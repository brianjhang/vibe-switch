/**
 * Task state storage.
 * Uses JSON files, following the KISS principle.
 */

import { readFileSync, writeFileSync } from 'fs';
import { TaskRecord } from '../adapters/types.js';
import { getTasksFilePath, ensureDir, getVibeDir } from '../utils/paths.js';

function isMissingFileError(err: unknown): boolean {
  return typeof err === 'object'
    && err !== null
    && 'code' in err
    && (err as NodeJS.ErrnoException).code === 'ENOENT';
}

function loadTasks(): TaskRecord[] {
  try {
    const data = readFileSync(getTasksFilePath(), 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (isMissingFileError(err)) {
      return [];
    }
    throw err;
  }
}

function saveTasks(tasks: TaskRecord[]): void {
  ensureDir(getVibeDir());
  writeFileSync(getTasksFilePath(), JSON.stringify(tasks, null, 2));
}

export function addTask(task: TaskRecord): void {
  const tasks = loadTasks();
  tasks.push(task);
  saveTasks(tasks);
}

export function updateTask(id: string, updates: Partial<TaskRecord>): void {
  const tasks = loadTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], ...updates };
    saveTasks(tasks);
  }
}

export function getTask(id: string): TaskRecord | undefined {
  return loadTasks().find(t => t.id === id);
}

export function getTaskByBranch(branch: string): TaskRecord | undefined {
  const matches = loadTasks().filter(t => t.branch === branch);
  return matches.find(t => t.status === 'running') ?? matches[matches.length - 1];
}

export function getAllTasks(): TaskRecord[] {
  return loadTasks();
}

export function getActiveTasks(): TaskRecord[] {
  return loadTasks().filter(t => t.status === 'running');
}

export function removeTask(id: string): void {
  const tasks = loadTasks().filter(t => t.id !== id);
  saveTasks(tasks);
}

/**
 * Clean up stale tasks whose process has exited while status is still running.
 */
export function cleanupStaleTasks(): void {
  const tasks = loadTasks();
  let changed = false;

  for (const task of tasks) {
    if (task.status === 'running') {
      try {
        // Check whether the process is still alive.
        process.kill(task.pid, 0);
      } catch {
        // The process no longer exists.
        task.status = 'completed';
        task.stoppedAt = Date.now();
        changed = true;
      }
    }
  }

  if (changed) {
    saveTasks(tasks);
  }
}
