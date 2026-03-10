import { Option } from 'commander';
import paths from 'env-paths';
import { mkdirSync } from 'fs';
import { join } from 'path';

/**
 * @param {string} pkgName
 * @returns {Option}
 */
export function dbOption(pkgName) {
  const { data: dataDir } = paths(pkgName, { suffix: '' });
  mkdirSync(dataDir, { recursive: true });
  return new Option('--db <db-file>', 'path to db file').default(join(dataDir, pkgName + '.db'));
}
