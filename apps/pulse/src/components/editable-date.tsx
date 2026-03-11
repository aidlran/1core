import type { Accessor, JSX } from 'solid-js';
import { timestampToString } from '../lib/timestamps';
import { EditableText, type EditableTextProps } from './editable-text';

export interface EditableDateProps extends Omit<EditableTextProps, 'on:change' | 'value'> {
  'on:change'?: JSX.ChangeEventHandler<HTMLInputElement, Event>;
  value: Accessor<number | undefined>;
}

export const EditableDate = (props: EditableDateProps) => (
  <EditableText
    {...props}
    value={() => timestampToString(props.value())}
    on:change={
      props?.['on:change']
        ? (e) => !isNaN(Date.parse(e.target.value)) && props?.['on:change']?.(e)
        : undefined
    }
  />
);
