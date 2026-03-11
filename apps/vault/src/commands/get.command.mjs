import { Command } from 'commander';
import { dbOption } from '../../../../lib/1core/db.option.mjs';
import { getAssertedEntryProps } from '../lib/content.mjs';
import { init } from '../lib/init.mjs';

export default new Command('get')
  .argument('<name>')
  .description('Retrieve an entry')
  .addOption(dbOption())
  .action(async (id, { db }) => {
    for (const [k, v] of Object.entries(await getAssertedEntryProps(await init(db), id)).sort(
      ([a], [b]) => a.localeCompare(b),
    )) {
      // eslint-disable-next-line no-console
      console.log(`${k.charAt(0).toUpperCase()}${k.slice(1)}:`, v);
    }
  });
