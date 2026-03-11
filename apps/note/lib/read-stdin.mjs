/**
 * @param {number} timeout
 * @returns {Promise<Buffer[]>}
 */
export default async function (timeout) {
  /** @type {Buffer[]} */
  const chunks = [];

  let timeoutInstance = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error('Timed out awaiting input from stdin');
    process.exit(1);
  }, timeout);

  const stdinRead = new Promise((resolve) => {
    process.stdin.on('end', resolve);
  });

  process.stdin.on('data', (data) => {
    clearTimeout(timeoutInstance);
    chunks.push(typeof data === 'string' ? Buffer.from(data) : data);
  });

  await stdinRead;

  if (!chunks.some((buf) => buf.length)) {
    // eslint-disable-next-line no-console
    console.error('No input from stdin');
    process.exit(1);
  }

  return chunks;
}
