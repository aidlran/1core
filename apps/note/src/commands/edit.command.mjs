import { deleteContent } from '@astrobase/sdk/content';
import { spawnSync } from 'child_process';
import { Command } from 'commander';
import { randomUUID } from 'crypto';
import { readFileSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { get, getIndex, put, saveIndex } from '../../../../lib/1core/content.mjs';
import { dbOption } from '../../../../lib/1core/db.option.mjs';
import pkg from '../../package.json' with { type: 'json' };
import { init } from '../lib/init.mjs';

export default new Command('edit')
  .argument('<name>')
  .description(`Edit or create a note with EDITOR (${process.env.EDITOR})`)
  .addOption(dbOption(pkg.name))
  .action(async (name, { db }) => {
    const instance = await init(db);

    /** @type {Record<string, import('@astrobase/sdk/cid').ContentIdentifier>} */
    const index = (await getIndex(instance, pkg.name)) || {};

    const oldCID = index[name];

    /** @type {Uint8Array<ArrayBuffer>} */
    const note = (oldCID && (await get(instance, oldCID))) || new Uint8Array();

    /** @type {Buffer<ArrayBuffer>} */
    const newNote = securelyEditViaEditor(note);

    const changed = newNote.compare(note) != 0;

    note.fill(0);

    if (changed) {
      index[name] = await put(instance, pkg.name, newNote, 'application/octet-stream');
      newNote.fill(0);
      await saveIndex(instance, pkg.name, index);
      // eslint-disable-next-line no-console
      console.log('Note saved');
      if (oldCID) {
        await deleteContent(oldCID, instance);
      }
    } else {
      newNote.fill(0);
      // eslint-disable-next-line no-console
      console.log('No change');
    }
  });

function securelyEditViaEditor(/** @type {string | NodeJS.ArrayBufferView} */ data) {
  const tempFilePath = join(tmpdir(), randomUUID());

  const editor = process.env.EDITOR ?? 'vi';
  const args = [tempFilePath];

  if (editor === 'vim') {
    args.unshift('-c', 'set noswapfile nobackup nowritebackup');
  }

  writeFileSync(tempFilePath, data, { mode: 0o600 });

  const editResult = spawnSync(editor, args, { stdio: 'inherit' });

  const newData = readFileSync(tempFilePath);

  shred(tempFilePath);

  if (editResult.error) {
    // eslint-disable-next-line no-console
    console.error(editResult.error.message);
    process.exit(editResult.status);
  }

  return newData;
}

function shred(/** @type {string} */ path) {
  const file = statSync(path);

  function fallback() {
    writeFileSync(path, Buffer.alloc(file.size, 0));
    unlinkSync(path);
  }

  try {
    const shred = spawnSync('shred', ['--remove', '--zero', '--iterations=3', path]);
    if (shred.status != 0) {
      fallback();
    }
  } catch {
    fallback();
  }
}
