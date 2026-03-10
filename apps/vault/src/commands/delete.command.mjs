import deleteCommand from '../../../../lib/1core/commands/delete.command.mjs';
import pkg from '../../package.json' with { type: 'json' };
import { deleteEntryHook } from '../lib/content.mjs';
import { init } from '../lib/init.mjs';

export default deleteCommand(pkg.name, deleteEntryHook, init);
