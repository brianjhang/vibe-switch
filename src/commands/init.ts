/**
 * vibe init — 初始化項目配置
 */

import { configExists, DEFAULT_CONFIG, getConfigPath, writeConfig } from '../core/config.js';
import * as output from '../utils/output.js';

export async function initCommand(): Promise<void> {
  const configPath = getConfigPath();

  if (configExists()) {
    await output.warn(`配置文件已存在: ${configPath}`);
    return;
  }

  writeConfig({ ...DEFAULT_CONFIG });
  await output.success(`已建立配置文件: ${configPath}`);
}
