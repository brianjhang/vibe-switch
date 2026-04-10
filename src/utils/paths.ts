import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { delimiter, join } from 'path';

/**
 * CLI 常見安裝路徑（Homebrew / npm global）
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
 * 檢查命令是否存在
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
 * Vibe-Switch 數據目錄
 */
export function getVibeDir(): string {
  const dir = join(homedir(), '.vibe-switch');
  return dir;
}

/**
 * 任務存儲文件路徑
 */
export function getTasksFilePath(): string {
  return join(getVibeDir(), 'tasks.json');
}

/**
 * 上下文快照目錄
 */
export function getSnapshotsDir(): string {
  return join(getVibeDir(), 'snapshots');
}

/**
 * 確保目錄存在
 */
export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
