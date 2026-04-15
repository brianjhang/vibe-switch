/**
 * Git branch management, simplified.
 * Inspired by Vibe-Kanban WorktreeManager, but much simpler.
 */

import { simpleGit, SimpleGit } from 'simple-git';
import { createHash } from 'crypto';
import { basename, join, resolve } from 'path';

/**
 * Generate a vibe branch name.
 * Format: vibe/<agent>-<first 6 hash chars>
 */
export function generateBranchName(agent: string, task: string): string {
  const hash = createHash('md5').update(task + Date.now()).digest('hex').slice(0, 6);
  return `vibe/${agent}-${hash}`;
}

/**
 * Create a new branch.
 */
export async function createBranch(cwd: string, branchName: string): Promise<void> {
  const git: SimpleGit = simpleGit(cwd);

  // Ensure this is a git repo.
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error(`${cwd} is not a Git repository`);
  }

  // Create the branch from the current HEAD without switching the worktree.
  await git.raw(['branch', branchName]);
}

/**
 * Create an isolated Git worktree so multiple Agents can work in parallel.
 */
export async function createWorktree(projectDir: string, branchName: string): Promise<string> {
  const git: SimpleGit = simpleGit(projectDir);

  // Ensure this is a git repo.
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error(`${projectDir} is not a Git repository`);
  }

  const repoName = basename(projectDir);
  const relativeWorktreePath = join('..', `${repoName}-${branchName}`);

  await git.raw(['worktree', 'add', relativeWorktreePath, branchName]);
  return resolve(projectDir, relativeWorktreePath);
}

/**
 * Remove the specified Git worktree.
 */
export async function removeWorktree(worktreePath: string): Promise<void> {
  const git: SimpleGit = simpleGit(worktreePath);
  await git.raw(['worktree', 'remove', worktreePath]);
}

/**
 * Get the list of modified files for a branch.
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
 * Get newly created files (untracked + staged new).
 * These are files that don't exist on the base branch and need their
 * full content included in handoff artifacts.
 */
export async function getNewFiles(cwd: string): Promise<string[]> {
  const git: SimpleGit = simpleGit(cwd);
  const status = await git.status();
  return [
    ...status.created,    // staged new files ('A')
    ...status.not_added,  // untracked files ('??')
  ];
}

/**
 * Get diff stats.
 */
export async function getDiffSummary(cwd: string, baseBranch?: string): Promise<string> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    if (baseBranch) {
      const diff = await git.diff([baseBranch, '--stat']);
      return diff;
    }
    // Get working tree changes.
    const diff = await git.diff(['--stat']);
    return diff || '(no changes)';
  } catch {
    return '(unable to get diff)';
  }
}

/**
 * Get the full diff for handoff context.
 */
export async function getFullDiff(cwd: string): Promise<string> {
  const git: SimpleGit = simpleGit(cwd);
  try {
    // Try staged plus unstaged changes first.
    let diff = await git.diff();
    const stagedDiff = await git.diff(['--cached']);
    const fullDiff = [diff, stagedDiff].filter(Boolean).join('\n');

    // If there are no working changes, check recent commits.
    if (!fullDiff.trim()) {
      const log = await git.log({ maxCount: 3 });
      if (log.latest) {
        diff = await git.diff([`${log.latest.hash}~1`, log.latest.hash]);
        return diff || '(no diff available)';
      }
    }

    // Truncate to avoid excessive length.
    if (fullDiff.length > 5000) {
      return fullDiff.slice(0, 5000) + '\n\n... (truncated, total ' + fullDiff.length + ' chars)';
    }
    return fullDiff || '(no changes)';
  } catch {
    return '(unable to get diff)';
  }
}

/**
 * Get the current branch name.
 */
export async function getCurrentBranch(cwd: string): Promise<string> {
  const git: SimpleGit = simpleGit(cwd);
  const branch = await git.branch();
  return branch.current;
}

/**
 * Check out the specified branch.
 */
export async function checkoutBranch(cwd: string, branch: string): Promise<void> {
  const git: SimpleGit = simpleGit(cwd);
  await git.checkout(branch);
}
