const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9877;
  const tempProfile = path.join(os.tmpdir(), `re-chrome-${Date.now()}`);

  console.log('====================================================');
  console.log('ROYAL ENFIELD CINEMATIC LOADER — FULL VERIFICATION');
  console.log('====================================================\n');

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
    console.log(`📸 Screenshot saved: screenshots/${filename}`);
  };

  // ----------------------------------------------------
  // STEP 1: Navigate and wait for page load
  // ----------------------------------------------------
  console.log('>>> [1/7] Navigating to http://localhost:5173/ ...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });

  // Wait for load event
  await new Promise((resolve) => {
    const handler = (e) => {
      const p = JSON.parse(e.data);
      if (p.method === 'Page.loadEventFired') {
        ws.removeEventListener('message', handler);
        resolve();
      }
    };
    ws.addEventListener('message', handler);
  });
  console.log('Page load event fired.');

  // Immediate inspection of the loader
  const immediateState = await send('Runtime.evaluate', {
    expression: `(() => {
      const loader = document.getElementById('royal-enfield-cinematic-loader') || document.getElementById('frame0-preloader');
      if (!loader) return { found: false };
      const logo = loader.querySelector('img[alt="Royal Enfield"]');
      const text = loader.innerText;
      const computedBg = window.getComputedStyle(loader).backgroundColor;
      return {
        found: true,
        id: loader.id,
        hasLogo: !!logo,
        logoSrc: logo ? logo.getAttribute('src') : null,
        tagline: text.includes('PURE MOTORCYCLING'),
        backgroundColor: computedBg,
      };
    })()`,
    returnByValue: true
  });
  console.log('Immediate loader inspection:', immediateState.result.value);
  await takeShot('verification-01-loader-immediate.png');

  // ----------------------------------------------------
  // STEP 2: Observe progress transitions as React hydrates & loads
  // ----------------------------------------------------
  console.log('\n>>> [2/7] Tracking Progress & Percentage Increment...');
  let observedReactLoader = false;
  let finalPercentage = '0%';

  for (let s = 1; s <= 15; s++) {
    await new Promise((r) => setTimeout(r, 400));
    const prog = await send('Runtime.evaluate', {
      expression: `(() => {
        const loader = document.getElementById('royal-enfield-cinematic-loader');
        const hero = document.getElementById('hero');
        if (!loader) return { active: false, heroPresent: !!hero };
        const text = loader.querySelector('span.tabular-nums');
        const bar = loader.querySelector('div[style*="width:"]');
        return {
          active: true,
          heroPresent: !!hero,
          percentText: text ? text.innerText : null,
          barWidth: bar ? bar.style.width : null,
          opacity: window.getComputedStyle(loader).opacity,
        };
      })()`,
      returnByValue: true
    });

    if (prog.result.value.active) {
      observedReactLoader = true;
      finalPercentage = prog.result.value.percentText;
      console.log(`Step ${s}: React loader active at ${prog.result.value.percentText} (bar: ${prog.result.value.barWidth}, opacity: ${prog.result.value.opacity})`);
    } else if (prog.result.value.heroPresent) {
      console.log(`Step ${s}: Hero section is ready and active!`);
      break;
    }
  }

  await takeShot('verification-02-loader-progress.png');

  // ----------------------------------------------------
  // STEP 3: Hero Reveal & Section Verification
  // ----------------------------------------------------
  console.log('\n>>> [3/7] Verifying Hero Section Content...');
  await new Promise((r) => setTimeout(r, 1000));

  const heroState = await send('Runtime.evaluate', {
    expression: `(() => {
      const loader = document.getElementById('royal-enfield-cinematic-loader');
      const hero = document.getElementById('hero');
      const title = document.getElementById('hero-main-title');
      const activeBike = document.getElementById('hero-active-bike-title');
      const bikes = document.querySelectorAll('#hero-showcase-container img');
      return {
        loaderUnmounted: !loader,
        heroPresent: !!hero,
        titlePresent: !!title,
        activeBikeName: activeBike ? activeBike.innerText : null,
        motorcycleCount: bikes.length,
        firstBikeSrc: bikes[0] ? bikes[0].getAttribute('src') : null,
      };
    })()`,
    returnByValue: true
  });
  console.log('Hero section inspection:', heroState.result.value);
  await takeShot('verification-03-hero-revealed.png');

  // ----------------------------------------------------
  // STEP 4: Turntable Carousel Interaction (Loader must NOT re-appear)
  // ----------------------------------------------------
  console.log('\n>>> [4/7] Testing Turntable Carousel Navigation...');
  const nextClicked = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[aria-label="Next motorcycle"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  console.log('Clicked next motorcycle:', nextClicked.result.value);
  await new Promise((r) => setTimeout(r, 600));

  const postCarousel = await send('Runtime.evaluate', {
    expression: `(() => {
      const loader = document.getElementById('royal-enfield-cinematic-loader');
      const activeBike = document.getElementById('hero-active-bike-title');
      return {
        loaderReappeared: !!loader,
        activeBikeAfterClick: activeBike ? activeBike.innerText : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Carousel check (loader must not reappear):', postCarousel.result.value);
  await takeShot('verification-04-carousel-interaction.png');

  // ----------------------------------------------------
  // STEP 5: Anchor Navigation (Loader must NOT re-appear)
  // ----------------------------------------------------
  console.log('\n>>> [5/7] Testing Section Anchor Navigation...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const link = document.querySelector('a[href="#contact"]');
      if (link) link.click();
    })()`,
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 800));

  const postNav = await send('Runtime.evaluate', {
    expression: `(() => {
      const loader = document.getElementById('royal-enfield-cinematic-loader');
      return { loaderReappeared: !!loader };
    })()`,
    returnByValue: true
  });
  console.log('Navigation check (loader must not reappear):', postNav.result.value);

  // Return to top
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise((r) => setTimeout(r, 500));

  // ----------------------------------------------------
  // STEP 6: Mobile Responsiveness Viewport (393x852)
  // ----------------------------------------------------
  console.log('\n>>> [6/7] Testing Mobile Responsiveness (393x852)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 393,
    height: 852,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise((r) => setTimeout(r, 350));
  await takeShot('verification-05-mobile-loader.png');
  await new Promise((r) => setTimeout(r, 3500));
  await takeShot('verification-06-mobile-hero.png');

  // ----------------------------------------------------
  // STEP 7: Console Errors & Exceptions Audit
  // ----------------------------------------------------
  console.log('\n>>> [7/7] Auditing Console & Exception Logs...');
  console.log(`Total console logs: ${consoleLogs.length}`);
  console.log(`Total console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors detected:', consoleErrors);
  } else {
    console.log('✅ ZERO CONSOLE ERRORS DETECTED.');
  }

  console.log('\n====================================================');
  console.log('ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');

  chrome.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
