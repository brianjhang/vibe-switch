/**
 * vibe status - overview of all Agents
 */

import { getAllTasks, cleanupStaleTasks } from '../core/store.js';
import { isProcessRunning } from '../core/process.js';
import { getModifiedFiles } from '../core/git.js';
import { getAdapter } from '../adapters/index.js';
import * as output from '../utils/output.js';
import { statusEmoji } from '../utils/output.js';

export async function statusCommand(): Promise<void> {
  // Clean up stale tasks first.
  let tasks: ReturnType<typeof getAllTasks>;
  try {
    cleanupStaleTasks();
    tasks = getAllTasks();
  } catch {
    await output.error('Task state corrupted. Run: rm ~/.vibe-switch/tasks.json to reset.');
    process.exit(1);
    return;
  }

  if (tasks.length === 0) {
    await output.info('No Agents are currently working.');
    await output.info('Start one with vibe run "<task>" --agent <agent>.');
    return;
  }

  // Dynamically import Table for ESM compatibility.
  const Table = (await import('cli-table3')).default;

  const table = new Table({
    head: ['Agent', 'Task', 'Status', 'Branch', 'Modified', 'PID', 'Runtime'],
    style: { head: ['cyan'] },
    colWidths: [14, 30, 10, 22, 8, 8, 10],
    wordWrap: true,
  });

  for (const task of tasks) {
    const adapter = getAdapter(task.agent);
    const agentName = adapter ? `${adapter.icon} ${adapter.name}` : task.agent;

    // Update running status.
    const alive = task.status === 'running' && isProcessRunning(task.pid);
    const status = alive ? 'running' : (task.status === 'running' ? 'completed' : task.status);

    // Try to get the number of modified files.
    let fileCount = '-';
    try {
      const files = await getModifiedFiles(task.worktreePath || task.projectDir);
      fileCount = files.length.toString();
    } catch {
      fileCount = '?';
    }

    // Calculate runtime.
    const elapsed = Date.now() - task.startedAt;
    const mins = Math.floor(elapsed / 60000);
    const runTime = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h${mins % 60}m`;

    table.push([
      agentName,
      task.task.length > 28 ? task.task.slice(0, 26) + '...' : task.task,
      `${statusEmoji(status)} ${status}`,
      task.branch,
      fileCount,
      task.pid.toString(),
      runTime,
    ]);
  }

  console.log('');
  console.log(table.toString());
  console.log('');
}
