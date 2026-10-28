const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9700 + Math.floor(Math.random() * 200);
  const tempProfile = path.join(os.tmpdir(), 'chrome-cnt-' + Date.now());
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1600,1050',
    'http://localhost:5173#contact'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  const targets = await new Promise((resolve) => {
    http.get(`http://localhost:${port}/json/list`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise(r => ws.onopen = r);
  let msgId = 1;
  const handlers = new Map();
  ws.onmessage = (e) => {
    const p = JSON.parse(e.data);
    if (p.id && handlers.has(p.id)) {
      const fn = handlers.get(p.id);
      handlers.delete(p.id);
      fn(p.result || p.error);
    }
  };

  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      handlers.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  await send('Runtime.evaluate', {
    expression: 'const el = document.getElementById("contact"); if (el) el.scrollIntoView({ behavior: "instant", block: "start" });'
  });

  await new Promise(r => setTimeout(r, 1500));

  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
  fs.writeFileSync('screenshots/contact_final_verified.png', Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshots/contact_final_verified.png');

  ws.close();
  chrome.kill();
}
run();
