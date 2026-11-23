/* Store screenshots straight from the running app.  Usage:  node scripts/make-screenshots.js http://localhost:8123/
 * Needs Playwright (npx playwright install chromium).  Output: store/screenshots/<device>/NN-name.jpg */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const URL = process.argv[2] || 'http://localhost:8123/index.html';
const OUT = path.resolve(__dirname, '..', 'store', 'screenshots');
const DEVICES = {
  'iphone-6.7in-1290x2796': { w: 430, h: 932, s: 3 },
  'ipad-13in-2048x2732': { w: 1024, h: 1366, s: 2 },
  'android-phone-1080x1920': { w: 360, h: 640, s: 3 }
};
(async () => {
  const br = await chromium.launch(); fs.mkdirSync(OUT, { recursive: true });
  for (const [name, d] of Object.entries(DEVICES)) {
    const ctx = await br.newContext({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: d.s, hasTouch: true, serviceWorkers: 'block' });
    const pg = await ctx.newPage(); pg.on('dialog', x => x.accept());
    await pg.addInitScript(() => { localStorage.setItem('fkbc_v31_access', '1'); localStorage.setItem('fkbc_v31_access:coach', 'joe'); });
    await pg.goto(URL); await pg.waitForTimeout(900);
    const dir = path.join(OUT, name); fs.mkdirSync(dir, { recursive: true });
    const shot = async n => { await pg.waitForTimeout(600); await pg.screenshot({ path: path.join(dir, n + '.jpg'), type: 'jpeg', quality: 88 }); };
    await shot('01-home');
    await pg.evaluate(() => {
      state.lesson = { name: 'Tuesday Kickboxing', style: 'kickboxing', leadCoach: 'joe', notes: '', sections: [
        { ...newSection('work', 'Warm Up'), title: 'Skipping, mobility, shadow boxing', mins: 8 },
        { ...newSection('work', 'Technique'), title: 'Jab, cross, hook', coach: 'paul', mode: 'partner', roundCount: 3, techniques: 'Jab\nJab – Cross\nJab – Cross – Hook' },
        newSection('break'),
        { ...newSection('work', 'Grading'), belt: 'Red', title: 'Red belt grading', coach: 'jack', mode: 'rounds', roundCount: 4, techniques: 'Lead hook\nRear roundhouse\nKnee strike\nParry and return' },
        { ...newSection('work', 'Cool Down'), title: 'Stretch + breathing', coach: 'gracie', mins: 5 }] };
      persist(); showView('planner'); renderPlanner();
    });
    await shot('02-planner');
    await pg.evaluate(() => { document.querySelectorAll('.sec2')[3].scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); });
    await shot('03-grading-section');
    await pg.evaluate(() => { state.libStyle = 'kickboxing'; state.libCat = 'Pad Work'; showView('library'); renderLibrary(); }); await shot('04-library');
    await pg.evaluate(() => { showView('planner'); startLesson(); }); await pg.waitForTimeout(1500); await shot('05-timer');
    await ctx.close();
  }
  await br.close(); console.log('screenshots saved to', OUT);
})();
