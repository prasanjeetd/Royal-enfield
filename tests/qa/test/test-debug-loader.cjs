const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9899;
  const tempProfile = path.join(__dirname, '../../..', 'chrome-temp-debug-loader');

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900',
  ]);

  await new Promise((r) => setTimeout(r, 1500));
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
    if (p.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE:', p.params.type, p.params.args.map(a => a.value || JSON.stringify(a)).join(' '));
    }
    if (p.method === 'Runtime.exceptionThrown') {
      console.error('EXCEPTION THROWN:', JSON.stringify(p.params.exceptionDetails));
    }
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
  await send('Log.enable');

  await send('Page.navigate', { url: 'http://localhost:5173/' });

  for (let i = 1; i <= 12; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const dom = await send('Runtime.evaluate', {
      expression: `(() => {
        const root = document.getElementById('root');
        const hero = document.getElementById('hero');
        const loader = document.getElementById('royal-enfield-cinematic-loader');
        const frame0 = document.getElementById('frame0-preloader');
        return {
          second: ${i},
          heroPresent: !!hero,
          loaderPresent: !!loader,
          frame0Present: !!frame0,
          rootChildCount: root ? root.children.length : 0,
          rootChildIds: root ? Array.from(root.children).map(c => c.id || c.className) : [],
          loaderProgress: loader ? loader.querySelector('span.tabular-nums')?.innerText : null
        };
      })()`,
      returnByValue: true
    });
    console.log(`Second ${i}:`, dom.result.value);
    if (dom.result.value.heroPresent && !dom.result.value.loaderPresent) {
      console.log('>>> COMPLETE! Hero is visible and Loader has faded out/unmounted.');
      break;
    }
  }

  // Check if main.jsx had an error
  const scriptErr = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        scriptsFailed: window.__FAILED_SCRIPTS || [],
        reactLoaded: typeof window.React !== 'undefined'
      };
    })()`,
    returnByValue: true
  });
  console.log('Script check:', scriptErr.result.value);

  chrome.kill();
  process.exit(0);
}

main().catch(console.error);
