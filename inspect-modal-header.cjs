const { spawn } = require('child_process');
const http = require('http');

async function checkHeader() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--remote-debugging-port=9782',
    '--headless=new',
    '--no-sandbox',
    '--window-size=1440,900'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const targets = await new Promise(res => {
    http.get('http://localhost:9782/json/list', r => {
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
  await new Promise(r => setTimeout(r, 2000));

  await send('Runtime.evaluate', { expression: "document.getElementById('btn-book-test-ride')?.click();" });
  await new Promise(r => setTimeout(r, 800));

  const info = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('.booking-modal-card');
      const header = modal ? modal.firstElementChild.nextElementSibling : null;
      const title = document.getElementById('booking-modal-title');
      return {
        modalClasses: modal?.className,
        headerClasses: header?.className,
        headerPadding: header ? window.getComputedStyle(header).padding : '',
        headerHeight: header ? header.offsetHeight : 0,
        titleOffsetTop: title ? title.offsetTop : 0,
        headerOffsetTop: header ? header.offsetTop : 0
      };
    })()`,
    returnByValue: true
  });

  console.log('Header Info:', info.result?.value);
  chrome.kill();
  process.exit(0);
}
checkHeader().catch(console.error);
