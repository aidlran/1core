import { Command } from 'commander';
import { assertEntryExists, deleteEntry } from '../content.mjs';
import { dbOption } from '../db.option.mjs';
import { initInstance } from '../init.mjs';

export default /**
 * @template T
 * @param {string} pkgName
 * @param {(
 *   value: T,
 *   instance: import('@astrobase/sdk/instance').Instance,
 * ) => Promise<unknown>} hook
 * @param {(db: string) => Promise<import('@astrobase/sdk/instance').Instance>} [init]
 * @returns {Command}
 */
(pkgName, hook, init) =>
  new Command('delete')
    .argument('<name>')
    .description('Delete an entry')
    .addOption(dbOption())
    .action(async (id, { db }) => {
      init ??= () => initInstance(db, pkgName);
      const instance = await init(db);
      await assertEntryExists(instance, pkgName, id);
      await deleteEntry(instance, pkgName, id, hook);
    });
