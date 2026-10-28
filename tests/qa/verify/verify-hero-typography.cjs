const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9891;
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

  await new Promise((r) => setTimeout(r, 3500));
  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  // 1. 1440px Desktop View
  console.log('--- Capturing 1440px Hero View ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });
  await new Promise((r) => setTimeout(r, 1000));
  const shot1440 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/hero_final_brush_1440px.png', Buffer.from(shot1440.data, 'base64'));
  console.log('Saved: screenshots/hero_final_brush_1440px.png');

  // 2. 1920px Full HD View
  console.log('--- Capturing 1920px Hero View ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise((r) => setTimeout(r, 1000));
  const shot1920 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/hero_final_brush_1920px.png', Buffer.from(shot1920.data, 'base64'));
  console.log('Saved: screenshots/hero_final_brush_1920px.png');

  // 3. Mobile View 375px
  console.log('--- Capturing Mobile 375px Hero View ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 1000));
  const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/hero_final_brush_mobile.png', Buffer.from(shotMobile.data, 'base64'));
  console.log('Saved: screenshots/hero_final_brush_mobile.png');

  chrome.kill();
  console.log('All verification screenshots captured!');
  process.exit(0);
}

run().catch(console.error);
