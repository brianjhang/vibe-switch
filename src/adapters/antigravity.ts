import { AgentAdapter } from './types.js';
import { commandExists } from '../utils/paths.js';
import { homedir } from 'os';
import { join } from 'path';

export const antigravityAdapter: AgentAdapter = {
  id: 'antigravity',
  name: 'Antigravity',
  icon: '🚀',

  async detect() {
    // Antigravity is Gemini's Agent mode and shares the gemini CLI.
    // Or it may have a separate antigravity command.
    return commandExists('gemini');
  },

  buildCommand(task: string, cwd: string): string {
    const escapedTask = task.replace(/"/g, '\\"');
    return `gemini -p "${escapedTask}"`;
  },

  resolveSessionPath(): string | null {
    return join(homedir(), '.gemini', 'antigravity', 'brain');
  },
};
