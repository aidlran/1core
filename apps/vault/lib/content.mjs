import { deleteContent } from '@astrobase/sdk/content';
// prettier-ignore
import { assertEntryExists, get, getEntry, getIndex, put, saveIndex } from '../../../lib/1core/content.mjs';
import { appName } from './app-name.mjs';

/**
 * @typedef IndexValue
 * @property {string} added
 * @property {import('@astrobase/sdk/cid').ContentIdentifier} cid
 */

/** @typedef {Record<string, IndexValue>} Index */

/**
 * @typedef Entry
 * @property {import('@astrobase/sdk/cid').ContentIdentifier} [prev]
 * @property {Record<string, string>} props
 */

/**
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} id
 * @returns {Promise<(Entry['props'] & { added: string }) | undefined>}
 */
export async function getEntryProps(instance, id) {
  const entry = await getEntry(instance, appName, id);

  return entry
    ? {
        ...entry.props,
        added: (await getIndex(instance, appName))[id]?.added,
      }
    : undefined;
}

/**
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} id
 * @returns {Promise<import('./content.mjs').Entry['props']>}
 */
export async function getAssertedEntryProps(instance, id) {
  await assertEntryExists(instance, appName, id);
  const props = await getEntryProps(instance, id);
  if (!props) {
    // eslint-disable-next-line no-console
    console.error(`Entry '${id}' not found`);
    process.exit(1);
  }
  return props;
}

/**
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} id
 * @param {Entry['props']} props
 */
export async function saveEntry(instance, id, props) {
  const index = await getIndex(instance, appName);
  const now = new Date().toISOString();
  props.updated ??= now;
  const added = props.added ?? index[id]?.added ?? now;
  delete props.added;
  index[id] = {
    added,
    cid: await put(instance, appName, { prev: index[id]?.cid, props }),
  };
  await saveIndex(instance, appName, index);
}

/** @type {import('../../../lib/1core/content.mjs').DeleteEntryHook<IndexValue>} */
export async function deleteEntryHook({ cid }, instance) {
  /** @type {Promise<unknown>[]} */
  const promises = [];

  /** @type {import('@astrobase/sdk/cid').ContentIdentifier | undefined} */
  let next = cid;

  while (next) {
    /** @type {Entry | void} */
    const entry = await get(instance, cid);

    promises.push(deleteContent(cid, instance));

    if (!entry) {
      break;
    }

    next = entry.prev;
  }

  return Promise.all(promises);
}
