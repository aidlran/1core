import { Command } from 'commander';
import { getIndex } from '../content.mjs';
import { dbOption } from '../db.option.mjs';
import { initInstance } from '../init.mjs';

export default /**
 * @param {string} pkgName
 * @param {(db: string) => Promise<import('@astrobase/sdk/instance').Instance>} [init]
 * @returns
 */
(pkgName, init) =>
  new Command('list')
    .argument('[search]')
    .description('List entries')
    .addOption(dbOption())
    .action(async (search, { db }) => {
      init ??= () => initInstance(db, pkgName);
      const index = await getIndex(await init(db), pkgName);
      let keys = Object.keys(index);
      if (search) {
        keys = keys.filter((key) => key.toLowerCase().includes(search.trim().toLowerCase()));
      }
      for (const key of keys.sort((a, b) => a.localeCompare(b))) {
        // eslint-disable-next-line no-console
        console.log(key);
      }
    });
