/**
 * Context extraction and injection, the core differentiating module.
 */

import { ContextSnapshot, AgentId } from '../adapters/types.js';
import { getModifiedFiles, getFullDiff } from './git.js';
import { getSnapshotsDir, ensureDir } from '../utils/paths.js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Generate a context snapshot from the current work state.
 */
export async function createSnapshot(
  sourceAgent: AgentId,
  task: string,
  branch: string,
  cwd: string,
  summary?: string,
): Promise<ContextSnapshot> {
  const modifiedFiles = await getModifiedFiles(cwd);
  const gitDiff = await getFullDiff(cwd);

  const snapshot: ContextSnapshot = {
    sourceAgent,
    taskDescription: task,
    projectDir: cwd,
    branch,
    timestamp: Date.now(),
    summary: summary || `Agent ${sourceAgent} is working on: ${task}`,
    modifiedFiles,
    gitDiff,
    pendingItems: [],
  };

  // Persist the snapshot.
  saveSnapshot(branch, snapshot);
  return snapshot;
}

/**
 * Save a snapshot to a file.
 */
function saveSnapshot(branch: string, snapshot: ContextSnapshot): void {
  const dir = getSnapshotsDir();
  ensureDir(dir);
  const filename = branch.replace(/\//g, '_') + '.json';
  writeFileSync(join(dir, filename), JSON.stringify(snapshot, null, 2));
}

/**
 * Load a snapshot.
 */
export function loadSnapshot(branch: string): ContextSnapshot | null {
  try {
    const dir = getSnapshotsDir();
    const filename = branch.replace(/\//g, '_') + '.json';
    const data = readFileSync(join(dir, filename), 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Format a context snapshot as a prompt for injection into the target Agent.
 */
export function formatSnapshotAsPrompt(
  snapshot: ContextSnapshot,
  targetAgent: AgentId,
  extraMessage?: string,
): string {
  const lines: string[] = [
    `=== Context Handoff ===`,
    `The previous Agent (${snapshot.sourceAgent}) is handing off its work to you (${targetAgent}).`,
    ``,
    `## Original Task`,
    snapshot.taskDescription,
    ``,
    `## Work Summary`,
    snapshot.summary,
    ``,
  ];

  if (snapshot.modifiedFiles.length > 0) {
    lines.push(`## Modified Files`);
    snapshot.modifiedFiles.forEach(f => lines.push(`- ${f}`));
    lines.push('');
  }

  if (snapshot.pendingItems.length > 0) {
    lines.push(`## Pending Items`);
    snapshot.pendingItems.forEach(item => lines.push(`- ${item}`));
    lines.push('');
  }

  if (snapshot.gitDiff && snapshot.gitDiff !== '(no changes)') {
    lines.push(`## Code Changes (diff)`);
    // Truncate the diff to avoid an overly long prompt.
    const truncatedDiff = snapshot.gitDiff.length > 3000
      ? snapshot.gitDiff.slice(0, 3000) + '\n... (truncated)'
      : snapshot.gitDiff;
    lines.push('```diff');
    lines.push(truncatedDiff);
    lines.push('```');
    lines.push('');
  }

  if (extraMessage) {
    lines.push(`## Additional Notes`);
    lines.push(extraMessage);
    lines.push('');
  }

  lines.push(`Continue working from this context. First understand the previous progress, then move the task forward.`);

  return lines.join('\n');
}
