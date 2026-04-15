import { AgentAdapter } from './types.js';
import { commandExists } from '../utils/paths.js';

export const opencodeAdapter: AgentAdapter = {
  id: 'opencode',
  name: 'OpenCode',
  icon: '◈',

  async detect() {
    return commandExists('opencode');
  },

  buildCommand(task: string, _cwd: string): string {
    const escapedTask = task.replace(/"/g, '\\"');
    // Run in non-interactive mode with the task as the initial prompt.
    return `opencode run "${escapedTask}"`;
  },

  resolveSessionPath(): string | null {
    // OpenCode does not maintain a persistent session directory.
    return null;
  },
};
