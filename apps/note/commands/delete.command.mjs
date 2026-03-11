import { deleteContent } from '@astrobase/sdk/content';
import deleteCommand from '../../../lib/1core/commands/delete.command.mjs';
import { appName } from '../lib/app-name.mjs';

export default deleteCommand(appName, deleteContent);
