import { getIndex, put, saveIndex } from '../../../lib/1core/content.mjs';
import { deleteContent } from '../../../lib/astrobase/dist/content/api.js';
import { appName } from './app-name.mjs';

/**
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} name
 * @param {Buffer[]} chunks
 */
export default async function (instance, name, chunks) {
  /** @type {Record<string, import('@astrobase/sdk/cid').ContentIdentifier>} */
  const index = (await getIndex(instance, appName)) || {};

  /** @type {Buffer} */
  const newNote = Buffer.concat(chunks);

  for (const chunk of chunks) {
    chunk.fill(0);
  }

  const oldCID = index[name];

  index[name] = await put(instance, appName, newNote, 'application/octet-stream');

  newNote.fill(0);

  await saveIndex(instance, appName, index);

  // eslint-disable-next-line no-console
  console.log('Note saved');

  if (oldCID) {
    await deleteContent(oldCID, instance);
  }
}
