import { Command } from 'commander';
import { assertEntryExists, getIndex, saveIndex } from '../content.mjs';
import { dbOption } from '../db.option.mjs';
import { initInstance } from '../init.mjs';

export default /**
 * @param {string} appName
 * @returns {Command}
 */
(appName) =>
  new Command('rename')
    .arguments('<old-name> <new-name>')
    .description('Assign a new ID to an entry')
    .addOption(dbOption())
    .action(async (oldID, newID, { db }) => {
      const instance = await initInstance(db, appName);

      await assertEntryExists(instance, appName, oldID);
      await assertEntryExists(instance, appName, newID, false);

      const index = await getIndex(instance, appName);

      index[newID] = index[oldID];

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete index[oldID];

      await saveIndex(instance, appName, index);
    });
