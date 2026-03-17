# 1core App Suite

A suite of apps powered by [Astrobase]:

- **1core Note:** Encrypted notes management CLI app.
- **1core Pulse:** Encrypted project management GUI app.
- **1core Vault:** Encrypted password and secrets management CLI app.

## Installation

### Prebuilt

**For prebuilt binaries, see the [Releases] page.**

### From Source

You'll need [Bun] installed (v1.3.10 or later).

To build the GUI, you'll need Rust and Cargo installed. If you are only building the CLI, you can skip this.

> For Nix users, a `shell.nix` is available to install Rust dependencies.

Install dependencies with `bun`:

```sh
bun i
```

You can build all applications for your current system and architecture with one command:

```sh
bun run build
```

Alternatively, you can build only the CLI, or only the Pulse GUI:

```sh
bun run build:cli

bun run build:pulse:native
```

CLI builds are output to `dist`.
Pulse GUI builds are output to `apps/pulse/src-tauri/target/release/bundle`.

There are no official distribution packages yet.

[Astrobase]: https://github.com/aidlran/astrobase
[Bun]: https://bun.sh
[Releases]: https://github.com/aidlran/1core/releases
