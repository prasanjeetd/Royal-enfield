const { spawn } = require('child_process');
const http = require('http');

async function check() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9884;
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
  await new Promise((r) => setTimeout(r, 3000));

  const bounds = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const h = document.getElementById('hero');
        const b = document.getElementById('bike-3d');
        const p = document.getElementById('parts-archive');
        const c = document.getElementById('choose-your-ride');
        return {
          windowScrollY: window.scrollY,
          heroTop: h?.offsetTop,
          bike3dTop: b?.offsetTop,
          partsTop: p?.offsetTop,
          chooseTop: c?.offsetTop,
          documentHeight: document.documentElement.scrollHeight
        };
      })()
    `,
    returnByValue: true
  });

  console.log('POSITION REPORT:', bounds.result?.value);
  chrome.kill();
  process.exit(0);
}

check().catch(console.error);
