import { deleteContent } from '@astrobase/sdk/content';
import deleteCommand from '../../../../lib/1core/commands/delete.command.mjs';
import pkg from '../../package.json' with { type: 'json' };
import { init } from '../lib/init.mjs';

export default deleteCommand(pkg.name, deleteContent, init);
