/**
 * vibe handoff - context handoff, the core differentiating command
 */

import { getAdapter } from '../adapters/index.js';
import { AgentId } from '../adapters/types.js';
import { getTaskByBranch, addTask, updateTask } from '../core/store.js';
import { createSnapshot, formatSnapshotAsPrompt } from '../core/context.js';
import { spawnAgent, killProcess } from '../core/process.js';
import { checkoutBranch } from '../core/git.js';
import * as output from '../utils/output.js';

interface HandoffOptions {
  to: string;
  message?: string;
  noArtifacts?: boolean;
}

export async function handoffCommand(branch: string, options: HandoffOptions): Promise<void> {
  const targetAgentId = options.to as AgentId;
  const targetAdapter = getAdapter(targetAgentId);

  if (!targetAdapter) {
    await output.error(`Unknown target Agent: ${targetAgentId}`);
    process.exit(1);
    return;
  }

  // 1. Find the source task.
  const sourceTask = getTaskByBranch(branch);
  if (!sourceTask) {
    await output.error(`Could not find a task for branch ${branch}`);
    await output.info('Use vibe status to view all tasks');
    process.exit(1);
    return;
  }

  const sourceAdapter = getAdapter(sourceTask.agent);
  const sourceName = sourceAdapter?.name || sourceTask.agent;
  const targetName = targetAdapter.name;
  const sourceCwd = sourceTask.worktreePath || sourceTask.projectDir;

  await output.info(`Starting handoff: ${sourceName} -> ${targetName}`);

  // 2. Stop the source Agent if it is still running.
  if (sourceTask.status === 'running') {
    killProcess(sourceTask.pid);
    updateTask(sourceTask.id, { status: 'stopped', stoppedAt: Date.now() });
    await output.info(`Stopped ${sourceName} (PID: ${sourceTask.pid})`);
  }

  // 3. Generate a context snapshot.
  await output.info('Extracting context...');
  const includeArtifacts = !options.noArtifacts;
  const snapshot = await createSnapshot(
    sourceTask.agent,
    sourceTask.task,
    sourceTask.branch,
    sourceCwd,
    undefined,
    includeArtifacts,
  );

  await output.info(`Modified files: ${snapshot.modifiedFiles.length}`);
  await output.info(`Git diff: ${snapshot.gitDiff.length} characters`);
  if (snapshot.artifacts.length > 0) {
    await output.info(`Artifacts: ${snapshot.artifacts.length} new file(s) included`);
  }

  // 4. Format the context as a prompt.
  const prompt = formatSnapshotAsPrompt(snapshot, targetAgentId, options.message);

  // 5. Check the target Agent.
  const installed = await targetAdapter.detect();
  if (!installed) {
    await output.error(`${targetName} is not installed`);
    // Fallback: print the context so the user can copy it manually.
    await output.warn('Fallback: here is the context summary. You can copy it to the target Agent manually:');
    console.log('\n' + '─'.repeat(60));
    console.log(prompt);
    console.log('─'.repeat(60) + '\n');
    process.exit(1);
  }

  // 6. Switch to the source task branch so the target Agent works on the correct branch.
  try {
    await checkoutBranch(sourceCwd, sourceTask.branch);
  } catch {
    // It may already be on the correct branch.
  }

  // 7. Start the target Agent with the context.
  await output.info(`Starting ${targetName} with injected context...`);

  // 8. Start the target Agent and record the new task.
  const newTaskId = `${targetAgentId}-${Date.now()}`;
  const { pid } = spawnAgent(targetAdapter, prompt, sourceCwd, newTaskId);

  addTask({
    id: newTaskId,
    agent: targetAgentId,
    task: `[handoff] ${sourceTask.task}`,
    branch: sourceTask.branch,  // Continue on the same branch.
    pid,
    status: 'running',
    startedAt: Date.now(),
    projectDir: sourceTask.projectDir,
    worktreePath: sourceTask.worktreePath,
  });

  await output.success(`Context handoff complete!`);
  await output.info(`${targetName} is continuing work on branch ${sourceTask.branch} (PID: ${pid})`);
  await output.info('View status: vibe status');
}
