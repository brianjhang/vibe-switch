/**
 * vibe summary — 查看 Agent 的工作摘要
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { getAdapter } from '../adapters/index.js';
import { type TaskRecord } from '../adapters/types.js';
import { getTaskByBranch } from '../core/store.js';
import { getLogFilePath } from '../utils/paths.js';
import * as output from '../utils/output.js';
import { statusEmoji } from '../utils/output.js';

function isMissingFileError(err: unknown): boolean {
  return typeof err === 'object'
    && err !== null
    && 'code' in err
    && (err as NodeJS.ErrnoException).code === 'ENOENT';
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function formatRuntime(startedAt: number, stoppedAt?: number): string {
  const elapsedMs = Math.max(0, (stoppedAt ?? Date.now()) - startedAt);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  if (hours > 0) {
    return `${hours}h${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m${seconds}s`;
  }
  return `${seconds}s`;
}

function readLogSnippet(taskId: string): string {
  try {
    const data = readFileSync(getLogFilePath(taskId), 'utf-8');
    return data.slice(-500).trim() || '(no log output)';
  } catch (err) {
    if (isMissingFileError(err)) {
      return '(log file not found)';
    }
    throw err;
  }
}

function getDiffStat(task: TaskRecord): string {
  const cwdCandidates = [task.worktreePath, task.projectDir]
    .filter((cwd): cwd is string => Boolean(cwd));
  const range = shellQuote(`main..${task.branch}`);

  for (const cwd of cwdCandidates) {
    try {
      const diffStat = execSync(`git diff --stat ${range}`, {
        cwd,
        encoding: 'utf-8',
      }).trim();
      return diffStat || '(no committed file changes vs main)';
    } catch {
      // Try the next known project path before giving up.
    }
  }

  return '(unable to get changed files)';
}

export async function summaryCommand(branch: string): Promise<void> {
  const task = getTaskByBranch(branch);
  if (!task) {
    await output.error(`找不到分支 ${branch} 對應的任務`);
    process.exit(1);
    return;
  }

  const adapter = getAdapter(task.agent);
  const agentName = adapter ? `${adapter.icon} ${adapter.name}` : task.agent;
  const logSnippet = readLogSnippet(task.id);
  const diffStat = getDiffStat(task);

  const Table = (await import('cli-table3')).default;
  const table = new Table({
    colWidths: [16, 70],
    wordWrap: true,
  });

  table.push(
    ['Agent', agentName],
    ['Task', task.task],
    ['Status', `${statusEmoji(task.status)} ${task.status}`],
    ['Runtime', formatRuntime(task.startedAt, task.stoppedAt)],
    ['Branch', task.branch],
  );

  console.log('');
  console.log(table.toString());
  console.log('');
  console.log('Log snippet:');
  console.log('─'.repeat(60));
  console.log(logSnippet);
  console.log('─'.repeat(60));
  console.log('');
  console.log('Changed files:');
  console.log(diffStat);
  console.log('');
}
