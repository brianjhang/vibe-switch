/**
 * vibe log — 查看 Agent 任務輸出
 */

import { existsSync, readFileSync } from 'fs';
import { followLogFile, type LogFollower } from '../core/logStream.js';
import { getTaskByBranch } from '../core/store.js';
import { getLogFilePath } from '../utils/paths.js';
import * as output from '../utils/output.js';

interface LogOptions {
  follow?: boolean;
}

function isMissingFileError(err: unknown): boolean {
  return typeof err === 'object'
    && err !== null
    && 'code' in err
    && (err as NodeJS.ErrnoException).code === 'ENOENT';
}

function waitForStop(follower: LogFollower): Promise<void> {
  return new Promise(resolve => {
    const stop = () => {
      follower.stop();
      process.off('SIGINT', stop);
      process.off('SIGTERM', stop);
      console.log('');
      resolve();
    };

    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  });
}

export async function logCommand(branch: string, options: LogOptions = {}): Promise<void> {
  const task = getTaskByBranch(branch);
  if (!task) {
    await output.error(`找不到分支 ${branch} 對應的任務`);
    process.exit(1);
    return;
  }

  const logFilePath = getLogFilePath(task.id);

  if (options.follow) {
    if (!existsSync(logFilePath)) {
      await output.warn('找不到日誌文件。等待 Agent 產生輸出...');
    }

    const follower = followLogFile(logFilePath, line => {
      console.log(line);
    });

    await output.info('正在追蹤日誌輸出。按 Ctrl+C 停止。');
    await waitForStop(follower);
    return;
  }

  try {
    const data = readFileSync(logFilePath, 'utf-8');
    const lines = data.split(/\r?\n/);
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }

    if (lines.length === 0) {
      await output.info('目前沒有日誌輸出');
      return;
    }

    console.log(lines.slice(-20).join('\n'));
  } catch (err) {
    if (isMissingFileError(err)) {
      await output.warn('找不到日誌文件。這可能是舊任務，或 Agent 尚未產生輸出。');
      return;
    }
    throw err;
  }
}
