import { check, integer, number, pipe } from 'valibot';

export const timestamp = pipe(number(), integer());

export const pastTimestamp = pipe(
  number(),
  integer(),
  check((value) => value <= Date.now()),
);
