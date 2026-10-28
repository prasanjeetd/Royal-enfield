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

  console.log('1. Waiting 4s for page init...');
  await new Promise((r) => setTimeout(r, 4000));

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
    await new Promise((r) => setTimeout(r, 1200));
  };

  const takeShot = async (filename) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshots/${filename}`, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: screenshots/${filename}`);
  };

  // 1. Classic 350 Section 4 View
  console.log('2. Scrolling to Section 4...');
  await scrollToElem('#choose-your-ride');
  await takeShot('final_sec4_01_classic350.png');

  // 2. Click Hunter 350
  console.log('3. Selecting Hunter 350...');
  await send('Runtime.evaluate', {
    expression: `
      const btn = Array.from(document.querySelectorAll('#choose-your-ride button')).find(b => b.innerText.includes('HUNTER 350'));
      if (btn) btn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 1200));
  await takeShot('final_sec4_02_hunter350.png');

  // 3. Click Himalayan 450
  console.log('4. Selecting Himalayan 450...');
  await send('Runtime.evaluate', {
    expression: `
      const btn = Array.from(document.querySelectorAll('#choose-your-ride button')).find(b => b.innerText.includes('HIMALAYAN 450'));
      if (btn) btn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 1200));
  await takeShot('final_sec4_03_himalayan450.png');

  // 4. Click BOOK A TEST RIDE button
  console.log('5. Opening booking modal...');
  await send('Runtime.evaluate', {
    expression: `
      const bookBtn = Array.from(document.querySelectorAll('#choose-your-ride button')).find(b => b.innerText.includes('BOOK A TEST RIDE'));
      if (bookBtn) bookBtn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 800));
  await takeShot('final_sec4_04_modal_open.png');

  // 5. Fill form in modal
  console.log('6. Filling booking form...');
  await send('Runtime.evaluate', {
    expression: `
      const modal = document.querySelector('[role="dialog"]');
      if (modal) {
        const inputs = modal.querySelectorAll('input');
        const setVal = (input, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        };
        if (inputs[0]) setVal(inputs[0], 'Alexander Vance');
        if (inputs[1]) setVal(inputs[1], '+91 98765 43210');
        if (inputs[2]) setVal(inputs[2], 'alexander.vance@motorcycle.com');
        const submit = modal.querySelector('button[type="submit"]');
        if (submit) submit.click();
      }
    `
  });
  await new Promise((r) => setTimeout(r, 1400));
  await takeShot('final_sec4_05_modal_submitted.png');

  // 6. Close modal & View Contact Section
  console.log('7. Closing modal and scrolling to Contact section...');
  await send('Runtime.evaluate', {
    expression: `
      const closeBtn = document.querySelector('[role="dialog"] button[aria-label="Close booking modal"]') ||
                       Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.innerText.includes('RETURN TO SHOWROOM'));
      if (closeBtn) closeBtn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 800));
  await scrollToElem('#contact');
  await takeShot('final_sec4_06_contact_section.png');

  // 7. Mobile Viewport (375x812)
  console.log('8. Testing mobile view...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await scrollToElem('#choose-your-ride');
  await new Promise((r) => setTimeout(r, 1000));
  await takeShot('final_sec4_07_mobile_view.png');

  console.log('All final verifications complete!');
  chrome.kill();
  process.exit(0);
}

run().catch(console.error);
