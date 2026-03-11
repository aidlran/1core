import { ContentIdentifier } from '@astrobase/sdk/cid';
import { array, type InferInput, instance, strictObject, strictTuple } from 'valibot';

/** Valibot schema of the entity root POJO as stored. */
export const EntityRootSchema = strictObject({
  entities: array(instance(ContentIdentifier)),
  dependencies: array(strictTuple([instance(ContentIdentifier), instance(ContentIdentifier)])),
});

export type EntityRootPOJO = InferInput<typeof EntityRootSchema>;
