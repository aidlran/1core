import type { Accessor, JSX } from 'solid-js';
import { EditableText, type EditableTextProps } from './editable-text';

export interface EditableDateProps extends Omit<EditableTextProps, 'on:change' | 'value'> {
  'on:change'?: JSX.ChangeEventHandler<HTMLInputElement, Event>;
  value: Accessor<number | undefined>;
}

export const EditableDate = (props: EditableDateProps) => (
  <EditableText
    {...props}
    value={() => {
      const value = props.value();
      if (value === undefined) {
        return '';
      }

      if (value % 864e5 == 0) {
        return new Date(value).toLocaleDateString();
      }

      return new Date(value).toLocaleString();
    }}
    on:change={
      props?.['on:change']
        ? (e) => !isNaN(Date.parse(e.target.value)) && props?.['on:change']?.(e)
        : undefined
    }
  />
);
