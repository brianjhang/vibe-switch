/**
 * vibe status — 總覽所有 Agent
 */

import { getAllTasks, cleanupStaleTasks } from '../core/store.js';
import { isProcessRunning } from '../core/process.js';
import { getModifiedFiles } from '../core/git.js';
import { getAdapter } from '../adapters/index.js';
import * as output from '../utils/output.js';
import { statusEmoji } from '../utils/output.js';

export async function statusCommand(): Promise<void> {
  // 先清理失效的任務
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
    await output.info('目前沒有任何 Agent 在工作。');
    await output.info('使用 vibe run "<任務>" --agent <agent> 啟動。');
    return;
  }

  // 動態 import Table（ESM 兼容）
  const Table = (await import('cli-table3')).default;

  const table = new Table({
    head: ['Agent', '任務', '狀態', '分支', '已修改', 'PID', '運行時間'],
    style: { head: ['cyan'] },
    colWidths: [14, 30, 10, 22, 8, 8, 10],
    wordWrap: true,
  });

  for (const task of tasks) {
    const adapter = getAdapter(task.agent);
    const agentName = adapter ? `${adapter.icon} ${adapter.name}` : task.agent;

    // 更新運行狀態
    const alive = task.status === 'running' && isProcessRunning(task.pid);
    const status = alive ? 'running' : (task.status === 'running' ? 'completed' : task.status);

    // 嘗試獲取修改文件數
    let fileCount = '-';
    try {
      const files = await getModifiedFiles(task.projectDir);
      fileCount = files.length.toString();
    } catch {
      fileCount = '?';
    }

    // 計算運行時間
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
