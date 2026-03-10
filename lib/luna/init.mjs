import wordlist from '@astrobase/sdk/bip39/wordlist/english';
import { Common } from '@astrobase/sdk/common';
import { WithCryptWrap } from '@astrobase/sdk/crypt';
import { WithNodeCrypt } from '@astrobase/sdk/crypt/node';
import { WithEcdsaWrap } from '@astrobase/sdk/ecdsa';
import { createInstance } from '@astrobase/sdk/instance';
import { WithNodeKDF } from '@astrobase/sdk/kdf/node';
import { createKeyring, getAvailableKeyringCIDs, loadKeyring } from '@astrobase/sdk/keyrings';
import { WithECDSA } from '@astrobase/sdk/signatures/ecdsa';
import sqlite from '@astrobase/sdk/sqlite';
import { saveIndex } from './content.mjs';
import { prompt } from './readline.mjs';

/**
 * @param {string} prefix
 * @returns {Promise<string>}
 */
async function promptPassphrase(prefix) {
  /** @type {string | undefined} */
  let passphrase;

  while (!passphrase) {
    passphrase = await prompt(`${prefix} database passphrase`);
    if (!passphrase) {
      // eslint-disable-next-line no-console
      console.error('No passphrase entered');
    }
  }

  return passphrase;
}

/** @type {string | undefined} */
let passphrase;

/**
 * @param {import('@astrobase/sdk/instance').Instance} instance
 * @param {string} pkgName
 * @returns {Promise<void>}
 */
export async function initKeyring(instance, pkgName) {
  let [cid] = await getAvailableKeyringCIDs(instance);

  if (cid) {
    if (passphrase) {
      await loadKeyring(instance, { cid, passphrase, wordlist });
    } else {
      while (!passphrase) {
        try {
          passphrase = await promptPassphrase('Enter');
          await loadKeyring(instance, { cid, passphrase, wordlist });
        } catch (e) {
          if (e instanceof Error && e.message.includes('unable to authenticate')) {
            // eslint-disable-next-line no-console
            console.error('Incorrect passphrase');
            passphrase = undefined;
          } else {
            throw e;
          }
        }
      }
    }
  } else {
    if (!passphrase) {
      passphrase = await promptPassphrase('Choose a');
      if (passphrase !== (await promptPassphrase('Confirm'))) {
        // eslint-disable-next-line no-console
        console.error('Passphrases do not match');
        process.exit(1);
      }
    }
    const { cid } = await createKeyring(instance, { passphrase, wordlist });
    await loadKeyring(instance, { cid, passphrase, wordlist });
    await saveIndex(instance, pkgName, {});
  }
}

/**
 * @param {string} dbFilePath Database file path.
 * @param {string} pkgName
 * @param {import('better-sqlite3').Database} [db]
 * @param {import('@astrobase/sdk/instance').InstanceConfig[]} [extraConfigs]
 * @returns {Promise<import('@astrobase/sdk/instance').Instance>}
 */
export async function initInstance(dbFilePath, pkgName, db, extraConfigs = []) {
  const instance = createInstance(
    Common,
    WithCryptWrap,
    WithECDSA,
    WithEcdsaWrap,
    WithNodeCrypt,
    WithNodeKDF,
    ...extraConfigs,
    { clients: [{ strategy: sqlite(db ?? { filename: dbFilePath }) }] },
  );
  await initKeyring(instance, pkgName);
  return instance;
}
