import { getContent } from '@astrobase/sdk/content';
import { FileBuilder } from '@astrobase/sdk/file';
import { getAvailableKeyringCIDs, type PersistedKeyring } from '@astrobase/sdk/keyrings';
import { Title } from '@solidjs/meta';
import { A, createAsync, useNavigate } from '@solidjs/router';
import { createEffect, createResource, For, Show, type JSX } from 'solid-js';
import { KeyringGuard } from '../../components/keyring-guard';
import { instance, setSelectedKeyring } from '../../lib/astrobase';

export default (): JSX.Element => (
  <Show when={instance()}>
    {(instance) => {
      const [keyringCIDs] = createResource(() => getAvailableKeyringCIDs(instance()));

      const keyrings = createAsync(() => {
        const _instance = instance();
        return Promise.all(
          keyringCIDs()?.map((cid) =>
            getContent<FileBuilder<PersistedKeyring>>(cid, _instance).then(
              (file) => file?.getValue(_instance) as Promise<PersistedKeyring>,
            ),
          ) ?? [],
        );
      });

      const navigate = useNavigate();

      createEffect(() => {
        switch (keyringCIDs()?.length) {
          case 0:
            return navigate('create', { replace: true });
          case 1:
            return navigate('unlock', { replace: true });
        }
      });

      return (
        <KeyringGuard unlockStatus={false} redirectPath="/">
          <main class="text-center">
            <Title>Keyrings | 1core Pulse</Title>

            <A class="button m-[1ch]" href="create">
              Create New Keyring
            </A>

            <h1>Select a Keyring</h1>

            <For each={keyrings()}>
              {(_, i) => (
                <button
                  class="button m-[1ch]"
                  onClick={() => {
                    setSelectedKeyring(i());
                    navigate('unlock', { replace: true });
                  }}
                >
                  {i() + 1}
                </button>
              )}
            </For>
          </main>
        </KeyringGuard>
      );
    }}
  </Show>
);
