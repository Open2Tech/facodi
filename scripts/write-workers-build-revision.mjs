import { writeFile } from 'node:fs/promises';

if (process.env.WORKERS_CI === '1') {
  const revision = process.env.WORKERS_CI_COMMIT_SHA;
  if (!revision || !/^[0-9a-f]{40}$/.test(revision)) {
    throw new Error('Workers Builds must provide a valid WORKERS_CI_COMMIT_SHA.');
  }
  await writeFile('dist/build-revision.txt', `${revision}\n`, 'utf8');
  console.log(`Recorded Workers build revision ${revision}.`);
} else {
  console.log('No Workers build revision is written outside Workers Builds.');
}
