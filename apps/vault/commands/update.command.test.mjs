import { assert, describe, expect, it } from 'vitest';
import { generateID } from '../../../lib/test/generate-id.mjs';
import { passphrase } from '../../../lib/test/passphrase.mjs';
import { spawnCommand } from '../../../lib/test/spawn-command.mjs';

describe('Update command', () => {
  it('Updates an entry', async () => {
    const id = generateID();

    const email = 'hello@example.com';
    const username = 'luna';

    const addResult = await spawnCommand('vault', 'add', {
      args: [id, '-p', 'email=' + email, '-p', 'note=abcd', '-s', 'password'],
      cleanup: false,
    });

    expect(addResult.exitCode).toBe(0);
    expect(addResult.stderr).toBe('');
    expect(addResult.stdout).toBe('');

    const { dbFile } = addResult;

    const getResultBefore = await spawnCommand('vault', 'get', {
      args: [id],
      cleanup: false,
      dbFile,
    });

    expect(getResultBefore.exitCode).toBe(0);
    expect(getResultBefore.stderr).toBe('');
    expect(getResultBefore.stdout).not.toBe('');

    const updateResult = await spawnCommand('vault', 'update', {
      args: [id, '-p', 'username=' + username, '-s', '2FA code', '-d', 'note'],
      cleanup: false,
      dbFile,
    });

    expect(updateResult.exitCode).toBe(0);
    expect(updateResult.stderr).toBe('');
    expect(updateResult.stdout).toBe('');

    const getResultAfter = await spawnCommand('vault', 'get', {
      args: [id],
      dbFile,
    });

    expect(getResultAfter.exitCode).toBe(0);
    expect(getResultAfter.stderr).toBe('');
    expect(getResultAfter.stdout).not.toBe('');

    const getResultAfterSplit = getResultAfter.stdout.split('\n');

    expect(getResultAfterSplit).toHaveLength(7);

    const [
      twoFactorString,
      addedString,
      emailString,
      passwordString,
      updatedString,
      usernameString,
      empty,
    ] = getResultAfterSplit;

    expect(empty).toBe('');

    const [twoFactorLabel, twoFactorValue] = twoFactorString?.split(': ') ?? [];
    expect(twoFactorLabel).toBe('2FA code');
    expect(twoFactorValue).toBe(passphrase);

    const getResultBeforeSplit = getResultBefore.stdout.split('\n');

    const [addedLabel, addedValue] = addedString?.split(': ') ?? [];
    expect(addedLabel).toBe('Added');
    assert(addedValue);
    expect(Date.parse(addedValue)).not.toBeNaN();
    const getResultBeforeL1 = getResultBeforeSplit[0];
    assert(getResultBeforeL1);
    expect(addedValue).toBe(getResultBeforeL1.split(': ')[1]);

    const [emailLabel, emailValue] = emailString?.split(': ') ?? [];
    expect(emailLabel).toBe('Email');
    expect(emailValue).toBe(email);

    const [passwordLabel, passwordValue] = passwordString?.split(': ') ?? [];
    expect(passwordLabel).toBe('Password');
    expect(passwordValue).toBe(passphrase);

    const [updatedLabel, updatedValue] = updatedString?.split(': ') ?? [];
    expect(updatedLabel).toBe('Updated');
    assert(updatedValue);
    const updatedTimestamp = Date.parse(updatedValue);
    expect(updatedTimestamp).not.toBeNaN();
    const getResultBeforeL5 = getResultBeforeSplit[4];
    assert(getResultBeforeL5);
    const getResultBeforeL5Value = getResultBeforeL5.split(': ')[1];
    assert(getResultBeforeL5Value);
    expect(updatedTimestamp).toBeGreaterThan(Date.parse(getResultBeforeL5Value));

    const [usernameLabel, usernameValue] = usernameString?.split(': ') ?? [];
    expect(usernameLabel).toBe('Username');
    expect(usernameValue).toBe(username);
  });

  it('Refuses if ID does not exist', async () => {
    const id = generateID();

    const { exitCode, stderr, stdout } = await spawnCommand('vault', 'update', {
      args: [id],
    });

    expect(exitCode).not.toBe(0);
    expect(stderr).toBe(`Entry '${id}' does not exist\n`);
    expect(stdout).toBe('');
  });

  it('Refuses and warns if secret passed on command line', async () => {
    const id = generateID();

    const addResult = await spawnCommand('vault', 'add', {
      args: [id],
      cleanup: false,
    });

    expect(addResult.exitCode).toBe(0);
    expect(addResult.stderr).toBe('');
    expect(addResult.stdout).toBe('');

    const { dbFile } = addResult;

    const getResultBefore = await spawnCommand('vault', 'get', {
      args: [id],
      cleanup: false,
      dbFile,
    });

    expect(getResultBefore.exitCode).toBe(0);
    expect(getResultBefore.stderr).toBe('');
    expect(getResultBefore.stdout).not.toBe('');

    const updateResult = await spawnCommand('vault', 'update', {
      args: [id, '-s', `password=${passphrase}`],
      cleanup: false,
      dbFile,
    });

    expect(updateResult.exitCode).not.toBe(0);
    expect(updateResult.stdout).toBe('');
    expect(updateResult.stderr).toBe(
      'WARN: Secrets may have been leaked via command line input' +
        '\n--secret cannot accept a value on the command line for security reasons\n',
    );

    const getResultAfter = await spawnCommand('vault', 'get', {
      args: [id],
      dbFile,
    });

    expect(getResultAfter.exitCode).toBe(0);
    expect(getResultAfter.stderr).toBe('');
    expect(getResultAfter.stdout).toBe(getResultBefore.stdout);
  });
});
