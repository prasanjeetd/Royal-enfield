const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function testPartsShowcase() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9898;
  const tempProfile = path.join(__dirname, '../../..', 'chrome-temp-parts-test2');
  
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--disable-gpu',
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
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const handlers = new Map();
  const consoleLogs = [];
  const errors = [];

  ws.onmessage = e => {
    const p = JSON.parse(e.data);
    if (p.method === 'Runtime.consoleAPICalled') {
      consoleLogs.push({
        type: p.params.type,
        text: p.params.args.map(a => a.value !== undefined ? a.value : (a.description || JSON.stringify(a))).join(' ')
      });
    }
    if (p.method === 'Runtime.exceptionThrown') {
      errors.push(p.params.exceptionDetails);
    }
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

  await new Promise(r => setTimeout(r, 4500));

  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  // 1. Scroll directly to #parts-archive section
  await send('Runtime.evaluate', {
    expression: `
      const el = document.getElementById('parts-archive');
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 50;
        window.scrollTo({ top, behavior: 'instant' });
      }
    `
  });

  await new Promise(r => setTimeout(r, 1500));

  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/parts_01_engine.png', Buffer.from(shot1.data, 'base64'));
  console.log('1. Saved parts_01_engine.png');

  // 2. Click on EXHAUST tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-exhaust')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/parts_02_exhaust.png', Buffer.from(shot2.data, 'base64'));
  console.log('2. Saved parts_02_exhaust.png');

  // 3. Click on HEADLIGHT tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-headlight')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/parts_03_headlight.png', Buffer.from(shot3.data, 'base64'));
  console.log('3. Saved parts_03_headlight.png');

  // 4. Click on TANK tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-tank')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  const shot4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/parts_04_tank.png', Buffer.from(shot4.data, 'base64'));
  console.log('4. Saved parts_04_tank.png');

  // 5. Click on SEAT tab
  await send('Runtime.evaluate', {
    expression: `document.getElementById('nav-part-btn-seat')?.click();`
  });
  await new Promise(r => setTimeout(r, 1200));
  const shot5 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/parts_05_seat.png', Buffer.from(shot5.data, 'base64'));
  console.log('5. Saved parts_05_seat.png');

  // 6. Click VIEW DETAIL of SEAT
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-detail-seat')?.click();`
  });
  await new Promise(r => setTimeout(r, 800));
  const shot6 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/parts_06_detail_modal.png', Buffer.from(shot6.data, 'base64'));
  console.log('6. Saved parts_06_detail_modal.png');

  console.log('Browser Logs:', consoleLogs);
  console.log('Browser Errors:', errors);

  ws.close();
  chrome.kill();
  process.exit(0);
}

testPartsShowcase().catch(console.error);
