// Parity screenshot loop: CDP-driven captures with real waits + console-error dump.
// Usage: node scripts/parity-shots.mjs <url> <outPath> [waitMs] [width] [height]
// Example: node scripts/parity-shots.mjs http://localhost:3000 /tmp/shot.png 8000 1440 1100
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

const [url, outPath, waitMsArg, wArg, hArg] = process.argv.slice(2);
if (!url || !outPath) {
  console.error('Usage: node scripts/parity-shots.mjs <url> <outPath> [waitMs] [width] [height]');
  process.exit(1);
}
const waitMs = Number(waitMsArg || 8000);
const width = Number(wArg || 1440);
const height = Number(hArg || 1100);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debuggingPort = 9781;

const chromeProc = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${debuggingPort}`,
  '--disable-gpu',
  '--no-sandbox',
  '--autoplay-policy=no-user-gesture-required',
  `--window-size=${width},${height}`,
  'about:blank',
], { stdio: 'ignore' });

let wsUrl = null;
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 200));
  try {
    const res = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`);
    const list = await res.json();
    const pageTarget = list.find((t) => t.type === 'page');
    if (pageTarget) { wsUrl = pageTarget.webSocketDebuggerUrl; break; }
  } catch (e) {}
}
if (!wsUrl) { chromeProc.kill(); throw new Error('CDP connect failed'); }

const ws = new WebSocket(wsUrl);
await new Promise((resolve) => (ws.onopen = resolve));

let msgId = 1;
const pending = new Map();
const errors = [];
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(new Error(JSON.stringify(data.error)));
    else resolve(data.result);
  }
  if (data.method === 'Runtime.exceptionThrown') errors.push(data.params?.exceptionDetails?.text || 'exception');
  if (data.method === 'Log.entryAdded' && data.params?.entry?.level === 'error') errors.push(data.params.entry.text);
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

await send('Runtime.enable');
await send('Page.enable');
await send('Log.enable');
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, waitMs));

const customExpr = process.argv[7];
const metrics = await send('Runtime.evaluate', {
  expression: customExpr || `(() => ({ title: document.title, textLen: (document.body?.innerText || '').length, canvases: document.querySelectorAll('canvas').length, videos: document.querySelectorAll('video').length }))()`,
  returnByValue: true,
});
console.log('PAGE:', JSON.stringify(metrics.result.value));
console.log('JS-ERRORS:', errors.length ? errors.slice(0, 10) : 'none');

const shot = await send('Page.captureScreenshot', { format: 'png' });
await writeFile(outPath, Buffer.from(shot.data, 'base64'));
console.log('SAVED:', outPath);
ws.close();
chromeProc.kill();
