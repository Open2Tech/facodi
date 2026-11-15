import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const checkName = 'Workers Builds: facodi';
const cloudflareApp = 'cloudflare-workers-and-pages';
const revisionPattern = /^[0-9a-f]{40}$/;

async function getGithubJson(url, token, request) {
  const response = await request(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`GitHub checks API returned HTTP ${response.status}.`);
  return response.json();
}

export async function verifyWorkersDeployment({
  repository,
  revision,
  githubApiUrl,
  githubToken,
  workersOrigin,
  request = fetch,
  wait = sleep,
  maxAttempts = 90,
  intervalMs = 10_000,
  log = console.log,
}) {
  if (!repository || !/^[\w.-]+\/[\w.-]+$/.test(repository) ||
      !revisionPattern.test(revision ?? '') || !githubApiUrl || !githubToken || !workersOrigin) {
    throw new Error('GitHub repository, commit, API URL, token and Workers origin are required.');
  }

  const repositoryUrl = `${githubApiUrl.replace(/\/$/, '')}/repos/${repository}`;
  const suitesUrl = new URL(`${repositoryUrl}/commits/${revision}/check-suites`);
  suitesUrl.searchParams.set('check_name', checkName);
  suitesUrl.searchParams.set('per_page', '100');
  const revisionUrl = new URL('/build-revision.txt', workersOrigin);
  revisionUrl.searchParams.set('commit', revision);
  let buildSucceeded = false;
  let observation = 'Cloudflare build check not reported';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (!buildSucceeded) {
      const suites = await getGithubJson(suitesUrl, githubToken, request);
      if (!Array.isArray(suites.check_suites)) throw new Error('GitHub check suites API returned an invalid response.');
      const suite = suites.check_suites
        .filter(item => item.app?.slug === cloudflareApp && item.head_branch === 'facodi' && item.head_sha === revision)
        .sort((a, b) => b.id - a.id)[0];
      let check;
      if (suite) {
        const checksUrl = new URL(`${repositoryUrl}/check-suites/${suite.id}/check-runs`);
        checksUrl.searchParams.set('check_name', checkName);
        checksUrl.searchParams.set('filter', 'latest');
        checksUrl.searchParams.set('per_page', '100');
        const checks = await getGithubJson(checksUrl, githubToken, request);
        if (!Array.isArray(checks.check_runs)) throw new Error('GitHub check runs API returned an invalid response.');
        check = checks.check_runs
          .filter(run => run.name === checkName && run.app?.slug === cloudflareApp && run.head_sha === revision)
          .sort((a, b) => b.id - a.id)[0];
      }
      if (check?.status === 'completed') {
        if (check.conclusion !== 'success') {
          throw new Error(`Cloudflare build for ${revision} concluded ${check.conclusion ?? 'without a result'}: ${check.details_url ?? 'no details URL'}`);
        }
        buildSucceeded = true;
      } else {
        observation = check ? `Cloudflare build status: ${check.status}` : 'Cloudflare build check not reported';
      }
    }

    if (buildSucceeded) {
      const response = await request(revisionUrl, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(15_000),
      });
      const liveRevision = response.ok ? (await response.text()).trim() : '';
      if (response.ok && liveRevision === revision) {
        log(`Cloudflare build succeeded and Workers serves ${revision}.`);
        return;
      }
      observation = !response.ok
        ? `revision endpoint returned HTTP ${response.status}`
        : revisionPattern.test(liveRevision)
          ? `Workers serves ${liveRevision}, not ${revision}`
          : 'revision endpoint did not return a valid commit';
    }

    log(`Waiting for Cloudflare deployment (${attempt}/${maxAttempts}): ${observation}.`);
    if (attempt < maxAttempts) await wait(intervalMs);
  }

  throw new Error(`Timed out verifying Cloudflare deployment for ${revision}: ${observation}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await verifyWorkersDeployment({
    repository: process.env.GITHUB_REPOSITORY,
    revision: process.env.GITHUB_SHA,
    githubApiUrl: process.env.GITHUB_API_URL,
    githubToken: process.env.GITHUB_TOKEN,
    workersOrigin: process.env.FACODI_WORKERS_ORIGIN,
  });
}
