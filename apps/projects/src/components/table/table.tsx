import type { JSX, ParentProps } from 'solid-js';
import './table.css';

export default (props: ParentProps): JSX.Element => (
  <div class="m-[1ch]">
    <table>{props.children}</table>
  </div>
);
