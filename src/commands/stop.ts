/**
 * vibe stop — 停止 Agent
 */

import { getAllTasks, updateTask, getTaskByBranch } from '../core/store.js';
import { killProcess } from '../core/process.js';
import { removeWorktree } from '../core/git.js';
import { TaskRecord } from '../adapters/types.js';
import * as output from '../utils/output.js';

interface StopOptions {
  all?: boolean;
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function cleanupWorktree(task: TaskRecord): Promise<void> {
  if (!task.worktreePath) {
    return;
  }

  try {
    await removeWorktree(task.worktreePath);
    await output.info(`已移除 worktree: ${task.worktreePath}`);
  } catch (err) {
    await output.warn(`Worktree 清理失敗 (${task.worktreePath}): ${getErrorMessage(err)}`);
  }
}

export async function stopCommand(branch: string | undefined, options: StopOptions): Promise<void> {
  if (options.all) {
    await stopAll();
    return;
  }

  if (!branch) {
    await output.error('請指定分支名，或使用 --all 停止所有 Agent');
    await output.info('用法: vibe stop <branch>  |  vibe stop --all');
    process.exit(1);
    return;
  }

  const task = getTaskByBranch(branch!);
  if (!task) {
    await output.error(`找不到分支 ${branch} 對應的任務`);
    return;
  }

  if (task.status !== 'running') {
    await output.warn(`任務已經是 ${task.status} 狀態`);
    return;
  }

  const killed = killProcess(task.pid);
  if (killed) {
    updateTask(task.id, { status: 'stopped', stoppedAt: Date.now() });
    await output.success(`已停止 ${task.agent} (PID: ${task.pid}) — 分支: ${task.branch}`);
  } else {
    await output.warn(`進程 ${task.pid} 可能已經退出`);
    updateTask(task.id, { status: 'completed', stoppedAt: Date.now() });
  }

  await cleanupWorktree(task);
}

async function stopAll(): Promise<void> {
  const tasks = getAllTasks().filter(t => t.status === 'running');

  if (tasks.length === 0) {
    await output.info('沒有正在運行的 Agent');
    return;
  }

  let stopped = 0;
  for (const task of tasks) {
    const killed = killProcess(task.pid);
    updateTask(task.id, {
      status: killed ? 'stopped' : 'completed',
      stoppedAt: Date.now(),
    });
    await cleanupWorktree(task);
    stopped++;
  }

  await output.success(`已停止 ${stopped} 個 Agent`);
}
