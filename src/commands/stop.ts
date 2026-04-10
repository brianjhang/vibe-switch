/**
 * vibe stop - stop an Agent
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
    await output.info(`Removed worktree: ${task.worktreePath}`);
  } catch (err) {
    await output.warn(`Worktree cleanup failed (${task.worktreePath}): ${getErrorMessage(err)}`);
  }
}

export async function stopCommand(branch: string | undefined, options: StopOptions): Promise<void> {
  if (options.all) {
    await stopAll();
    return;
  }

  if (!branch) {
    await output.error('Please specify a branch name, or use --all to stop all Agents');
    await output.info('Usage: vibe stop <branch>  |  vibe stop --all');
    process.exit(1);
    return;
  }

  const task = getTaskByBranch(branch!);
  if (!task) {
    await output.error(`Could not find a task for branch ${branch}`);
    return;
  }

  if (task.status !== 'running') {
    await output.warn(`Task is already in ${task.status} status`);
    return;
  }

  const killed = killProcess(task.pid);
  if (killed) {
    updateTask(task.id, { status: 'stopped', stoppedAt: Date.now() });
    await output.success(`Stopped ${task.agent} (PID: ${task.pid}) - branch: ${task.branch}`);
  } else {
    await output.warn(`Process ${task.pid} may have already exited`);
    updateTask(task.id, { status: 'completed', stoppedAt: Date.now() });
  }

  await cleanupWorktree(task);
}

async function stopAll(): Promise<void> {
  const tasks = getAllTasks().filter(t => t.status === 'running');

  if (tasks.length === 0) {
    await output.info('No Agents are currently running');
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

  await output.success(`Stopped ${stopped} Agent(s)`);
}
