import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface VibeSwitchConfig {
  defaultAgent: string;
  logRetentionDays: number;
  [key: string]: unknown;
}

export const DEFAULT_CONFIG = {
  defaultAgent: 'codex',
  logRetentionDays: 7,
};

export function getConfigPath(cwd = process.cwd()): string {
  return join(cwd, '.vibeswitch.json');
}

export function configExists(cwd = process.cwd()): boolean {
  return existsSync(getConfigPath(cwd));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readConfig(cwd = process.cwd()): VibeSwitchConfig {
  if (!configExists(cwd)) {
    return { ...DEFAULT_CONFIG };
  }

  const parsed = JSON.parse(readFileSync(getConfigPath(cwd), 'utf-8')) as unknown;
  if (!isRecord(parsed)) {
    throw new Error('.vibeswitch.json must contain a JSON object');
  }

  const config: VibeSwitchConfig = { ...DEFAULT_CONFIG };
  for (const [key, value] of Object.entries(parsed)) {
    config[key] = value;
  }

  if (typeof config.defaultAgent !== 'string') {
    config.defaultAgent = DEFAULT_CONFIG.defaultAgent;
  }

  if (typeof config.logRetentionDays !== 'number' || !Number.isFinite(config.logRetentionDays)) {
    config.logRetentionDays = DEFAULT_CONFIG.logRetentionDays;
  }

  return config;
}

export function writeConfig(config: VibeSwitchConfig, cwd = process.cwd()): void {
  writeFileSync(getConfigPath(cwd), `${JSON.stringify(config, null, 2)}\n`);
}
