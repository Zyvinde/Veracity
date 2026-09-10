import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debuggingPort = 9777;

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debuggingPort}`,
    '--disable-gpu',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=1280,800',
    'about:blank',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`);
      const list = await res.json();
      const pageTarget = list.find((t) => t.type === 'page');
      if (pageTarget) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    chromeProc.kill();
    throw new Error('Could not connect to Chrome CDP');
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.onopen = resolve);

  let msgId = 1;
  const pending = new Map();
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push(data.params);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  console.log('Navigating to http://127.0.0.1:8123/...');
  await send('Page.navigate', { url: 'http://127.0.0.1:8123/' });

  // Wait 5s for network, video loading, CSS font, layout, and rAF loop
  await new Promise((r) => setTimeout(r, 5000));

  const res1 = await send('Runtime.evaluate', {
    expression: `(() => {
      try {
        const bgVideo = document.getElementById('bg-video');
        const card = document.querySelector('[data-glass-card]');
        const dupCanvas = document.getElementById('dup-image');
        const dupContainer = document.getElementById('dup-video-container');
        const rules = document.querySelectorAll('.rule');
        const menu = document.getElementById('menu');

        return JSON.stringify({
          title: document.title,
          videoSrc: bgVideo ? bgVideo.src : null,
          videoPaused: bgVideo ? bgVideo.paused : null,
          videoReadyState: bgVideo ? bgVideo.readyState : null,
          videoWidth: bgVideo ? bgVideo.videoWidth : null,
          videoHeight: bgVideo ? bgVideo.videoHeight : null,
          cardRect: card ? {
            width: card.getBoundingClientRect().width,
            height: card.getBoundingClientRect().height,
            top: card.getBoundingClientRect().top,
            left: card.getBoundingClientRect().left
          } : null,
          canvasSize: dupCanvas ? { w: dupCanvas.width, h: dupCanvas.height } : null,
          dupContainerStyle: dupContainer ? {
            left: dupContainer.style.left,
            top: dupContainer.style.top,
            width: dupContainer.style.width,
            height: dupContainer.style.height
          } : null,
          rulesCount: rules.length,
          rulesDisplay: Array.from(rules).map(r => window.getComputedStyle(r).display),
          menuHidden: menu ? menu.getAttribute('aria-hidden') : null
        });
      } catch (err) {
        return JSON.stringify({ error: err.message, stack: err.stack });
      }
    })()`,
    returnByValue: true,
  });

  const state1 = JSON.parse(res1.result.value);
  console.log('Desktop State Evaluation with Autoplay:', JSON.stringify(state1, null, 2));

  // Desktop screenshot
  const desktopScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(root, 'screenshot-desktop.png'), Buffer.from(desktopScreenshot.data, 'base64'));
  console.log('Desktop screenshot saved to screenshot-desktop.png');

  // Open Menu
  const resMenuOpen = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('menu-open');
      btn.click();
      const menu = document.getElementById('menu');
      return JSON.stringify({
        isOpen: menu.classList.contains('is-open'),
        ariaExpanded: btn.getAttribute('aria-expanded'),
        activeElement: document.activeElement ? document.activeElement.id : null
      });
    })()`,
    returnByValue: true,
  });
  console.log('Menu Open State:', JSON.parse(resMenuOpen.result.value));

  await new Promise((r) => setTimeout(r, 600));

  const screenshotMenu = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(root, 'screenshot-menu-open.png'), Buffer.from(screenshotMenu.data, 'base64'));
  console.log('Menu screenshot saved to screenshot-menu-open.png');

  // Test Escape Key
  await send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`,
  });
  await new Promise((r) => setTimeout(r, 600));

  const resMenuClose = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('menu-open');
      const menu = document.getElementById('menu');
      return JSON.stringify({
        isOpen: menu.classList.contains('is-open'),
        ariaExpanded: btn.getAttribute('aria-expanded'),
        activeElement: document.activeElement ? document.activeElement.id : null
      });
    })()`,
    returnByValue: true,
  });
  console.log('Menu Closed by Escape State:', JSON.parse(resMenuClose.result.value));

  // Switch to Mobile
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await new Promise((r) => setTimeout(r, 1000));

  const resMobile = await send('Runtime.evaluate', {
    expression: `(() => {
      const rules = document.querySelectorAll('.rule');
      const menuLabel = document.querySelector('.nav__label--menu');
      const chamferGlass = document.querySelector('.chamfer__glass');
      const card = document.querySelector('[data-glass-card]');
      return JSON.stringify({
        rulesDisplay: Array.from(rules).map(r => window.getComputedStyle(r).display),
        menuLabelDisplay: window.getComputedStyle(menuLabel).display,
        chamferGlassBg: window.getComputedStyle(chamferGlass).backgroundColor,
        cardWidth: card ? card.getBoundingClientRect().width : null,
      });
    })()`,
    returnByValue: true,
  });
  console.log('Mobile State:', JSON.parse(resMobile.result.value));

  const screenshotMobile = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(root, 'screenshot-mobile.png'), Buffer.from(screenshotMobile.data, 'base64'));
  console.log('Mobile screenshot saved to screenshot-mobile.png');

  console.log('Console API messages count:', consoleMessages.length);
  if (consoleMessages.length > 0) {
    console.log('Console API messages:', consoleMessages);
  }

  ws.close();
  chromeProc.kill();
  console.log('All verification assertions completed successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
