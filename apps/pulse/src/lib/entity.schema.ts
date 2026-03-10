import {
  boolean,
  InferInput,
  maxLength,
  minLength,
  optional,
  pipe,
  strictObject,
  string,
} from 'valibot';
import { pastTimestamp, timestamp } from './schemas.js';

/** Valibot schema of an entity POJO as stored. */
export const EntitySchema = strictObject({
  /** Task name. */
  name: pipe(string(), minLength(1), maxLength(1000)),

  /** Task completion flag. */
  completed: boolean(),

  /** Task start window timestamp */
  start: optional(timestamp),

  /** Task deadline timestamp. */
  deadline: optional(timestamp),

  /** Task creation date. Should not change. */
  created: pastTimestamp,

  /** Task update date. Should change when any other property changes. */
  updated: pastTimestamp,
});

export type EntityPOJO = InferInput<typeof EntitySchema>;
