/**
 * vibe log - view Agent task output
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
    await output.error(`Could not find a task for branch ${branch}`);
    process.exit(1);
    return;
  }

  const logFilePath = getLogFilePath(task.id);

  if (options.follow) {
    if (!existsSync(logFilePath)) {
      await output.warn('Log file not found. Waiting for Agent output...');
    }

    const follower = followLogFile(logFilePath, line => {
      console.log(line);
    });

    await output.info('Following log output. Press Ctrl+C to stop.');
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
      await output.info('No log output yet');
      return;
    }

    console.log(lines.slice(-20).join('\n'));
  } catch (err) {
    if (isMissingFileError(err)) {
      await output.warn('Log file not found. This may be an old task, or the Agent has not produced output yet.');
      return;
    }
    throw err;
  }
}
