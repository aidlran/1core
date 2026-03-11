import { Command } from 'commander';
import { dbOption } from '../../../../lib/1core/db.option.mjs';
import { init } from '../lib/init.mjs';
import readStdin from '../lib/read-stdin.mjs';
import setNote from '../lib/set-note.mjs';
import timeoutOption from '../options/timeout.option.mjs';

export default new Command('set')
  .arguments('<name>')
  .description('Write to a new or overwrite an existing note from stdin')
  .addOption(dbOption())
  .addOption(timeoutOption)
  .action(async function (name, { db, timeout }) {
    const content = await readStdin(timeout);
    const instance = await init(db);
    await setNote(instance, name, content);
  });
