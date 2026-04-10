import { AgentAdapter } from './types.js';
import { commandExists } from '../utils/paths.js';
import { homedir } from 'os';
import { join } from 'path';

export const geminiAdapter: AgentAdapter = {
  id: 'gemini',
  name: 'Gemini CLI',
  icon: '◆',

  async detect() {
    return commandExists('gemini');
  },

  buildCommand(task: string, cwd: string): string {
    const escapedTask = task.replace(/"/g, '\\"');
    return `gemini -p "${escapedTask}" --yolo`;
  },

  resolveSessionPath(): string | null {
    return join(homedir(), '.gemini');
  },
};
