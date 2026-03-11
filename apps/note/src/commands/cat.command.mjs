import { Command } from 'commander';
import { assertEntryExists, get } from '../../../../lib/1core/content.mjs';
import { dbOption } from '../../../../lib/1core/db.option.mjs';
import pkg from '../../package.json' with { type: 'json' };
import { init } from '../lib/init.mjs';

export default new Command('cat')
  .alias('get')
  .argument('<name>')
  .description('Retrieve a note & print to stdout')
  .addOption(dbOption())
  .action(async function (name, { db }) {
    const instance = await init(db);

    /** @type {import('@astrobase/sdk/cid').ContentIdentifier} */
    const cid = await assertEntryExists(instance, pkg.name, name);

    /** @type {Uint8Array<ArrayBuffer> | void} */
    const note = await get(instance, cid);

    if (!note) {
      this.error('Note content not found');
    }

    process.stdout.write(note);
  });
