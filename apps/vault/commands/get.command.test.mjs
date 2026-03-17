import { assert, describe, expect, it } from 'vitest';
import { generateID } from '../../../lib/test/generate-id.mjs';
import { passphrase } from '../../../lib/test/passphrase.mjs';
import { spawnCommand } from '../../../lib/test/spawn-command.mjs';

describe('Get command', () => {
  it('Refuses if entry does not exist', async () => {
    const id = generateID();

    const { exitCode, stderr, stdout } = await spawnCommand('vault', 'get', {
      args: [id],
    });

    expect(exitCode).toBe(1);
    expect(stderr).toBe(`Entry '${id}' does not exist\n`);
    expect(stdout).toBe('');
  });

  it('Shows an existing entry', async () => {
    const id = generateID();

    const email = 'hello@example.com';

    const { dbFile } = await spawnCommand('vault', 'add', {
      args: [id, '-p', `email=${email}`, '-s', 'password'],
      cleanup: false,
    });

    const { exitCode, stderr, stdout } = await spawnCommand('vault', 'get', {
      args: [id],
      dbFile,
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe('');

    const split = stdout.split('\n');

    expect(split).toHaveLength(5);

    const [addedString, emailString, passwordString, updatedString, empty] = split;

    expect(empty).toBe('');

    const [addedLabel, addedValue] = addedString?.split(': ') ?? [];
    expect(addedLabel).toBe('Added');
    assert(addedValue);
    expect(Date.parse(addedValue)).not.toBeNaN();

    const [emailLabel, emailValue] = emailString?.split(': ') ?? [];
    expect(emailLabel).toBe('Email');
    expect(emailValue).toBe(email);

    const [passwordLabel, passwordValue] = passwordString?.split(': ') ?? [];
    expect(passwordLabel).toBe('Password');
    expect(passwordValue).toBe(passphrase);

    const [updatedLabel, updatedValue] = updatedString?.split(': ') ?? [];
    expect(updatedLabel).toBe('Updated');
    assert(updatedValue);
    expect(Date.parse(updatedValue)).not.toBeNaN();
  });
});
