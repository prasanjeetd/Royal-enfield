const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9600 + Math.floor(Math.random() * 300);
  const tempProfile = path.join(os.tmpdir(), 'chrome-cnt-' + Date.now());
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1920,1080',
    'http://localhost:5174'
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

  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  const captureViewport = async (width, height, filename) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768
    });
    await new Promise(r => setTimeout(r, 600));

    // Give lazy components time to load and scroll to bottom
    await send('Runtime.evaluate', {
      expression: `
        new Promise((resolve) => {
          window.scrollTo(0, 999999);
          setTimeout(() => {
            const el = document.getElementById('contact');
            if (el) {
              if (window.__lenis) {
                window.__lenis.scrollTo(el, { immediate: true });
              } else {
                el.scrollIntoView({ behavior: 'instant', block: 'start' });
              }
            }
            setTimeout(resolve, 2000);
          }, 2500);
        })
      `,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 1000));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('screenshots/' + filename, Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshots/' + filename);
  };

  await captureViewport(1536, 730, 'current_contact_1536x730.png');

  ws.close();
  chrome.kill();
  console.log('Done!');
  process.exit(0);
}

run().catch(console.error);
