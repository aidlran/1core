import wordlist from '@astrobase/sdk/bip39/wordlist/english' with { type: 'json' };
import { Common } from '@astrobase/sdk/common';
import { WithNodeCrypt } from '@astrobase/sdk/crypt/node';
import { inMemory } from '@astrobase/sdk/in-memory';
import { createInstance } from '@astrobase/sdk/instance';
import { WithNodeKDF } from '@astrobase/sdk/kdf/node';
import { createKeyring, loadKeyring } from '@astrobase/sdk/keyrings';
import { WithECDSA } from '@astrobase/sdk/signatures/ecdsa';
import { randomBytes } from 'node:crypto';
import { assert, expect, test } from 'vitest';
import { deleteEntry, getEntry, getIndex, saveIndex } from '../../../lib/1core/content.mjs';
import { appName } from './app-name.mjs';
import { deleteEntryHook, saveEntry } from './content.mjs';

const randText = (length = 8) => randomBytes(length).toString('base64');

const instance = createInstance(Common, WithECDSA, WithNodeCrypt, WithNodeKDF, {
  clients: [{ strategy: inMemory() }],
});
const passphrase = randText();
const keyring = await createKeyring(instance, { passphrase, wordlist });
await loadKeyring(instance, { cid: keyring.cid, passphrase, wordlist });

test('saveEntry, getEntry, renameEntry & deleteEntry', async () => {
  await saveIndex(instance, appName, {});

  const firstEntryID = randText();

  // Non exist get test
  await expect(getEntry(instance, appName, firstEntryID)).resolves.toBe(undefined);

  // Save new test
  let props = {
    [randText()]: randText(),
  };
  await saveEntry(instance, firstEntryID, props);
  await expect(getEntry(instance, appName, firstEntryID)).resolves.toStrictEqual({ props });

  // Save update test
  let prev = (await getIndex(instance, appName))[firstEntryID].cid;
  props = {
    [randText()]: randText(),
    [randText()]: randText(),
  };
  await saveEntry(instance, firstEntryID, props);

  // Get after update
  let retrievedEntry = await getEntry(instance, appName, firstEntryID);
  assert(retrievedEntry);
  expect(retrievedEntry.prev.toString()).toBe(prev.toString());
  expect(retrievedEntry.props).toStrictEqual(props);

  // Delete test
  await deleteEntry(instance, appName, firstEntryID, deleteEntryHook);
  await expect(getEntry(instance, appName, firstEntryID)).resolves.toBe(undefined);
});
