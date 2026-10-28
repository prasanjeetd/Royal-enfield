const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9895;
  const tempProfile = path.join(__dirname, '../../..', 'chrome-temp-inspect');

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
    if (p.method === 'Runtime.consoleAPICalled') {
      const text = p.params.args.map((a) => a.value || a.description || '').join(' ');
      console.log(`[PAGE CONSOLE ${p.params.type.toUpperCase()}]:`, text);
    }
    if (p.method === 'Runtime.exceptionThrown') {
      console.error('[UNCAUGHT EXCEPTION]:', p.params.exceptionDetails.exception?.description || p.params.exceptionDetails.text);
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

  // Inject error trap
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.addEventListener('error', (e) => {
        console.error('WINDOW ERROR:', e.message, e.filename, e.lineno);
      });
    `
  });

  console.log('Navigating...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });

  // Wait 6 seconds
  await new Promise((r) => setTimeout(r, 6000));

  const domCheck = await send('Runtime.evaluate', {
    expression: `({
      title: document.title,
      appContainer: !!document.querySelector('.app-container'),
      sections: Array.from(document.querySelectorAll('section')).map(s => s.id),
      chooseRide: !!document.getElementById('choose-your-ride')
    })`,
    returnByValue: true
  });

  console.log('DOM CHECK RESULT:', JSON.stringify(domCheck.result?.value, null, 2));

  chrome.kill();
  process.exit(0);
}

main().catch(console.error);
