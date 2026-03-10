import { Command } from 'commander';
import { assertEntryExists, getIndex, saveIndex } from '../content.mjs';
import { dbOption } from '../db.option.mjs';
import { initInstance } from '../init.mjs';

export default /**
 * @param {string} pkgName
 * @param {(db: string) => Promise<import('@astrobase/sdk/instance').Instance>} [init]
 */
(pkgName, init) =>
  new Command('rename')
    .arguments('<old-name> <new-name>')
    .description('Assign a new ID to an entry')
    .addOption(dbOption(pkgName))
    .action(async (oldID, newID, { db }) => {
      init ??= () => initInstance(db, pkgName);
      const instance = await init(db);

      await assertEntryExists(instance, pkgName, oldID);
      await assertEntryExists(instance, pkgName, newID, false);

      const index = await getIndex(instance, pkgName);

      index[newID] = index[oldID];

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete index[oldID];

      await saveIndex(instance, pkgName, index);
    });
