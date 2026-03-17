# Changelog

## Unreleased

### Note

- Upgraded Astrobase & migrated to crypt wraps. An automatic migration will run when using the CLI
  with an old database. This migration will be removed in a future version.
- Removed the `migrate` subcommand.

### Pulse

- Migrated to Solid from Svelte.
- Added management of a single task list with a reactive interface.

### Vault

- Upgraded Astrobase & migrated to crypt wraps. An automatic migration will run when using the CLI
  with an old database. This migration will be removed in a future version.

## [Note 0.2.0](https://github.com/aidlran/1core/releases/tag/note-v0.2.0) - 2025-12-30

- Added error handling and reprompt when incorrect passphrase is entered.

## [Vault 3.1.0](https://github.com/aidlran/1core/releases/tag/pass-v3.1.0) - 2025-12-30

- Added error handling and reprompt when incorrect passphrase is entered.

## [Note 0.1.0](https://github.com/aidlran/1core/releases/tag/note-v0.1.0) - 2025-10-14

- Initial version.
- Added `append`, `cat`, `delete`, `edit`, `list`, `migrate`, `rename` & `set` commands.
- Added AGPL-3.0 license.

## [Vault 3.0.0](https://github.com/aidlran/1core/releases/tag/pass-v3.0.0) - 2025-10-14

- Removed automatic migration introduced in `v2.0.0-rc.7`.
- Removed `note` subcommand in favour of standalone Note app.
- Refactored to modularise code.
- Replaced `readline-sync` dependency with own solution.
- Added E2E tests for commands.
- Added AGPL-3.0 license.

## [Vault 2.1.0](https://github.com/aidlran/1core/releases/tag/pass-v2.1.0) - 2025-07-17

- Added `note` subcommand.

## [Vault 2.0.0-rc.8](https://github.com/aidlran/1core/releases/tag/pass-v2.0.0-rc.7) - 2025-06-25

- Added missing peer dependencies.

## [Vault 2.0.0-rc.7](https://github.com/aidlran/1core/releases/tag/pass-v2.0.0-rc.7) - 2025-06-24

- Added `--db` option.
- Changed get command to list properties alphabetically.
- Renamed default database file path. File will be automatically renamed when a command is run.
- Migrated to use Astrobase keyring & identity. Database will be migrated when a command is run.

## [Vault 2.0.0-rc.6](https://github.com/aidlran/1core/releases/tag/pass-v2.0.0-rc.6) - 2025-04-13

- Added optional case insensitive search to list command.
- Changed list command to print entries in alphabetical order.
- Fixed deprecation warning for assert import.
