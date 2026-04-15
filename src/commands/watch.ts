/**
 * vibe watch - view real-time output from all Agents
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
  aider: 'Aider',
  opencode: 'OpenCode',
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
    case 'aider':
      return chalk.green(label);
    case 'opencode':
      return chalk.blue(label);
    default:
      return chalk.white(label);
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
    await output.info('No Agents are currently running.');
    return;
  }

  const chalk = (await import('chalk')).default;

  const followers = tasks.map(task => {
    const label = colorAgentLabel(task, chalk);
    return followLogFile(getLogFilePath(task.id), line => {
      console.log(`${label} ${line}`);
    }, {
      onError(err) {
        console.error(chalk.red(`Failed to read log for ${task.branch}: ${err instanceof Error ? err.message : String(err)}`));
      },
    });
  });

  await output.info(`Watching real-time output from ${tasks.length} Agent(s). Press Ctrl+C to stop.`);
  await waitForStop(followers);
}
