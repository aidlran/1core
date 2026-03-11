import { clearLine as _clearLine, cursorTo } from 'node:readline';
import { createInterface } from 'node:readline/promises';
import { ReadStream } from 'node:tty';

export function clearLine() {
  cursorTo(process.stderr, 0);
  _clearLine(process.stderr, 0);
}

/**
 * Prompts user for a secret value.
 *
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function prompt(prompt) {
  /** @type {import('tty').ReadStream | undefined} */
  let input;

  /** @type {boolean} */
  let unref = false;

  for (const stream of [process.stderr, process.stdout]) {
    if (stream.isTTY) {
      input = new ReadStream(stream.fd, { readable: true });
      unref = true;
      break;
    }
  }

  if (!input) {
    input = process.stdin;
  }

  const readline = createInterface({ input, terminal: true });

  process.stderr.write(prompt + ': ');

  try {
    var answer = await readline.question('');
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      process.exit(0);
    }
    throw e;
  }

  clearLine();

  readline.close();

  if (unref) {
    input.unref();
  }

  return answer;
}
