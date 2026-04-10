import { AgentAdapter } from './types.js';
import { commandExists } from '../utils/paths.js';
import { homedir } from 'os';
import { join } from 'path';

export const codexAdapter: AgentAdapter = {
  id: 'codex',
  name: 'Codex CLI',
  icon: '◎',

  async detect() {
    return commandExists('codex');
  },

  buildCommand(task: string, cwd: string): string {
    const escapedTask = task.replace(/"/g, '\\"');
    return `codex exec --full-auto "${escapedTask}"`;
  },

  resolveSessionPath(): string | null {
    return join(homedir(), '.codex', 'sessions');
  },
};
