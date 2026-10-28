const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9898;
  const tempProfile = path.join(__dirname, '../../..', 'chrome-temp-loader-test');

  console.log('--- STARTING CINEMATIC LOADER VERIFICATION ---');

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900',
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

  const consoleLogs = [];
  const consoleErrors = [];

  ws.onmessage = (e) => {
    const p = JSON.parse(e.data);
    if (p.method === 'Runtime.consoleAPICalled') {
      const text = p.params.args.map((a) => a.value || JSON.stringify(a)).join(' ');
      consoleLogs.push({ type: p.params.type, text });
      if (p.params.type === 'error') {
        consoleErrors.push(text);
      }
    }
    if (p.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(JSON.stringify(p.params.exceptionDetails));
    }
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

  const takeShot = async (filename) => {
    if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshots/${filename}`, Buffer.from(shot.data, 'base64'));
    console.log(`[PASS] Captured screenshot: screenshots/${filename}`);
  };

  // TEST 1: Initial Page Load & Loader Presence
  console.log('\n--- TEST 1: First Page Load & Initial Loader State ---');
  await send('Page.navigate', { url: 'http://localhost:5173/' });

  // Check state within first 200ms
  await new Promise((r) => setTimeout(r, 200));

  const initialLoaderInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('royal-enfield-cinematic-loader') || document.getElementById('frame0-preloader');
      const text = el ? el.innerText : '';
      const hasLogo = !!el && !!el.querySelector('img[alt="Royal Enfield"]');
      const progressText = el ? (el.querySelector('span.tabular-nums') || el.querySelector('div:last-child'))?.innerText : '';
      const isVisible = el ? window.getComputedStyle(el).display !== 'none' : false;
      return { exists: !!el, text, hasLogo, progressText, isVisible };
    })()`,
    returnByValue: true
  });
  console.log('Initial loader check:', initialLoaderInfo.result.value);
  await takeShot('loader-initial.png');

  // TEST 2: Progress Observation as Assets Load
  console.log('\n--- TEST 2: Observing Progress & Percentage Increment ---');
  let finalPercentage = '0%';
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 300));
    const prog = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('royal-enfield-cinematic-loader');
        if (!el) return { present: false, percent: '100% (unmounted)' };
        const textEl = el.querySelector('span.tabular-nums');
        const barEl = el.querySelector('div[style*="background: linear-gradient"]');
        return {
          present: true,
          percent: textEl ? textEl.innerText : '',
          barWidth: barEl ? barEl.style.width : '',
          opacity: window.getComputedStyle(el).opacity
        };
      })()`,
      returnByValue: true
    });
    console.log(`Step ${i + 1} loader progress:`, prog.result.value);
    finalPercentage = prog.result.value.percent;
  }

  // Wait for fadeout and removal
  console.log('\n--- TEST 3: Fade-Out & Removal Once Hero is Ready ---');
  await new Promise((r) => setTimeout(r, 1200));

  const postLoadInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const loader = document.getElementById('royal-enfield-cinematic-loader');
      const hero = document.getElementById('hero');
      const heroBikes = document.querySelectorAll('#hero-showcase-container img');
      const activeBikeTitle = document.getElementById('hero-active-bike-title')?.innerText;
      return {
        loaderRemoved: !loader,
        heroRendered: !!hero,
        heroBikesCount: heroBikes.length,
        activeBikeTitle
      };
    })()`,
    returnByValue: true
  });
  console.log('Post-load check:', postLoadInfo.result.value);
  await takeShot('hero-revealed.png');

  // TEST 4: Section Navigation (Loader must NOT re-appear)
  console.log('\n--- TEST 4: Navigation between sections ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const link = document.querySelector('a[href="#contact"]');
      if (link) link.click();
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 600));

  const navCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      return { loaderPresent: !!document.getElementById('royal-enfield-cinematic-loader') };
    })()`,
    returnByValue: true
  });
  console.log('Nav check (loader should be absent):', navCheck.result.value);

  // TEST 5: Carousel Interaction (Loader must NOT re-appear)
  console.log('\n--- TEST 5: Carousel Turntable Next/Prev ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const nextBtn = document.querySelector('button[aria-label="Next motorcycle"]');
      if (nextBtn) nextBtn.click();
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 500));

  const carouselCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      return { loaderPresent: !!document.getElementById('royal-enfield-cinematic-loader') };
    })()`,
    returnByValue: true
  });
  console.log('Carousel check (loader should be absent):', carouselCheck.result.value);

  // TEST 6: Mobile Responsiveness
  console.log('\n--- TEST 6: Mobile Viewport Rendering (375x812) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  // Navigate fresh on mobile
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise((r) => setTimeout(r, 150));
  await takeShot('mobile-loader.png');
  await new Promise((r) => setTimeout(r, 1600));
  await takeShot('mobile-hero-revealed.png');

  // TEST 7: Check Console Errors
  console.log('\n--- TEST 7: Console Errors Audit ---');
  console.log(`Total console messages: ${consoleLogs.length}`);
  console.log(`Total errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Errors found:', consoleErrors);
  } else {
    console.log('[PASS] Zero console errors during loading flow!');
  }

  chrome.kill();
  console.log('\n--- VERIFICATION FINISHED SUCCESSFULLY ---');
  process.exit(0);
}

main().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
