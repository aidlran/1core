import { describe, expect, it } from 'vitest';
import { generateID } from '../../test/generate-id.mjs';
import { spawnCommand } from '../../test/spawn-command.mjs';

describe('Delete command', () => {
  it('Deletes an entry', async () => {
    const id = generateID();
    const args = [id];

    const addResult = await spawnCommand('vault', 'add', {
      args,
      cleanup: false,
    });

    expect(addResult.stderr).toBe('');
    expect(addResult.exitCode).toBe(0);
    expect(addResult.stdout).toBe('');

    const { dbFile } = addResult;

    let getResult = await spawnCommand('vault', 'get', {
      args,
      cleanup: false,
      dbFile,
    });

    expect(getResult.stderr).toBe('');
    expect(getResult.exitCode).toBe(0);
    expect(getResult.stdout).not.toBe('');

    const deleteResult = await spawnCommand('vault', 'delete', {
      args,
      cleanup: false,
      dbFile,
    });

    expect(deleteResult.stderr).toBe('');
    expect(deleteResult.exitCode).toBe(0);
    expect(deleteResult.stdout).toBe('');

    getResult = await spawnCommand('vault', 'get', {
      args,
      dbFile,
    });

    expect(getResult.stderr).toBe(`Entry '${id}' does not exist\n`);
    expect(getResult.exitCode).toBe(1);
    expect(getResult.stdout).toBe('');
  });

  it('Refuses if ID does not exist', async () => {
    const id = generateID();

    const { exitCode, stderr, stdout } = await spawnCommand('vault', 'delete', {
      args: [id],
    });

    expect(stderr).toBe(`Entry '${id}' does not exist\n`);
    expect(exitCode).toBe(1);
    expect(stdout).toBe('');
  });
});
