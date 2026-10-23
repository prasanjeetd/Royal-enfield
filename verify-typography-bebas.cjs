const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Starting visual verification for Bebas Neue typography system...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err));

  const url = 'http://localhost:5173/';
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait 2 seconds for fonts and GSAP animations to settle
  await new Promise(r => setTimeout(r, 2000));

  const outDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Hero Section Screenshot
  await page.screenshot({ path: path.join(outDir, '01-hero-bebas.png') });
  console.log('Captured 01-hero-bebas.png');

  // 2. 3D Bike Experience Section
  const bike3dElem = await page.$('#bike-3d');
  if (bike3dElem) {
    await page.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }), bike3dElem);
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(outDir, '02-3d-experience-bebas.png') });
    console.log('Captured 02-3d-experience-bebas.png');
  }

  // 3. Parts Archive Section
  const partsElem = await page.$('#parts-archive');
  if (partsElem) {
    await page.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }), partsElem);
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(outDir, '03-parts-archive-bebas.png') });
    console.log('Captured 03-parts-archive-bebas.png');
  }

  // 4. Choose Your Ride Section
  const collectionElem = await page.$('#choose-your-ride');
  if (collectionElem) {
    await page.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }), collectionElem);
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(outDir, '04-collection-bebas.png') });
    console.log('Captured 04-collection-bebas.png');
  }

  // 5. Test Booking Modal
  const bookBtn = await page.$('button[type="button"]');
  // Find "BOOK A TEST RIDE" button
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('BOOK A TEST RIDE')) {
      await b.click();
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(outDir, '05-booking-modal-bebas.png') });
      console.log('Captured 05-booking-modal-bebas.png');

      // Close modal
      const closeBtn = await page.$('button[aria-label="Close booking modal"]');
      if (closeBtn) {
        await closeBtn.click();
        await new Promise(r => setTimeout(r, 500));
      }
      break;
    }
  }

  // 6. Contact Section
  const contactElem = await page.$('#contact');
  if (contactElem) {
    await page.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }), contactElem);
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(outDir, '06-contact-bebas.png') });
    console.log('Captured 06-contact-bebas.png');
  }

  await browser.close();
  console.log('Visual verification complete!');
})();
