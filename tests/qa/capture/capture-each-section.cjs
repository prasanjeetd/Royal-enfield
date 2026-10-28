const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9870 + Math.floor(Math.random() * 50);
  const tempProfile = path.join(os.tmpdir(), 'chrome-capture-' + Date.now());
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1600,1050',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

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

  const outDir = path.join(__dirname, '../../..', 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  async function saveScreenshot(destFilename) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(outDir, destFilename), buf);
    console.log(`Saved ${destFilename}`);
  }

  console.log('Loading page...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  // Wait for initial render + models
  await new Promise(r => setTimeout(r, 4500));

  // 1. Hero
  console.log('1. Capturing Hero Section...');
  await saveScreenshot('section1_hero.png');

  // 2. 3D Experience Section
  console.log('2. Scrolling to 3D Experience Section...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('bike-3d');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));
  await saveScreenshot('section2_bike_3d.png');

  // 3. Parts Archive Section
  console.log('3. Scrolling to Parts Archive Section...');
  const partsEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('parts-archive');
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        return 'Found and scrolled';
      }
      return 'Element not found!';
    })()`
  });
  console.log('Parts Archive eval result:', partsEval);
  await new Promise(r => setTimeout(r, 2000));
  await saveScreenshot('section3_parts_archive.png');

  // Test Parts Archive Detail Modal
  console.log('Opening Parts Modal...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-detail-engine') || document.querySelector('button[id^="btn-detail-"]');
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));
  await saveScreenshot('section3b_parts_modal.png');

  // Close Parts Modal
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-close-parts-modal') || document.querySelector('button[aria-label*="lose"]');
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  // 4. Collection Section (Choose Your Ride)
  console.log('4. Scrolling to Collection Section...');
  const collEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('choose-your-ride') || document.getElementById('collection');
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        return 'Found and scrolled to collection';
      }
      return 'Collection element not found!';
    })()`
  });
  console.log('Collection eval result:', collEval);
  await new Promise(r => setTimeout(r, 2000));
  await saveScreenshot('section4_collection.png');

  // Switch bike tab in Collection
  console.log('Switching to Hunter 350 tab...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('collection-tab-2') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('HUNTER 350'));
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));
  await saveScreenshot('section4b_collection_hunter.png');

  // Open Booking Modal while in Collection section
  console.log('Opening Booking Modal...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-book-test-ride') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('TEST RIDE'));
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot('section6_booking_modal.png');

  // Close Booking Modal
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[aria-label="Close modal"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('RETURN'));
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  // 5. Contact Section
  console.log('5. Scrolling to Contact Section...');
  const contactEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('contact');
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        return 'Found and scrolled to contact';
      }
      return 'Contact element not found!';
    })()`
  });
  console.log('Contact eval result:', contactEval);
  await new Promise(r => setTimeout(r, 2000));
  await saveScreenshot('section5_contact.png');

  ws.close();
  chrome.kill();
  console.log('All sections captured successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
