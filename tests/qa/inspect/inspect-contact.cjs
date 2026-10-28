const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9885;
  const tempProfile = path.join(os.tmpdir(), 'chrome-contact-inspect-' + Date.now());

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

  // Trigger lazy loading
  await send('Runtime.evaluate', { expression: `window.scrollTo(0, 5000);` });
  await new Promise((r) => setTimeout(r, 3000));

  // Scroll to contact
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('contact');
      if (window.__lenis) {
        window.__lenis.scrollTo(el, { immediate: true });
      } else if (el) {
        window.scrollTo(0, el.offsetTop);
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 1500));

  const report = await send('Runtime.evaluate', {
    expression: `(() => {
      const contact = document.getElementById('contact');
      const container = document.getElementById('contact-container');
      const grid = document.getElementById('contact-grid');
      const leftCol = document.getElementById('contact-left-col');
      const rightCol = document.getElementById('contact-right-col');
      const formCard = document.getElementById('contact-form-card');
      const heading = leftCol?.querySelector('h2');
      const navbar = document.getElementById('main-navbar');
      const navRect = navbar?.getBoundingClientRect();

      return {
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        navbarHeight: navRect?.height,
        navbarBottom: navRect?.bottom,
        contactRect: contact?.getBoundingClientRect(),
        contactComputed: contact ? {
          paddingTop: getComputedStyle(contact).paddingTop,
          paddingBottom: getComputedStyle(contact).paddingBottom,
          minHeight: getComputedStyle(contact).minHeight,
          height: getComputedStyle(contact).height,
          scrollMarginTop: getComputedStyle(contact).scrollMarginTop
        } : null,
        containerRect: container?.getBoundingClientRect(),
        containerComputed: container ? {
          maxWidth: getComputedStyle(container).maxWidth,
          width: getComputedStyle(container).width,
          marginLeft: getComputedStyle(container).marginLeft,
          marginRight: getComputedStyle(container).marginRight,
          paddingLeft: getComputedStyle(container).paddingLeft,
          paddingRight: getComputedStyle(container).paddingRight
        } : null,
        leftColTop: leftCol?.getBoundingClientRect().top,
        headingTop: heading?.getBoundingClientRect().top,
        rightColTop: rightCol?.getBoundingClientRect().top,
        formCardTop: formCard?.getBoundingClientRect().top,
        leftColHeight: leftCol?.getBoundingClientRect().height,
        formCardHeight: formCard?.getBoundingClientRect().height,
        gridComputed: grid ? {
          display: getComputedStyle(grid).display,
          gridTemplateColumns: getComputedStyle(grid).gridTemplateColumns,
          gap: getComputedStyle(grid).gap,
          alignItems: getComputedStyle(grid).alignItems
        } : null
      };
    })()`,
    returnByValue: true
  });

  console.log('CONTACT INSPECTION REPORT:', JSON.stringify(report.result.value, null, 2));

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch(console.error);
