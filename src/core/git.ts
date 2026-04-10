/**
 * Git 分支管理（簡化版）
 * 借鑑 Vibe-Kanban WorktreeManager，但大幅簡化
 */

import { simpleGit, SimpleGit } from 'simple-git';
import { createHash } from 'crypto';

/**
 * 生成 vibe 分支名
 * 格式：vibe/<agent>-<hash前6位>
 */
export function generateBranchName(agent: string, task: string): string {
  const hash = createHash('md5').update(task + Date.now()).digest('hex').slice(0, 6);
  return `vibe/${agent}-${hash}`;
}

/**
 * 創建並切換到新分支
 */
export async function createBranch(cwd: string, branchName: string): Promise<void> {
  const git: SimpleGit = simpleGit(cwd);

  // 確保是 git repo
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error(`${cwd} 不是一個 Git 倉庫`);
  }

  // 從當前 HEAD 創建分支
  await git.checkoutLocalBranch(branchName);
}

/**
 * 獲取分支的修改文件列表
 */
export async function getModifiedFiles(cwd: string): Promise<string[]> {
  const git: SimpleGit = simpleGit(cwd);
  const status = await git.status();
  return [
    ...status.modified,
    ...status.created,
    ...status.not_added,
  ];
}

/**
 * 獲取 diff 統計
 */
export async function getDiffSummary(cwd: string, baseBranch?: string): Promise<string> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    if (baseBranch) {
      const diff = await git.diff([baseBranch, '--stat']);
      return diff;
    }
    // 獲取工作區的改動
    const diff = await git.diff(['--stat']);
    return diff || '(no changes)';
  } catch {
    return '(unable to get diff)';
  }
}

/**
 * 獲取完整 diff（用於 handoff 上下文）
 */
export async function getFullDiff(cwd: string): Promise<string> {
  const git: SimpleGit = simpleGit(cwd);
  try {
    // 先嘗試 staged + unstaged
    let diff = await git.diff();
    const stagedDiff = await git.diff(['--cached']);
    const fullDiff = [diff, stagedDiff].filter(Boolean).join('\n');

    // 如果沒有 working 改動，檢查最近的 commits
    if (!fullDiff.trim()) {
      const log = await git.log({ maxCount: 3 });
      if (log.latest) {
        diff = await git.diff([`${log.latest.hash}~1`, log.latest.hash]);
        return diff || '(no diff available)';
      }
    }

    // 截斷避免太長
    if (fullDiff.length > 5000) {
      return fullDiff.slice(0, 5000) + '\n\n... (truncated, total ' + fullDiff.length + ' chars)';
    }
    return fullDiff || '(no changes)';
  } catch {
    return '(unable to get diff)';
  }
}

/**
 * 獲取當前分支名
 */
export async function getCurrentBranch(cwd: string): Promise<string> {
  const git: SimpleGit = simpleGit(cwd);
  const branch = await git.branch();
  return branch.current;
}

/**
 * 切換到指定分支
 */
export async function checkoutBranch(cwd: string, branch: string): Promise<void> {
  const git: SimpleGit = simpleGit(cwd);
  await git.checkout(branch);
}
