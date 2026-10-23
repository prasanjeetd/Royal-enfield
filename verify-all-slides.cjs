const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function verifyAllSlides() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9873;
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

  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
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
  console.log('Navigated. Waiting for initial render...');
  await new Promise(r => setTimeout(r, 3500));

  const bikeButtons = [
    'CLASSIC 350',
    'HUNTER 350',
    'METEOR 350',
    'HIMALAYAN 450',
    'BULLET 350'
  ];

  for (let i = 0; i < bikeButtons.length; i++) {
    const name = bikeButtons[i];
    console.log(`Clicking bike: ${name}...`);
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('#hero button')).find(b => b.textContent.includes('${name}'));
        if (btn) btn.click();
      })()`
    });
    // Wait 1.3s for rotation & GSAP title transition to complete
    await new Promise(r => setTimeout(r, 1300));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const filename = `slide_${i + 1}_${name.replace(/\\s+/g, '_').toLowerCase()}.png`;
    fs.writeFileSync(path.join('screenshots', filename), Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: screenshots/${filename}`);
  }

  // Tablet View (768x1024)
  console.log('Verifying Tablet 768px View...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 1000));
  const shotTablet = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/hero_typography_tablet.png', Buffer.from(shotTablet.data, 'base64'));
  console.log('Saved screenshots/hero_typography_tablet.png');

  // Mobile View (375x812)
  console.log('Verifying Mobile 375px View...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1000));
  const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/hero_typography_mobile.png', Buffer.from(shotMobile.data, 'base64'));
  console.log('Saved screenshots/hero_typography_mobile.png');

  chrome.kill();
  console.log('Verification across all slides and devices completed successfully!');
  process.exit(0);
}

verifyAllSlides().catch(console.error);
