// 先啟動 npm run preview；此測試用虛擬時間驗證行為，不是效能驗收。
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const executablePath = process.env.PINBALL_CHROMIUM_PATH;
const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), headless: true });
const results = [];
await mkdir('work/validation', { recursive: true });
try {
  for (const dpr of [1, 1.25, 1.5, 2]) {
    const context = await browser.newContext({ viewport: { width: 260, height: 420 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.install();
    await page.goto('http://127.0.0.1:1421');
    await page.waitForFunction(() => document.querySelector('#status').textContent.includes('瀏覽器預覽'));
    await page.clock.runFor(1200);
    assert.equal(await page.locator('#metrics').isHidden(), true);
    assert.equal(await page.locator('#minimize').isDisabled(), true);
    assert.equal(await page.locator('#close').isDisabled(), true);
    const canvas = await page.locator('canvas').evaluate((c) => ({
      width: c.width, height: c.height, logicalWidth: c.getBoundingClientRect().width,
      logicalHeight: c.getBoundingClientRect().height,
      alpha: c.getContext('2d').getImageData(0, 0, 1, 1).data[3],
      root: getComputedStyle(document.body).backgroundColor,
      overflow: document.documentElement.scrollHeight > 420 || document.documentElement.scrollWidth > 260,
    }));
    assert.equal(canvas.width, Math.round(260 * dpr)); assert.equal(canvas.height, Math.round(284 * dpr));
    assert.equal(canvas.logicalWidth, 260); assert.equal(canvas.logicalHeight, 284);
    assert.equal(canvas.alpha, 0); assert.equal(canvas.root, 'rgba(0, 0, 0, 0)'); assert.equal(canvas.overflow, false);
    await page.locator('#debug').check(); await page.clock.runFor(600);
    const tick = async () => Number((await page.locator('#metrics').textContent()).match(/tick (\d+)/)[1]);
    assert.ok(await tick() > 0);
    assert.ok(Number((await page.locator('#metrics').textContent()).match(/碰釘 (\d+)/)[1]) > 0);
    await page.locator('#pause').click(); await page.clock.runFor(600);
    const frozenTick = await tick();
    await page.clock.runFor(10_000); assert.equal(await tick(), frozenTick);
    await page.locator('#pause').click(); await page.clock.runFor(600);
    assert.ok(await tick() > frozenTick); assert.ok(await tick() < frozenTick + 50);
    await page.locator('#hz').selectOption('120'); await page.clock.runFor(600);
    assert.match(await page.locator('#metrics').textContent(), /120 Hz/);
    await page.locator('#drop').click(); await page.clock.runFor(1200);
    assert.ok(await tick() < 180);
    await page.screenshot({ path: `work/validation/browser-dpr-${dpr}.png`, omitBackground: true });
    if (dpr === 1) {
      await page.locator('#capture').click(); await page.clock.runFor(1000);
      await page.locator('#pause').click();
      assert.equal(await page.locator('#export').isDisabled(), true);
      assert.equal(await page.locator('#capture').isDisabled(), false);
      await page.locator('#pause').click(); await page.locator('#hz').selectOption('60');
      await page.locator('#capture').click();
      await page.clock.runFor(11_000);
      await page.locator('#drop').click(); await page.clock.runFor(60_000);
      await page.locator('#drop').click(); await page.clock.runFor(60_000);
      assert.equal(await page.locator('#export').isDisabled(), false);
      const downloadPromise = page.waitForEvent('download'); await page.locator('#export').click();
      const download = await downloadPromise; await download.saveAs('work/validation/browser-capture-synthetic.json');
      const data = JSON.parse(await readFile('work/validation/browser-capture-synthetic.json', 'utf8'));
      assert.equal(data.mode, 'browser'); assert.equal(data.hz, 60); assert.equal(data.buildMode, 'production');
      assert.ok(data.durationMs >= 120_000); assert.ok(data.statistics.frame.count > 7000);
      assert.ok(data.statistics.physics.count > 7000); assert.equal(data.manualDrops, 2);
    }
    assert.deepEqual(errors, []);
    results.push({ dpr, result: 'PASS', canvas, pageErrors: errors });
    await context.close();
  }
  const report = { browser: browser.version(), playwright: '1.62.1', clock: 'synthetic', performanceEvidence: false, results };
  await writeFile('work/validation/browser-smoke.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
