import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyWorkersDeployment } from './verify-workers-deployment.mjs';

const revision = 'a'.repeat(40);
const previousRevision = 'b'.repeat(40);
const revisionScript = path.resolve('scripts/write-workers-build-revision.mjs');
const execFileAsync = promisify(execFile);
let directory;

const check = (status, conclusion = null) => ({
  id: 1,
  name: 'Workers Builds: facodi',
  app: { slug: 'cloudflare-workers-and-pages' },
  head_sha: revision,
  status,
  conclusion,
  details_url: 'https://example.com/build',
});

const suite = {
  id: 1,
  app: { slug: 'cloudflare-workers-and-pages' },
  head_branch: 'facodi',
  head_sha: revision,
};

function options(request, extra = {}) {
  return {
    repository: 'Open2Tech/facodi',
    revision,
    githubApiUrl: 'https://api.github.test',
    githubToken: 'test-token',
    workersOrigin: 'https://workers.example',
    request,
    wait: vi.fn(),
    maxAttempts: 4,
    intervalMs: 1,
    log: vi.fn(),
    ...extra,
  };
}

function jsonResponse(payload) {
  return new Response(JSON.stringify(payload));
}

afterEach(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
  directory = undefined;
});

describe('Workers deployment verification', () => {
  it('waits for the matching successful check and the revision actually served', async () => {
    const suites = [[], [suite], [suite]];
    const checks = [[check('in_progress')], [check('completed', 'success')]];
    const revisions = [previousRevision, revision];
    const request = vi.fn(async url => {
      if (url.pathname.endsWith('/check-suites')) return jsonResponse({ check_suites: suites.shift() });
      if (url.pathname.endsWith('/check-runs')) return jsonResponse({ check_runs: checks.shift() });
      return new Response(`${revisions.shift()}\n`);
    });
    const config = options(request);

    await expect(verifyWorkersDeployment(config)).resolves.toBeUndefined();
    expect(config.wait).toHaveBeenCalledTimes(3);
    const workersRequests = request.mock.calls.filter(([url]) => url.hostname === 'workers.example');
    expect(workersRequests).toHaveLength(2);
    expect(workersRequests[0][1].headers).not.toHaveProperty('Authorization');
    expect(workersRequests[0][1].cache).toBe('no-store');
  });

  it('rejects a failed Cloudflare build without checking an older deployment', async () => {
    const request = vi.fn(async url => url.pathname.endsWith('/check-suites')
      ? jsonResponse({ check_suites: [suite] })
      : jsonResponse({ check_runs: [check('completed', 'failure')] }));
    await expect(verifyWorkersDeployment(options(request))).rejects.toThrow('concluded failure');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('ignores checks for a preview branch, another app or another commit', async () => {
    const request = vi.fn(async () => jsonResponse({ check_suites: [
      { ...suite, head_branch: 'feature/example' },
      { ...suite, app: { slug: 'other-app' } },
      { ...suite, head_sha: previousRevision },
    ] }));
    await expect(verifyWorkersDeployment(options(request, { maxAttempts: 2 })))
      .rejects.toThrow('Cloudflare build check not reported');
  });

  it.each([
    [previousRevision, `Workers serves ${previousRevision}`],
    ['<html>SPA fallback</html>', 'revision endpoint did not return a valid commit'],
  ])('fails rather than accepting a stale or missing revision', async (served, message) => {
    const request = vi.fn(async url => {
      if (url.pathname.endsWith('/check-suites')) return jsonResponse({ check_suites: [suite] });
      if (url.pathname.endsWith('/check-runs')) return jsonResponse({ check_runs: [check('completed', 'success')] });
      return new Response(served);
    });
    await expect(verifyWorkersDeployment(options(request, { maxAttempts: 2 })))
      .rejects.toThrow(message);
  });

  it('surfaces GitHub API permission errors', async () => {
    const request = vi.fn(async () => new Response('', { status: 403 }));
    await expect(verifyWorkersDeployment(options(request))).rejects.toThrow('GitHub checks API returned HTTP 403');
  });
});

describe('Workers build revision', () => {
  async function run(env) {
    directory = await mkdtemp(path.join(tmpdir(), 'facodi-workers-revision-'));
    await mkdir(path.join(directory, 'dist'));
    return execFileAsync('bun', [revisionScript], {
      cwd: directory,
      env: { ...process.env, WORKERS_CI: '1', WORKERS_CI_COMMIT_SHA: '', ...env },
    });
  }

  it('writes the public commit supplied by Workers Builds', async () => {
    await run({ WORKERS_CI_COMMIT_SHA: revision });
    await expect(readFile(path.join(directory, 'dist', 'build-revision.txt'), 'utf8'))
      .resolves.toBe(`${revision}\n`);
  });

  it.each(['', 'invalid'])('fails a Workers build with a missing or invalid revision', async invalidRevision => {
    await expect(run({ WORKERS_CI_COMMIT_SHA: invalidRevision }))
      .rejects.toMatchObject({ stderr: expect.stringContaining('valid WORKERS_CI_COMMIT_SHA') });
    await expect(readFile(path.join(directory, 'dist', 'build-revision.txt'), 'utf8'))
      .rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('does not require or generate a revision outside Workers Builds', async () => {
    await run({ WORKERS_CI: '0' });
    await expect(readFile(path.join(directory, 'dist', 'build-revision.txt'), 'utf8'))
      .rejects.toMatchObject({ code: 'ENOENT' });
  });
});
