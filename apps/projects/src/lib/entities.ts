import type { ContentIdentifier } from '@astrobase/sdk/cid';
import { deleteImmutable } from '@astrobase/sdk/immutable';
import { type Accessor, createSignal, type Setter } from 'solid-js';
import { get, getIndex, put, saveIndex } from '../../../../lib/luna/content.mjs';
import { assert } from './assert';
import { instance } from './astrobase';

export type EntityDependency = [dependent: Entity, dependee: Entity];

export interface EntityPojo {
  name: string;
  completed: boolean;
  start?: string;
  end?: string;
  created: number;
  updated: number;
  cid: ContentIdentifier;
}

export interface Entity {
  name: Accessor<string>;
  setName: Setter<string>;

  completed: Accessor<boolean>;
  setCompleted: Setter<boolean>;

  start: Accessor<string | undefined>;
  setStart: Setter<string | undefined>;

  end: Accessor<string | undefined>;
  setEnd: Setter<string | undefined>;

  created: number;

  updated: Accessor<number>;
  setUpdated: Setter<number>;

  cid: Accessor<ContentIdentifier | undefined>;
  setCID: Setter<ContentIdentifier | undefined>;

  dependencies: Accessor<EntityDependency[]>;

  blocked: Accessor<boolean>;
}

export interface EntityRootPojo {
  entities: ContentIdentifier[];
  dependencies: [ContentIdentifier, ContentIdentifier][];
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

function objectToEntity(entityRoot: EntityRoot, entityPojo: Partial<EntityPojo>): Entity {
  const [name, setName] = createSignal(entityPojo.name ?? '');
  const [completed, setCompleted] = createSignal(entityPojo.completed ?? false);
  const [start, setStart] = createSignal(entityPojo.start);
  const [end, setEnd] = createSignal(entityPojo.end);
  const [updated, setUpdated] = createSignal(entityPojo.updated ?? Date.now());
  const [cid, setCID] = createSignal(entityPojo.cid);

  const entity: Entity = {
    name,
    setName,

    completed,
    setCompleted,

    start,
    setStart,

    end,
    setEnd,

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

async function refreshEntityRoot(entityRoot: EntityRoot) {
  const _instance = assert(instance());

  let pojo: EntityRootPojo | void;

  try {
    pojo = await getIndex<EntityRootPojo>(_instance, identityID);
  } catch {
    return;
  }

  if (pojo) {
    const entityMap: Record<string, Promise<Entity>> = {};

    const loadEntity = async (cid: ContentIdentifier) =>
      (entityMap[cid.toString()] ??= (get(_instance, cid) as Promise<EntityPojo>).then((pojo) =>
        objectToEntity(entityRoot, { ...pojo, cid }),
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

  const pojo: EntityRootPojo = { entities: entitiesPOJO, dependencies: dependenciesPOJO };

  await saveIndex(assert(instance()), identityID, pojo, cryptOverrides);
}

export async function saveEntity(entityRoot: EntityRoot, entity: Entity) {
  const cid = await put(
    assert(instance()),
    identityID,
    {
      name: entity.name(),
      completed: entity.completed(),
      start: entity.start(),
      end: entity.end(),
      created: entity.created,
      updated: entity.updated(),
    },
    undefined,
    cryptOverrides,
  );

  entity.setCID(cid);

  await saveEntityRoot(entityRoot);
}

export function createEntity(entityRoot: EntityRoot, entityPojo: Partial<EntityPojo>) {
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

  update?.();

  const newCID = entity.cid();

  if (force !== true && originalCID && newCID && newCID.toString() === originalCID.toString()) {
    return;
  }

  entity.setUpdated(Date.now());

  const _instance = assert(instance());

  saveEntity(entityRoot, entity);

  if (originalCID) {
    deleteImmutable(_instance, originalCID.value);
  }
}
