const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9774;
  const chrome = spawn(chromePath, ['--remote-debugging-port=' + port, '--headless=new', '--no-sandbox', '--window-size=1440,1100']);
  await new Promise(r => setTimeout(r, 2000));
  const targets = await new Promise(res => http.get('http://localhost:' + port + '/json/list', r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }));
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (m, params = {}) => new Promise(res => {
    const cur = id++;
    const handler = e => {
      const p = JSON.parse(e.data);
      if (p.id === cur) { ws.removeEventListener('message', handler); res(p.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: cur, method: m, params }));
  });
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2000));
  await send('Runtime.evaluate', { expression: "document.getElementById('choose-your-ride').scrollIntoView({ behavior: 'instant', block: 'start' });" });
  await new Promise(r => setTimeout(r, 1200));
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/collection_top.png', Buffer.from(shot1.data, 'base64'));

  await send('Runtime.evaluate', { expression: 'window.scrollBy(0, 500);' });
  await new Promise(r => setTimeout(r, 800));
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/collection_bottom.png', Buffer.from(shot2.data, 'base64'));
  console.log('Saved collection_top.png and collection_bottom.png');

  chrome.kill();
  process.exit(0);
}
test();
