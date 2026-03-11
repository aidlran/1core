import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import { passphrase } from './passphrase.mjs';

/**
 * @typedef SpawnCommandOptions
 * @property {string[]} [args]
 * @property {boolean} [cleanup]
 * @property {string} [code]
 * @property {string} [dbFile]
 */

/**
 * @typedef SpawnCommandResult
 * @property {string} dbFile
 * @property {number | null} exitCode
 * @property {string} stderr
 * @property {string} stdout
 */

/**
 * @param {string} dirname
 * @param {string} commandName
 * @param {SpawnCommandOptions} [options]
 * @returns {Promise<SpawnCommandResult>}
 */
export function spawnCommand(
  dirname,
  commandName,
  {
    args = [],
    cleanup = true,
    code,
    dbFile = join(dirname, `test.${randomBytes(8).toString('base64url')}.db`),
  } = {},
) {
  const srcFile = join(dirname, commandName + '.command.mjs');

  const commandProcess = spawn('node', [
    '-e',
    `let command = require('${srcFile}').default;\n` +
      (code ?? '') +
      `\ncommand.parse(${JSON.stringify(['--db', dbFile, ...args])}, { from: 'user' })`,
  ]);

  let stderr = '';

  commandProcess.stderr.on('data', (/** @type {Buffer} */ data) => {
    const str = data.toString();
    if (str.endsWith('database passphrase: ') || str.startsWith("Enter value for '")) {
      commandProcess.stdin.write(passphrase + '\n');
    } else {
      stderr += str;
    }
  });

  let stdout = '';

  commandProcess.stdout.on('data', (/** @type {Buffer} */ data) => {
    stdout += data.toString();
  });

  function clean() {
    if (cleanup) {
      for (const file of [dbFile, dbFile + '-shm', dbFile + 'wal']) {
        rm(file).catch(() => undefined);
      }
    }
  }

  /** @type {Promise<SpawnCommandResult>} */
  return new Promise((resolve, reject) => {
    commandProcess.on('close', (exitCode) => {
      resolve({ dbFile, exitCode, stderr: stripVTControlCharacters(stderr), stdout });
      clean();
    });

    commandProcess.on('error', (err) => {
      reject('Unexpected error: ' + err);
      clean();
    });
  });
}
