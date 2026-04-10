/**
 * 任務狀態存儲
 * 使用 JSON 文件，KISS 原則
 */

import { readFileSync, writeFileSync } from 'fs';
import { TaskRecord } from '../adapters/types.js';
import { getTasksFilePath, ensureDir, getVibeDir } from '../utils/paths.js';

function loadTasks(): TaskRecord[] {
  try {
    const data = readFileSync(getTasksFilePath(), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
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
  return loadTasks().find(t => t.branch === branch);
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
 * 清理已失效的任務（進程已退出但狀態還是 running）
 */
export function cleanupStaleTasks(): void {
  const tasks = loadTasks();
  let changed = false;

  for (const task of tasks) {
    if (task.status === 'running') {
      try {
        // 檢查進程是否還活著
        process.kill(task.pid, 0);
      } catch {
        // 進程已不存在
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
