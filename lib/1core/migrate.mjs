import { CryptWrapModule } from '@astrobase/sdk/crypt';
import { getPrivateKeyBIP44 } from '@astrobase/sdk/identity/bip44';
import Database from 'better-sqlite3';
import paths from 'env-paths';
import { existsSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { getIndex, saveIndex } from './content.mjs';
import { dbDefaultPath } from './db.option.mjs';
import { initInstance } from './init.mjs';
import { legacyGetIndex } from './legacy-content.mjs';
import { clearLine } from './readline.mjs';

/** @type {import('@astrobase/sdk/instance').InstanceConfig} */
const LegacyConfig = {
  functions: { getPrivateKey: getPrivateKeyBIP44 },
  wraps: { encrypt: CryptWrapModule },
};

let once = false;

/** @param {string} data */
const log = (data) => process.stderr.write(data);

/** @param {Promise<unknown>[]} promises */
async function trackProgress(promises) {
  log('0%');
  let i = 0;
  await Promise.all(
    promises.map(async (promise) => {
      await promise;
      clearLine();
      log(`${Math.floor((++i / promises.length) * 100)}%`);
    }),
  );
  clearLine();
}

/**
 * Migrates database to new format.
 *
 * @deprecated
 * @param {string} dbFile
 * @param {string} oldIdentityID
 * @param {string} newIdentityID
 * @param {(
 *   previousValue: Record<string, unknown>,
 *   currentValue: [string, unknown],
 *   currentIndex: number,
 *   array: [string, unknown][],
 * ) => Record<string, unknown>} cloneCallback
 * @param {(
 *   entry: unknown,
 *   oldInstance: import('@astrobase/sdk/instance').Instance,
 *   newInstance: import('@astrobase/sdk/instance').Instance,
 * ) => Promise<unknown>} updateEntryCallback
 * @param {(
 *   id: string,
 *   before: unknown,
 *   after: unknown,
 *   oldInstance: import('@astrobase/sdk/instance').Instance,
 *   newInstance: import('@astrobase/sdk/instance').Instance,
 *   error: (message: string) => void,
 * ) => Promise<void>} checkCallback
 * @returns {Promise<import('@astrobase/sdk/instance').Instance | undefined>}
 */
export async function migrate(
  dbFile,
  oldIdentityID,
  newIdentityID,
  cloneCallback,
  updateEntryCallback,
  checkCallback,
) {
  if (once) {
    return;
  }

  let oldDbFile =
    dbFile === dbDefaultPath
      ? join(paths(oldIdentityID, { suffix: '' }).data, oldIdentityID + '.db')
      : dbFile;

  if (!existsSync(oldDbFile)) {
    return;
  }

  /** @type {import('@astrobase/sdk/instance').Instance} */
  let tempInstance;

  const tempSQL = new Database(oldDbFile, { readonly: true });

  try {
    tempInstance = await initInstance(oldDbFile, oldIdentityID, tempSQL, [LegacyConfig]);
  } catch {
    tempSQL.close();
    return;
  }

  let legacyIndex;

  try {
    legacyIndex = await legacyGetIndex(tempInstance, oldIdentityID);
  } catch {
    // fallthrough
  }

  tempSQL.close();

  if (!legacyIndex) {
    return;
  }

  // Create a deep copy to mutate
  const clonedIndex = Object.entries(legacyIndex).reduce(
    cloneCallback,
    /** @type {typeof legacyIndex} */ ({}),
  );

  const backupPath = `${oldDbFile.slice(0, -3)}-${new Date().toISOString()}.db`;
  for (const suffix of ['', '-shm', '-wal']) {
    const file = oldDbFile + suffix;
    if (existsSync(file)) {
      renameSync(file, backupPath + suffix);
    }
  }

  log(`Backup at ${backupPath}\nBeginning migration...\n`);

  const originalSQL = new Database(backupPath, { readonly: true });

  const originalInstance = await initInstance(backupPath, oldIdentityID, originalSQL, [
    LegacyConfig,
  ]);

  const newInstance = await initInstance(dbFile, newIdentityID);

  // Update each entry in the index
  await trackProgress(
    Object.entries(clonedIndex).map(async ([id, entry]) => {
      clonedIndex[id] = await updateEntryCallback(entry, originalInstance, newInstance);
    }),
  );

  // Save the new index
  await saveIndex(newInstance, newIdentityID, clonedIndex);

  log('Migration complete.\nRunning tests...\n');

  const afterIndex = await getIndex(newInstance, newIdentityID);

  let hasError = false;

  /** @param {unknown} message */
  function error(message) {
    // eslint-disable-next-line no-console
    console.error(message);
    hasError = true;
  }

  await trackProgress(
    Object.entries(legacyIndex).map(async ([id, before]) =>
      checkCallback(id, before, afterIndex[id], originalInstance, newInstance, error),
    ),
  );

  originalSQL.close();

  if (hasError) {
    process.exit(1);
  } else {
    log('Tests pass.\n');
  }

  return newInstance;
}
