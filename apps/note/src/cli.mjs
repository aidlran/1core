#!/usr/bin/env node

import { Command } from 'commander';
import listCommand from '../../../lib/1core/commands/list.command.mjs';
import renameCommand from '../../../lib/1core/commands/rename.command.mjs';
import pkg from '../package.json' with { type: 'json' };
import appendCommand from './commands/append.command.mjs';
import catCommand from './commands/cat.command.mjs';
import deleteCommand from './commands/delete.command.mjs';
import editCommand from './commands/edit.command.mjs';
import setCommand from './commands/set.command.mjs';
import { init } from './lib/init.mjs';

new Command(pkg.name)
  .description(pkg.description)
  .version(pkg.version, '-v, --version')
  .addCommand(appendCommand)
  .addCommand(catCommand)
  .addCommand(deleteCommand)
  .addCommand(editCommand)
  .addCommand(listCommand(pkg.name, init))
  .addCommand(renameCommand(pkg.name, init))
  .addCommand(setCommand)
  .parse();
