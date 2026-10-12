import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const [base, output] = process.argv.slice(2);
assert(base && output, 'Usage: node verify-http.mjs base-url report-path');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const html = await fs.readFile('outputs/sakura-season.html');
const paths = [
  ['/', html, 'text/html'],
  ['/sakura-season.html', html, 'text/html'],
  ['/little-bloom.html', html, 'text/html'],
  ['/?source=homescreen', html, 'text/html'],
  ...await Promise.all(['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'].map(async file =>
    ['/' + file, await fs.readFile('outputs/' + file), file.endsWith('.png') ? 'image/png' : 'application/manifest+json']))
];
const checks = await Promise.all(paths.map(async ([pathname, expected, mime]) => {
  const url = new URL(pathname, base).href;
  try {
    const response = await fetch(url, {signal: AbortSignal.timeout(30000), headers: {'Cache-Control': 'no-cache'}});
    const bytes = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type');
    return {url, status: response.status, contentType, bytes: bytes.length, sha256: hash(bytes),
      exactMatch: hash(bytes) === hash(expected), mimeMatch: contentType?.split(';')[0] === mime, anonymousRequest: true};
  } catch (error) {
    return {url, error: error.message, exactMatch: false};
  }
}));
const report = {checkedAt: new Date().toISOString(), url: base, checks,
  passed: checks.every(check => check.status === 200 && check.exactMatch && check.mimeMatch),
  browserRenderingVerified: false, physicalPhoneVerified: false};
await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
assert(report.passed, 'HTTP content or MIME verification failed');
