import { Command } from 'commander';
import { assertEntryExists, deleteEntry } from '../content.mjs';
import { dbOption } from '../db.option.mjs';
import { initInstance } from '../init.mjs';

export default /**
 * @template T
 * @param {string} appName
 * @param {(
 *   value: T,
 *   instance: import('@astrobase/sdk/instance').Instance,
 * ) => Promise<unknown>} hook
 * @returns {Command}
 */
(appName, hook) =>
  new Command('delete')
    .argument('<name>')
    .description('Delete an entry')
    .addOption(dbOption())
    .action(async (id, { db }) => {
      const instance = await initInstance(db, appName);
      await assertEntryExists(instance, appName, id);
      await deleteEntry(instance, appName, id, hook);
    });
