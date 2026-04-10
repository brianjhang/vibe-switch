/**
 * 日誌文件增量讀取
 */

import { createReadStream, statSync } from 'fs';

export interface LogFollower {
  stop(): void;
}

interface FollowLogOptions {
  intervalMs?: number;
  startAtEnd?: boolean;
  onError?: (err: unknown) => void;
}

function isMissingFileError(err: unknown): boolean {
  return typeof err === 'object'
    && err !== null
    && 'code' in err
    && (err as NodeJS.ErrnoException).code === 'ENOENT';
}

function getInitialPosition(filePath: string, startAtEnd: boolean): number {
  try {
    return startAtEnd ? statSync(filePath).size : 0;
  } catch (err) {
    if (isMissingFileError(err)) {
      return 0;
    }
    throw err;
  }
}

export function followLogFile(
  filePath: string,
  onLine: (line: string) => void,
  options: FollowLogOptions = {},
): LogFollower {
  const intervalMs = options.intervalMs ?? 500;
  let position = getInitialPosition(filePath, options.startAtEnd ?? true);
  let pending = '';
  let reading = false;
  let stopped = false;

  function readNewBytes(): void {
    if (stopped || reading) {
      return;
    }

    let size: number;
    try {
      size = statSync(filePath).size;
    } catch (err) {
      if (!isMissingFileError(err)) {
        options.onError?.(err);
      }
      return;
    }

    if (size < position) {
      position = 0;
      pending = '';
    }

    if (size === position) {
      return;
    }

    const start = position;
    const end = size - 1;
    position = size;
    reading = true;

    const stream = createReadStream(filePath, { encoding: 'utf8', start, end });

    stream.on('data', chunk => {
      pending += chunk.toString();
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() ?? '';

      for (const line of lines) {
        onLine(line);
      }
    });

    stream.on('error', err => {
      position = start;
      reading = false;
      options.onError?.(err);
    });

    stream.on('close', () => {
      reading = false;
    });
  }

  const timer = setInterval(readNewBytes, intervalMs);
  readNewBytes();

  return {
    stop() {
      stopped = true;
      clearInterval(timer);

      if (pending.length > 0) {
        onLine(pending);
        pending = '';
      }
    },
  };
}
