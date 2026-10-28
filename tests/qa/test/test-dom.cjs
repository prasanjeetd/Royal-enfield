const { spawn } = require('child_process');
const http = require('http');

async function test() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--remote-debugging-port=9788',
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const targets = await new Promise(res => {
    http.get('http://localhost:9788/json/list', r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    });
  });
  const ws = new WebSocket((targets.find(t => t.type === 'page') || targets[0]).webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const handlers = new Map();
  ws.onmessage = e => {
    const p = JSON.parse(e.data);
    if (p.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE:', p.params.args?.map(a => a.value || a.description).join(' '));
    }
    if (p.method === 'Runtime.exceptionThrown') {
      console.error('EXCEPTION:', p.params.exceptionDetails?.text, p.params.exceptionDetails?.exception?.description);
    }
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
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  
  // Wait 4 seconds
  await new Promise(r => setTimeout(r, 4000));

  const check = await send('Runtime.evaluate', {
    expression: `(() => {
      const root = document.getElementById('root');
      const app = document.querySelector('.app-container');
      const hero = document.querySelector('section');
      const chooseYourRide = document.getElementById('choose-your-ride');
      return {
        rootHtmlLength: root?.innerHTML.length || 0,
        hasAppContainer: !!app,
        firstSection: hero?.id || hero?.className || null,
        chooseYourRideFound: !!chooseYourRide
      };
    })()`,
    returnByValue: true
  });
  console.log('DOM Check:', check.result?.value);
  chrome.kill();
  process.exit(0);
}
test().catch(console.error);
