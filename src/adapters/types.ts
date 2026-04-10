/**
 * Agent 適配器接口
 * 借鑑 CC-Switch 的 Provider Adapter 模式
 */

export type AgentId = 'claude' | 'codex' | 'gemini' | 'antigravity' | 'openclaw';

export interface AgentAdapter {
  /** Agent 唯一標識 */
  id: AgentId;
  /** 顯示名稱 */
  name: string;
  /** 圖標 (emoji) */
  icon: string;
  /** 檢測 Agent 是否已安裝 */
  detect(): Promise<boolean>;
  /** 構建啟動命令 */
  buildCommand(task: string, cwd: string): string;
  /** 會話數據的本地路徑 */
  resolveSessionPath(): string | null;
  /** 提取最近會話的上下文 (Phase 4) */
  extractContext?(sessionId?: string): Promise<ContextSnapshot | null>;
}

/**
 * 上下文快照
 * 借鑑 CC-Switch SessionMeta + 我們的差異化擴展
 */
export interface ContextSnapshot {
  sourceAgent: AgentId;
  taskDescription: string;
  projectDir: string;
  branch: string;
  timestamp: number;

  // 工作成果摘要
  summary: string;
  modifiedFiles: string[];
  gitDiff: string;

  // 待辦事項
  pendingItems: string[];
}

/**
 * 任務記錄
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
}
