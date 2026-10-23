const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9883;
  const tempProfile = path.join(os.tmpdir(), 'chrome-dom-cap-' + Date.now());
  
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
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

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (m, params = {}) => new Promise(res => {
    const cur = id++;
    const fn = e => {
      const p = JSON.parse(e.data);
      if (p.id === cur) {
        ws.removeEventListener('message', fn);
        res(p.result);
      }
    };
    ws.addEventListener('message', fn);
    ws.send(JSON.stringify({ id: cur, method: m, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Waiting 6s...');
  await new Promise(r => setTimeout(r, 6000));

  // Scroll to contact
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('contact');
      if (window.__lenis) {
        window.__lenis.scrollTo(el, { immediate: true });
      } else if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/wide_contact_1440_verified.png', Buffer.from(shot1.data, 'base64'));
  console.log('Saved screenshots/wide_contact_1440_verified.png (bytes: ' + shot1.data.length + ')');

  // 1920px view
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 500));
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('contact');
      if (window.__lenis) {
        window.__lenis.scrollTo(el, { immediate: true });
      } else if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/wide_contact_1920_verified.png', Buffer.from(shot2.data, 'base64'));
  console.log('Saved screenshots/wide_contact_1920_verified.png (bytes: ' + shot2.data.length + ')');

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch(console.error);
