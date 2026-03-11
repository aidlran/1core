import { Option } from 'commander';
import paths from 'env-paths';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const { data } = paths('1core', { suffix: '' });

export const dbDefaultPath = join(data, '1core.db');

/** @returns {Option} */
export function dbOption() {
  mkdirSync(data, { recursive: true });
  return new Option('--db <db-file>', 'path to db file').default(dbDefaultPath);
}
