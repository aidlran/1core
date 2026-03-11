import { Command } from 'commander';
import listCommand from '../../lib/1core/commands/list.command.mjs';
import renameCommand from '../../lib/1core/commands/rename.command.mjs';
import { version } from '../../lib/1core/version.mjs';
import addCommand from './commands/add.command.mjs';
import deleteCommand from './commands/delete.command.mjs';
import getCommand from './commands/get.command.mjs';
import updateCommand from './commands/update.command.mjs';
import { appName } from './lib/app-name.mjs';

export default new Command('vault')
  .description('A secure password and secrets management CLI utility using Astrobase')
  .version(version, '-v, --version')
  .addCommand(addCommand)
  .addCommand(deleteCommand)
  .addCommand(getCommand)
  .addCommand(listCommand(appName))
  .addCommand(renameCommand(appName))
  .addCommand(updateCommand);
