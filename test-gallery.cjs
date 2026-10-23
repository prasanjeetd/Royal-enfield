const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testGallery() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9884;
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
  await send('Emulation.setDefaultBackgroundColorOverride', {
    color: { r: 5, g: 5, b: 5, a: 1 }
  });

  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 4000));

  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  // 1. Scroll to Parts Archive section
  await send('Runtime.evaluate', {
    expression: `
      const el = document.getElementById('parts-archive');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  // Capture Engine
  const s1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/part_engine.png', Buffer.from(s1.data, 'base64'));
  console.log('Saved screenshots/part_engine.png');

  // Click Exhaust Tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-exhaust')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  const s2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/part_exhaust.png', Buffer.from(s2.data, 'base64'));
  console.log('Saved screenshots/part_exhaust.png');

  // Click Headlight Tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-headlight')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  const s3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/part_headlight.png', Buffer.from(s3.data, 'base64'));
  console.log('Saved screenshots/part_headlight.png');

  // Click Tank Tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-tank')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  const s4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/part_tank.png', Buffer.from(s4.data, 'base64'));
  console.log('Saved screenshots/part_tank.png');

  // Click Seat Tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-seat')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  const s5 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/part_seat.png', Buffer.from(s5.data, 'base64'));
  console.log('Saved screenshots/part_seat.png');

  // Open Detail Modal
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-detail-seat')?.click();`
  });
  await new Promise(r => setTimeout(r, 800));
  const s6 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/part_seat_modal.png', Buffer.from(s6.data, 'base64'));
  console.log('Saved screenshots/part_seat_modal.png');

  ws.close();
  chrome.kill();
  console.log('Gallery test completed successfully!');
  process.exit(0);
}

testGallery().catch(console.error);
