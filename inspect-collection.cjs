const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function inspect() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9888;
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900',
    'http://localhost:5173/'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const targets = await new Promise(res => {
    http.get(`http://localhost:${port}/json/list`, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    });
  });
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (m, params = {}) => new Promise(res => {
    const cur = id++;
    const fn = e => {
      const p = JSON.parse(e.data);
      if (p.id === cur) { ws.removeEventListener('message', fn); res(p.result); }
    };
    ws.addEventListener('message', fn);
    ws.send(JSON.stringify({ id: cur, method: m, params }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 5000));
  // Scroll down to trigger lazy loading
  await send('Runtime.evaluate', {
    expression: `window.scrollTo(0, 3000);`
  });
  await new Promise(r => setTimeout(r, 2000));
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const sec = document.getElementById('choose-your-ride');
      if (window.__lenis) {
        window.__lenis.scrollTo(sec.offsetTop, { immediate: true });
      } else if (sec) {
        window.scrollTo(0, sec.offsetTop);
      }
      const container = sec ? sec.querySelector('.relative.z-10') : null;
      const h2 = sec ? sec.querySelector('h2') : null;
        let matched = [];
        if (container) {
          for (const sheet of document.styleSheets) {
            try {
              for (const rule of sheet.cssRules) {
                if (rule.selectorText && container.matches(rule.selectorText)) {
                  matched.push({ selector: rule.selectorText, css: rule.cssText });
                }
              }
            } catch(e) {}
          }
        }
        return {
          secTagName: sec ? sec.tagName : null,
          secClass: sec ? sec.className : null,
          secRect: sec ? sec.getBoundingClientRect() : null,
          secComputed: sec ? {
            paddingLeft: getComputedStyle(sec).paddingLeft,
            paddingRight: getComputedStyle(sec).paddingRight,
            boxSizing: getComputedStyle(sec).boxSizing
          } : null,
          containerClass: container ? container.className : null,
          containerRect: container ? container.getBoundingClientRect() : null,
          containerComputed: container ? {
            width: getComputedStyle(container).width,
            maxWidth: getComputedStyle(container).maxWidth,
            marginLeft: getComputedStyle(container).marginLeft,
            marginRight: getComputedStyle(container).marginRight,
            marginInline: getComputedStyle(container).marginInline,
            paddingLeft: getComputedStyle(container).paddingLeft,
            paddingRight: getComputedStyle(container).paddingRight,
            boxSizing: getComputedStyle(container).boxSizing,
            display: getComputedStyle(container).display
          } : null,
        matched,
        secPaddingLeft: getComputedStyle(sec).paddingLeft,
        containerMarginLeft: getComputedStyle(container).marginLeft,
        containerMarginRight: getComputedStyle(container).marginRight,
        containerWidth: getComputedStyle(container).width,
        secWidth: getComputedStyle(sec).width,
        secRect: sec ? sec.getBoundingClientRect() : null,
        containerRect: container ? container.getBoundingClientRect() : null
      };
    })()`,
    returnByValue: true
  });
  console.log('DOM INSPECT:', JSON.stringify(res.result.value, null, 2));
  chrome.kill();
  process.exit(0);
}
inspect().catch(console.error);
