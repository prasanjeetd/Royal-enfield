const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];

async function runResponsiveVerification() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9775;
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900'
  ]);

  await new Promise(r => setTimeout(r, 2200));

  const targets = await new Promise(res => {
    http.get(`http://localhost:${port}/json/list`, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    });
  });

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const handlers = new Map();
  ws.onmessage = e => {
    const p = JSON.parse(e.data);
    if (p.id && handlers.has(p.id)) {
      const fn = handlers.get(p.id);
      handlers.delete(p.id);
      fn(p.result);
    }
  };

  const send = (m, params = {}) => new Promise(res => {
    const cur = id++;
    handlers.set(cur, res);
    ws.send(JSON.stringify({ id: cur, method: m, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('--- STARTING RESPONSIVE VERIFICATION ---');
  const results = {};

  for (const vp of VIEWPORTS) {
    console.log(`\nTesting Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);

    // Set viewport emulation
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 768
    });

    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 3500));

    // Scroll to collection section
    await send('Runtime.evaluate', {
      expression: "document.getElementById('choose-your-ride')?.scrollIntoView({ behavior: 'instant' });"
    });
    await new Promise(r => setTimeout(r, 1200));

    // Check collection metrics
    const colMetrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const col = document.getElementById('choose-your-ride');
        const container = document.getElementById('collection-container');
        const img = document.querySelector('.collection-bike-image');
        const hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
        const rect = container?.getBoundingClientRect();
        const compStyle = container ? window.getComputedStyle(container) : null;
        
        return {
          windowWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          hasHorizontalOverflow,
          containerWidth: rect ? rect.width : 0,
          containerLeft: rect ? rect.left : 0,
          containerRight: rect ? window.innerWidth - rect.right : 0,
          paddingInline: compStyle ? (compStyle.paddingLeft + ' / ' + compStyle.paddingRight) : '',
          bikeImgVisible: img ? (img.offsetWidth > 0 && img.offsetHeight > 0) : false,
          bikeImgWidth: img ? img.offsetWidth : 0,
          bikeImgHeight: img ? img.offsetHeight : 0
        };
      })()`,
      returnByValue: true
    });

    console.log('Collection Metrics:', colMetrics.result?.value);

    // Capture screenshot of collection section
    const shotCol = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshots/collection_${vp.name}.png`, Buffer.from(shotCol.data, 'base64'));

    // Test carousel navigation: Click next bike arrow
    await send('Runtime.evaluate', {
      expression: "document.querySelector('.collection-nav-controls button:last-child')?.click();"
    });
    await new Promise(r => setTimeout(r, 800));

    // Open booking modal
    await send('Runtime.evaluate', {
      expression: "document.getElementById('btn-book-test-ride')?.click();"
    });
    await new Promise(r => setTimeout(r, 1000));

    // Check modal metrics
    const modalMetrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const overlay = document.querySelector('[role="dialog"]');
        const modal = overlay ? overlay.querySelector('.booking-modal-card') : null;
        const closeBtn = overlay ? overlay.querySelector('button[aria-label="Close booking modal"]') : null;
        const submitBtn = document.getElementById('booking-submit');
        const nameInput = document.getElementById('booking-full-name');
        const phoneInput = document.getElementById('booking-phone');
        const emailInput = document.getElementById('booking-email');
        const citySelect = document.getElementById('booking-city');
        const dateInput = document.getElementById('booking-date');
        const timeSelect = document.getElementById('booking-time');
        const messageArea = document.getElementById('booking-message');
        const disclaimer = overlay ? overlay.querySelector('.flex.items-center.justify-center p') : null;
        
        const mRect = modal?.getBoundingClientRect();
        const bodyOverflow = document.body.style.overflow;
        
        // Check grid columns of pair 1
        const pair1 = nameInput?.closest('.grid');
        const pair1Cols = pair1 ? window.getComputedStyle(pair1).gridTemplateColumns.split(' ').length : 0;

        return {
          modalWidth: mRect ? mRect.width : 0,
          modalHeight: mRect ? mRect.height : 0,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          fitsInViewport: mRect ? (mRect.height <= window.innerHeight && mRect.width <= window.innerWidth) : false,
          bodyOverflowLocked: bodyOverflow === 'hidden',
          closeBtnClickable: !!closeBtn,
          submitBtnVisible: !!submitBtn,
          nameInputHeight: nameInput ? nameInput.offsetHeight : 0,
          phoneInputHeight: phoneInput ? phoneInput.offsetHeight : 0,
          emailInputHeight: emailInput ? emailInput.offsetHeight : 0,
          cityInputHeight: citySelect ? citySelect.offsetHeight : 0,
          dateInputHeight: dateInput ? dateInput.offsetHeight : 0,
          timeInputHeight: timeSelect ? timeSelect.offsetHeight : 0,
          messageAreaHeight: messageArea ? messageArea.offsetHeight : 0,
          gridCols: pair1Cols,
          disclaimerText: disclaimer ? disclaimer.innerText : ''
        };
      })()`,
      returnByValue: true
    });

    console.log('Modal Metrics:', modalMetrics.result?.value);

    // Capture screenshot of modal
    const shotModal = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshots/modal_${vp.name}.png`, Buffer.from(shotModal.data, 'base64'));

    // Test filling and submitting modal form (only on desktop to verify functionality)
    if (vp.name === 'desktop') {
      await send('Runtime.evaluate', {
        expression: `(() => {
          const nameInput = document.getElementById('booking-full-name');
          const phoneInput = document.getElementById('booking-phone');
          const emailInput = document.getElementById('booking-email');
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          
          if (nameInput) {
            setter.call(nameInput, 'Aarav Sharma');
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (phoneInput) {
            setter.call(phoneInput, '+91 9876543210');
            phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (emailInput) {
            setter.call(emailInput, 'aarav@royalenfield.com');
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          const submitBtn = document.getElementById('booking-submit');
          submitBtn?.click();
        })()`
      });
      await new Promise(r => setTimeout(r, 1200));

      const submittedMetrics = await send('Runtime.evaluate', {
        expression: `(() => {
          const conf = document.body.innerText.includes('REQUEST RECEIVED');
          return { confirmationVisible: conf };
        })()`,
        returnByValue: true
      });
      console.log('Submission Verification:', submittedMetrics.result?.value);

      const shotSuccess = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`screenshots/modal_success.png`, Buffer.from(shotSuccess.data, 'base64'));
    }

    // Close modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('button[aria-label="Close booking modal"]') ||
                         document.querySelector('[role="dialog"] button');
        closeBtn?.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    results[vp.name] = {
      collection: colMetrics.result?.value,
      modal: modalMetrics.result?.value
    };
  }

  console.log('\n--- ALL RESPONSIVE VERIFICATIONS COMPLETED SUCCESSFULLY ---');
  chrome.kill();
  process.exit(0);
}

runResponsiveVerification().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
