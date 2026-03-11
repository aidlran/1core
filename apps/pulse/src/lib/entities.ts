import type { ContentIdentifier } from '@astrobase/sdk/cid';
import { deleteImmutable } from '@astrobase/sdk/immutable';
import { type Accessor, createSignal, type Setter } from 'solid-js';
import { get, getIndex, put, saveIndex } from '../../../../lib/1core/content.mjs';
import { assert } from './assert';
import { instance } from './astrobase';
import type { EntityPOJO } from './entity.schema';
import type { EntityRootPOJO } from './entity-root.schema';

export type EntityDependency = [dependent: Entity, dependee: Entity];

export interface Entity {
  name: Accessor<string>;
  setName: Setter<string>;

  completed: Accessor<boolean>;
  setCompleted: Setter<boolean>;

  start: Accessor<number | undefined>;
  setStart: Setter<number | undefined>;

  deadline: Accessor<number | undefined>;
  setDeadline: Setter<number | undefined>;

  created: number;

  updated: Accessor<number>;
  setUpdated: Setter<number>;

  cid: Accessor<ContentIdentifier | undefined>;
  setCID: Setter<ContentIdentifier | undefined>;

  dependencies: Accessor<EntityDependency[]>;

  blocked: Accessor<boolean>;
}

export interface EntityRoot {
  readonly identityID: string;

  entities: Accessor<Entity[]>;
  setEntities: Setter<Entity[]>;

  entityDependencies: Accessor<EntityDependency[]>;
  setEntityDependencies: Setter<EntityDependency[]>;
}

const identityID = '1core';

export const cryptOverrides = {
  encAlg: 'XChaCha20-Poly1305',
  nonce: crypto.getRandomValues(new Uint8Array(24)),
} as const;

export function getEntityRootForDerivedIdentity(identityID: string): EntityRoot {
  const [entities, setEntities] = createSignal<Entity[]>([]);

  const [entityDependencies, setEntityDependencies] = createSignal<EntityDependency[]>([]);

  const entityRoot = {
    identityID,

    entities,
    setEntities,

    entityDependencies,
    setEntityDependencies,
  };

  void refreshEntityRoot(entityRoot);

  return entityRoot;
}

function objectToEntity(
  entityRoot: EntityRoot,
  entityPojo: Partial<EntityPOJO>,
  _cid?: ContentIdentifier,
): Entity {
  const [name, setName] = createSignal(entityPojo.name ?? '');
  const [completed, setCompleted] = createSignal(entityPojo.completed ?? false);
  const [start, setStart] = createSignal(entityPojo.start);
  const [deadline, setDeadline] = createSignal(entityPojo.deadline);
  const [updated, setUpdated] = createSignal(entityPojo.updated ?? Date.now());
  const [cid, setCID] = createSignal(_cid);

  const entity: Entity = {
    name,
    setName,

    completed,
    setCompleted,

    start,
    setStart,

    deadline,
    setDeadline,

    created: entityPojo.created ?? Date.now(),

    updated,
    setUpdated,

    cid,
    setCID,

    dependencies: () =>
      entityRoot.entityDependencies().filter(([dependent]) => dependent === entity),

    blocked: () =>
      entity.dependencies().some(([, dependee]) => !dependee.completed() || dependee.blocked()),
  };

  return entity;
}

export const entityToObject = (entity: Entity): EntityPOJO => ({
  name: entity.name(),
  completed: entity.completed(),
  start: entity.start(),
  deadline: entity.deadline(),
  created: entity.created,
  updated: entity.updated(),
});

async function refreshEntityRoot(entityRoot: EntityRoot) {
  const _instance = assert(instance());

  let pojo: EntityRootPOJO | void;

  try {
    pojo = await getIndex<EntityRootPOJO>(_instance, identityID);
  } catch {
    return;
  }

  if (pojo) {
    const entityMap: Record<string, Promise<Entity>> = {};

    const loadEntity = async (cid: ContentIdentifier) =>
      (entityMap[cid.toString()] ??= (get(_instance, cid) as Promise<EntityPOJO>).then((pojo) =>
        objectToEntity(entityRoot, pojo, cid),
      ));

    await Promise.all([
      Promise.all(pojo.entities.map(loadEntity)).then(entityRoot.setEntities),

      Promise.all(
        pojo.dependencies.map(([a, b]) => Promise.all([loadEntity(a), loadEntity(b)])),
      ).then(entityRoot.setEntityDependencies),
    ]);
  }
}

export async function saveEntityRoot(entityRoot: EntityRoot) {
  const [entitiesPOJO, dependenciesPOJO] = await Promise.all([
    Promise.all(entityRoot.entities().map(({ cid }) => assert(cid()))),
    Promise.all(
      entityRoot
        .entityDependencies()
        .map(([a, b]) => Promise.all([assert(a.cid()), assert(b.cid())])),
    ),
  ]);

  const pojo: EntityRootPOJO = { entities: entitiesPOJO, dependencies: dependenciesPOJO };

  await saveIndex(assert(instance()), identityID, pojo, cryptOverrides);
}

export async function saveEntity(entityRoot: EntityRoot, entity: Entity) {
  const cid = await put(
    assert(instance()),
    identityID,
    entityToObject(entity),
    undefined,
    cryptOverrides,
  );

  entity.setCID(cid);

  await saveEntityRoot(entityRoot);
}

export function createEntity(entityRoot: EntityRoot, entityPojo: Partial<EntityPOJO>) {
  const entity = objectToEntity(entityRoot, entityPojo);
  entityRoot.setEntities((entities) => [entity, ...entities]);
  saveEntity(entityRoot, entity);
}

export function updateEntity(
  entityRoot: EntityRoot,
  entity: Entity,
  update?: () => unknown,
  force?: boolean,
) {
  const originalCID = entity.cid();
  const originalSerialized = JSON.stringify(entityToObject(entity));

  update?.();

  const newSerialized = JSON.stringify(entityToObject(entity));

  if (!force && originalSerialized === newSerialized) {
    return;
  }

  entity.setUpdated(Date.now());

  const _instance = assert(instance());

  saveEntity(entityRoot, entity);

  if (originalCID) {
    deleteImmutable(_instance, originalCID.value);
  }
}
