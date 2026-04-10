import { AgentAdapter } from './types.js';
import { commandExists } from '../utils/paths.js';
import { homedir } from 'os';
import { join } from 'path';

export const antigravityAdapter: AgentAdapter = {
  id: 'antigravity',
  name: 'Antigravity',
  icon: '🚀',

  async detect() {
    // Antigravity 是 Gemini 的 Agent 模式，共用 gemini CLI
    // 或者有獨立的 antigravity 命令
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
