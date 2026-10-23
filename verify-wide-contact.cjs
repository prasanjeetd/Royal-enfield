const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9884;
  const tempProfile = path.join(os.tmpdir(), 'chrome-wide-fix-' + Date.now());
  
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900',
    'about:blank'
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

  console.log('Navigating to http://localhost:5173/...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  
  console.log('Waiting 6s for React & GSAP...');
  await new Promise(r => setTimeout(r, 6000));

  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  const takeShot = async (filename) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshots/${filename}`, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshots/${filename} (size: ${shot.data.length})`);
  };

  // 1. Scroll to #contact on 1440px
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
  await takeShot('wide_contact_desktop_1440.png');

  // 2. 1920px view
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
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
  await takeShot('wide_contact_desktop_1920.png');

  ws.close();
  chrome.kill();
  console.log('Done!');
  process.exit(0);
}

main().catch(console.error);
