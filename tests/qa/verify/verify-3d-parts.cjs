const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testSections() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9887;
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900'
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
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to bike-3d
  await send('Runtime.evaluate', {
    expression: "document.getElementById('bike-3d')?.scrollIntoView({ behavior: 'instant' });"
  });
  console.log('Scrolled to 3D section. Waiting 3.5s for 3D render...');
  await new Promise(r => setTimeout(r, 3500));

  const shot3D = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/opt_bike_3d.png', Buffer.from(shot3D.data, 'base64'));
  console.log('Saved screenshots/opt_bike_3d.png');

  // Scroll to parts-archive
  await send('Runtime.evaluate', {
    expression: "document.getElementById('parts-archive')?.scrollIntoView({ behavior: 'instant' });"
  });
  console.log('Scrolled to parts archive. Waiting 1.5s...');
  await new Promise(r => setTimeout(r, 1500));

  const shotParts = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/opt_parts_archive.png', Buffer.from(shotParts.data, 'base64'));
  console.log('Saved screenshots/opt_parts_archive.png');

  // Scroll to collection / choose your ride
  await send('Runtime.evaluate', {
    expression: "document.getElementById('choose-your-ride')?.scrollIntoView({ behavior: 'instant' });"
  });
  console.log('Scrolled to collection. Waiting 1.5s...');
  await new Promise(r => setTimeout(r, 1500));

  const shotCollection = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/opt_collection.png', Buffer.from(shotCollection.data, 'base64'));
  console.log('Saved screenshots/opt_collection.png');

  chrome.kill();
  process.exit(0);
}

testSections().catch(console.error);
