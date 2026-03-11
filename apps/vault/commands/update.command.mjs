import { Command } from 'commander';
import { dbOption } from '../../../lib/1core/db.option.mjs';
import { getAssertedEntryProps, saveEntry } from '../lib/content.mjs';
import { init } from '../lib/init.mjs';
import { promptSecrets } from '../lib/prompt.mjs';
import { propertyOption } from '../options/property.option.mjs';
import { secretOption } from '../options/secret.options.mjs';

export default new Command('update')
  .argument('<name>')
  .description('Update an existing entry')
  .addOption(dbOption())
  .addOption(propertyOption)
  .addOption(secretOption)
  .option('-d, --delete <keys-to-delete...>', 'specify keys to delete')
  .action(async (id, { db, delete: keysToDelete, property, secret }) => {
    const instance = await init(db);

    const props = await getAssertedEntryProps(instance, id);

    if (keysToDelete) {
      for (const key of keysToDelete) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete props[key];
      }
    }

    promptSecrets(props, secret);

    (property ??= {}).updated ??= new Date().toISOString();

    Object.assign(props, property);

    await saveEntry(instance, id, props);
  });
