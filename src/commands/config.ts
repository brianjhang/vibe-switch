/**
 * vibe config - view or set config
 */

import { DEFAULT_CONFIG, readConfig, writeConfig } from '../core/config.js';
import * as output from '../utils/output.js';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function parseValue(key: string, value: string): unknown {
  const defaultValue = (DEFAULT_CONFIG as Record<string, unknown>)[key];

  if (typeof defaultValue === 'number') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(`${key} must be a number`);
    }
    return parsed;
  }

  if (typeof defaultValue === 'boolean') {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    throw new Error(`${key} must be true or false`);
  }

  if (typeof defaultValue === 'string') {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export async function configCommand(key?: string, value?: string): Promise<void> {
  try {
    const config = readConfig();

    if (!key) {
      console.log(JSON.stringify(config, null, 2));
      return;
    }

    if (value === undefined) {
      if (!(key in config)) {
        await output.warn(`Config not found: ${key}`);
        process.exit(1);
        return;
      }

      console.log(formatValue(config[key]));
      return;
    }

    config[key] = parseValue(key, value);
    writeConfig(config);
    await output.success(`Updated config: ${key} = ${formatValue(config[key])}`);
  } catch (err) {
    await output.error(`Config handling failed: ${getErrorMessage(err)}`);
    process.exit(1);
    return;
  }
}
