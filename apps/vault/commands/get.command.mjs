import { Command } from 'commander';
import { dbOption } from '../../../lib/1core/db.option.mjs';
import { initInstance } from '../../../lib/1core/init.mjs';
import { appName } from '../lib/app-name.mjs';
import { getAssertedEntryProps } from '../lib/content.mjs';

export default new Command('get')
  .argument('<name>')
  .description('Retrieve an entry')
  .addOption(dbOption())
  .action(async (id, { db }) => {
    for (const [k, v] of Object.entries(
      await getAssertedEntryProps(await initInstance(db, appName), id),
    ).sort(([a], [b]) => a.localeCompare(b))) {
      // eslint-disable-next-line no-console
      console.log(`${k.charAt(0).toUpperCase()}${k.slice(1)}:`, v);
    }
  });
