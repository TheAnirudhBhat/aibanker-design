/* Run against `npm run dev`: npm run qa:return
 * QA_BROWSER=webkit QA_THEME=light QA_MOBILE=1 npm run qa:return
 * WebKit captures do not reliably include backdrop filters on macOS; this
 * checks interaction/geometry. Rendered blur is separately pixel-compared. */
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const sharp = require('sharp');

(async () => {
  const mobile = process.env.QA_MOBILE === '1';
  const isWebKit = process.env.QA_BROWSER === 'webkit';
  const theme = process.env.QA_THEME || 'dark';
  const browser = await (isWebKit ? webkit : chromium).launch(isWebKit ? {} : { channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1250, height: 1083 }, isMobile: mobile, hasTouch: mobile });
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', error => {
      // Agentation's optional local feedback collector is not the app runtime.
      if (!error.message.includes('/localhost:4747/sessions')) errors.push(error.message);
    });
    await page.addInitScript(value => localStorage.setItem('dls-theme-mode', value), theme);
    await page.goto(`${process.env.QA_BASE_URL || 'http://127.0.0.1:3000'}/app/return-exp1-v2`, { waitUntil: 'networkidle' });
    const frame = page.locator('.re1-ambient').first();
    await frame.waitFor();
    await page.waitForTimeout(700);
    const gaps = await page.locator('[data-cashflow-glance-bars]').evaluate(el => {
      const bars = Array.from(el.children).map(child => child.getBoundingClientRect());
      const box = el.getBoundingClientRect();
      return { gaps: bars.slice(1).map((bar, i) => bar.left - bars[i].right), centre: ((bars[0].left + bars.at(-1).right) / 2) - ((box.left + box.right) / 2) };
    });
    assert.ok(gaps.gaps.every(gap => Math.abs(gap - 12) < 0.5) && Math.abs(gaps.centre) < 0.5, 'Glance bars are centred with 12px gaps');
    const blur = page.locator('[data-re1-top-blur]');
    const checkRenderedBlur = async scroller => {
      if (isWebKit) return;
      await scroller.evaluate(el => {
        const probe = document.createElement('div');
        probe.dataset.qaBlurPattern = '';
        Object.assign(probe.style, { position: 'absolute', top: `${el.scrollTop + 35}px`, left: '80px', width: '190px', height: '55px', zIndex: '100', background: 'repeating-linear-gradient(90deg,#000 0px,#000 4px,#fff 4px,#fff 8px)', pointerEvents: 'none' });
        el.appendChild(probe);
      });
      const bounds = await frame.boundingBox();
      const clip = { x: Math.ceil(bounds.x + 95), y: Math.ceil(bounds.y + 43), width: 155, height: 38 };
      const filtered = await sharp(await page.screenshot({ clip })).removeAlpha().raw().toBuffer();
      await blur.evaluate(el => { el.style.setProperty('backdrop-filter', 'none'); el.style.setProperty('-webkit-backdrop-filter', 'none'); });
      const plain = await sharp(await page.screenshot({ clip })).removeAlpha().raw().toBuffer();
      await blur.evaluate(el => { el.style.setProperty('backdrop-filter', 'blur(24px)'); el.style.setProperty('-webkit-backdrop-filter', 'blur(24px)'); });
      await page.locator('[data-qa-blur-pattern]').evaluate(el => el.remove());
      const difference = filtered.reduce((sum, value, i) => sum + Math.abs(value - plain[i]), 0) / filtered.length;
      assert.ok(difference > 4, `Real backdrop blur at half opacity, not only a tint (pixel difference ${difference.toFixed(2)})`);
    };
    const back = () => page.locator('[data-re1-detail-chrome]').getByLabel('Back', { exact: true }).click();
    for (const value of [0, 12, 24, 36, 48]) {
      await page.locator('[data-re1-page="home"]').evaluate((el, y) => { el.scrollTop = y; }, value);
      await page.waitForTimeout(40);
      assert.equal(await blur.evaluate(el => Number(getComputedStyle(el).opacity)), value / 48);
    }
    await page.locator('[data-re1-page="home"]').evaluate(el => { el.scrollTop = 24; }); await page.waitForTimeout(80);
    await checkRenderedBlur(page.locator('[data-re1-page="home"]'));
    await page.locator('[data-re1-page="home"]').evaluate(el => { el.scrollTop = 0; });
    await page.getByLabel('Bank accounts', { exact: true }).click();
    await page.waitForTimeout(1000);
    const chart = page.getByRole('slider', { name: 'Balance history' });
    const chartBox = await chart.boundingBox();
    const checkBankCentre = async () => {
      const centre = await page.locator('[data-bank-subtext]').evaluate(el => {
        const box = el.getBoundingClientRect(), text = el.querySelector('[data-fluid-run]').getBoundingClientRect();
        return (text.left + text.right - box.left - box.right) / 2;
      });
      assert.ok(Math.abs(centre) < 0.5, 'Bank subtext is always centred, including inside a button');
    };
    await checkBankCentre();
    const markerX = () => chart.locator('circle').evaluate(el => Number(el.getAttribute('cx')));
    await page.mouse.move(chartBox.x + 100, chartBox.y + 60);
    await page.mouse.down();
    for (const x of [40, 24, 12, 4, 0, 4, 12, 24, 40, 120, 240, 120]) {
      await page.mouse.move(chartBox.x + x, chartBox.y + 60);
      await page.waitForTimeout(35);
      assert.ok(Math.abs(await markerX() - x) < 1, `No left-edge dead zone at ${x}px`);
      assert.equal(await page.locator('[data-bank-subtext] [data-fluid-run]').count(), 1, 'Date is a single collision-free text run');
      await checkBankCentre();
    }
    await page.mouse.up();
    // A mouse still over the chart keeps scrubbing, so the return to live is the
    // pointer LEAVING — and it SNAPS (user call): sliding the geometry back
    // across the chart read as the dragger running away from the cursor.
    const liveX = chartBox.width - 44;
    await page.mouse.move(chartBox.x + 120, chartBox.y - 90);
    await page.waitForTimeout(50);
    assert.ok(Math.abs(await markerX() - liveX) < 1, 'Leaving the chart returns to live at once, with no slide');
    await page.waitForTimeout(700);
    assert.ok(Math.abs(await markerX() - liveX) < 1, 'Right-side breathing room is retained');
    await chart.press('End');
    const months = new Map();
    for (let i = 0; i <= 60; i++) {
      const point = await chart.evaluate(el => ({ index: Number(el.getAttribute('aria-valuenow')), balance: Number(el.getAttribute('aria-valuetext').split('₹')[1].replaceAll(',', '')) }));
      if (point.index % 12 === 0) assert.equal(point.balance, 8000, 'Every salary month closes at ₹8,000');
      if (point.index % 12 === 1) assert.equal(point.balance, 128000, 'Monthly salary adds exactly ₹1.2 lakh');
      const month = Math.floor(point.index / 12);
      if (!months.has(month)) months.set(month, []);
      months.get(month).push(point.balance);
      await chart.press('ArrowLeft');
    }
    const completeMonths = Array.from(months.values()).filter(values => values.length === 12);
    assert.ok(new Set(completeMonths.map(values => JSON.stringify(values))).size === completeMonths.length, 'Bank months do not repeat the same spending curve');
    assert.ok(completeMonths.every(values => values.slice(1, -1).some((v, i) => v < values[i])), 'Each month contains a refund/recovery as well as expenses');
    await back(); await page.waitForTimeout(650);
    await page.getByLabel('Cashflow details', { exact: true }).click(); await page.waitForTimeout(650);
    const savedHomeScroll = await page.locator('[data-re1-page="home"]').evaluate(el => el.scrollTop);
    const fit = await page.locator('[data-cashflow-level="all"]').evaluate(el => {
      const scroller = el.closest('[data-re1-page]'), ask = document.querySelector('[aria-label="Ask cosimo"]');
      return { height: scroller.clientHeight, content: scroller.scrollHeight, overflow: getComputedStyle(scroller).overflowY, bottom: el.getBoundingClientRect().bottom, askTop: ask.getBoundingClientRect().top };
    });
    assert.equal(fit.overflow, 'hidden');
    assert.ok(fit.content <= fit.height && fit.bottom <= fit.askTop - 8, `Cashflow fits without scroll or hidden rows: ${JSON.stringify(fit)}`);
    const ordered = await page.locator('[data-cashflow-label]').allTextContents();
    assert.deepEqual(ordered, ['Inflow', 'Investments', 'Outflow']);
    const strip = page.locator('[data-re1-page="trip"] .no-scrollbar');
    await page.evaluate(() => {
      // Inflow and Outflow are on every month. Investments is NOT — a month
      // with nothing invested drops its column, its bar and its row together —
      // so only these two can be held as live nodes across a scrub.
      window.qaCurrency = Array.from(document.querySelectorAll('[data-re1-page="trip"] [data-cashflow-total="in"] [data-fluid-part], [data-re1-page="trip"] [data-cashflow-total="out"] [data-fluid-part]'));
    });
    for (const offset of [0, 68, 136, 476, 544, 612, 136]) {
      await strip.evaluate((el, x) => { el.scrollLeft = x; }, offset);
      await page.waitForTimeout(50);
      // rollDigits — the scrub's digit roll, now on the list amounts too — gives
      // every character its own clipped cell, so a part is no longer a single
      // text node (4 parts here: two headings split stem/unit). What must hold
      // is that the SAME elements survive a digit-count change and carry
      // nothing but their cells. An outgoing ghost shares the cell mid-roll,
      // so read each cell's own char, never textContent.
      assert.ok(await page.evaluate(() => window.qaCurrency.length === 4 && window.qaCurrency.every(el => el.isConnected && el.querySelectorAll('[data-roll-cell]').length === el.childNodes.length)), 'Inflow and Outflow stay one clean per-character run through digit-count changes');
      // the investment series is all-or-nothing: column, bar and row agree
      const invest = await page.evaluate(() => ({
        column: !!document.querySelector('[data-cashflow-total="invest"]'),
        bars: Array.from(document.querySelectorAll('[data-cashflow-chart] [data-roll-cell]')).length,
        rows: document.querySelectorAll('[data-cashflow-row-amount]').length,
      }));
      assert.equal(invest.rows, invest.column ? 3 : 2, `A month shows its Investments column and row together (${JSON.stringify(invest)})`);
      const rightEdges = await page.locator('[data-cashflow-row-amount]').evaluateAll(elements => elements.map(el => ({ row: el.getBoundingClientRect().right, text: el.querySelector('[data-fluid-run]').getBoundingClientRect().right, chars: Array.from(el.querySelectorAll('[data-roll-cell]')).map(c => c.dataset.ch).join('') })));
      assert.ok(rightEdges.every(edge => edge.chars.startsWith('₹')), 'Every list amount still reads as rupees');
      assert.ok(rightEdges.every(edge => Math.abs(edge.row - edge.text) < 0.5), 'Every list amount stays right-aligned during motion');
    }
    const outSlot = page.locator('[data-cashflow-total="out"]');
    const average = page.locator('[data-cashflow-average]');
    // Always mounted now, so the overview PARKS it transparent and 8px low
    // instead of unmounting it. That is what lets it transition both ways
    // (user call 2026-09-22: rise + fade in arriving, slide down + fade out
    // leaving). An unmounted element cannot animate out.
    assert.equal(await average.count(), 1);
    const averageParked = await average.evaluate(el => ({ opacity: Number(getComputedStyle(el).opacity), offset: new DOMMatrixReadOnly(getComputedStyle(el).transform).m42 }));
    assert.ok(averageParked.opacity === 0 && Math.abs(averageParked.offset - 8) < 0.5, `Overview parks the average transparent and 8px low: ${JSON.stringify(averageParked)}`);
    const chartGeometry = await page.locator('[data-cashflow-chart]').boundingBox();
    const dividerGeometry = await page.locator('[data-cashflow-divider]').boundingBox();
    const checkCashflowGeometry = async () => {
      const c = await page.locator('[data-cashflow-chart]').boundingBox(), d = await page.locator('[data-cashflow-divider]').boundingBox();
      for (const key of ['y', 'height']) assert.ok(Math.abs(c[key] - chartGeometry[key]) < 0.5, `Chart frame ${key} stays fixed`);
      assert.ok(Math.abs(d.y - dividerGeometry.y) < 0.5, 'Divider stays fixed');
      assert.equal(await page.locator('[data-cashflow-header]').evaluate(el => el.clientHeight), 84);
    };
    const startX = await outSlot.evaluate(el => el.getBoundingClientRect().x);
    await page.evaluate(() => { window.qaOutflowNode = document.querySelector('[data-cashflow-total="out"]'); });
    await page.evaluate(() => {
      // The live text of a whole figure: its cells' own characters, in order.
      // textContent would include the outgoing ghost a roll stacks in a cell.
      window.qaRunText = (el) => Array.from(el.querySelectorAll('[data-cashflow-figure] [data-roll-cell]')).map(c => c.dataset.ch).join('');
      window.qaHeaderFrames = []; window.qaHeaderStop = false;
      const tick = () => {
        const el = document.querySelector('[data-cashflow-total="out"]');
        const avg = document.querySelector('[data-cashflow-average]');
        window.qaHeaderFrames.push({ x: el.getBoundingClientRect().x, text: window.qaRunText(el), opacity: Number(getComputedStyle(el.querySelector('[data-cashflow-ink]')).opacity), blur: getComputedStyle(el.querySelector('[data-cashflow-ink]')).filter, avgOffset: avg ? new DOMMatrixReadOnly(getComputedStyle(avg).transform).m42 : null });
        if (!window.qaHeaderStop) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.getByRole('button', { name: 'View Outflow', exact: true }).click(); await page.waitForTimeout(240);
    const midX = await outSlot.evaluate(el => el.getBoundingClientRect().x);
    const averageMid = await average.evaluate(el => ({ y: el.getBoundingClientRect().y, opacity: Number(getComputedStyle(el).opacity) }));
    await page.waitForTimeout(760);
    const finishX = await outSlot.evaluate(el => el.getBoundingClientRect().x);
    const averageEnd = await average.evaluate(el => ({ y: el.getBoundingClientRect().y, opacity: Number(getComputedStyle(el).opacity) }));
    // The average line rises 8px and fades in as it arrives, and reverses that
    // exactly on the way out (user call 2026-09-22). Sampled 240ms into a 480ms
    // transition it must be PART-WAY on both channels: a jump would already be
    // home, and the previous revision of this file asserted precisely that.
    assert.ok(averageMid.y > averageEnd.y && averageMid.y - averageEnd.y <= 8.5, `Average rises into place from 8px below: ${JSON.stringify({averageMid,averageEnd})}`);
    assert.ok(averageMid.opacity > 0 && averageMid.opacity < 1 && averageEnd.opacity === 1, `Average fades in while it rises: ${JSON.stringify({averageMid,averageEnd})}`);
    const handoff = await page.evaluate(() => { window.qaHeaderStop = true; return window.qaHeaderFrames; });
    const firstAverage = handoff.find(f => f.avgOffset !== null);
    assert.ok(firstAverage && firstAverage.avgOffset > 0 && firstAverage.avgOffset <= 8.5, `Average starts 8px below its own height: ${JSON.stringify(firstAverage)}`);
    assert.ok(Math.abs(handoff[handoff.length - 1].avgOffset) < 0.5, 'Average finishes level with its own height');
    assert.ok(handoff.some(f => /[KL]$/.test(f.text) && f.x < startX - 1), 'Compact number begins moving before the precision changes');
    assert.ok(handoff.some(f => !/[KL]$/.test(f.text) && f.x > finishX + 1 && f.blur !== 'none' && f.blur !== 'blur(0px)'), 'Full figure appears during the subtly blurred zoom');
    const formatChange = handoff.find((f, i) => i > 0 && f.text !== handoff[i - 1].text && !/[KL]$/.test(f.text));
    assert.ok(formatChange && formatChange.opacity >= 0.65 && formatChange.opacity < 0.9, 'Precision changes under soft focus while staying visible');
    assert.ok(handoff.every(f => f.opacity >= 0.65), 'Selected heading never disappears');
    await checkCashflowGeometry();
    assert.ok(startX > midX && midX > finishX, 'Outflow moves continuously from the right column to the centre');
    assert.ok(await page.evaluate(() => window.qaOutflowNode === document.querySelector('[data-cashflow-total="out"]')), 'Header stays the same live element');
    const heights = await strip.evaluate(el => Array.from(el.querySelectorAll('div')).filter(node => node.style.backgroundImage.includes('linear-gradient') && parseFloat(node.style.width) > 0).map(node => node.getBoundingClientRect().height));
    assert.ok(Math.max(...heights) >= 147 && Math.max(...heights) <= 149, 'Outflow uses its own vertical scale');
    const timing = await outSlot.locator('[data-cashflow-figure]').evaluate(el => getComputedStyle(el).transitionDuration);
    assert.ok(timing.split(', ').every(duration => duration === '0.48s'), 'Heading shares the quicker 480ms bar-morph duration');
    await page.getByLabel('Food & drinks spends', { exact: true }).click(); await page.waitForTimeout(800);
    await checkCashflowGeometry();
    const foodBars = await strip.evaluate(el => Array.from(el.querySelectorAll('div')).filter(node => node.style.backgroundImage.includes('linear-gradient') && parseFloat(node.style.width) > 0).map(node => ({ height: node.getBoundingClientRect().height, fill: node.style.backgroundImage })));
    assert.ok(foodBars.every(bar => bar.fill.includes('255, 132, 0')), 'Food bars use the category orange');
    assert.notDeepEqual(foodBars.map(bar => bar.height), heights, 'Category has its own monthly pattern');
    await back(); await page.waitForTimeout(800);
    await back(); await page.waitForTimeout(800);
    await checkCashflowGeometry();
    assert.ok(Math.abs(startX - await outSlot.evaluate(el => el.getBoundingClientRect().x)) < 0.5, 'Back returns Outflow to its original column');
    assert.equal(await page.locator('[data-re1-page="trip"] .re1-fluid-text').count(), 6);
    for (const name of ['Inflow', 'Investments']) {
      if (name === 'Investments') await page.evaluate(() => {
        window.qaInvestFrames = []; window.qaInvestStop = false;
        const tick = () => {
          const el = document.querySelector('[data-cashflow-total="invest"]');
          window.qaInvestFrames.push({ text: window.qaRunText(el), label: el.querySelector('[data-cashflow-label]').textContent, opacity: Number(getComputedStyle(el.querySelector('[data-cashflow-ink]')).opacity) });
          if (!window.qaInvestStop) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await page.getByRole('button', { name: `View ${name}`, exact: true }).click(); await page.waitForTimeout(720);
      await checkCashflowGeometry();
      if (name === 'Investments') {
        const frames = await page.evaluate(() => { window.qaInvestStop = true; return window.qaInvestFrames; });
        const change = frames.find((f, i) => i > 0 && f.label !== frames[i - 1].label);
        assert.ok(change && change.label === 'Investments' && !/[KL]$/.test(change.text) && change.opacity >= 0.65 && change.opacity < 0.9, 'Invest label and amount change together without a blank midpoint');
      }
      await back(); await page.waitForTimeout(720);
    }
    await back();
    for (let i = 0; i < 16; i++) {
      await page.waitForTimeout(40);
      assert.ok(Math.abs(await blur.evaluate(el => Number(getComputedStyle(el).opacity)) - Math.min(1, savedHomeScroll / 48)) < 0.01, 'Home blur is restored from the first return frame');
    }
    await page.getByLabel('Upcoming payments details', { exact: true }).click(); await page.waitForTimeout(650);
    assert.ok(await page.locator('[data-upcoming-row]').evaluateAll(rows => rows.every(row => {
      const avatar = row.children[0].getBoundingClientRect(), text = row.children[1].getBoundingClientRect();
      return Math.abs(text.left - avatar.right - 12) < 0.5;
    })), 'Upcoming payment text is 12px from the avatar');
    await back(); await page.waitForTimeout(550);
    await page.locator('[data-re1-page="home"]').evaluate(el => { el.scrollTop = 0; });
    await page.getByLabel('Budget details', { exact: true }).click(); await page.waitForTimeout(650);
    assert.equal(await page.locator('[data-re1-page="trip"] [data-budget-progress]').evaluate(el => getComputedStyle(el).animationName), 'none', 'Budget progress opens at its actual value, without an intro animation');
    await page.locator('[data-re1-page="trip"]').evaluate(el => { el.scrollTop = 24; }); await page.waitForTimeout(50);
    assert.equal(await blur.evaluate(el => getComputedStyle(el).opacity), '0.5', 'L1 uses the same 48px ramp');
    await checkRenderedBlur(page.locator('[data-re1-page="trip"]'));
    const blurHeight = await blur.evaluate(el => el.clientHeight);
    await page.getByLabel('Ask cosimo', { exact: true }).click(); await page.waitForTimeout(850);
    const bounds = await frame.boundingBox(), surface = await page.locator('[data-re1-chat-surface]').boundingBox();
    for (const key of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(bounds[key] - surface[key]) < 1, `Full-frame budget chat: ${key}`);
    assert.equal(blurHeight - await blur.evaluate(el => el.clientHeight), 16);
    if (mobile) assert.ok(await page.getByLabel('Message cosimo', { exact: true }).evaluate(el => el === document.activeElement));
    await page.getByText("Let's set up a goal", { exact: true }).click();
    await page.getByText('Save for something', { exact: true }).click();
    const dock = page.locator('[data-re1-setup-dock]');
    await dock.getByText("Yes, it's my salary", { exact: true }).waitFor(); await page.waitForTimeout(400);
    const sent = await page.locator('[data-re1-user-message]').count();
    const parked = await page.locator('[data-re1-chat-thread]').evaluate(el => el.scrollTop);
    await dock.getByText("Yes, it's my salary", { exact: true }).click();
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(40);
      assert.ok(Math.abs(await page.locator('[data-re1-chat-thread]').evaluate(el => el.scrollTop) - parked) < 1, 'Dock resize never jerks the parked scan');
    }
    assert.equal(await page.locator('[data-re1-user-message]').count(), sent, 'Sheet answers stay out of history');
    await dock.getByText("No, that's my old job", { exact: true }).click();
    await dock.getByText('Looks right', { exact: true }).click();
    await dock.getByText('Rent', { exact: true }).click();
    await dock.getByText('No, take it out', { exact: true }).click();
    await dock.getByText('Looks right', { exact: true }).click();
    await page.getByText('₹12,000', { exact: true }).click();
    await page.getByText('Nothing else', { exact: true }).waitFor();
    await page.getByText('Nothing else', { exact: true }).click();
    let previous = await page.locator('[data-re1-chat-thread]').evaluate(el => el.scrollTop);
    for (let i = 0; i < 35; i++) {
      await page.waitForTimeout(40);
      const current = await page.locator('[data-re1-chat-thread]').evaluate(el => el.scrollTop);
      assert.ok(current >= previous - 1, 'Message entrance and loading-to-reply handoff never reverse scroll');
      previous = current;
    }
    const opacities = await page.locator('[data-re1-user-message] p').evaluateAll(elements => elements.map(el => getComputedStyle(el).opacity));
    assert.ok(opacities.length > 0 && opacities.every(value => value === '0.9'));
    assert.deepEqual(errors, []);
    console.log(`PASS: ${isWebKit ? 'WebKit' : 'Chrome'}, ${theme}, ${mobile ? 'mobile' : 'desktop'} — blur ramp, full-screen chat, scan stability, sent text, bank pointer/return, currency identity, cashflow scale/timing`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
