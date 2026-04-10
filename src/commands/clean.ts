import { unlinkSync } from 'fs';
import { removeWorktree } from '../core/git.js';
import { getAllTasks, removeTask } from '../core/store.js';
import { getLogFilePath } from '../utils/paths.js';
import * as output from '../utils/output.js';

const CLEANABLE_STATUSES = new Set(['completed', 'stopped', 'failed']);

export async function cleanCommand(): Promise<void> {
  const tasks = getAllTasks().filter(task => CLEANABLE_STATUSES.has(task.status));
  let cleaned = 0;

  for (const task of tasks) {
    if (task.worktreePath) {
      try {
        await removeWorktree(task.worktreePath);
      } catch {
        // Best-effort cleanup: the worktree may already be gone.
      }
    }

    try {
      unlinkSync(getLogFilePath(task.id));
    } catch {
      // Best-effort cleanup: the log may already be gone.
    }

    removeTask(task.id);
    cleaned++;
  }

  await output.success(`已清理 ${cleaned} 個任務`);
}
