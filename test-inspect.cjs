const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function inspectDOM() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9876;
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900'
  ]);

  await new Promise(r => setTimeout(r, 1500));
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
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 4000));

  const info = await send('Runtime.evaluate', {
    expression: `document.querySelector('#hero [class*="backdrop-blur-md"]')?.outerHTML`,
    returnByValue: true
  });
  console.log('NAV HTML:', info.result.value);

  console.log('DOM INFO:', JSON.stringify(info.result.value, null, 2));

  // Capture screenshot directly
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/hero_verified.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshots/hero_verified.png');

  chrome.kill();
  process.exit(0);
}

inspectDOM().catch(console.error);
