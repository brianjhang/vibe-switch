import { getAllAdapters } from '../adapters/index.js';

export async function agentsCommand(): Promise<void> {
  const adapters = getAllAdapters();

  for (const adapter of adapters) {
    const installed = await adapter.detect();
    console.log(`${adapter.icon} ${adapter.name} (${adapter.id}) - ${installed ? 'installed' : 'not installed'}`);
  }
}
