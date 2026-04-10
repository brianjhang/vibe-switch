/**
 * vibe log — 查看 Agent 任務輸出
 */

import { readFileSync } from 'fs';
import { getTaskByBranch } from '../core/store.js';
import { getLogFilePath } from '../utils/paths.js';
import * as output from '../utils/output.js';

function isMissingFileError(err: unknown): boolean {
  return typeof err === 'object'
    && err !== null
    && 'code' in err
    && (err as NodeJS.ErrnoException).code === 'ENOENT';
}

export async function logCommand(branch: string): Promise<void> {
  const task = getTaskByBranch(branch);
  if (!task) {
    await output.error(`找不到分支 ${branch} 對應的任務`);
    process.exit(1);
    return;
  }

  try {
    const data = readFileSync(getLogFilePath(task.id), 'utf-8');
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
