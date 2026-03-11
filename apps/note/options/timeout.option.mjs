import { Option } from 'commander';

/**
 * @this {Option}
 * @param {string} value
 * @returns {number}
 */
function parseIntArg(value) {
  const asInt = Number.parseInt(value);
  if (Number.isNaN(asInt)) {
    // eslint-disable-next-line no-console
    console.error(this.long + ' value must be an integer');
    process.exit(1);
  }
  return asInt;
}

export default new Option('--timeout <INTEGER>', 'Timeout for awaiting stdin input')
  .default(3000)
  .argParser(parseIntArg);
