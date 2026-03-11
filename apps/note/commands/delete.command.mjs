import { deleteContent } from '@astrobase/sdk/content';
import deleteCommand from '../../../lib/1core/commands/delete.command.mjs';
import { appName } from '../lib/app-name.mjs';
import { init } from '../lib/init.mjs';

export default deleteCommand(appName, deleteContent, init);
