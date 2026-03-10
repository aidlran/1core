import { type Accessor, createSignal, type JSX, Show } from 'solid-js';

export interface EditableTextProps extends Omit<JSX.IntrinsicElements['input'], 'value'> {
  value: Accessor<string | undefined>;
}

export function EditableText(props: EditableTextProps): JSX.Element {
  const [editing, setEditing] = createSignal(false);

  let input!: HTMLInputElement;

  return (
    <Show
      when={editing()}
      fallback={
        <button
          class={(
            'text-left p-[1ch] focus:bg-comment hover:bg-comment ' + (props.class ?? '')
          ).trimEnd()}
          on:click={() => (setEditing(true), input.focus())}
        >
          {props.value()}
        </button>
      }
    >
      <input
        {...props}
        value={props.value()}
        ref={input}
        on:blur={() => setEditing(false)}
        on:keydown={(e) => (e.key === 'Escape' || e.key === 'Enter') && input.blur()}
      />
    </Show>
  );
}
