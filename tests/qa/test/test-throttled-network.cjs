const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9866;
  const tempProfile = path.join(os.tmpdir(), `re-throttle-${Date.now()}`);

  console.log('--- TESTING LOADER UNDER NETWORK THROTTLING ---');

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900',
  ]);

  await new Promise((r) => setTimeout(r, 1800));
  const targets = await new Promise((res) => {
    http.get(`http://localhost:${port}/json/list`, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => res(JSON.parse(d)));
    });
  });

  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
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
  await send('Network.enable');

  // Clear browser cache so all assets are fresh
  await send('Network.clearBrowserCache');

  // Emulate Good 3G / Slow 4G
  await send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 120,
    downloadThroughput: (1.2 * 1024 * 1024) / 8, // 1.2 Mbps
    uploadThroughput: (500 * 1024) / 8,
    connectionType: 'cellular3g'
  });

  console.log('Navigating under throttled network conditions...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });

  const takeShot = async (filename) => {
    if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshots/${filename}`, Buffer.from(shot.data, 'base64'));
    console.log(`[PASS] Captured screenshot: screenshots/${filename}`);
  };

  // Poll progress every 200ms
  const recordedSteps = [];
  let capturedMidwayShot = false;

  for (let tick = 1; tick <= 35; tick++) {
    await new Promise((r) => setTimeout(r, 200));
    const status = await send('Runtime.evaluate', {
      expression: `(() => {
        const loader = document.getElementById('royal-enfield-cinematic-loader');
        const hero = document.getElementById('hero');
        if (!loader) return { active: false, hero: !!hero };
        const text = loader.querySelector('span.tabular-nums');
        const bar = loader.querySelector('div[style*="width:"]');
        return {
          active: true,
          percent: text ? text.innerText : '',
          barWidth: bar ? bar.style.width : '',
          opacity: window.getComputedStyle(loader).opacity,
          hero: !!hero
        };
      })()`,
      returnByValue: true
    });

    if (status.result.value.active) {
      const pct = parseInt(status.result.value.percent || '0', 10);
      recordedSteps.push(status.result.value.percent);
      console.log(`Tick ${tick}: Loader at ${status.result.value.percent} (bar: ${status.result.value.barWidth})`);

      if (pct >= 20 && !capturedMidwayShot) {
        capturedMidwayShot = true;
        await takeShot('throttled-progress-midway.png');
      }
    } else {
      console.log(`Tick ${tick}: Loader unmounted! Hero active.`);
      await takeShot('throttled-hero-complete.png');
      break;
    }
  }

  console.log('Progress step values recorded:', recordedSteps);
  chrome.kill();
  process.exit(0);
}

main().catch(console.error);
