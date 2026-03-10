import { Common } from '@astrobase/sdk/common';
import { indexeddb } from '@astrobase/sdk/indexeddb';
import { createInstance } from '@astrobase/sdk/instance';
import { createResource } from 'solid-js';

/**
 * The base Astrobase config. The application derives a reactive final config value with user
 * configuration on top.
 */
export default createResource(async () =>
  createInstance(Common, { clients: [{ strategy: await indexeddb() }] }),
)[0];
