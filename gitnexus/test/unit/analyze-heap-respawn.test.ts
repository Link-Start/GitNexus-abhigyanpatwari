import { beforeEach, describe, expect, it, vi } from 'vitest';

const execFileSyncMock = vi.fn();
const getHeapStatisticsMock = vi.fn();

vi.mock('child_process', async () => {
  const actual = await vi.importActual<typeof import('child_process')>('child_process');
  return { ...actual, execFileSync: execFileSyncMock };
});

vi.mock('v8', () => ({
  default: {
    getHeapStatistics: getHeapStatisticsMock,
  },
}));

vi.mock('../../src/core/lbug/lbug-adapter.js', () => ({
  closeLbug: vi.fn(async () => undefined),
}));

describe('analyzeCommand heap respawn', () => {
  beforeEach(() => {
    vi.resetModules();
    execFileSyncMock.mockReset();
    getHeapStatisticsMock.mockReset();
    process.exitCode = undefined;
  });

  it('re-execs analyze with 16GB heap when no max-old-space-size is present', async () => {
    delete process.env.NODE_OPTIONS;
    getHeapStatisticsMock.mockReturnValue({ heap_size_limit: 512 * 1024 * 1024 });

    const { analyzeCommand } = await import('../../src/cli/analyze.js');
    await analyzeCommand(undefined, {});

    expect(execFileSyncMock).toHaveBeenCalledTimes(1);
    const [, args, opts] = execFileSyncMock.mock.calls[0];
    expect(args).toContain('--max-old-space-size=16384');
    expect(opts.env.NODE_OPTIONS).toContain('--max-old-space-size=16384');
  });
});
