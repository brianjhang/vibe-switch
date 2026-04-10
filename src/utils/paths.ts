import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { delimiter, join } from 'path';

/**
 * Common CLI install paths for Homebrew and npm global installs.
 */
export function getExpandedPath(): string {
  const extraPaths = [
    '/opt/homebrew/bin',
    join(homedir(), '.npm-global', 'bin'),
  ];

  return [process.env.PATH, ...extraPaths]
    .filter((entry): entry is string => Boolean(entry))
    .join(delimiter);
}

/**
 * Check whether a command exists.
 */
export function commandExists(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, {
      stdio: 'ignore',
      env: { ...process.env, PATH: getExpandedPath() },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Vibe-Switch data directory.
 */
export function getVibeDir(): string {
  const dir = join(homedir(), '.vibe-switch');
  return dir;
}

/**
 * Task storage file path.
 */
export function getTasksFilePath(): string {
  return join(getVibeDir(), 'tasks.json');
}

/**
 * Agent output log directory.
 */
export function getLogsDir(): string {
  return join(getVibeDir(), 'logs');
}

/**
 * Agent task log file path.
 */
export function getLogFilePath(taskId: string): string {
  return join(getLogsDir(), `${taskId}.log`);
}

/**
 * Context snapshot directory.
 */
export function getSnapshotsDir(): string {
  return join(getVibeDir(), 'snapshots');
}

/**
 * Ensure a directory exists.
 */
export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
