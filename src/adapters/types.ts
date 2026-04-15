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

  // New/created file contents for handoff.
  artifacts: ArtifactEntry[];

  // Pending items.
  pendingItems: string[];
}

/**
 * A file artifact collected during handoff.
 * Contains the full content of new/created files so the target agent
 * can see what the source agent produced (not just a diff).
 */
export interface ArtifactEntry {
  /** Path relative to the worktree root. */
  path: string;
  /** Full file content (text files only). */
  content: string;
  /** File size in bytes. */
  sizeBytes: number;
  /** Whether this is a newly created file (untracked or staged new). */
  isNew: boolean;
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
