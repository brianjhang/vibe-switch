import { AgentAdapter, AgentId } from './types.js';
import { claudeAdapter } from './claude.js';
import { codexAdapter } from './codex.js';
import { geminiAdapter } from './gemini.js';
import { aiderAdapter } from './aider.js';
import { opencodeAdapter } from './opencode.js';

const adapters: Record<AgentId, AgentAdapter> = {
  claude: claudeAdapter,
  codex: codexAdapter,
  gemini: geminiAdapter,
  aider: aiderAdapter,
  opencode: opencodeAdapter,
};

export function getAdapter(id: string): AgentAdapter | null {
  return adapters[id as AgentId] ?? null;
}

export function getAllAdapters(): AgentAdapter[] {
  return Object.values(adapters);
}

export function getAvailableAgentIds(): AgentId[] {
  return Object.keys(adapters) as AgentId[];
}
