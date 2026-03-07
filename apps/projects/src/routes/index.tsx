import { deleteImmutable } from '@astrobase/sdk/immutable';
import { clearKeyring } from '@astrobase/sdk/keyrings';
import { Title } from '@solidjs/meta';
import { A } from '@solidjs/router';
// prettier-ignore
import { type Accessor, createMemo, createSignal, For, type JSX, type ParentProps, type Setter, Show, type Signal } from 'solid-js';
import { EditableDate } from '~/components/editable-date';
import { EditableText } from '~/components/editable-text';
import { KeyringGuard } from '~/components/keyring-guard';
import { instance, setKeyringUnlocked } from '~/lib/astrobase';
// prettier-ignore
import { createEntity, getEntityRootForDerivedIdentity, saveEntityRoot, updateEntity } from '~/lib/entities';

const FilterCheckbox = (
  props: ParentProps<{ get: Accessor<boolean>; set: Setter<boolean> }>,
): JSX.Element => (
  <label class="m-2">
    <input type="checkbox" checked={props.get()} on:change={(e) => props.set(e.target.checked)} />
    {props.children}
  </label>
);

export default (): JSX.Element => (
  <main>
    <Title>Home | Luna Projects</Title>
    <Show when={instance()}>
      {(instance) => {
        const [addingTask, setAddingTask] = createSignal(false);

        const [hideBlocked, setHideBlocked] = createSignal(true);
        const [hideCompleted, setHideCompleted] = createSignal(true);
        const [hideFuture, setHideFuture] = createSignal(true);

        let newTaskInput!: HTMLInputElement;

        const entityRoot = getEntityRootForDerivedIdentity('1core');

        return (
          <KeyringGuard redirectPath="/keyrings" unlockStatus={true}>
            <A
              href="/keyrings/unlock"
              onClick={() => {
                clearKeyring(instance());
                setKeyringUnlocked(false);
              }}
            >
              Lock
            </A>

            <FilterCheckbox get={hideBlocked} set={setHideBlocked}>
              Hide blocked tasks
            </FilterCheckbox>

            <FilterCheckbox get={hideCompleted} set={setHideCompleted}>
              Hide completed tasks
            </FilterCheckbox>

            <FilterCheckbox get={hideFuture} set={setHideFuture}>
              Hide future tasks
            </FilterCheckbox>

            <table class="w-full">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Completed</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Dependencies</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th class="text-right">
                    <button
                      disabled={addingTask()}
                      on:click={() => {
                        setAddingTask(true);
                        newTaskInput.focus();
                      }}
                    >
                      Add task
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <Show when={addingTask()}>
                  <tr>
                    <td colspan="8">
                      <input
                        ref={newTaskInput}
                        class="w-full"
                        placeholder="New task"
                        on:blur={(e) => {
                          const name = e.currentTarget.value.trim();
                          name && createEntity(entityRoot, { name });
                          setAddingTask(false);
                        }}
                        on:keydown={(e) =>
                          (e.key === 'Escape' || e.key === 'Enter') && e.currentTarget.blur()
                        }
                      />
                    </td>
                  </tr>
                </Show>
                <For each={entityRoot.entities()}>
                  {(entity, i) => {
                    const created = new Date(entity.created);
                    const updated = createMemo(() => new Date(entity.updated()));

                    const [addingDependency, setAddingDependency] = createSignal(false);
                    let dependencyInput!: HTMLInputElement;

                    const EditableDateCell = (props: {
                      value: Signal<string | undefined>;
                    }): JSX.Element => (
                      <td>
                        <div class="flex">
                          <EditableDate
                            class="grow"
                            value={props.value[0]}
                            on:change={(e) => {
                              // eslint-disable-next-line solid/reactivity
                              updateEntity(entityRoot, entity, () =>
                                props.value[1](new Date(e.target.value).toISOString()),
                              );
                            }}
                          />
                          <Show when={props.value[0]()}>
                            <button
                              on:click={() => {
                                // eslint-disable-next-line solid/reactivity
                                updateEntity(entityRoot, entity, () => props.value[1](undefined));
                              }}
                            >
                              x
                            </button>
                          </Show>
                        </div>
                      </td>
                    );

                    return (
                      <Show
                        when={
                          (!hideBlocked() || !entity.blocked()) &&
                          (!hideCompleted() || !entity.completed()) &&
                          (!hideFuture() ||
                            !entity.start() ||
                            Date.parse(entity.start()!) <= Date.now())
                        }
                      >
                        <tr>
                          <td>
                            <EditableText
                              class="w-full"
                              value={entity.name}
                              on:change={(e) => {
                                const v = e.target.value.trim();
                                v && updateEntity(entityRoot, entity, () => entity.setName(v));
                              }}
                            />
                          </td>

                          <td>
                            <input
                              type="checkbox"
                              checked={entity.completed()}
                              on:change={(e) =>
                                updateEntity(entityRoot, entity, () =>
                                  entity.setCompleted(e.target.checked),
                                )
                              }
                            />
                          </td>

                          <EditableDateCell value={[entity.start, entity.setStart]} />

                          <EditableDateCell value={[entity.end, entity.setEnd]} />

                          <td>
                            <div class="flex justify-between">
                              <div>
                                <For each={entityRoot.entityDependencies()}>
                                  {([dependent, dependee], i) => (
                                    <Show when={dependent === entity}>
                                      <div class="border inline">
                                        {dependee.name()}
                                        <button
                                          on:click={() => {
                                            const index = i();
                                            entityRoot.setEntityDependencies((v) =>
                                              v.toSpliced(index, 1),
                                            );
                                            updateEntity(entityRoot, entity, undefined, true);
                                          }}
                                        >
                                          x
                                        </button>
                                      </div>
                                    </Show>
                                  )}
                                </For>
                              </div>

                              <Show
                                when={addingDependency()}
                                fallback={
                                  <button
                                    on:click={() => {
                                      setAddingDependency(true);
                                      dependencyInput.focus();
                                    }}
                                  >
                                    +
                                  </button>
                                }
                              >
                                <input
                                  class="grow"
                                  list="tasks"
                                  ref={dependencyInput}
                                  on:change={async (e) => {
                                    e.target.blur();
                                    const dependee = entityRoot
                                      .entities()
                                      .find(({ name }) => name() === e.target.value);
                                    if (dependee) {
                                      entityRoot.setEntityDependencies((v) => [
                                        ...v,
                                        [entity, dependee],
                                      ]);
                                      updateEntity(entityRoot, entity, undefined, true);
                                    }
                                  }}
                                  on:blur={() => setAddingDependency(false)}
                                  on:keydown={(e) =>
                                    (e.key === 'Escape' || e.key === 'Enter') &&
                                    dependencyInput.blur()
                                  }
                                />

                                <datalist id="tasks">
                                  <For each={entityRoot.entities()}>
                                    {(datalistEntity) => (
                                      <Show
                                        when={
                                          // TODO: need to hide it if the entry's dependency chain includes `task`
                                          //       need to propagate dependencies up
                                          entity !== datalistEntity &&
                                          !entity
                                            .dependencies()
                                            .some(([, dependee]) => dependee === datalistEntity)
                                        }
                                      >
                                        <option>{datalistEntity.name()}</option>
                                      </Show>
                                    )}
                                  </For>
                                </datalist>
                              </Show>
                            </div>
                          </td>

                          <td title={created.toLocaleString()}>{created.toLocaleDateString()}</td>

                          <td title={updated().toLocaleString()}>
                            {updated().toLocaleDateString()}
                          </td>

                          <td class="text-right">
                            <button
                              on:click={async () => {
                                const index = i();
                                entityRoot.setEntities((v) => v.toSpliced(index, 1));
                                entityRoot.setEntityDependencies((dependencies) =>
                                  dependencies.filter(
                                    ([dependent, dependee]) =>
                                      entity !== dependent && entity !== dependee,
                                  ),
                                );
                                saveEntityRoot(entityRoot);
                                const cid = entity.cid();
                                if (cid) {
                                  deleteImmutable(instance(), cid.value);
                                }
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      </Show>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </KeyringGuard>
        );
      }}
    </Show>
  </main>
);
