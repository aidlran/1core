import { Command } from 'commander';
import { assertEntryExists } from '../../../lib/1core/content.mjs';
import { dbOption } from '../../../lib/1core/db.option.mjs';
import { initInstance } from '../../../lib/1core/init.mjs';
import { appName } from '../lib/app-name.mjs';
import { saveEntry } from '../lib/content.mjs';
import { promptSecrets } from '../lib/prompt.mjs';
import { propertyOption } from '../options/property.option.mjs';
import { secretOption } from '../options/secret.options.mjs';

export default new Command('add')
  .argument('<name>')
  .description('Add an entry')
  .addOption(dbOption())
  .addOption(propertyOption)
  .addOption(secretOption)
  .action(async (id, { db, property, secret }) => {
    promptSecrets((property ??= {}), secret);
    const instance = await initInstance(db, appName);
    await assertEntryExists(instance, appName, id, false);
    await saveEntry(instance, id, property);
  });
