import { prompt } from '../../../../lib/1core/readline.mjs';

/**
 * @param {Partial<Record<string, string>>} obj
 * @param {string[]} [secrets]
 * @returns {Promise<void>}
 */
export async function promptSecrets(obj, secrets) {
  if (secrets) {
    for (const key of secrets) {
      obj[key] = await prompt(`Enter value for '${key}'`);
    }
  }
}
