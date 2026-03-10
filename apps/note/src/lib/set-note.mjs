import { deleteContent } from '../../../../lib/astrobase/dist/content/api.js';
import { getIndex, put, saveIndex } from '../../../../lib/1core/content.mjs';
import pkg from '../../package.json' with { type: 'json' };

/**
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} name
 * @param {Buffer[]} chunks
 */
export default async function (instance, name, chunks) {
  /** @type {Record<string, import('@astrobase/sdk/cid').ContentIdentifier>} */
  const index = (await getIndex(instance, pkg.name)) || {};

  /** @type {Buffer} */
  const newNote = Buffer.concat(chunks);

  for (const chunk of chunks) {
    chunk.fill(0);
  }

  const oldCID = index[name];

  index[name] = await put(instance, pkg.name, newNote, 'application/octet-stream');

  newNote.fill(0);

  await saveIndex(instance, pkg.name, index);

  // eslint-disable-next-line no-console
  console.log('Note saved');

  if (oldCID) {
    await deleteContent(oldCID, instance);
  }
}
