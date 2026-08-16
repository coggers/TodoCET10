// Focused suite for the three new behaviours.
import { chromium } from 'playwright';
import { statusFor } from '../assets/data/hours.js';
const BASE=process.env.BASE_URL||(process.env.BASE_URL||'http://127.0.0.1:8080');
const IOS='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
const b = await chromium.launch();

const openIds = ['bdr','jupiter','maresme'].filter(id=>statusFor(id).state!=='closed');
console.log('   open right now:', openIds.join(', ') || '(none)');

// ---- 1. quick book separation ----
{
  const c = await b.newContext({viewport:{width:390,height:844},userAgent:IOS});
  const p = await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  const panel = await p.evaluate(()=>{
    const el = document.querySelector('.quickbook__panel'); if(!el) return null;
    const s = getComputedStyle(el), body = getComputedStyle(document.body);
    return { bg:s.backgroundColor, bodyBg:body.backgroundColor, border:s.borderTopWidth, radius:s.borderTopLeftRadius };
  });
  ok(!!panel, 'quick-book panel exists');
  ok(panel && panel.bg!==panel.bodyBg, `panel background differs from page (${panel?.bg} vs ${panel?.bodyBg})`);
  ok(panel && parseFloat(panel.border)>0, `panel has a border (${panel?.border})`);
  ok(panel && parseFloat(panel.radius)>0, `panel is rounded (${panel?.radius})`);
  await c.close();
}

// ---- 2. sort is an action, never an "original order" toggle ----
{
  const c = await b.newContext({viewport:{width:390,height:844},userAgent:IOS,permissions:['geolocation'],geolocation:{latitude:41.4099,longitude:2.2094}});
  const p = await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'});
  const before = (await p.locator('#sort').textContent()).trim();
  await p.locator('#sort').click();
  await p.waitForFunction(()=>document.querySelector('#sort')?.getAttribute('aria-pressed')==='true',{timeout:8000}).catch(()=>{});
  await p.waitForTimeout(400);
  const after = (await p.locator('#sort').textContent()).trim();
  ok(before===after, `label unchanged after sorting ("${before}") — no "original order" state`);
  ok(!/original/i.test(after), 'label never says "original order"');
  const first1 = (await p.locator('.gym__name').first().textContent()).replace('CEM','').trim();
  ok(first1==='Maresme', `sorted nearest-first (${first1})`);

  // move the device, tap again — must re-sort, not toggle back
  await c.setGeolocation({latitude:41.4143,longitude:2.1941});
  await p.locator('#sort').click();
  await p.waitForTimeout(1500);
  const first2 = (await p.locator('.gym__name').first().textContent()).replace('CEM','').trim();
  ok(first2==='Bac de Roda', `re-tapping after moving re-sorts (${first1} -> ${first2})`);
  ok(await p.locator('.gym').count()===3, 'still shows all centres after re-sort');
  await c.close();
}

// ---- 3. open-now filter ----
{
  const c = await b.newContext({viewport:{width:390,height:844},userAgent:IOS});
  const p = await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(400);
  ok(await p.locator('#openNow').count()===1, 'open-now button sits next to sort');
  const box = await p.evaluate(()=>{ const a=document.querySelector('#sort').getBoundingClientRect(), b=document.querySelector('#openNow').getBoundingClientRect(); return Math.abs(a.top-b.top)<4 && b.left>a.left; });
  ok(box, 'open-now is on the same row, to the right of sort');

  await p.locator('#openNow').click(); await p.waitForTimeout(400);
  ok(await p.locator('#openNow').getAttribute('aria-pressed')==='true', 'filter shows as active');
  const shown = await p.$$eval('.gym__name', e=>e.map(x=>x.textContent.replace('CEM','').trim()));
  ok(shown.length===openIds.length, `shows only open centres (${shown.length} of 3: ${shown.join(', ')})`);
  const closedShown = await p.$$eval('.status__pill', e=>e.filter(x=>x.className.includes('--closed')).length);
  ok(closedShown===0, 'no closed centre is listed while filtering');
  const qb = await p.$$eval('.quickbook__pill', e=>e.map(x=>x.textContent.trim()));
  ok(qb.length===3, `quick-book row ignores the filter, all three stay reachable (${qb.length})`);

  // persists across reload
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(500);
  ok(await p.locator('#openNow').getAttribute('aria-pressed')==='true', 'filter persists across reload');

  await p.locator('#openNow').click(); await p.waitForTimeout(400);
  ok(await p.locator('.gym').count()===3, 'turning the filter off restores all three');
  await c.close();
}

// ---- 4. empty state when nothing is open (03:00 Barcelona) ----
{
  const c = await b.newContext({viewport:{width:390,height:844},userAgent:IOS,locale:'en-GB'});
  // Freeze the clock at 03:00 CET, when every centre is shut.
  await c.addInitScript(() => {
    const fixed = new Date('2026-08-19T01:00:00Z').getTime(); // 03:00 Europe/Madrid
    const R = Date;
    // eslint-disable-next-line no-global-assign
    Date = class extends R { constructor(...a){ return a.length? new R(...a) : new R(fixed); } static now(){ return fixed; } };
  });
  const p = await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.locator('#openNow').click(); await p.waitForTimeout(400);
  ok(await p.locator('.gym').count()===0, 'at 03:00 nothing matches');
  ok(await p.locator('#empty').isVisible(), 'empty state is shown');
  ok(/No centre is open/i.test(await p.locator('#empty').textContent()), 'empty state explains why');
  ok(await p.locator('#quickbook').isVisible(), 'quick-book stays available even when nothing is open');
  ok((await p.$$eval('.quickbook__pill', e=>e.length))===3, 'all three remain bookable from quick book');
  await p.locator('.empty__clear').click(); await p.waitForTimeout(400);
  ok(await p.locator('.gym').count()===3, '"Show all" recovers from the empty state');
  await c.close();
}

await b.close();
console.log(fails?`\n${fails} FAILED`:'\nNEW-FEATURE TESTS PASSED');
process.exit(fails?1:0);
