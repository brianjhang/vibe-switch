/**
 * Terminal output formatting utilities.
 */

// Use a dynamic import to handle ESM chalk.
let chalkInstance: any = null;

async function getChalk() {
  if (!chalkInstance) {
    chalkInstance = (await import('chalk')).default;
  }
  return chalkInstance;
}

export async function success(msg: string): Promise<void> {
  const chalk = await getChalk();
  console.log(chalk.green('✅ ') + msg);
}

export async function error(msg: string): Promise<void> {
  const chalk = await getChalk();
  console.error(chalk.red('❌ ') + msg);
}

export async function info(msg: string): Promise<void> {
  const chalk = await getChalk();
  console.log(chalk.blue('ℹ️  ') + msg);
}

export async function warn(msg: string): Promise<void> {
  const chalk = await getChalk();
  console.log(chalk.yellow('⚠️  ') + msg);
}

export async function agentLabel(icon: string, name: string): Promise<string> {
  const chalk = await getChalk();
  return `${icon} ${chalk.bold(name)}`;
}

export function statusEmoji(status: string): string {
  switch (status) {
    case 'running': return '🟢';
    case 'stopped': return '⏸️';
    case 'completed': return '✅';
    case 'failed': return '❌';
    default: return '⚪';
  }
}
