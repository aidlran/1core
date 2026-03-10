import { describe, expect, it } from 'vitest';
import { generateID } from '../../../../lib/test/generate-id.mjs';
import { spawnCommand } from '../../../../lib/test/spawn-command.mjs';
import { passphrase } from '../../../../lib/test/passphrase.mjs';

describe('Add command', () => {
  it('Adds an entry', async () => {
    const id = generateID();

    const email = 'hello@example.com';

    const addResult = await spawnCommand(__dirname, 'add', {
      args: [id, '-p', `email=${email}`, '-s', 'password'],
      cleanup: false,
    });

    const dbFile = addResult.dbFile;

    let { exitCode, stderr, stdout } = addResult;

    expect(exitCode).toBe(0);
    expect(stderr).toBe('');
    expect(stdout).toBe('');

    ({ exitCode, stderr, stdout } = await spawnCommand(__dirname, 'get', {
      args: [id],
      dbFile,
    }));

    expect(exitCode).toBe(0);
    expect(stderr).toBe('');
    expect(stdout.length).toBeGreaterThan(0);
  });

  it('Refuses and warns if secret passed on command line', async () => {
    const id = generateID();

    const { exitCode, stderr, stdout } = await spawnCommand(__dirname, 'add', {
      args: [id, '-s', `password=${passphrase}`],
    });

    expect(exitCode).not.toBe(0);
    expect(stdout).toBe('');
    expect(stderr).toBe(
      'WARN: Secrets may have been leaked via command line input\n' +
        '--secret cannot accept a value on the command line for security reasons\n',
    );
  });

  it('Refuses if ID already exists', async () => {
    const id = generateID();

    const { dbFile } = await spawnCommand(__dirname, 'add', {
      args: [id],
      cleanup: false,
    });

    const { exitCode, stderr, stdout } = await spawnCommand(__dirname, 'add', {
      args: [id],
      dbFile,
    });

    expect(exitCode).not.toBe(0);
    expect(stdout).toBe('');
    expect(stderr).toBe(`Entry '${id}' already exists\n`);
  });
});
