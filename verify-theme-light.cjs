const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ARTIFACT_DIR = 'C:\\Users\\FAHAD VOHRA\\.gemini\\antigravity-ide\\brain\\ddbf9290-8015-4212-ae50-25795e19ea59';

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9750 + Math.floor(Math.random() * 100);
  const tempProfile = path.join(os.tmpdir(), 'chrome-theme-' + Date.now());
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1600,1050',
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 3000));

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

  const outDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  async function saveScreenshot(destFilename) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(outDir, destFilename), buf);
    fs.writeFileSync(path.join(ARTIFACT_DIR, destFilename), buf);
    console.log(`Saved ${destFilename}`);
  }

  // Helper to scroll using Lenis
  async function scrollToSection(selector) {
    await send('Runtime.evaluate', {
      expression: `
        const target = document.querySelector('${selector}');
        if (target) {
          if (window.__lenis) {
            window.__lenis.scrollTo(target, { immediate: true, offset: 0 });
          } else {
            target.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        }
      `
    });
    await new Promise(r => setTimeout(r, 2000));
  }

  // 1. Hero
  console.log('1. Checking Hero Section...');
  await scrollToSection('#hero');
  await saveScreenshot('verify_01_hero.png');

  // 2. 3D Experience Section
  console.log('2. Checking 3D Experience Section...');
  await scrollToSection('#bike-3d');
  await new Promise(r => setTimeout(r, 2500));
  await saveScreenshot('verify_02_3d_experience.png');

  // Test hotspot click (e.g. PEASHOOTER SILENCER)
  console.log('Clicking 3D Hotspot...');
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('PEASHOOTER SILENCER'));
      if (btn) btn.click();
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot('verify_02b_3d_hotspot.png');

  // 3. Parts Archive Section
  console.log('3. Checking Parts Archive Section...');
  await scrollToSection('#parts-archive');
  await new Promise(r => setTimeout(r, 2000));
  await saveScreenshot('verify_03_parts_archive.png');

  // Open a part modal
  console.log('Opening Part Detail Modal...');
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const viewBtn = btns.find(b => b.textContent && b.textContent.includes('VIEW DETAIL'));
      if (viewBtn) viewBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot('verify_03b_parts_modal.png');

  // Close part modal
  await send('Runtime.evaluate', {
    expression: `
      const closeBtn = document.querySelector('button[aria-label="Close specifications modal"]') || document.querySelector('#btn-close-parts-modal') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('CLOSE SPECIFICATION'));
      if (closeBtn) closeBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  // 4. Collection Section
  console.log('4. Checking Collection Section...');
  await scrollToSection('#choose-your-ride');
  await new Promise(r => setTimeout(r, 2000));
  await saveScreenshot('verify_04_collection.png');

  // Switch bike tab in collection
  console.log('Switching to HUNTER 350 tab...');
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const hunterBtn = btns.find(b => b.textContent && b.textContent.includes('HUNTER 350'));
      if (hunterBtn) hunterBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot('verify_04b_collection_hunter.png');

  // 5. Contact Section
  console.log('5. Checking Contact Section...');
  await scrollToSection('#contact');
  await new Promise(r => setTimeout(r, 2000));
  await saveScreenshot('verify_05_contact.png');

  // 6. Test Booking Modal
  console.log('6. Opening Booking Modal...');
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const bookBtn = btns.find(b => b.textContent && b.textContent.includes('BOOK TEST RIDE'));
      if (bookBtn) bookBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot('verify_06_booking_modal.png');

  ws.close();
  chrome.kill();
  console.log('All verification screenshots captured successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
