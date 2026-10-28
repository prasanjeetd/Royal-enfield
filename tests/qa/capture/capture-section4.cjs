const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9885;
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
  console.log('Scrolling to Choose Your Ride section (6173px)...');
  await send('Runtime.evaluate', {
    expression: `
      const el = document.getElementById('choose-your-ride');
      const top = el ? el.getBoundingClientRect().top + window.scrollY : 6173;
      if (window.__lenis) {
        window.__lenis.scrollTo(top, { immediate: true });
      }
      window.scrollTo(0, top);
    `
  });
  await new Promise((r) => setTimeout(r, 1500));

  // 1. Classic 350
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/sec4_01_classic.png', Buffer.from(shot1.data, 'base64'));
  console.log('1. Saved sec4_01_classic.png');

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
  fs.writeFileSync('screenshots/sec4_02_hunter.png', Buffer.from(shot2.data, 'base64'));
  console.log('2. Saved sec4_02_hunter.png');

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
  fs.writeFileSync('screenshots/sec4_03_himalayan.png', Buffer.from(shot3.data, 'base64'));
  console.log('3. Saved sec4_03_himalayan.png');

  // 4. Click BOOK A TEST RIDE
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('#choose-your-ride button'));
      const book = btns.find(b => b.innerText.includes('BOOK A TEST RIDE'));
      if (book) book.click();
    `
  });
  await new Promise((r) => setTimeout(r, 800));
  const shot4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/sec4_04_modal_open.png', Buffer.from(shot4.data, 'base64'));
  console.log('4. Saved sec4_04_modal_open.png');

  // 5. Fill form and submit
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
  fs.writeFileSync('screenshots/sec4_05_modal_submitted.png', Buffer.from(shot5.data, 'base64'));
  console.log('5. Saved sec4_05_modal_submitted.png');

  // 6. Close modal & Scroll to Contact
  await send('Runtime.evaluate', {
    expression: `
      const returnBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.innerText.includes('RETURN TO SHOWROOM'));
      if (returnBtn) returnBtn.click();
      const contact = document.getElementById('contact');
      const cTop = contact ? contact.getBoundingClientRect().top + window.scrollY : 7000;
      if (window.__lenis) {
        window.__lenis.scrollTo(cTop, { immediate: true });
      }
      window.scrollTo(0, cTop);
    `
  });
  await new Promise((r) => setTimeout(r, 1500));
  const shot6 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/sec4_06_contact.png', Buffer.from(shot6.data, 'base64'));
  console.log('6. Saved sec4_06_contact.png');

  console.log('All captures done.');
  chrome.kill();
  process.exit(0);
}

run().catch(console.error);
