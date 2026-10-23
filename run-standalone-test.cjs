const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testStandalone() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9890;
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    'http://localhost:5173/test-3d.html'
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

  // Wait 5 seconds for model loading and rendering
  await new Promise(r => setTimeout(r, 5000));

  const modelData = await send('Runtime.evaluate', {
    expression: `window.__MODEL_DATA`,
    returnByValue: true
  });

  console.log('Model Data Result:', JSON.stringify(modelData, null, 2));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
  fs.writeFileSync('screenshots/standalone_3d_test.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshot to screenshots/standalone_3d_test.png');

  ws.close();
  chrome.kill();
  process.exit(0);
}

testStandalone().catch(console.error);
