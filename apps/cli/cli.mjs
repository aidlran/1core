#!/usr/bin/env bun

import { Command } from 'commander';
import noteCommand from '../note/command.mjs';
import vaultCommand from '../vault/command.mjs';

new Command('1core')
  //
  .addCommand(noteCommand)
  .addCommand(vaultCommand)
  .parse();
