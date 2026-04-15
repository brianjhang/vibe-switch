/**
 * vibe wait - block until a task finishes
 *
 * Unix-style building block: use with && to chain tasks.
 *   vibe wait vibe/codex-xxx && vibe handoff vibe/codex-xxx --to gemini
 */

import { getTaskByBranch, cleanupStaleTasks } from '../core/store.js';
import * as output from '../utils/output.js';

const POLL_INTERVAL_MS = 2000;

export async function waitCommand(branch: string): Promise<void> {
  const task = getTaskByBranch(branch);
  if (!task) {
    await output.error(`Could not find a task for branch ${branch}`);
    process.exit(1);
    return;
  }

  if (task.status !== 'running') {
    await output.info(`Task ${branch} already finished (${task.status})`);
    return;
  }

  await output.info(`Waiting for ${branch} to finish... (Ctrl+C to cancel)`);

  while (true) {
    // Sync process state (detect exited processes).
    cleanupStaleTasks();

    const current = getTaskByBranch(branch);
    if (!current || current.status !== 'running') {
      const finalStatus = current?.status ?? 'unknown';
      await output.success(`Task ${branch} finished (${finalStatus})`);
      // Exit with non-zero if the task failed, so && chains stop.
      if (finalStatus === 'failed') {
        process.exit(1);
        return;
      }
      return;
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}
