/**
 * vibe run — 一行啟動 Agent
 */

import { getAdapter } from '../adapters/index.js';
import { AgentId } from '../adapters/types.js';
import { spawnAgent } from '../core/process.js';
import { createBranch, generateBranchName } from '../core/git.js';
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

    // 3. 啟動 Agent 進程
    const label = await output.agentLabel(adapter.icon, adapter.name);
    await output.info(`啟動 ${label} ...`);

    // 4. 啟動 Agent 進程並記錄任務
    const taskId = `${agentId}-${Date.now()}`;
    const { pid } = spawnAgent(adapter, task, cwd, taskId);

    addTask({
      id: taskId,
      agent: agentId,
      task,
      branch: branchName,
      pid,
      status: 'running',
      startedAt: Date.now(),
      projectDir: cwd,
    });

    // 5. 切回原始分支，讓用戶可以繼續操作
    // 注意：Agent 進程已在 branchName 分支的 cwd 中運行
    // 但由於 detached，切回不影響它
    // 不過 git checkout 會影響工作區...
    // MVP 先保持在新分支上，讓用戶手動切回

    await output.success(`${adapter.name} 已在背景啟動 (PID: ${pid})`);
    await output.info(`任務: ${task}`);
    await output.info(`分支: ${branchName}`);
    await output.info(`查看狀態: vibe status`);

  } catch (err) {
    await output.error(`啟動失敗: ${getErrorMessage(err)}`);
    process.exit(1);
    return;
  }
}
