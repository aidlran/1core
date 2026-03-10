import { get, put } from '../../../../lib/1core/content.mjs';
import { initInstance } from '../../../../lib/1core/init.mjs';
import { legacyGet } from '../../../../lib/1core/legacy-content.mjs';
import { migrate } from '../../../../lib/1core/migrate.mjs';
import pkg from '../../package.json' with { type: 'json' };

/** @typedef {import('@astrobase/sdk/cid').ContentIdentifier} IndexValue */

/**
 * @param {string} dbFilePath
 * @returns {Promise<import('@astrobase/sdk/instance').Instance>}
 */
export const init = async (dbFilePath) =>
  // @ts-expect-error
  (await migrate(dbFilePath, pkg.name, cloneCallback, updateEntryCallback, checkCallback)) ??
  (await initInstance(dbFilePath, pkg.name));

/**
 * @param {Record<string, IndexValue>} index
 * @param {[string, IndexValue]} entry
 * @returns {Record<string, IndexValue>}
 */
function cloneCallback(index, [id, cid]) {
  index[id] = cid;
  return index;
}

/**
 * @param {IndexValue} entry
 * @param {import('@astrobase/sdk/instance').Instance} oldInstance
 * @param {import('@astrobase/sdk/instance').Instance} newInstance
 * @returns {Promise<IndexValue>}
 */
async function updateEntryCallback(entry, oldInstance, newInstance) {
  const content = await legacyGet(oldInstance, pkg.name, entry, 'application/octet-stream');
  return put(newInstance, pkg.name, content, 'application/octet-stream');
}

/**
 * @param {string} id
 * @param {IndexValue} _before
 * @param {IndexValue} after
 * @param {import('@astrobase/sdk/instance').Instance} _oldInstance
 * @param {import('@astrobase/sdk/instance').Instance} newInstance
 * @param {(message: string) => void} error
 */
async function checkCallback(id, _before, after, _oldInstance, newInstance, error) {
  if (!(await get(newInstance, after))) {
    error(`index[${id}] note content not found`);
  }
}
