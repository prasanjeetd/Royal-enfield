const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9750 + Math.floor(Math.random() * 100);
  const tempProfile = path.join(os.tmpdir(), 'chrome-contact-' + Date.now());
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

  await send('Page.navigate', { url: 'http://localhost:5173' });
  await new Promise(r => setTimeout(r, 4000));

  // Verify page title and #contact exists
  const checkPage = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      return {
        title: document.title,
        hasContact: !!document.querySelector('#contact'),
        bodyHeight: document.body.scrollHeight
      };
    })()`
  });
  console.log('Page check:', checkPage.result?.value);

  const outDir = path.join(__dirname, '../../..', 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  // Helper to capture screenshot
  async function takeScreenshot(name) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const localPath = path.join(outDir, `${name}.png`);
    fs.writeFileSync(localPath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: ${name}.png`);
  }

  // Helper to scroll cleanly to contact
  async function scrollToContact() {
    await send('Runtime.evaluate', {
      expression: `(() => {
        const contact = document.querySelector('#contact');
        if (contact) {
          if (window.__lenis) {
            window.__lenis.scrollTo(contact.offsetTop, { immediate: true });
          }
          window.scrollTo(0, contact.offsetTop);
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));
  }

  // 1. Desktop 1600px: Check layout metrics
  console.log('--- Checking Desktop (1600x1050) Layout ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 1050,
    deviceScaleFactor: 1,
    mobile: false
  });

  await scrollToContact();

  const desktopMetrics = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const contact = document.querySelector('#contact');
      const container = document.getElementById('contact-container');
      const grid = document.getElementById('contact-grid');
      const leftCol = document.getElementById('contact-left-col');
      const rightCol = document.getElementById('contact-right-col');
      const heading = leftCol.querySelector('h2');
      const branchCards = leftCol.querySelectorAll('a');
      const formCard = document.getElementById('contact-form-card');
      const formInputs = formCard.querySelectorAll('input, textarea, button');

      const contactRect = contact.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      const lRect = leftCol.getBoundingClientRect();
      const rRect = rightCol.getBoundingClientRect();
      const hRect = heading.getBoundingClientRect();
      const fRect = formCard.getBoundingClientRect();

      const branchWidths = Array.from(branchCards).map(b => b.getBoundingClientRect().width);
      const inputWidths = Array.from(formInputs).map(i => ({
        tag: i.tagName,
        width: i.getBoundingClientRect().width,
        left: i.getBoundingClientRect().left - fRect.left,
        right: fRect.right - i.getBoundingClientRect().right
      }));

      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        scrollInfo: {
          scrollY: window.scrollY,
          contactTop: contactRect.top,
          contactOffsetTop: contact.offsetTop,
          contactHeight: contact.offsetHeight,
          scrollHeight: document.documentElement.scrollHeight,
          maxScroll: document.documentElement.scrollHeight - window.innerHeight,
          lenisExists: !!window.__lenis,
          lenisScroll: window.__lenis ? window.__lenis.scroll : null,
          lenisLimit: window.__lenis ? window.__lenis.limit : null,
        },
        container: {
          width: cRect.width,
          left: cRect.left,
          right: window.innerWidth - cRect.right,
          maxWidth: window.getComputedStyle(container).maxWidth
        },
        grid: {
          gap: window.getComputedStyle(grid).gap,
          columns: window.getComputedStyle(grid).gridTemplateColumns
        },
        leftCol: {
          width: lRect.width,
          left: lRect.left,
          headingText: heading.innerText.replace(/\\n/g, ' '),
          headingLeft: hRect.left,
          branchCount: branchCards.length,
          branchWidths
        },
        rightCol: {
          width: rRect.width,
          right: window.innerWidth - rRect.right,
          formCardWidth: fRect.width,
          inputWidths
        },
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()`
  });

  console.log('Desktop Metrics:', JSON.stringify(desktopMetrics.result.value, null, 2));
  await takeScreenshot('contact_desktop_1600');

  // Test Contact Form Submission
  console.log('--- Testing Contact Form Submission ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      function setReactValue(input, val) {
        const proto = Object.getPrototypeOf(input);
        const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
        set.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const nameInput = document.querySelector('#name');
      const emailInput = document.querySelector('#email');
      const msgInput = document.querySelector('#message');
      const submitBtn = document.querySelector('#contact form button[type="submit"]');

      setReactValue(nameInput, 'Vikram Sharma');
      setReactValue(emailInput, 'vikram.sharma@example.com');
      setReactValue(msgInput, 'Interested in booking a test ride for the Continental GT 650.');

      submitBtn?.click();
    })()`
  });

  await new Promise(r => setTimeout(r, 600));
  await scrollToContact();
  await takeScreenshot('contact_form_submitted');

  // Click "Send another message" to reset form
  await send('Runtime.evaluate', {
    expression: `(() => {
      const resetBtn = Array.from(document.querySelectorAll('#contact button')).find(b => b.innerText.includes('Send another message'));
      if (resetBtn) resetBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  // 2. Standard Desktop 1440px
  console.log('--- Checking 1440px Layout ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await scrollToContact();
  await takeScreenshot('contact_desktop_1440');

  // 3. Mobile View 390px
  console.log('--- Checking Mobile (390x844) Layout ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Runtime.evaluate', {
    expression: `(() => {
      const contact = document.querySelector('#contact');
      if (window.__lenis) {
        window.__lenis.scrollTo(contact, { immediate: true });
      } else {
        contact?.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));

  const mobileMetrics = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const container = document.getElementById('contact-container');
      const grid = document.getElementById('contact-grid');
      const formCard = document.getElementById('contact-form-card');

      return {
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        containerWidth: container.getBoundingClientRect().width,
        containerLeft: container.getBoundingClientRect().left
      };
    })()`
  });

  console.log('Mobile Metrics:', JSON.stringify(mobileMetrics.result.value, null, 2));
  await takeScreenshot('contact_mobile_390');

  // Scroll down slightly inside contact on mobile to capture the form
  await send('Runtime.evaluate', {
    expression: `(() => {
      const form = document.querySelector('#contact form') || document.querySelector('#contact h3');
      if (window.__lenis) {
        window.__lenis.scrollTo(form, { immediate: true });
      } else {
        form?.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 800));
  await takeScreenshot('contact_mobile_390_form');

  chrome.kill();
  console.log('Verification completed successfully!');
}

run().catch(err => {
  console.error('Error running verification:', err);
  process.exit(1);
});
