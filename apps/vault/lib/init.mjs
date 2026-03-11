import { get, put } from '../../../lib/1core/content.mjs';
import { initInstance } from '../../../lib/1core/init.mjs';
import { legacyGet } from '../../../lib/1core/legacy-content.mjs';
import { migrate } from '../../../lib/1core/migrate.mjs';
import { appName, legacyAppName } from './app-name.mjs';

/**
 * @param {string} dbFilePath
 * @returns {Promise<import('@astrobase/sdk/instance').Instance>}
 */
export const init = async (dbFilePath) =>
  (await migrate(
    dbFilePath,
    legacyAppName,
    appName,
    // @ts-expect-error
    cloneCallback,
    updateEntryCallback,
    checkCallback,
  )) ?? (await initInstance(dbFilePath, appName));

/**
 * @param {import('./content.mjs').Index} index
 * @param {[string, import('./content.mjs').IndexValue]} entry
 * @returns {import('./content.mjs').Index}
 */
function cloneCallback(index, [id, { added, cid }]) {
  index[id] = { added, cid };
  return index;
}

/**
 * @param {import('./content.mjs').IndexValue} entry
 * @param {import('@astrobase/sdk/instance').Instance} oldInstance
 * @param {import('@astrobase/sdk/instance').Instance} newInstance
 * @returns {Promise<import('./content.mjs').IndexValue>}
 */
async function updateEntryCallback(entry, oldInstance, newInstance) {
  /** @type {import('./content.mjs').Entry['props'][]} */
  const stack = [];

  /** @type {import('@astrobase/sdk/cid').ContentIdentifier} */
  let prev = entry.cid;

  // Push each generation onto stack (oldest on top)
  do {
    const entry = await legacyGet(oldInstance, legacyAppName, prev, 'application/json');
    stack.push(entry.props);
    ({ prev } = entry);
  } while (prev);

  // Pop throughout the stack to build a new chain
  while (stack.length) {
    prev = await put(newInstance, appName, { prev, props: stack.pop() });
  }

  return { added: entry.added, cid: prev };
}

/**
 * @param {string} id
 * @param {import('./content.mjs').IndexValue} before
 * @param {import('./content.mjs').IndexValue} after
 * @param {import('@astrobase/sdk/instance').Instance} oldInstance
 * @param {import('@astrobase/sdk/instance').Instance} newInstance
 * @param {(message: string) => void} error
 */
async function checkCallback(id, before, after, oldInstance, newInstance, error) {
  if (before.added !== after.added) {
    error(`index[${id}].added does not match`);
  }

  let newPrev = after.cid,
    oldPrev = before.cid,
    generation = 0;

  do {
    const newContent = await get(newInstance, newPrev);
    const oldContent = await legacyGet(oldInstance, legacyAppName, oldPrev, 'application/json');

    if (JSON.stringify(newContent.props) !== JSON.stringify(oldContent.props)) {
      error(`${id}{${generation}}.props do not match`);
    }

    if ((newPrev && !oldPrev) || (!newPrev && oldPrev)) {
      error(`${id}{${generation}}.prev exists only on one`);
    }

    newPrev = newContent.prev;
    oldPrev = oldContent.prev;
    --generation;
  } while (newPrev);
}
