const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function testSubmit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9912;
  const tempProfile = path.join(os.tmpdir(), 'chrome-modal-test-' + Date.now());
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1600,1050',
    'http://localhost:5173#collection'
  ]);

  await new Promise(r => setTimeout(r, 3000));
  const targets = await new Promise(res => {
    http.get(`http://localhost:${port}/json/list`, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    });
  });

  const page = targets.find(t => t.type === 'page') || targets[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
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

  // Open modal
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-book-test-ride')?.click()`
  });
  await new Promise(r => setTimeout(r, 1200));

  // Fill in form inputs
  await send('Runtime.evaluate', {
    expression: `(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const nameInput = inputs.find(i => i.placeholder && i.placeholder.includes('Alexander'));
      if (nameInput) {
        nameInput.value = 'Marcus Vance';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const phoneInput = inputs.find(i => i.type === 'tel' || (i.placeholder && i.placeholder.includes('+91')));
      if (phoneInput) {
        phoneInput.value = '+91 98765 43210';
        phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const emailInput = inputs.find(i => i.type === 'email');
      if (emailInput) {
        emailInput.value = 'marcus.vance@example.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(shot.data, 'base64');
  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
  fs.writeFileSync('screenshots/section6b_booking_confirmation.png', buf);
  console.log('Saved screenshots/section6b_booking_confirmation.png');

  ws.close();
  chrome.kill();
  process.exit(0);
}
testSubmit().catch(console.error);
