#!/usr/bin/env node

import { Command } from 'commander';
import listCommand from '../../lib/1core/commands/list.command.mjs';
import renameCommand from '../../lib/1core/commands/rename.command.mjs';
import { version } from '../../lib/1core/version.mjs';
import appendCommand from './commands/append.command.mjs';
import catCommand from './commands/cat.command.mjs';
import deleteCommand from './commands/delete.command.mjs';
import editCommand from './commands/edit.command.mjs';
import setCommand from './commands/set.command.mjs';
import { appName } from './lib/app-name.mjs';
import { init } from './lib/init.mjs';

new Command(appName)
  .description('An encrypted notes app using Astrobase.')
  .version(version, '-v, --version')
  .addCommand(appendCommand)
  .addCommand(catCommand)
  .addCommand(deleteCommand)
  .addCommand(editCommand)
  .addCommand(listCommand(appName, init))
  .addCommand(renameCommand(appName, init))
  .addCommand(setCommand)
  .parse();
