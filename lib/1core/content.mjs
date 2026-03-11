import { getContent } from '@astrobase/sdk/content';
import { cryptOptions } from '@astrobase/sdk/crypt';
import { FileBuilder } from '@astrobase/sdk/file';
import { getIdentity, putIdentity } from '@astrobase/sdk/identity';
import { putImmutable } from '@astrobase/sdk/immutable';
import { Wrap } from '@astrobase/sdk/media-types';

/**
 * @satisfies {Partial<import('@astrobase/sdk/crypt').CryptOptions> & {
 *   encAlg: import('@astrobase/sdk/crypt/node').NodeCryptAlg;
 * } & { kdf: import('@astrobase/sdk/kdf/node').NodeKDF }}
 */
export const baseCryptOptions = {
  encAlg: 'ChaCha20-Poly1305',
  hashAlg: 'SHA-512',
  iterations: 10000,
  kdf: 'PBKDF2',
  keyLen: 32,
};

/**
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} id Identity ID
 * @returns {Promise<Uint8Array<ArrayBuffer>>}
 */
export const getPubKey = async (instance, id) =>
  new Uint8Array((await getIdentity({ id, instance })).cid.value);

/**
 * @template T
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {import('@astrobase/sdk/cid').ContentIdentifierLike} cid
 * @returns {Promise<T | void>}
 */
export async function get(instance, cid) {
  const content = await getContent(cid, instance);

  if (content) {
    /** @type {import('../astrobase/dist/wraps/types.js').Unwrapped} */
    const unwrapped = await content.getValue(instance);
    return unwrapped.value.getValue(instance);
  }
}

/**
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} id Identity ID
 * @returns {Promise<import('@astrobase/sdk/cid').ContentIdentifier | undefined>}
 */
export const getIndexCID = async (instance, id) =>
  (await getIdentity({ id, instance })).identity?.ref;

/**
 * @template T
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} id Identity ID
 * @returns {Promise<T | void>}
 */
export async function getIndex(instance, id) {
  const cid = await getIndexCID(instance, id);
  if (cid) {
    return get(instance, cid);
  }
}

/**
 * @template T
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} identityID
 * @param {string} key
 * @returns {Promise<T | void>}
 */
export async function getEntry(instance, identityID, key) {
  const cid = (await getIndex(instance, identityID))[key]?.cid;
  if (cid) {
    return get(instance, cid);
  }
}

/**
 * @template T
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} identityID
 * @param {string} id
 * @param {boolean} [bool] `true` = it must exist. `false` = it must not exist.
 * @returns {Promise<T>} The value.
 * @throws If assertion fails.
 */
export async function assertEntryExists(instance, identityID, id, bool = true) {
  /** @type {T} */
  const value = (await getIndex(instance, identityID))[id];
  if (!value == bool) {
    // eslint-disable-next-line no-console
    console.error(`Entry '${id}' ${bool ? 'does not exist' : 'already exists'}`);
    process.exit(1);
  }
  return value;
}

/**
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} identityID
 * @param {unknown} value
 * @param {import('@astrobase/sdk/media-types').MediaTypeLike} [mediaType]
 * @param {Partial<import('@astrobase/sdk/crypt').CryptOptions>} [_cryptOptions]
 * @returns {Promise<import('@astrobase/sdk/cid').ContentIdentifier>}
 */
export async function put(
  instance,
  identityID,
  value,
  mediaType = 'application/json',
  _cryptOptions,
) {
  const publicKey = await getPubKey(instance, identityID);
  const metadata = await new FileBuilder()
    .setMediaType('application/json')
    .setValue(cryptOptions({ ...baseCryptOptions, ..._cryptOptions, publicKey }), instance);
  const valueFile = await new FileBuilder().setMediaType(mediaType).setValue(value, instance);
  const file = await new FileBuilder()
    .setMediaType(Wrap)
    .setValue({ type: 'crypt', metadata, value: valueFile }, instance);
  return putImmutable(file, { instance });
}

/**
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} id Identity ID
 * @param {unknown} [newIndex]
 * @param {Partial<import('@astrobase/sdk/crypt').CryptOptions>} [cryptOptions]
 */
export const saveIndex = async (instance, id, newIndex, cryptOptions) =>
  putIdentity({
    id,
    instance,
    ref: await put(
      instance,
      id,
      /** @type {never} */ (newIndex ?? (await getIndex(instance, id))),
      undefined,
      cryptOptions,
    ),
  });

/**
 * @template T
 * @typedef {(value: T, instance: import('@astrobase/sdk/instance').Instance) => Promise<unknown>} DeleteEntryHook
 */

/**
 * Deletes an entry in the index and runs a hook with the value.
 *
 * @template T
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} identityID
 * @param {string} id
 * @param {DeleteEntryHook<T>} hook
 */
export async function deleteEntry(instance, identityID, id, hook) {
  /** @type {Record<string, T> | void} */
  const index = await getIndex(instance, identityID);

  if (!index) {
    return;
  }

  const value = index[id];

  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete index[id];

  /** @type {Promise<unknown>[]} */
  const promises = [saveIndex(instance, identityID, index)];

  if (value) {
    promises.push(hook(value, instance));
  }

  await Promise.all(promises);
}
