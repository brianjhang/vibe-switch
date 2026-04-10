/**
 * 上下文提取和注入（核心差異化模組）
 */

import { ContextSnapshot, AgentId } from '../adapters/types.js';
import { getModifiedFiles, getFullDiff } from './git.js';
import { getSnapshotsDir, ensureDir } from '../utils/paths.js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * 從當前工作狀態生成上下文快照
 */
export async function createSnapshot(
  sourceAgent: AgentId,
  task: string,
  branch: string,
  cwd: string,
  summary?: string,
): Promise<ContextSnapshot> {
  const modifiedFiles = await getModifiedFiles(cwd);
  const gitDiff = await getFullDiff(cwd);

  const snapshot: ContextSnapshot = {
    sourceAgent,
    taskDescription: task,
    projectDir: cwd,
    branch,
    timestamp: Date.now(),
    summary: summary || `Agent ${sourceAgent} 正在處理: ${task}`,
    modifiedFiles,
    gitDiff,
    pendingItems: [],
  };

  // 持久化快照
  saveSnapshot(branch, snapshot);
  return snapshot;
}

/**
 * 保存快照到文件
 */
function saveSnapshot(branch: string, snapshot: ContextSnapshot): void {
  const dir = getSnapshotsDir();
  ensureDir(dir);
  const filename = branch.replace(/\//g, '_') + '.json';
  writeFileSync(join(dir, filename), JSON.stringify(snapshot, null, 2));
}

/**
 * 加載快照
 */
export function loadSnapshot(branch: string): ContextSnapshot | null {
  try {
    const dir = getSnapshotsDir();
    const filename = branch.replace(/\//g, '_') + '.json';
    const data = readFileSync(join(dir, filename), 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * 將上下文快照格式化為 prompt（注入目標 Agent）
 */
export function formatSnapshotAsPrompt(
  snapshot: ContextSnapshot,
  targetAgent: AgentId,
  extraMessage?: string,
): string {
  const lines: string[] = [
    `=== 上下文交接 ===`,
    `前一個 Agent (${snapshot.sourceAgent}) 的工作交接給你 (${targetAgent})。`,
    ``,
    `## 原始任務`,
    snapshot.taskDescription,
    ``,
    `## 工作摘要`,
    snapshot.summary,
    ``,
  ];

  if (snapshot.modifiedFiles.length > 0) {
    lines.push(`## 已修改的文件`);
    snapshot.modifiedFiles.forEach(f => lines.push(`- ${f}`));
    lines.push('');
  }

  if (snapshot.pendingItems.length > 0) {
    lines.push(`## 待完成事項`);
    snapshot.pendingItems.forEach(item => lines.push(`- ${item}`));
    lines.push('');
  }

  if (snapshot.gitDiff && snapshot.gitDiff !== '(no changes)') {
    lines.push(`## 代碼改動 (diff)`);
    // 截斷 diff 避免 prompt 過長
    const truncatedDiff = snapshot.gitDiff.length > 3000
      ? snapshot.gitDiff.slice(0, 3000) + '\n... (truncated)'
      : snapshot.gitDiff;
    lines.push('```diff');
    lines.push(truncatedDiff);
    lines.push('```');
    lines.push('');
  }

  if (extraMessage) {
    lines.push(`## 額外說明`);
    lines.push(extraMessage);
    lines.push('');
  }

  lines.push(`請在此基礎上繼續工作。先理解之前的進展，然後繼續推進。`);

  return lines.join('\n');
}
