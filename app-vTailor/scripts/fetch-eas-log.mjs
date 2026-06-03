import { execSync } from 'node:child_process';
import fs from 'node:fs';
import zlib from 'node:zlib';

const buildId = process.argv[2] || 'f6152035-7c76-4bcf-aaf2-b34084b90336';
const json = execSync(`npx eas-cli build:view ${buildId} --json`, {
  encoding: 'utf8',
  stdio: ['pipe', 'pipe', 'ignore'],
});
const { logFiles } = JSON.parse(json);
const url = logFiles[0];
const buf = execSync(`curl.exe -sL -H "Accept-Encoding: identity" "${url}"`, {
  maxBuffer: 100 * 1024 * 1024,
});

let text;
try {
  text = zlib.gunzipSync(buf).toString('utf8');
} catch {
  text = buf.toString('utf8');
}

fs.writeFileSync('eas-log.txt', text);

const failureIdx = text.indexOf('FAILURE:');
const taskFail = [...text.matchAll(/> Task [^\n]*FAILED/g)].pop();
const errLines = text.split('\n').filter((l) =>
  /FAILURE:|What went wrong|BUILD FAILED|Execution failed|error:|AAPT|Exception|Gradle build failed/i.test(l),
);

console.log('--- matched errors ---');
console.log(errLines.slice(-30).join('\n') || '(none)');

if (failureIdx >= 0) {
  console.log('\n--- failure context ---');
  console.log(text.slice(failureIdx, failureIdx + 2500));
} else if (taskFail) {
  console.log('\n--- last failed task ---');
  console.log(taskFail[0]);
  const idx = taskFail.index ?? text.lastIndexOf(taskFail[0]);
  console.log(text.slice(Math.max(0, idx - 500), idx + 2000));
} else {
  console.log('\n--- log tail ---');
  console.log(text.slice(-2500));
}
