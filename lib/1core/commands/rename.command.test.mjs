import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appName } from '../../../apps/vault/lib/app-name.mjs';
import { generateID } from '../../test/generate-id.mjs';
import { spawnCommand } from '../../test/spawn-command.mjs';

const commandDir = join(__dirname, '../../../apps/vault/commands');

/** @param {import('../../test/spawn-command.mjs').SpawnCommandOptions} options */
const spawnRenameCommand = (options) =>
  spawnCommand(__dirname, 'rename', {
    ...options,
    code: `command = command('${appName}')`,
  });

describe('Rename command', () => {
  it('Renames an entry', async () => {
    const oldID = generateID();

    const addResult = await spawnCommand(commandDir, 'add', {
      args: [oldID],
      cleanup: false,
    });

    expect(addResult.stderr).toBe('');
    expect(addResult.exitCode).toBe(0);
    expect(addResult.stdout).toBe('');

    const { dbFile } = addResult;

    const getResult = await spawnCommand(commandDir, 'get', {
      args: [oldID],
      cleanup: false,
      dbFile,
    });

    expect(getResult.stderr).toBe('');
    expect(getResult.exitCode).toBe(0);
    expect(getResult.stdout).not.toBe('');

    const newID = generateID();

    const renameResult = await spawnRenameCommand({
      args: [oldID, newID],
      cleanup: false,
      dbFile,
    });

    expect(renameResult.stderr).toBe('');
    expect(renameResult.exitCode).toBe(0);
    expect(renameResult.stdout).toBe('');

    const getOldResult = await spawnCommand(commandDir, 'get', {
      args: [oldID],
      cleanup: false,
      dbFile,
    });

    expect(getOldResult.exitCode).toBe(1);
    expect(getOldResult.stderr).toBe(`Entry '${oldID}' does not exist\n`);
    expect(getOldResult.stdout).toBe('');

    const getNewResult = await spawnCommand(commandDir, 'get', {
      args: [newID],
      dbFile,
    });

    expect(getNewResult.stderr).toBe('');
    expect(getNewResult.exitCode).toBe(0);
    expect(getNewResult.stdout).toBe(getResult.stdout);
  });

  it('Refuses if old ID does not exist', async () => {
    const oldID = generateID();

    const { exitCode, stderr, stdout } = await spawnRenameCommand({
      args: [oldID, generateID()],
    });

    expect(exitCode).toBe(1);
    expect(stderr).toBe(`Entry '${oldID}' does not exist\n`);
    expect(stdout).toBe('');
  });

  it('Refuses if new ID already exists', async () => {
    const oldID = generateID();
    const newID = generateID();

    let dbFile;

    for (const id of [oldID, newID]) {
      const result = await spawnCommand(commandDir, 'add', {
        args: [id],
        dbFile,
        cleanup: false,
      });

      dbFile ??= result.dbFile;

      expect(result.stderr).toBe('');
      expect(result.exitCode).toBe(0);
    }

    const { exitCode, stderr, stdout } = await spawnRenameCommand({
      args: [oldID, newID],
      dbFile,
    });

    expect(exitCode).toBe(1);
    expect(stderr).toBe(`Entry '${newID}' already exists\n`);
    expect(stdout).toBe('');
  });
});
