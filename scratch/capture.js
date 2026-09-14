const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.resolve(__dirname);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkServerReady(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}`, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServer(port = 3000) {
  const isReady = await checkServerReady(port);
  if (isReady) {
    console.log(`Server already running on port ${port}`);
    return null;
  }
  console.log(`Starting Next.js server on port ${port}...`);
  const serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'ignore',
  });

  for (let i = 0; i < 30; i++) {
    await wait(1000);
    if (await checkServerReady(port)) {
      console.log(`Server is ready on port ${port}`);
      return serverProc;
    }
  }
  throw new Error(`Server failed to start on port ${port}`);
}

async function capture() {
  const port = 3000;
  const serverProc = await ensureServer(port);

  console.log('Launching headless Chrome with remote debugging on port 9222...');
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ]);

  await wait(2000);

  // Get existing page tab from /json/list
  let pages = [];
  for (let i = 0; i < 10; i++) {
    try {
      pages = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json/list', (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      if (pages.length > 0 && pages[0].webSocketDebuggerUrl) break;
    } catch {
      await wait(500);
    }
  }

  const page = pages.find((p) => p.type === 'page') || pages[0];
  if (!page || !page.webSocketDebuggerUrl) {
    throw new Error('Could not find Chrome page tab in /json/list');
  }

  console.log('Connecting to page WebSocket:', page.webSocketDebuggerUrl);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result || msg.error || msg);
      pending.delete(msg.id);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  function send(method, params = {}) {
    const msgId = idCounter++;
    return new Promise((resolve) => {
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  // Configure Emulation
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
    screenOrientation: { type: 'portraitPrimary', angle: 0 },
  });
  await send('Emulation.setUserAgentOverride', {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });

  const targets = [
    { name: 'mobile_landing.png', url: `http://localhost:${port}/` },
    { name: 'mobile_console.png', url: `http://localhost:${port}/console` },
    { name: 'mobile_intake.png', url: `http://localhost:${port}/intake` },
    { name: 'mobile_blood.png', url: `http://localhost:${port}/blood` },
  ];

  for (const t of targets) {
    const outPath = path.join(outputDir, t.name);
    if (fs.existsSync(outPath)) {
      try {
        fs.unlinkSync(outPath);
      } catch {}
    }
    console.log(`Navigating to ${t.url}...`);
    await send('Page.navigate', { url: t.url });
    // Wait for network idle & hydration
    await wait(3500);

    console.log(`Capturing screenshot for ${t.name}...`);
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 },
      captureBeyondViewport: false,
    });

    if (result && result.data) {
      const buffer = Buffer.from(result.data, 'base64');
      fs.writeFileSync(outPath, buffer);
      console.log(`Saved ${t.name} (${buffer.length} bytes, 390x844)`);
    } else {
      console.error(`Failed to capture screenshot for ${t.name}:`, result);
    }
  }

  // Desktop captures
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
    screenOrientation: { type: 'landscapePrimary', angle: 0 },
  });
  await send('Emulation.setUserAgentOverride', {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    platform: 'Win32',
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });

  const desktopTargets = [
    { name: 'desktop_landing.png', url: `http://localhost:${port}/` },
    { name: 'desktop_console.png', url: `http://localhost:${port}/console` },
  ];

  for (const t of desktopTargets) {
    const outPath = path.join(outputDir, t.name);
    if (fs.existsSync(outPath)) {
      try {
        fs.unlinkSync(outPath);
      } catch {}
    }
    console.log(`Navigating to ${t.url} (desktop)...`);
    await send('Page.navigate', { url: t.url });
    await wait(3500);

    console.log(`Capturing screenshot for ${t.name}...`);
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1440, height: 900, scale: 1 },
      captureBeyondViewport: false,
    });

    if (result && result.data) {
      const buffer = Buffer.from(result.data, 'base64');
      fs.writeFileSync(outPath, buffer);
      console.log(`Saved ${t.name} (${buffer.length} bytes, 1440x900)`);
    }
  }

  ws.close();
  try {
    chromeProc.kill();
  } catch {}
  if (serverProc) {
    try {
      serverProc.kill();
    } catch {}
  }
  console.log('Mobile screenshot capture finished successfully.');
}

capture().catch((err) => {
  console.error('Capture script error:', err);
  process.exit(1);
});
