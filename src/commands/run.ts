/**
 * vibe run — 一行啟動 Agent
 */

import { getAdapter } from '../adapters/index.js';
import { AgentId } from '../adapters/types.js';
import { spawnAgent } from '../core/process.js';
import { createBranch, createWorktree, generateBranchName, removeWorktree } from '../core/git.js';
import { addTask } from '../core/store.js';
import * as output from '../utils/output.js';

interface RunOptions {
  agent: string;
  branch?: string;
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isNotGitRepositoryError(err: unknown): boolean {
  const message = getErrorMessage(err).toLowerCase();
  return message.includes('not a git repository') || message.includes('不是一個 git 倉庫');
}

export async function runCommand(task: string, options: RunOptions): Promise<void> {
  const agentId = options.agent as AgentId;
  const adapter = getAdapter(agentId);

  if (!adapter) {
    await output.error(`未知的 Agent: ${agentId}。可用: claude, codex, gemini, antigravity, openclaw`);
    process.exit(1);
    return;
  }

  // 1. 檢測 Agent 是否安裝
  const installed = await adapter.detect();
  if (!installed) {
    await output.error(`${adapter.name} 未安裝或不在 PATH 中`);
    process.exit(1);
    return;
  }

  const cwd = process.cwd();

  // 2. 創建 Git 分支
  const branchName = options.branch || generateBranchName(agentId, task);
  let worktreePath: string | undefined;

  try {
    try {
      await createBranch(cwd, branchName);
    } catch (err) {
      if (isNotGitRepositoryError(err)) {
        await output.error('This directory is not a git repository. Please run vibe from a project with git initialized.');
        process.exit(1);
        return;
      }
      throw err;
    }

    await output.info(`已創建分支: ${branchName}`);

    // 3. 創建隔離 worktree
    worktreePath = await createWorktree(cwd, branchName);
    await output.info(`已創建 worktree: ${worktreePath}`);

    // 4. 啟動 Agent 進程
    const label = await output.agentLabel(adapter.icon, adapter.name);
    await output.info(`啟動 ${label} ...`);

    // 5. 啟動 Agent 進程並記錄任務
    const taskId = `${agentId}-${Date.now()}`;
    const { pid } = spawnAgent(adapter, task, worktreePath, taskId);

    addTask({
      id: taskId,
      agent: agentId,
      task,
      branch: branchName,
      pid,
      status: 'running',
      startedAt: Date.now(),
      projectDir: cwd,
      worktreePath,
    });

    await output.success(`${adapter.name} 已在背景啟動 (PID: ${pid})`);
    await output.info(`任務: ${task}`);
    await output.info(`分支: ${branchName}`);
    await output.info(`Worktree: ${worktreePath}`);
    await output.info(`查看狀態: vibe status`);

  } catch (err) {
    if (worktreePath) {
      try {
        await removeWorktree(worktreePath);
      } catch {
        // 啟動失敗時盡力清理已創建的 worktree
      }
    }

    await output.error(`啟動失敗: ${getErrorMessage(err)}`);
    process.exit(1);
    return;
  }
}
