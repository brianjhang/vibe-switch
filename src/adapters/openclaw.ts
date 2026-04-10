import { AgentAdapter } from './types.js';
import { commandExists } from '../utils/paths.js';
import { homedir } from 'os';
import { join } from 'path';

export const openclawAdapter: AgentAdapter = {
  id: 'openclaw',
  name: 'OpenClaw',
  icon: '🦀',

  async detect() {
    return commandExists('openclaw');
  },

  buildCommand(task: string, cwd: string): string {
    const escapedTask = task.replace(/"/g, '\\"');
    return `openclaw "${escapedTask}"`;
  },

  resolveSessionPath(): string | null {
    return join(homedir(), '.openclaw');
  },
};
