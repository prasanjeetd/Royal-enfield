const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9890;
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
  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  const fontsToTest = [
    {
      name: 'road_rage_refined',
      font: "'Road Rage', cursive",
      size: 'clamp(84px, 12vw, 175px)',
      tracking: '0.04em',
      gradient: 'linear-gradient(180deg, #9DC4F8 0%, #7CA7E6 28%, #2D4E80 68%, #17365F 100%)',
      top: 'clamp(70px, 9.5vh, 105px)'
    },
    {
      name: 'rubik_wet_paint',
      font: "'Rubik Wet Paint', cursive",
      size: 'clamp(70px, 9.8vw, 145px)',
      tracking: '0.04em',
      gradient: 'linear-gradient(180deg, #A8C7FA 0%, #7CA7E6 30%, #2D4E80 70%, #17365F 100%)',
      top: 'clamp(76px, 10.5vh, 115px)'
    },
    {
      name: 'rock_salt',
      font: "'Rock Salt', cursive",
      size: 'clamp(54px, 7.5vw, 110px)',
      tracking: '0.06em',
      gradient: 'linear-gradient(180deg, #A8C7FA 0%, #7CA7E6 30%, #2D4E80 70%, #17365F 100%)',
      top: 'clamp(85px, 12vh, 130px)'
    }
  ];

  for (const item of fontsToTest) {
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const wrapper = document.querySelector('#hero h1')?.parentElement;
          if (wrapper) {
            wrapper.style.top = "${item.top}";
          }
          const h1 = document.querySelector('#hero h1');
          if (h1) {
            h1.style.fontFamily = "${item.font}";
            h1.style.letterSpacing = "${item.tracking}";
            h1.style.fontSize = "${item.size}";
            h1.style.textTransform = "uppercase";
            h1.style.background = "${item.gradient}";
            h1.style.webkitBackgroundClip = "text";
            h1.style.webkitTextFillColor = "transparent";
            h1.style.filter = "drop-shadow(0 12px 28px rgba(5, 10, 20, 0.95))";
          }
          const h2 = document.querySelector('#hero h2');
          if (h2) {
            h2.style.fontFamily = "'Oswald', sans-serif";
            h2.style.fontWeight = "600";
            h2.style.letterSpacing = "0.06em";
          }
          const sub = document.querySelector('#hero p.hidden.sm\\\\:block');
          if (sub) {
            sub.style.fontFamily = "'Rajdhani', sans-serif";
            sub.style.fontWeight = "500";
            sub.style.letterSpacing = "0.16em";
          }
        })()
      `
    });

    await new Promise((r) => setTimeout(r, 1000));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshots/hero_${item.name}.png`, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: screenshots/hero_${item.name}.png`);
  }

  chrome.kill();
  process.exit(0);
}

run().catch(console.error);
