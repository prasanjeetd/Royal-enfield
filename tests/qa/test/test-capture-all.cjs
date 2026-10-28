const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function captureAllViews() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9872;
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
  console.log('Navigated. Waiting 3.5s for initial render...');
  await new Promise(r => setTimeout(r, 3500));

  // 1. Desktop Slide A
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/hero_desktop_slide1.png', Buffer.from(shot1.data, 'base64'));
  console.log('Saved: screenshots/hero_desktop_slide1.png');

  // 2. Desktop Slide B (wait 2s for auto-rotation)
  await new Promise(r => setTimeout(r, 2000));
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/hero_desktop_slide2.png', Buffer.from(shot2.data, 'base64'));
  console.log('Saved: screenshots/hero_desktop_slide2.png');

  // 3. Desktop Slide C (wait 2s for auto-rotation)
  await new Promise(r => setTimeout(r, 2000));
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/hero_desktop_slide3.png', Buffer.from(shot3.data, 'base64'));
  console.log('Saved: screenshots/hero_desktop_slide3.png');

  // 4. Tablet View (768x1024)
  console.log('Resizing to Tablet (768x1024)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 1200));
  const shotTablet = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/hero_tablet_view.png', Buffer.from(shotTablet.data, 'base64'));
  console.log('Saved: screenshots/hero_tablet_view.png');

  // 5. Mobile View (375x812)
  console.log('Resizing to Mobile (375x812)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1200));
  const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/hero_mobile_view.png', Buffer.from(shotMobile.data, 'base64'));
  console.log('Saved: screenshots/hero_mobile_view.png');

  chrome.kill();
  console.log('All verification captures completed!');
  process.exit(0);
}

captureAllViews().catch(console.error);
