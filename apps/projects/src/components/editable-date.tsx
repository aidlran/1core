import type { JSX } from 'solid-js';
import { EditableText, type EditableTextProps } from './editable-text';

export interface EditableDateProps extends Omit<EditableTextProps, 'on:change'> {
  'on:change'?: JSX.ChangeEventHandler<HTMLInputElement, Event>;
}

export const EditableDate = (props: EditableDateProps) => (
  <EditableText
    {...props}
    value={() => {
      const value = props.value();
      return value ? new Date(value).toISOString() : '';
    }}
    on:change={
      props?.['on:change']
        ? (e) => !isNaN(Date.parse(e.target.value)) && props?.['on:change']?.(e)
        : undefined
    }
  />
);
