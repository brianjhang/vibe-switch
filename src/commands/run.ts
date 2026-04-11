/**
 * vibe run - start an Agent with one command
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
  return message.includes('not a git repository');
}

export async function runCommand(task: string, options: RunOptions): Promise<void> {
  const agentId = options.agent as AgentId;
  const adapter = getAdapter(agentId);

  if (!adapter) {
    await output.error(`Unknown Agent: ${agentId}. Available: claude, codex, gemini`);
    process.exit(1);
    return;
  }

  // 1. Check whether the Agent is installed.
  const installed = await adapter.detect();
  if (!installed) {
    await output.error(`${adapter.name} is not installed or is not in PATH`);
    process.exit(1);
    return;
  }

  const cwd = process.cwd();

  // 2. Create a Git branch.
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

    await output.info(`Created branch: ${branchName}`);

    // 3. Create an isolated worktree.
    worktreePath = await createWorktree(cwd, branchName);
    await output.info(`Created worktree: ${worktreePath}`);

    // 4. Start the Agent process.
    const label = await output.agentLabel(adapter.icon, adapter.name);
    await output.info(`Starting ${label} ...`);

    // 5. Start the Agent process and record the task.
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

    await output.success(`${adapter.name} started in the background (PID: ${pid})`);
    await output.info(`Task: ${task}`);
    await output.info(`Branch: ${branchName}`);
    await output.info(`Worktree: ${worktreePath}`);
    await output.info(`View status: vibe status`);

  } catch (err) {
    if (worktreePath) {
      try {
        await removeWorktree(worktreePath);
      } catch {
        // Best-effort cleanup for the worktree created before startup failed.
      }
    }

    await output.error(`Startup failed: ${getErrorMessage(err)}`);
    process.exit(1);
    return;
  }
}
