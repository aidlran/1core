import { Option } from 'commander';
import { warn } from '../lib/console.mjs';

export const secretOption = new Option(
  '-s, --secret <secrets...>',
  'secret property key names to ask for',
).argParser((v, prev) => {
  if (v.includes('=')) {
    warn('Secrets may have been leaked via command line input');
    // eslint-disable-next-line no-console
    console.error('--secret cannot accept a value on the command line for security reasons');
    process.exit(1);
  }
  if (v === 'added' || v === 'updated') {
    // eslint-disable-next-line no-console
    console.error(`Cannot use --secret for property '${v}'. Use --property instead.`);
    process.exit(1);
  }
  (prev ??= []).push(v);
  return prev;
});
