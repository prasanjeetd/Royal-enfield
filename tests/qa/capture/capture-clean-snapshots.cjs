const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9883;
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900',
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

  console.log('Waiting 4s for page init...');
  await new Promise((r) => setTimeout(r, 4000));

  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  // Scroll to Choose Your Ride section
  console.log('Scrolling to #choose-your-ride...');
  await send('Runtime.evaluate', {
    expression: `
      if (window.__lenis) {
        window.__lenis.scrollTo('#choose-your-ride', { immediate: true });
      } else {
        const el = document.getElementById('choose-your-ride');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    `
  });
  await new Promise((r) => setTimeout(r, 1500));

  // 1. Classic 350
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/shot_01_classic.png', Buffer.from(shot1.data, 'base64'));
  console.log('1. Saved shot_01_classic.png');

  // 2. Click Hunter 350
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('#choose-your-ride button'));
      const hunter = btns.find(b => b.innerText.includes('HUNTER 350'));
      if (hunter) hunter.click();
    `
  });
  await new Promise((r) => setTimeout(r, 1200));
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/shot_02_hunter.png', Buffer.from(shot2.data, 'base64'));
  console.log('2. Saved shot_02_hunter.png');

  // 3. Click Himalayan 450
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('#choose-your-ride button'));
      const himalayan = btns.find(b => b.innerText.includes('HIMALAYAN 450'));
      if (himalayan) himalayan.click();
    `
  });
  await new Promise((r) => setTimeout(r, 1200));
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/shot_03_himalayan.png', Buffer.from(shot3.data, 'base64'));
  console.log('3. Saved shot_03_himalayan.png');

  // 4. Open Booking Modal
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('#choose-your-ride button'));
      const book = btns.find(b => b.innerText.includes('BOOK A TEST RIDE'));
      if (book) book.click();
    `
  });
  await new Promise((r) => setTimeout(r, 800));
  const shot4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/shot_04_booking_modal.png', Buffer.from(shot4.data, 'base64'));
  console.log('4. Saved shot_04_booking_modal.png');

  // 5. Fill and Submit form
  await send('Runtime.evaluate', {
    expression: `
      const modal = document.querySelector('[role="dialog"]');
      if (modal) {
        const inputs = modal.querySelectorAll('input');
        if (inputs[0]) inputs[0].value = 'Alexander Vance';
        if (inputs[0]) inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        if (inputs[1]) inputs[1].value = '+91 98765 43210';
        if (inputs[1]) inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        if (inputs[2]) inputs[2].value = 'alexander.vance@motorcycle.com';
        if (inputs[2]) inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
        const submit = modal.querySelector('button[type="submit"]');
        if (submit) submit.click();
      }
    `
  });
  await new Promise((r) => setTimeout(r, 1200));
  const shot5 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/shot_05_modal_confirmed.png', Buffer.from(shot5.data, 'base64'));
  console.log('5. Saved shot_05_modal_confirmed.png');

  // 6. Close Modal & View Contact Section
  await send('Runtime.evaluate', {
    expression: `
      const returnBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.innerText.includes('RETURN TO SHOWROOM'));
      if (returnBtn) returnBtn.click();
      if (window.__lenis) {
        window.__lenis.scrollTo('#contact', { immediate: true });
      } else {
        const contact = document.getElementById('contact');
        if (contact) contact.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    `
  });
  await new Promise((r) => setTimeout(r, 1200));
  const shot6 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/shot_06_contact.png', Buffer.from(shot6.data, 'base64'));
  console.log('6. Saved shot_06_contact.png');

  console.log('Finished capturing all snapshots.');
  chrome.kill();
  process.exit(0);
}

run().catch(console.error);
