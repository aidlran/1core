import wordlist from '@astrobase/sdk/bip39/wordlist/english';
import { getAvailableKeyringCIDs, loadKeyring } from '@astrobase/sdk/keyrings';
import { Title } from '@solidjs/meta';
import { A, useNavigate } from '@solidjs/router';
import { createEffect, createResource, createSignal, Show, type JSX } from 'solid-js';
import { KeyringGuard } from '../../components/keyring-guard';
import {
  instance,
  selectedKeyring,
  setKeyringUnlocked,
  setSelectedKeyring,
} from '../../lib/astrobase';

export default (): JSX.Element => (
  <Show when={instance()}>
    {(instance) => {
      const [isWorking, setIsWorking] = createSignal(false);

      const [keyringCIDs] = createResource(() => getAvailableKeyringCIDs(instance()));

      const navigate = useNavigate();

      const keyringCount = () => keyringCIDs()?.length;

      createEffect(() => {
        const keyringCount = keyringCIDs()?.length;
        const selected = selectedKeyring();

        if (keyringCount == 0) {
          navigate('../create', { replace: true });
        } else if (typeof selected !== 'number') {
          if (keyringCount == 1) {
            setSelectedKeyring(0);
          } else {
            navigate('..', { replace: true });
          }
        }
      });

      return (
        <KeyringGuard unlockStatus={false} redirectPath="/">
          <main class="text-center">
            <Title>Unlock Keyring | 1core Pulse</Title>

            <Show when={keyringCount()}>
              {(count) => (
                <Show when={count() > 1}>
                  <A class="button m-[1ch]" href="..">
                    Back to keyring selection
                  </A>
                </Show>
              )}
            </Show>

            <A class="button m-[1ch]" href="../create">
              Create New Keyring
            </A>

            <Show when={selectedKeyring() !== undefined}>
              <h1>Unlock Keyring {selectedKeyring()! + 1}</h1>
            </Show>

            <form
              onSubmit={async (e) => {
                try {
                  e.preventDefault();
                  setIsWorking(true);
                  const i = instance();
                  const passphrase = e.currentTarget.passphrase.value;
                  const cid = keyringCIDs()![selectedKeyring()!]!;
                  await loadKeyring(i, { cid, passphrase, wordlist });
                  setKeyringUnlocked(true);
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
                autocomplete="current-password"
              />

              <button type="submit" disabled={isWorking()}>
                Unlock
              </button>
            </form>
          </main>
        </KeyringGuard>
      );
    }}
  </Show>
);
