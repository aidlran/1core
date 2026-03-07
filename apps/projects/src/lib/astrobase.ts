import { WithWebCryptoCrypt } from '@astrobase/sdk/crypt/web-crypto';
import { Common } from '@astrobase/sdk/common';
import { WithNobleCrypt } from '@astrobase/sdk/crypt/noble';
import { indexeddb } from '@astrobase/sdk/indexeddb';
import { createInstance } from '@astrobase/sdk/instance';
import { WithWebCryptoKDF } from '@astrobase/sdk/kdf/web-crypto';
import { WithECDSA } from '@astrobase/sdk/signatures/ecdsa';
import { createMemo, createResource, createSignal } from 'solid-js';

/**
 * The base Astrobase config. The application derives a reactive final config value with user
 * configuration on top.
 */
const baseConfig = createResource(async () =>
  createInstance(Common, WithECDSA, WithWebCryptoCrypt, WithNobleCrypt, WithWebCryptoKDF, {
    clients: [{ strategy: await indexeddb() }],
  }),
)[0];

export const [keyringUnlocked, setKeyringUnlocked] = createSignal(false);

export const [selectedKeyring, setSelectedKeyring] = createSignal<number>();

/** The reactive merged Astrobase config. We'll add a source signal with the user's configuration. */
export const instance = createMemo(() => baseConfig());
