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
    // claude --print 模式適合非互動式任務
    // 直接用 claude 互動模式讓用戶看到過程
    const escapedTask = task.replace(/"/g, '\\"');
    return `claude --yes -p "${escapedTask}"`;
  },

  resolveSessionPath(): string | null {
    const sessionDir = join(homedir(), '.claude', 'projects');
    return sessionDir;
  },
};
