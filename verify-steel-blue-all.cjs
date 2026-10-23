const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9888;
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,960',
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

  console.log('1. Waiting 4s for page init & 3D assets...');
  await new Promise((r) => setTimeout(r, 4500));

  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  const scrollToElem = async (selector) => {
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector('${selector}');
          if (el) {
            const rect = el.getBoundingClientRect();
            const absTop = rect.top + window.pageYOffset;
            if (window.__lenis) {
              window.__lenis.scrollTo(absTop, { immediate: true });
              window.__lenis.raf(performance.now());
            }
            window.scrollTo(0, absTop);
          }
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1400));
  };

  const takeShot = async (filename) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshots/${filename}`, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: screenshots/${filename}`);
  };

  // 1. SECTION 1: HERO (Steel Blue atmosphere + typography)
  console.log('--- 1. Hero Section ---');
  await scrollToElem('#hero');
  await takeShot('steel_blue_01_hero.png');

  // 2. SECTION 2: 3D BIKE EXPERIENCE
  console.log('--- 2. 3D Bike Experience Section ---');
  await scrollToElem('#bike-3d');
  await new Promise((r) => setTimeout(r, 1500));
  await takeShot('steel_blue_02_3d_experience.png');

  // Select a hotspot in 3D section
  await send('Runtime.evaluate', {
    expression: `
      const btn = document.querySelector('#hotspot-btn-engine');
      if (btn) btn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 1000));
  await takeShot('steel_blue_02b_3d_hotspot_active.png');

  // 3. SECTION 3: PARTS ARCHIVE
  console.log('--- 3. Parts Archive Section ---');
  await scrollToElem('#parts-archive');
  await takeShot('steel_blue_03_parts_archive.png');

  // Open Technical Specs Modal
  console.log('--- 3b. Parts Archive Modal ---');
  await send('Runtime.evaluate', {
    expression: `
      const btn = document.querySelector('#btn-detail-engine');
      if (btn) btn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 800));
  await takeShot('steel_blue_03b_parts_modal.png');

  // Close modal
  await send('Runtime.evaluate', {
    expression: `
      const btn = document.querySelector('#btn-close-parts-modal');
      if (btn) btn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 500));

  // 4. SECTION 4: BIKE COLLECTION / BOOKING
  console.log('--- 4. Choose Your Ride Section ---');
  await scrollToElem('#choose-your-ride');
  await takeShot('steel_blue_04_collection_classic350.png');

  // Switch to Shotgun 650
  await send('Runtime.evaluate', {
    expression: `
      const btn = Array.from(document.querySelectorAll('#choose-your-ride button')).find(b => b.innerText.includes('SHOTGUN 650'));
      if (btn) btn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 1200));
  await takeShot('steel_blue_04b_collection_shotgun650.png');

  // Open booking modal
  console.log('--- 4b. Booking Modal ---');
  await send('Runtime.evaluate', {
    expression: `
      const bookBtn = Array.from(document.querySelectorAll('#choose-your-ride button')).find(b => b.innerText.includes('BOOK A TEST RIDE'));
      if (bookBtn) bookBtn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 800));
  await takeShot('steel_blue_04c_booking_modal.png');

  // Close modal
  await send('Runtime.evaluate', {
    expression: `
      const closeBtn = document.querySelector('[role="dialog"] button[aria-label="Close booking modal"]');
      if (closeBtn) closeBtn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 600));

  // 5. SECTION 5: CONTACT & DEALERS
  console.log('--- 5. Contact Section ---');
  await scrollToElem('#contact');
  await takeShot('steel_blue_05_contact_section.png');

  // 6. MOBILE RESPONSIVE TEST
  console.log('--- 6. Mobile View (375x812) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await scrollToElem('#hero');
  await new Promise((r) => setTimeout(r, 800));
  await takeShot('steel_blue_mobile_01_hero.png');

  await scrollToElem('#choose-your-ride');
  await new Promise((r) => setTimeout(r, 800));
  await takeShot('steel_blue_mobile_02_collection.png');

  console.log('All Steel Blue gradient screenshots captured successfully!');
  chrome.kill();
  process.exit(0);
}

run().catch(console.error);
