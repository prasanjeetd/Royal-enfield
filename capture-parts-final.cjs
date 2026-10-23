const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function captureFinal() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9888;
  const tempProfile = path.join(__dirname, 'chrome-temp-parts-final-shots');
  
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900',
    'about:blank'
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
  
  console.log('Navigating to http://localhost:5173/...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 4500));

  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  const takeShot = async (filename) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshots/${filename}`, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshots/${filename}`);
  };

  // 1. Scroll to Parts Archive
  await send('Runtime.evaluate', {
    expression: `
      const el = document.getElementById('parts-archive');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  await takeShot('f_01_engine.png');

  // 2. Click Exhaust Tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-exhaust')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  await takeShot('f_02_exhaust.png');

  // 3. Click Headlight Tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-headlight')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  await takeShot('f_03_headlight.png');

  // 4. Click Tank Tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-tank')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  await takeShot('f_04_tank.png');

  // 5. Click Seat Tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-seat')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  await takeShot('f_05_seat.png');

  // 6. Open Detail Modal
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-detail-seat')?.click();`
  });
  await new Promise(r => setTimeout(r, 800));
  await takeShot('f_06_seat_modal.png');

  // Close modal
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-close-parts-modal')?.click();`
  });
  await new Promise(r => setTimeout(r, 600));

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
  await new Promise(r => setTimeout(r, 1200));
  await takeShot('f_07_mobile_engine.png');

  ws.close();
  chrome.kill();
  console.log('ALL SHOTS SUCCESSFULLY SAVED!');
  process.exit(0);
}

captureFinal().catch(console.error);
