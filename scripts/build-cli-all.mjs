#!/usr/bin/env bun

import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { version } from '../lib/1core/version.mjs';

const entrypoints = [join(import.meta.dirname, '../apps/cli/cli.mjs')];
const outdir = join(import.meta.dirname, `../dist`);

if (existsSync(outdir)) {
  await Promise.all(readdirSync(outdir).map((fileName) => rm(join(outdir, fileName))));
} else {
  mkdirSync(outdir);
}

const files = /** @type {Promise<[Buffer, Buffer]>} */ (
  Promise.all(
    ['LICENSE', 'README.md'].map((fileName) => readFile(join(import.meta.dirname, '..', fileName))),
  )
);

/**
 * @param {Record<string, BlobPart>} artifacts
 * @param {string} [name]
 */
async function writeArchive(artifacts, name) {
  const [license, readme] = await files;

  const archiveFiles = {
    'LICENSE.txt': license,
    'README.md': readme,
    ...artifacts,
  };

  const outfile = join(outdir, `1core-cli-v${version}${name ? `-${name}` : ''}`);

  await Bun.Archive.write(`${outfile}.tar.gz`, archiveFiles, { compress: 'gzip' });
}

/**
 * @param {Partial<Bun.BuildConfig>} [config]
 * @param {string} [name]
 */
async function writeScriptArchive(config, name) {
  const { outputs } = await Bun.build({
    entrypoints,
    minify: true,
    target: 'bun',
    ...config,
  });
  await writeArchive(
    Object.fromEntries(outputs.map((artifact) => [artifact.path, artifact])),
    name,
  );
}

await Promise.all([
  writeScriptArchive(),

  writeScriptArchive({ sourcemap: 'linked' }, 'debug'),

  .../** @type {Bun.Build.CompileTarget[]} */ ([
    'bun-darwin-arm64',
    'bun-darwin-x64',
    'bun-linux-arm64',
    'bun-linux-arm64-musl',
    'bun-linux-x64',
    'bun-linux-x64-musl',
    'bun-windows-arm64',
    'bun-windows-x64',
  ]).map(async (target) => {
    const outfile = target.slice(4);

    const { outputs } = await Bun.build({
      compile: { outfile, target },
      entrypoints,
      minify: true,
      sourcemap: 'linked',
    });

    if (!outputs[0]) {
      throw Error('No build output');
    }

    await writeArchive(
      { [`1core${extname(outputs[0].path)}`]: await readFile(outputs[0].path) },
      outfile,
    );

    await Promise.allSettled(outputs.map(({ path }) => rm(path)));
  }),
]);
