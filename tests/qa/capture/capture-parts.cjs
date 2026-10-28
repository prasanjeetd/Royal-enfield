const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function captureAllParts() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9771;
  const tempProfile = path.join(__dirname, '../../..', 'chrome-temp-parts-cap3');
  
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const targets = await new Promise(res => {
    http.get(`http://localhost:${port}/json/list`, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    });
  });

  const pageTarget = targets.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  
  if (ws.readyState !== 1) {
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
  }

  let id = 1;
  const handlers = new Map();

  ws.addEventListener('message', event => {
    const p = JSON.parse(event.data);
    if (p.id && handlers.has(p.id)) {
      const fn = handlers.get(p.id);
      handlers.delete(p.id);
      fn(p.result);
    }
  });

  const send = (m, params = {}) => new Promise(res => {
    const cur = id++;
    handlers.set(cur, res);
    ws.send(JSON.stringify({ id: cur, method: m, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/' });

  // Wait for initial load
  await new Promise(r => setTimeout(r, 3500));

  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  // 1. Scroll directly to #parts-archive
  await send('Runtime.evaluate', {
    expression: `
      const el = document.getElementById('parts-archive');
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    `
  });
  await new Promise(r => setTimeout(r, 1200));

  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/showcase_01_engine.png', Buffer.from(shot1.data, 'base64'));
  console.log('1. Engine captured');

  // 2. Click Exhaust Tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-exhaust')?.click();`
  });
  await new Promise(r => setTimeout(r, 1000));
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/showcase_02_exhaust.png', Buffer.from(shot2.data, 'base64'));
  console.log('2. Exhaust captured');

  // 3. Click Headlight Tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-headlight')?.click();`
  });
  await new Promise(r => setTimeout(r, 1000));
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/showcase_03_headlight.png', Buffer.from(shot3.data, 'base64'));
  console.log('3. Headlight captured');

  // 4. Click Tank Tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-tank')?.click();`
  });
  await new Promise(r => setTimeout(r, 1000));
  const shot4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/showcase_04_tank.png', Buffer.from(shot4.data, 'base64'));
  console.log('4. Tank captured');

  // 5. Click Seat Tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-seat')?.click();`
  });
  await new Promise(r => setTimeout(r, 1000));
  const shot5 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/showcase_05_seat.png', Buffer.from(shot5.data, 'base64'));
  console.log('5. Seat captured');

  // 6. Open Detail Modal for Seat
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-detail-seat')?.click();`
  });
  await new Promise(r => setTimeout(r, 600));
  const shot6 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/showcase_06_seat_modal.png', Buffer.from(shot6.data, 'base64'));
  console.log('6. Seat Modal captured');

  // Close modal before mobile test
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-close-parts-modal')?.click();`
  });
  await new Promise(r => setTimeout(r, 600));

  // 7. Mobile Viewport Check (390 x 844)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Runtime.evaluate', {
    expression: `
      window.scrollTo(0, 0);
      const el = document.getElementById('part-item-engine');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await new Promise(r => setTimeout(r, 1000));
  const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/showcase_07_mobile_engine.png', Buffer.from(shotMobile.data, 'base64'));
  console.log('7. Mobile view captured');

  ws.close();
  chrome.kill();
  console.log('All captures completed successfully!');
  process.exit(0);
}

captureAllParts().catch(err => {
  console.error(err);
  process.exit(1);
});
