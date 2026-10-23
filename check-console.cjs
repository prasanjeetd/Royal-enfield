const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9894;
  const tempProfile = path.join(__dirname, 'chrome-temp-console-debug');

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
      console.log('CONSOLE:', p.params.type, JSON.stringify(p.params.args));
    }
    if (p.method === 'Runtime.exceptionThrown') {
      console.error('EXCEPTION:', JSON.stringify(p.params.exceptionDetails));
    }
    if (p.method === 'Network.loadingFailed') {
      console.error('NET FAILED:', p.params.url, p.params.errorText);
    }
    if (p.method === 'Network.responseReceived') {
      console.log('NET RES:', p.params.response.status, p.params.response.url);
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
  await send('Network.enable');
  await send('Log.enable');

  console.log('Navigating to http://localhost:5173/ ...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });

  await new Promise((resolve) => {
    const handler = (e) => {
      const p = JSON.parse(e.data);
      if (p.method === 'Page.loadEventFired') {
        ws.removeEventListener('message', handler);
        resolve();
      }
    };
    ws.addEventListener('message', handler);
  });

  console.log('Page loadEventFired! Waiting for React render...');
  await new Promise((r) => setTimeout(r, 7000));

  const pageInfo = await send('Runtime.evaluate', {
    expression: '({ rootChildren: document.getElementById("root")?.children.length, sections: Array.from(document.querySelectorAll("section")).map(s => s.id) })',
    returnByValue: true
  });
  console.log('PAGE INFO:', pageInfo.result?.value);

  chrome.kill();
  process.exit(0);
}

main().catch(console.error);
