import { expect, it } from 'vitest';
import pkg from '../../package.json' with { type: 'json' };
import { version } from './version.mjs';

it('matches package.json version', () => {
  expect(version).toBe(pkg.version);
});
