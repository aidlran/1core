import { Option } from 'commander';

export const propertyOption = new Option(
  '-p, --property <properties...>',
  'set properties on the entry',
).argParser((v, prev) => {
  const separatorIndex = v.indexOf('=');

  // Separator cannot be at start (0), end, or not found (-1)
  if (separatorIndex <= 0 || separatorIndex == v.length - 1) {
    // eslint-disable-next-line no-console
    console.error('--property expects a key value pair, e.g. `--property key=value`');
    process.exit(1);
  }

  const key = v.slice(0, separatorIndex);
  const value = v.slice(separatorIndex + 1);

  if ((key === 'added' || key === 'updated') && isNaN(Date.parse(value))) {
    // eslint-disable-next-line no-console
    console.error(`Property '${key}' must use date format`);
    process.exit(1);
  }

  (prev ??= {})[key] = value;

  return prev;
});
