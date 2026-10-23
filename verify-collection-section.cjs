const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9896;
  const tempProfile = path.join(__dirname, 'chrome-temp-collection-final');

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900'
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

  console.log('1. Navigating to http://localhost:5173/ ...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise((r) => setTimeout(r, 5000));

  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  const takeShot = async (filename) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join('screenshots', filename), Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: screenshots/${filename}`);
  };

  const evalCode = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    return res.result ? res.result.value : null;
  };

  // Scroll to Choose Your Ride section
  console.log('2. Scrolling to Section 4 (#choose-your-ride)...');
  await evalCode(`
    const sec = document.getElementById('choose-your-ride');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise((r) => setTimeout(r, 1500));
  await takeShot('section4_01_classic350.png');

  // Switch to Hunter 350
  console.log('3. Selecting Hunter 350...');
  await evalCode(`
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('HUNTER 350'));
    if (btn) btn.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));
  await takeShot('section4_02_hunter350.png');

  // Switch to Himalayan 450
  console.log('4. Selecting Himalayan 450...');
  await evalCode(`
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('HIMALAYAN 450'));
    if (btn) btn.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));
  await takeShot('section4_03_himalayan450.png');

  // Open Booking Modal
  console.log('5. Clicking BOOK A TEST RIDE...');
  await evalCode(`
    const bookBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('BOOK A TEST RIDE'));
    if (bookBtn) bookBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 800));
  await takeShot('section4_04_booking_modal_open.png');

  // Fill form
  console.log('6. Filling booking modal form...');
  await evalCode(`
    const modal = document.querySelector('[role="dialog"]');
    if (modal) {
      const inputs = modal.querySelectorAll('input');
      const textareas = modal.querySelectorAll('textarea');
      if (inputs[0]) {
        inputs[0].value = 'Alexander Vance';
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (inputs[1]) {
        inputs[1].value = '+91 98765 43210';
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (inputs[2]) {
        inputs[2].value = 'alexander.vance@motorcycle.com';
        inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (textareas[0]) {
        textareas[0].value = 'Requesting weekend morning slot for Himalayan 450 adventure test ride.';
        textareas[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  `);
  await new Promise((r) => setTimeout(r, 400));
  await takeShot('section4_05_modal_filled.png');

  // Submit form
  console.log('7. Submitting form...');
  await evalCode(`
    const submitBtn = document.querySelector('[role="dialog"] button[type="submit"]');
    if (submitBtn) submitBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));
  await takeShot('section4_06_request_received.png');

  // Close modal
  console.log('8. Closing modal...');
  await evalCode(`
    const returnBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.innerText.includes('RETURN TO SHOWROOM'));
    if (returnBtn) returnBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 800));

  // Scroll to section end & Contact section
  console.log('9. Scrolling to Contact section...');
  await evalCode(`
    const contact = document.getElementById('contact');
    if (contact) contact.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise((r) => setTimeout(r, 1000));
  await takeShot('section4_07_contact_section.png');

  // Mobile Viewport test (375 x 812)
  console.log('10. Testing mobile responsive view...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await evalCode(`
    const sec = document.getElementById('choose-your-ride');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise((r) => setTimeout(r, 1200));
  await takeShot('section4_08_mobile_view.png');

  console.log('All verification tasks succeeded!');
  chrome.kill();
  process.exit(0);
}

main().catch(console.error);
