const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9882;
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
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

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const handlers = new Map();

  ws.onmessage = e => {
    const p = JSON.parse(e.data);
    if (p.id && handlers.has(p.id)) {
      const fn = handlers.get(p.id);
      handlers.delete(p.id);
      fn(p.result);
    }
  };

  const send = (m, params = {}) => new Promise(res => {
    const cur = id++;
    handlers.set(cur, res);
    ws.send(JSON.stringify({ id: cur, method: m, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Waiting 3.5s for page init...');
  await new Promise(r => setTimeout(r, 3500));

  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  // Scroll to #parts-archive
  await send('Runtime.evaluate', {
    expression: `
      const el = document.getElementById('parts-archive');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    `
  });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Engine
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/final_01_engine.png', Buffer.from(shot1.data, 'base64'));
  console.log('1. Saved final_01_engine.png');

  // 2. Exhaust
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-exhaust')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/final_02_exhaust.png', Buffer.from(shot2.data, 'base64'));
  console.log('2. Saved final_02_exhaust.png');

  // 3. Headlight
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-headlight')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/final_03_headlight.png', Buffer.from(shot3.data, 'base64'));
  console.log('3. Saved final_03_headlight.png');

  // 4. Tank
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-tank')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  const shot4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/final_04_tank.png', Buffer.from(shot4.data, 'base64'));
  console.log('4. Saved final_04_tank.png');

  // 5. Seat
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-seat')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  const shot5 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/final_05_seat.png', Buffer.from(shot5.data, 'base64'));
  console.log('5. Saved final_05_seat.png');

  // 6. Seat Detail Modal
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-detail-seat')?.click();`
  });
  await new Promise(r => setTimeout(r, 800));
  const shot6 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/final_06_seat_modal.png', Buffer.from(shot6.data, 'base64'));
  console.log('6. Saved final_06_seat_modal.png');

  // Close modal
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-close-parts-modal')?.click();`
  });
  await new Promise(r => setTimeout(r, 500));

  // 7. Mobile View
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
  const shot7 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/final_07_mobile_engine.png', Buffer.from(shot7.data, 'base64'));
  console.log('7. Saved final_07_mobile_engine.png');

  ws.close();
  chrome.kill();
  console.log('Verification COMPLETE!');
  process.exit(0);
}

run().catch(console.error);
