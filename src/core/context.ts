/**
 * Context extraction and injection, the core differentiating module.
 */

import { ContextSnapshot, ArtifactEntry, AgentId } from '../adapters/types.js';
import { getModifiedFiles, getNewFiles, getFullDiff } from './git.js';
import { getSnapshotsDir, ensureDir } from '../utils/paths.js';
import { readFileSync, writeFileSync, statSync } from 'fs';
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
  includeArtifacts: boolean = true,
): Promise<ContextSnapshot> {
  const modifiedFiles = await getModifiedFiles(cwd);
  const gitDiff = await getFullDiff(cwd);

  // Collect new file contents as artifacts for handoff.
  const artifacts: ArtifactEntry[] = includeArtifacts
    ? await collectArtifacts(cwd)
    : [];

  const snapshot: ContextSnapshot = {
    sourceAgent,
    taskDescription: task,
    projectDir: cwd,
    branch,
    timestamp: Date.now(),
    summary: summary || `Agent ${sourceAgent} is working on: ${task}`,
    modifiedFiles,
    gitDiff,
    artifacts,
    pendingItems: [],
  };

  // Persist the snapshot.
  saveSnapshot(branch, snapshot);
  return snapshot;
}

/** Max file size to include as artifact (30KB). */
const ARTIFACT_MAX_FILE_SIZE = 30 * 1024;

/** Max total size for all artifacts combined (100KB). */
const ARTIFACT_MAX_TOTAL_SIZE = 100 * 1024;

/** Binary file extensions to skip. */
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.woff', '.woff2', '.ttf', '.eot',
  '.zip', '.tar', '.gz', '.bz2',
  '.pdf', '.exe', '.dll', '.so', '.dylib',
  '.mp3', '.mp4', '.wav', '.avi',
  '.pyc', '.class', '.o',
]);

/**
 * Collect new/created files as artifacts.
 * Reads the full content of text files, respecting per-file and total size limits.
 */
async function collectArtifacts(cwd: string): Promise<ArtifactEntry[]> {
  const newFiles = await getNewFiles(cwd);
  const artifacts: ArtifactEntry[] = [];
  let totalSize = 0;

  for (const file of newFiles) {
    // Skip binary files.
    const dotIndex = file.lastIndexOf('.');
    if (dotIndex >= 0) {
      const ext = file.slice(dotIndex).toLowerCase();
      if (BINARY_EXTENSIONS.has(ext)) continue;
    }

    try {
      const fullPath = join(cwd, file);
      const stat = statSync(fullPath);

      // Skip files exceeding per-file limit.
      if (stat.size > ARTIFACT_MAX_FILE_SIZE) continue;

      // Stop if adding this file would exceed total limit.
      if (totalSize + stat.size > ARTIFACT_MAX_TOTAL_SIZE) break;

      const content = readFileSync(fullPath, 'utf-8');
      artifacts.push({
        path: file,
        content,
        sizeBytes: stat.size,
        isNew: true,
      });
      totalSize += stat.size;
    } catch {
      // Skip files that can't be read (permissions, symlinks, etc.).
    }
  }

  return artifacts;
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
    const truncatedDiff = snapshot.gitDiff.length > 8000
      ? snapshot.gitDiff.slice(0, 8000) + '\n... (truncated)'
      : snapshot.gitDiff;
    lines.push('```diff');
    lines.push(truncatedDiff);
    lines.push('```');
    lines.push('');
  }

  // Include full content of new files so the target agent knows what was built.
  if (snapshot.artifacts && snapshot.artifacts.length > 0) {
    lines.push(`## New Files Created by Previous Agent`);
    lines.push(`The following files are already in your working directory. Full content is shown for context.`);
    lines.push('');
    for (const artifact of snapshot.artifacts) {
      const ext = artifact.path.slice(artifact.path.lastIndexOf('.') + 1);
      lines.push(`### ${artifact.path}`);
      lines.push(`\`\`\`${ext}`);
      lines.push(artifact.content);
      lines.push('```');
      lines.push('');
    }
  }

  if (extraMessage) {
    lines.push(`## Additional Notes`);
    lines.push(extraMessage);
    lines.push('');
  }

  lines.push(`Continue working from this context. First understand the previous progress, then move the task forward.`);

  return lines.join('\n');
}
