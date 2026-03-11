import deleteCommand from '../../../lib/1core/commands/delete.command.mjs';
import { appName } from '../lib/app-name.mjs';
import { deleteEntryHook } from '../lib/content.mjs';

export default deleteCommand(appName, deleteEntryHook);
