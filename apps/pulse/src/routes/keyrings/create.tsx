import wordlist from '@astrobase/sdk/bip39/wordlist/english';
import { createKeyring, getAvailableKeyringCIDs, loadKeyring } from '@astrobase/sdk/keyrings';
import { Title } from '@solidjs/meta';
import { A } from '@solidjs/router';
import { createResource, createSignal, Show, type JSX } from 'solid-js';
import { KeyringGuard } from '../../components/keyring-guard';
import { instance, setKeyringUnlocked, setSelectedKeyring } from '../../lib/astrobase';

export default (): JSX.Element => (
  <Show when={instance()}>
    {(instance) => {
      const [keyringCIDs] = createResource(() => getAvailableKeyringCIDs(instance()));

      const [isWorking, setIsWorking] = createSignal(false);

      return (
        <KeyringGuard unlockStatus={false} redirectPath="/">
          <main class="text-center">
            <Title>Create Keyring | 1core Pulse</Title>

            <Show when={keyringCIDs()?.length}>
              <A class="button m-[1ch]" href="..">
                Back to keyring selection
              </A>
            </Show>

            <h1>Create Keyring</h1>

            <form
              onSubmit={async (e) => {
                try {
                  e.preventDefault();
                  setIsWorking(true);
                  const _instance = instance();
                  const passphrase = e.currentTarget.passphrase.value;
                  const { cid } = await createKeyring(_instance, { passphrase, wordlist });
                  await loadKeyring(_instance, { cid, passphrase, wordlist });
                  setKeyringUnlocked(true);
                  const nCID = cid.toString();
                  const keyringCIDs = await getAvailableKeyringCIDs(_instance);
                  for (let i = 0; i < keyringCIDs.length; i++) {
                    if (keyringCIDs[i]!.toString() === nCID) {
                      setSelectedKeyring(i);
                      break;
                    }
                  }
                } finally {
                  setIsWorking(false);
                }
              }}
            >
              <input
                type="password"
                name="passphrase"
                placeholder="Passphrase"
                required
                minlength="8"
                autocomplete="new-password"
              />

              <input
                type="password"
                name="confirmPassphrase"
                placeholder="Confirm passphrase"
                required
                minlength="8"
                autocomplete="new-password"
              />

              <button type="submit" disabled={isWorking()}>
                Create Keyring
              </button>
            </form>
          </main>
        </KeyringGuard>
      );
    }}
  </Show>
);
