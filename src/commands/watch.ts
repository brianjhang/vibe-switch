/**
 * vibe watch — 實時查看所有 Agent 的輸出
 */

import { type TaskRecord } from '../adapters/types.js';
import { getAdapter } from '../adapters/index.js';
import { followLogFile, type LogFollower } from '../core/logStream.js';
import { getActiveTasks } from '../core/store.js';
import { getLogFilePath } from '../utils/paths.js';
import * as output from '../utils/output.js';

const agentNames: Record<TaskRecord['agent'], string> = {
  claude: 'Claude',
  codex: 'Codex',
  gemini: 'Gemini',
  antigravity: 'Antigravity',
  openclaw: 'OpenClaw',
};

function colorAgentLabel(
  task: TaskRecord,
  chalk: any,
): string {
  const adapter = getAdapter(task.agent);
  const icon = adapter?.icon ?? '';
  const label = `[${icon} ${agentNames[task.agent]}]`;

  switch (task.agent) {
    case 'claude':
      return chalk.magenta(label);
    case 'codex':
      return chalk.cyan(label);
    case 'gemini':
      return chalk.yellow(label);
    case 'antigravity':
      return chalk.blue(label);
    case 'openclaw':
      return chalk.red(label);
  }
}

function waitForStop(followers: LogFollower[]): Promise<void> {
  return new Promise(resolve => {
    const stop = () => {
      for (const follower of followers) {
        follower.stop();
      }

      process.off('SIGINT', stop);
      process.off('SIGTERM', stop);
      console.log('');
      resolve();
    };

    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  });
}

export async function watchCommand(): Promise<void> {
  const tasks = getActiveTasks();

  if (tasks.length === 0) {
    await output.info('目前沒有正在運行的 Agent。');
    return;
  }

  const chalk = (await import('chalk')).default;

  const followers = tasks.map(task => {
    const label = colorAgentLabel(task, chalk);
    return followLogFile(getLogFilePath(task.id), line => {
      console.log(`${label} ${line}`);
    }, {
      onError(err) {
        console.error(chalk.red(`讀取 ${task.branch} 日誌失敗: ${err instanceof Error ? err.message : String(err)}`));
      },
    });
  });

  await output.info(`正在實時查看 ${tasks.length} 個 Agent 的輸出。按 Ctrl+C 停止。`);
  await waitForStop(followers);
}
