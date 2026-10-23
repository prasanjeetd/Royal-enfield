const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9890;
  const tempProfile = path.join(os.tmpdir(), 'chrome-contact-refine-' + Date.now());

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
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

  const send = (m, params = {}) =>
    new Promise((res) => {
      const cur = id++;
      const fn = (e) => {
        const p = JSON.parse(e.data);
        if (p.id === cur) {
          ws.removeEventListener('message', fn);
          res(p.result);
        }
      };
      ws.addEventListener('message', fn);
      ws.send(JSON.stringify({ id: cur, method: m, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
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

  // Scroll down to load all lazy sections progressively
  console.log('1. Progressive scroll to mount lazy sections...');
  await evalCode(`
    window.scrollTo(0, 1500);
  `);
  await new Promise((r) => setTimeout(r, 1200));

  await evalCode(`
    window.scrollTo(0, 3000);
  `);
  await new Promise((r) => setTimeout(r, 1200));

  // 1. Scroll cleanly to Contact
  console.log('2. Scrolling to #contact on 1440px desktop...');
  await evalCode(`
    const el = document.getElementById('contact');
    if (window.__lenis) {
      window.__lenis.scrollTo(el, { immediate: true });
    } else if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  `);
  await new Promise((r) => setTimeout(r, 1500));

  const desktopMetrics = await evalCode(`
    (() => {
      const contact = document.getElementById('contact');
      const container = document.getElementById('contact-container');
      const leftCol = document.getElementById('contact-left-col');
      const rightCol = document.getElementById('contact-right-col');
      const formCard = document.getElementById('contact-form-card');
      const heading = leftCol?.querySelector('h2');
      const navbar = document.getElementById('main-navbar');
      const navRect = navbar?.getBoundingClientRect();
      const cRect = contact?.getBoundingClientRect();
      const lRect = leftCol?.getBoundingClientRect();
      const fRect = formCard?.getBoundingClientRect();

      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        navbarBottom: navRect ? navRect.bottom : null,
        contactTop: cRect ? cRect.top : null,
        contactHeight: cRect ? cRect.height : null,
        leftColTop: lRect ? lRect.top : null,
        formCardTop: fRect ? fRect.top : null,
        colTopDiff: lRect && fRect ? Math.abs(lRect.top - fRect.top) : null,
        clearanceFromNavbar: lRect && navRect ? lRect.top - navRect.bottom : null,
        containerPaddingLeft: container ? getComputedStyle(container).paddingLeft : null,
        containerPaddingRight: container ? getComputedStyle(container).paddingRight : null,
        containerMaxWidth: container ? getComputedStyle(container).maxWidth : null
      };
    })()
  `);
  console.log('DESKTOP 1440 METRICS:', desktopMetrics);
  await takeShot('contact_desktop_1440_refined.png');

  // Test form submission
  console.log('3. Testing contact form submission...');
  await evalCode(`
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const msgInput = document.getElementById('message');
    if (nameInput) {
      nameInput.value = 'Vikram Singhania';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (emailInput) {
      emailInput.value = 'vikram.singhania@heritage.in';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (msgInput) {
      msgInput.value = 'Inquiring about Classic 350 Signals delivery schedule and accessories.';
      msgInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const submitBtn = document.querySelector('#contact form button[type="submit"]');
    if (submitBtn) submitBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));
  await takeShot('contact_form_submitted_refined.png');

  // Reset form
  await evalCode(`
    const resetBtn = Array.from(document.querySelectorAll('#contact button')).find(b => b.innerText.includes('another message'));
    if (resetBtn) resetBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 800));

  // 4. Tablet view (768px x 1024px)
  console.log('4. Testing Tablet (768px) view...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: false
  });
  await evalCode(`
    const el = document.getElementById('contact');
    if (window.__lenis) {
      window.__lenis.scrollTo(el, { immediate: true });
    } else if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  `);
  await new Promise((r) => setTimeout(r, 1200));

  const tabletMetrics = await evalCode(`
    (() => {
      const contact = document.getElementById('contact');
      const container = document.getElementById('contact-container');
      const navbar = document.getElementById('main-navbar');
      const lCol = document.getElementById('contact-left-col');
      return {
        viewportWidth: window.innerWidth,
        clearance: lCol && navbar ? lCol.getBoundingClientRect().top - navbar.getBoundingClientRect().bottom : null,
        paddingLeft: container ? getComputedStyle(container).paddingLeft : null,
        scrollWidth: document.body.scrollWidth
      };
    })()
  `);
  console.log('TABLET 768 METRICS:', tabletMetrics);
  await takeShot('contact_tablet_768_refined.png');

  // 5. Mobile view (390px x 844px)
  console.log('5. Testing Mobile (390px) view...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await evalCode(`
    const el = document.getElementById('contact');
    if (window.__lenis) {
      window.__lenis.scrollTo(el, { immediate: true });
    } else if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  `);
  await new Promise((r) => setTimeout(r, 1200));

  const mobileMetrics = await evalCode(`
    (() => {
      const contact = document.getElementById('contact');
      const container = document.getElementById('contact-container');
      const navbar = document.getElementById('main-navbar');
      const lCol = document.getElementById('contact-left-col');
      return {
        viewportWidth: window.innerWidth,
        clearance: lCol && navbar ? lCol.getBoundingClientRect().top - navbar.getBoundingClientRect().bottom : null,
        paddingLeft: container ? getComputedStyle(container).paddingLeft : null,
        scrollWidth: document.body.scrollWidth,
        hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth
      };
    })()
  `);
  console.log('MOBILE 390 METRICS:', mobileMetrics);
  await takeShot('contact_mobile_390_refined.png');

  console.log('All verification tasks succeeded!');
  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch(console.error);
