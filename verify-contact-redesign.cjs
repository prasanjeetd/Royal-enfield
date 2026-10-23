const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9892;
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900',
    'http://localhost:5173/'
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const targets = await new Promise((res) => {
    http.get(`http://localhost:${port}/json/list`, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => res(JSON.parse(d)));
    });
  });

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 1;
  const handlers = new Map();

  ws.onmessage = (e) => {
    const p = JSON.parse(e.data);
    if (p.id && handlers.has(p.id)) {
      const fn = handlers.get(p.id);
      handlers.delete(p.id);
      fn(p.result);
    }
  };

  const send = (m, params = {}) =>
    new Promise((res) => {
      const cur = id++;
      handlers.set(cur, res);
      ws.send(JSON.stringify({ id: cur, method: m, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');

  await new Promise((r) => setTimeout(r, 3000));
  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  const scrollToElem = async (selector) => {
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector('${selector}');
          if (el) {
            const rect = el.getBoundingClientRect();
            const absTop = rect.top + window.pageYOffset;
            if (window.__lenis) {
              window.__lenis.scrollTo(absTop, { immediate: true });
              window.__lenis.raf(performance.now());
            }
            window.scrollTo(0, absTop);
          }
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1200));
  };

  // 1. Desktop 1440px
  console.log('--- 1. Desktop 1440px Contact ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });
  await scrollToElem('#contact');
  const shot1440 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/contact_redesign_1440px.png', Buffer.from(shot1440.data, 'base64'));
  console.log('Saved: screenshots/contact_redesign_1440px.png');

  // 2. Desktop 1920px
  console.log('--- 2. Desktop 1920px Contact ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
  await scrollToElem('#contact');
  const shot1920 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/contact_redesign_1920px.png', Buffer.from(shot1920.data, 'base64'));
  console.log('Saved: screenshots/contact_redesign_1920px.png');

  // 3. Mobile 375px
  console.log('--- 3. Mobile 375px Contact ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await scrollToElem('#contact');
  const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/contact_redesign_mobile.png', Buffer.from(shotMobile.data, 'base64'));
  console.log('Saved: screenshots/contact_redesign_mobile.png');

  chrome.kill();
  console.log('Verification finished successfully!');
  process.exit(0);
}

run().catch(console.error);
