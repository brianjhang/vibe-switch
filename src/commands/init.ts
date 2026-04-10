/**
 * vibe init - initialize project config
 */

import { configExists, DEFAULT_CONFIG, getConfigPath, writeConfig } from '../core/config.js';
import * as output from '../utils/output.js';

export async function initCommand(): Promise<void> {
  const configPath = getConfigPath();

  if (configExists()) {
    await output.warn(`Config file already exists: ${configPath}`);
    return;
  }

  writeConfig({ ...DEFAULT_CONFIG });
  await output.success(`Created config file: ${configPath}`);
}
