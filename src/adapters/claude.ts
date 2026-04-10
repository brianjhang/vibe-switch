import { AgentAdapter } from './types.js';
import { commandExists } from '../utils/paths.js';
import { homedir } from 'os';
import { join } from 'path';

export const claudeAdapter: AgentAdapter = {
  id: 'claude',
  name: 'Claude Code',
  icon: '✦',

  async detect() {
    return commandExists('claude');
  },

  buildCommand(task: string, cwd: string): string {
    // claude --print mode is suitable for non-interactive tasks.
    // Use claude interactive mode directly so the user can see the process.
    const escapedTask = task.replace(/"/g, '\\"');
    return `claude --yes -p "${escapedTask}"`;
  },

  resolveSessionPath(): string | null {
    const sessionDir = join(homedir(), '.claude', 'projects');
    return sessionDir;
  },
};
