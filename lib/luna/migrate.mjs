import { CryptWrapModule } from '@astrobase/sdk/crypt';
import { getPrivateKeyBIP44 } from '@astrobase/sdk/identity/bip44';
import Database from 'better-sqlite3';
import { existsSync, renameSync } from 'node:fs';
import { getIndex, saveIndex } from './content.mjs';
import { initInstance } from './init.mjs';
import { legacyGetIndex } from './legacy-content.mjs';

/** @type {import('@astrobase/sdk/instance').InstanceConfig} */
export const LegacyConfig = {
  functions: { getPrivateKey: getPrivateKeyBIP44 },
  wraps: { encrypt: CryptWrapModule },
};

let once = false;

/**
 * Migrates database to new format.
 *
 * @param {string} dbFile
 * @param {string} identityId
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
 */
export async function migrate(
  dbFile,
  identityId,
  cloneCallback,
  updateEntryCallback,
  checkCallback,
) {
  if (once) {
    return;
  }

  if (!existsSync(dbFile)) {
    return;
  }

  /** @type {import('@astrobase/sdk/instance').Instance} */
  let tempInstance;

  const tempSQL = new Database(dbFile, { readonly: true });

  try {
    tempInstance = await initInstance(dbFile, identityId, tempSQL, [LegacyConfig]);
  } catch {
    tempSQL.close();
    return;
  }

  let legacyIndex;

  try {
    legacyIndex = await legacyGetIndex(tempInstance, identityId);
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

  const backupPath = `${dbFile.slice(0, -3)}-${new Date().toISOString()}.db`;
  for (const suffix of ['', '-shm', '-wal']) {
    const file = dbFile + suffix;
    if (existsSync(file)) {
      renameSync(file, backupPath + suffix);
    }
  }
  // eslint-disable-next-line no-console
  console.log(`Backup at ${backupPath}\nBeginning migration...`);

  const originalSQL = new Database(backupPath, { readonly: true });

  const originalInstance = await initInstance(backupPath, identityId, originalSQL, [LegacyConfig]);

  const newInstance = await initInstance(dbFile, identityId);

  // Update each entry in the index
  for (const [id, entry] of Object.entries(clonedIndex)) {
    clonedIndex[id] = await updateEntryCallback(entry, originalInstance, newInstance);
  }

  // Save the new index
  await saveIndex(newInstance, identityId, clonedIndex);

  // eslint-disable-next-line no-console
  console.log('Migration complete.\nRunning tests...');

  const afterIndex = await getIndex(newInstance, identityId);

  let hasError = false;

  /** @param {unknown} message */
  function error(message) {
    // eslint-disable-next-line no-console
    console.log(message);
    hasError = true;
  }

  for (const [id, before] of Object.entries(legacyIndex)) {
    await checkCallback(id, before, afterIndex[id], originalInstance, newInstance, error);
  }

  originalSQL.close();

  if (hasError) {
    process.exit(1);
  } else {
    // eslint-disable-next-line no-console
    console.log('Tests pass.');
  }

  return newInstance;
}
