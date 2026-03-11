import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { generateID } from '../../test/generate-id.mjs';
import { spawnCommand } from '../../test/spawn-command.mjs';

/**
 * @param {string[]} ids
 * @param {string} [dbFile]
 * @returns {Promise<string>}
 * @todo Do without `spawnCommand`.
 */
async function addMany(ids, dbFile) {
  for (const id of ids) {
    const result = await spawnCommand(join(__dirname, '../../../apps/vault/commands'), 'add', {
      args: [id],
      dbFile,
      cleanup: false,
    });

    dbFile ??= result.dbFile;

    expect(result.stderr).toBe('');
    expect(result.exitCode).toBe(0);
  }

  return /** @type {string} */ (dbFile);
}

/**
 * @param {string[]} ids IDs expected to be printed.
 * @param {import('../../test/spawn-command.mjs').SpawnCommandOptions} [options]
 */
async function testListCommand(ids, options) {
  const { exitCode, stderr, stdout } = await spawnCommand(__dirname, 'list', {
    ...options,
    code: `command = command('1core-vault');`,
  });
  expect(stderr).toBe('');
  expect(exitCode).toBe(0);
  expect(stdout).toBe(
    ids
      .sort((a, b) => a.localeCompare(b))
      .map((id) => id + '\n')
      .join(''),
  );
}

describe('List command', () => {
  it('Gives no output for no entries', () => testListCommand([]));

  it('Lists some entries', async () => {
    const ids = Array.from({ length: 4 }, () => generateID());

    const dbFile = await addMany(ids);

    return testListCommand(ids, { dbFile });
  });

  it('Respects search argument', async () => {
    const ids = ['google', 'microsoft', 'apple'];

    const dbFile = await addMany(ids);

    return Promise.all([
      ...ids.map((id) =>
        testListCommand([id], {
          args: [id],
          dbFile,
          cleanup: false,
        }),
      ),
      testListCommand(['apple', 'google'], {
        args: ['le'],
        dbFile,
      }),
    ]);
  });
});
