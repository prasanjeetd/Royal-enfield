const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function inspectLayout() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9772;
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

  // Scroll to choose-your-ride
  await send('Runtime.evaluate', {
    expression: "document.getElementById('choose-your-ride')?.scrollIntoView({ behavior: 'instant' });"
  });
  await new Promise(r => setTimeout(r, 1500));

  // Capture Collection section
  const shotCol = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/baseline_collection.png', Buffer.from(shotCol.data, 'base64'));
  console.log('Saved baseline_collection.png');

  // Click "BOOK A TEST RIDE" button
  await send('Runtime.evaluate', {
    expression: "document.getElementById('btn-book-test-ride')?.click();"
  });
  await new Promise(r => setTimeout(r, 1000));

  // Capture Modal
  const shotModal = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/baseline_modal.png', Buffer.from(shotModal.data, 'base64'));
  console.log('Saved baseline_modal.png');

  // Check metrics
  const metrics = await send('Runtime.evaluate', {
    expression: `(() => {
      const col = document.getElementById('choose-your-ride');
      const container = document.getElementById('collection-container');
      const modal = document.querySelector('[role="dialog"] > div');
      return {
        colWidth: col ? col.offsetWidth : 0,
        containerWidth: container ? container.offsetWidth : 0,
        containerPadding: container ? window.getComputedStyle(container).padding : '',
        modalWidth: modal ? modal.offsetWidth : 0,
        modalHeight: modal ? modal.offsetHeight : 0,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth
      };
    })()`,
    returnByValue: true
  });
  console.log('Metrics:', metrics.result?.value);

  chrome.kill();
  process.exit(0);
}

inspectLayout().catch(console.error);
