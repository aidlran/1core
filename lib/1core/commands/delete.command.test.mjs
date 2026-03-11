import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { generateID } from '../../test/generate-id.mjs';
import { spawnCommand } from '../../test/spawn-command.mjs';

const commandDir = join(__dirname, '../../../apps/vault/commands');

/** @param {import('../../test/spawn-command.mjs').SpawnCommandOptions} [options] */
const spawnDeleteCommand = (options) =>
  spawnCommand(__dirname, 'delete', {
    ...options,
    code: `command = command('1core-vault', () => {});`,
  });

describe('Delete command', () => {
  it('Deletes an entry', async () => {
    const id = generateID();
    const args = [id];

    const addResult = await spawnCommand(commandDir, 'add', {
      args,
      cleanup: false,
    });

    expect(addResult.stderr).toBe('');
    expect(addResult.exitCode).toBe(0);
    expect(addResult.stdout).toBe('');

    const { dbFile } = addResult;

    let getResult = await spawnCommand(commandDir, 'get', {
      args,
      cleanup: false,
      dbFile,
    });

    expect(getResult.stderr).toBe('');
    expect(getResult.exitCode).toBe(0);
    expect(getResult.stdout).not.toBe('');

    const deleteResult = await spawnDeleteCommand({
      args,
      cleanup: false,
      dbFile,
    });

    expect(deleteResult.stderr).toBe('');
    expect(deleteResult.exitCode).toBe(0);
    expect(deleteResult.stdout).toBe('');

    getResult = await spawnCommand(commandDir, 'get', {
      args,
      dbFile,
    });

    expect(getResult.stderr).toBe(`Entry '${id}' does not exist\n`);
    expect(getResult.exitCode).toBe(1);
    expect(getResult.stdout).toBe('');
  });

  it('Refuses if ID does not exist', async () => {
    const id = generateID();

    const { exitCode, stderr, stdout } = await spawnDeleteCommand({
      args: [id],
    });

    expect(stderr).toBe(`Entry '${id}' does not exist\n`);
    expect(exitCode).toBe(1);
    expect(stdout).toBe('');
  });
});
