/**
 * Agent adapter interface.
 * Inspired by CC-Switch's Provider Adapter pattern.
 */

export type AgentId = 'claude' | 'codex' | 'gemini';

export interface AgentAdapter {
  /** Unique Agent identifier. */
  id: AgentId;
  /** Display name. */
  name: string;
  /** Icon (emoji). */
  icon: string;
  /** Check whether the Agent is installed. */
  detect(): Promise<boolean>;
  /** Build the startup command. */
  buildCommand(task: string, cwd: string): string;
  /** Local path for session data. */
  resolveSessionPath(): string | null;
  /** Extract context from the most recent session (Phase 4). */
  extractContext?(sessionId?: string): Promise<ContextSnapshot | null>;
}

/**
 * Context snapshot.
 * Inspired by CC-Switch SessionMeta plus our differentiating extensions.
 */
export interface ContextSnapshot {
  sourceAgent: AgentId;
  taskDescription: string;
  projectDir: string;
  branch: string;
  timestamp: number;

  // Work result summary.
  summary: string;
  modifiedFiles: string[];
  gitDiff: string;

  // Pending items.
  pendingItems: string[];
}

/**
 * Task record.
 */
export interface TaskRecord {
  id: string;
  agent: AgentId;
  task: string;
  branch: string;
  pid: number;
  status: 'running' | 'stopped' | 'completed' | 'failed';
  startedAt: number;
  stoppedAt?: number;
  projectDir: string;
  worktreePath?: string;
}
