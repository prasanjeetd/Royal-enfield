const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9444;
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1600,1000',
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  const targets = await new Promise((resolve) => {
    http.get(`http://localhost:${port}/json/list`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });

  const wsUrl = targets[0].webSocketDebuggerUrl;
  const WebSocket = require('ws');
  const ws = new WebSocket(wsUrl);

  await new Promise(r => ws.on('open', r));
  let msgId = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      const handler = (data) => {
        const parsed = JSON.parse(data);
        if (parsed.id === id) {
          ws.off('message', handler);
          resolve(parsed.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDefaultBackgroundColorOverride', {
    color: { r: 5, g: 5, b: 5, a: 1 }
  });

  // 1. Capture Hero Section
  console.log('Capturing Hero Section...');
  await new Promise(r => setTimeout(r, 2000));
  const shotHero = await send('Page.captureScreenshot', { format: 'png' });
  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
  fs.writeFileSync('screenshots/section1_hero.png', Buffer.from(shotHero.data, 'base64'));
  console.log('Saved screenshots/section1_hero.png');

  // 2. Scroll to Cinematic Video / Hotspots Section
  console.log('Scrolling to Engine Hotspots Section...');
  await send('Runtime.evaluate', {
    expression: `
      const el = document.getElementById('engine');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  const shotEngine = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/section2_engine_hotspots.png', Buffer.from(shotEngine.data, 'base64'));
  console.log('Saved screenshots/section2_engine_hotspots.png');

  // 3. Scroll to 3D Bike Section
  console.log('Scrolling to 3D Bike Section...');
  await send('Runtime.evaluate', {
    expression: `
      const el = document.getElementById('bike-3d');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    `
  });
  // Wait for 3D model to load
  await new Promise(r => setTimeout(r, 4000));
  const shot3D = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/section3_bike_3d.png', Buffer.from(shot3D.data, 'base64'));
  console.log('Saved screenshots/section3_bike_3d.png');

  // 4. Click a 3D hotspot tab (e.g. EXHAUST)
  console.log('Clicking EXHAUST tab in 3D Section...');
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const exhaustBtn = btns.find(b => b.textContent && b.textContent.includes('TUNED PEASHOOTER SILENCER'));
      if (exhaustBtn) exhaustBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  const shot3DExhaust = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/section3_bike_3d_exhaust.png', Buffer.from(shot3DExhaust.data, 'base64'));
  console.log('Saved screenshots/section3_bike_3d_exhaust.png');

  ws.close();
  chrome.kill();
  console.log('Verification completed successfully!');
  process.exit(0);
}

run().catch(console.error);
