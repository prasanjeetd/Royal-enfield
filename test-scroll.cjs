const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9887;
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900',
    'http://localhost:5173/'
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const targets = await new Promise((res) => {
    http.get(`http://localhost:${port}/json/list`, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => res(JSON.parse(d)));
    });
  });

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 1;
  const handlers = new Map();

  ws.onmessage = (e) => {
    const p = JSON.parse(e.data);
    if (p.id && handlers.has(p.id)) {
      const fn = handlers.get(p.id);
      handlers.delete(p.id);
      fn(p.result);
    }
  };

  const send = (m, params = {}) =>
    new Promise((res) => {
      const cur = id++;
      handlers.set(cur, res);
      ws.send(JSON.stringify({ id: cur, method: m, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Waiting 3s for page init...');
  await new Promise((r) => setTimeout(r, 3000));

  // Force tick Lenis to Choose Your Ride section
  console.log('Driving Lenis scroll to #choose-your-ride...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sec = document.getElementById('choose-your-ride');
        if (sec && window.__lenis) {
          window.__lenis.scrollTo(sec, { immediate: true });
          // Force raf update
          window.__lenis.raf(performance.now());
          window.__lenis.emit();
        }
        if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 1200));

  const scrollInfo = await send('Runtime.evaluate', {
    expression: `({
      scrollY: window.scrollY,
      secTop: document.getElementById('choose-your-ride')?.getBoundingClientRect().top
    })`,
    returnByValue: true
  });
  console.log('Scroll Info after scroll:', scrollInfo.result?.value);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/test_sec4_view.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshots/test_sec4_view.png');

  chrome.kill();
  process.exit(0);
}

run().catch(console.error);
