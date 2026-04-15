import { AgentAdapter } from './types.js';
import { commandExists } from '../utils/paths.js';

export const aiderAdapter: AgentAdapter = {
  id: 'aider',
  name: 'Aider',
  icon: '⟁',

  async detect() {
    return commandExists('aider');
  },

  buildCommand(task: string, _cwd: string): string {
    const escapedTask = task.replace(/"/g, '\\"');
    // --no-git: skip aider's own git management (vibe-switch handles it via worktree)
    // --yes-always: non-interactive, auto-accept all prompts
    return `aider --no-git --yes-always --message "${escapedTask}"`;
  },

  resolveSessionPath(): string | null {
    // Aider does not maintain a persistent session directory.
    return null;
  },
};
