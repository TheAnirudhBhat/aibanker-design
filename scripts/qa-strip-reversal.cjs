/* Run against `npm run dev`: npm run qa:strip
 *
 * The month strip scrolls NATIVELY under a finger — that is what gives it
 * momentum — so nothing in the pointer drag runs on touch. The landing that
 * snaps it to the nearest month is armed off a settle timer, and the gesture
 * has to be able to hold that timer off, or it fires UNDER the finger and our
 * rAF glide and the browser's own scrolling write scrollLeft on alternate
 * frames. A reversal always contains a pause, which is why it showed up there.
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    page.setDefaultTimeout(15000);
    await page.goto('http://localhost:3000/app/return-exp1-v2');
    await page.waitForTimeout(3500);
    await page.getByLabel('Cashflow details').click();
    await page.waitForTimeout(1200);

    const box = await page.locator('[data-cashflow-chart]').boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const y = box.y + box.height / 2;
    const touch = (type, x) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });

    // Park on a month, then record scrollLeft every frame.
    await page.evaluate(() => {
      const el = document.querySelector('[data-cashflow-chart] .no-scrollbar');
      el.scrollLeft = 340;
      window.qaStrip = []; window.qaStripStop = false;
      const tick = () => { window.qaStrip.push(+el.scrollLeft.toFixed(1)); if (!window.qaStripStop) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    await page.waitForTimeout(400);

    let x = box.x + box.width / 2;
    await touch('touchStart', x);
    for (let i = 0; i < 6; i++) { x += 7; await touch('touchMove', x); await page.waitForTimeout(16); }

    // The pause a finger makes before it turns round. Nothing may move here:
    // the finger is still on the glass and has not asked for anything.
    const before = await page.evaluate(() => { window.qaStrip = []; return document.querySelector('[data-cashflow-chart] .no-scrollbar').scrollLeft; });
    await page.waitForTimeout(280);
    const during = await page.evaluate(() => window.qaStrip.slice());
    const after = await page.evaluate(() => document.querySelector('[data-cashflow-chart] .no-scrollbar').scrollLeft);
    assert.ok(Math.abs(after - before) < 1, `The strip holds still while the finger is down and not moving: ${before} -> ${after}`);
    assert.ok(Math.max(...during) - Math.min(...during) < 1, `Nothing animates the strip under a still finger: spread ${(Math.max(...during) - Math.min(...during)).toFixed(1)}px`);

    // Now switch sides. Only the finger writes scrollLeft, so it moves one way.
    await page.evaluate(() => { window.qaStrip = []; });
    for (let i = 0; i < 6; i++) { x -= 7; await touch('touchMove', x); await page.waitForTimeout(16); }
    const reverse = await page.evaluate(() => window.qaStrip.slice());
    const flips = reverse.filter((v, i) => i > 1 && Math.sign(v - reverse[i - 1]) && Math.sign(v - reverse[i - 1]) === -Math.sign(reverse[i - 1] - reverse[i - 2])).length;
    assert.ok(flips <= 1, `A reversal moves the strip one way, not back and forth: ${flips} direction flips in ${JSON.stringify(reverse)}`);

    await touch('touchEnd', x);
    await page.waitForTimeout(900);
    const landed = await page.evaluate(() => { window.qaStripStop = true; return document.querySelector('[data-cashflow-chart] .no-scrollbar').scrollLeft; });
    assert.ok(Math.abs(landed % 68) < 0.6, `Lifting the finger still lands the strip on a month: ${landed}`);

    console.log('PASS: month strip — a pause under the finger holds, a reversal does not fight itself, the lift still lands');
  } finally {
    await browser.close();
  }
})();
