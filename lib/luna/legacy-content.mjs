import { decodeWithCodec } from '@astrobase/sdk/codecs';
import { getContent } from '@astrobase/sdk/content';
import {
  getIdentityBIP44,
  getNextIdentity,
  getPrivateKeyBIP44,
} from '@astrobase/sdk/identity/bip44';
import { legacyDecrypt } from './legacy-crypt.mjs';

/**
 * @deprecated
 * @template T
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} id
 * @param {import('@astrobase/sdk/cid').ContentIdentifierLike} cid
 * @param {import('@astrobase/sdk/media-types').MediaTypeLike} mediaType
 * @returns {Promise<T | void>}
 */
export async function legacyGet(instance, id, cid, mediaType = 'application/json') {
  const content = await getContent(cid, instance);

  if (content) {
    /** @type {import('@astrobase/sdk/cid').ContentIdentifier} */
    let cid;

    try {
      ({ cid } = await getIdentityBIP44({ id, instance }));
    } catch (e) {
      if (e instanceof Error && e.message === 'Identity not found') {
        ({ cid } = await getNextIdentity(instance));
      } else {
        throw e;
      }
    }

    // @ts-expect-error
    return decodeWithCodec(
      instance,
      legacyDecrypt(
        content.payload,
        getPrivateKeyBIP44({ instance, publicKey: new Uint8Array(cid.value) }),
      ),
      mediaType,
    );
  }
}

/**
 * @deprecated
 * @template T
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} id Identity ID
 * @param {import('@astrobase/sdk/media-types').MediaTypeLike} [mediaType]
 * @returns {Promise<T | void>}
 */
export const legacyGetIndex = async (instance, id, mediaType) =>
  legacyGet(instance, id, (await getIdentityBIP44({ id, instance })).identity.ref, mediaType);
