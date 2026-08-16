import { chromium } from 'playwright';
import { statusFor } from '../assets/data/hours.js';
const BASE=process.env.BASE_URL||(process.env.BASE_URL||'http://127.0.0.1:8080');
const IOS='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
const b = await chromium.launch();
const openIds=['bdr','jupiter','maresme'].filter(id=>statusFor(id).state!=='closed');
console.log('   open right now:', openIds.join(', ')||'(none)');

const names = p => p.$$eval('.gym__name', e=>e.map(x=>x.textContent.replace('CEM','').trim()));
const qbNames = p => p.$$eval('.quickbook__pill', e=>e.map(x=>x.textContent.trim()));

const ctx = await b.newContext({viewport:{width:390,height:844},userAgent:IOS,
  permissions:['geolocation'], geolocation:{latitude:41.4099,longitude:2.2094}}); // by Maresme
const p = await ctx.newPage();
await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);

// ---- 1. star toggle ----
ok(await p.locator('.fav').count()===3, 'a star on every card');
ok((await p.$$eval('.fav',e=>e.map(x=>x.getAttribute('aria-pressed')))).every(v=>v==='false'), 'nothing starred initially');
ok((await names(p)).join(',')==='Bac de Roda,Júpiter,Maresme', 'default order to start');

// star Maresme (last card)
await p.locator('.fav[data-gym="maresme"]').click(); await p.waitForTimeout(400);
ok((await names(p))[0]==='Maresme', `favourite pinned to top (${(await names(p)).join(', ')})`);
ok(await p.locator('.fav[data-gym="maresme"]').getAttribute('aria-pressed')==='true', 'star shows as set');
ok(await p.$$eval('.fav',e=>e.filter(x=>x.getAttribute('aria-pressed')==='true').length)===1, 'only one favourite at a time');

// ---- 2. quick book: starred but NOT reordered, and shows all three ----
ok(qbNames(p).then, 'quick-book present');
const qb1 = await qbNames(p);
ok(qb1.join(',')==='Bac de Roda,Júpiter,Maresme', `quick book keeps its fixed order (${qb1.join(', ')})`);
ok(await p.locator('.quickbook__pill--fav').count()===1, 'exactly one quick-book pill is marked favourite');
ok((await p.locator('.quickbook__pill--fav').textContent()).includes('Maresme'), 'the starred pill is the favourite');
ok(await p.locator('.quickbook__star').count()===1, 'star icon appears in quick book');

// switching favourite moves the star, not the pills
await p.locator('.fav[data-gym="bdr"]').click(); await p.waitForTimeout(400);
ok((await qbNames(p)).join(',')==='Bac de Roda,Júpiter,Maresme', 'quick-book order still fixed after changing favourite');
ok((await p.locator('.quickbook__pill--fav').textContent()).includes('Bac de Roda'), 'star moved to the new favourite');
ok((await names(p))[0]==='Bac de Roda', 'list re-pins to the new favourite');

// ---- 3. sort overrides the favourite ----
await p.locator('#sort').click();
await p.waitForFunction(()=>document.querySelector('#sort')?.getAttribute('aria-pressed')==='true',{timeout:8000}).catch(()=>{});
await p.waitForTimeout(500);
const sorted = await names(p);
ok(sorted[0]==='Maresme', `sorting overrides the favourite (${sorted.join(', ')})`);
ok(await p.locator('.fav[data-gym="bdr"]').getAttribute('aria-pressed')==='true', 'favourite still set while sorted');
ok((await qbNames(p)).join(',')==='Bac de Roda,Júpiter,Maresme', 'sorting does not touch quick book');

// ---- 4. reset restores the favourite pin, keeps the favourite ----
ok(await p.locator('#reset').isVisible(), 'reset appears once a sort is active');
await p.locator('#reset').click(); await p.waitForTimeout(400);
ok((await names(p))[0]==='Bac de Roda', 'reset restores favourite-first order');
ok(await p.locator('.fav[data-gym="bdr"]').getAttribute('aria-pressed')==='true', 'reset does NOT clear the favourite');
ok(!(await p.locator('#reset').isVisible()), 'reset hides again once nothing is active');
ok(await p.locator('#sort').getAttribute('aria-pressed')==='false', 'reset clears the sort state');

// ---- 5. filter overrides the favourite, quick book unaffected ----
await p.locator('#openNow').click(); await p.waitForTimeout(400);
const filtered = await names(p);
ok(filtered.length===openIds.length, `filter applies to the list (${filtered.length} of 3)`);
ok((await qbNames(p)).length===3, 'filter does NOT apply to quick book — all three stay');
ok(await p.locator('#reset').isVisible(), 'reset appears for a filter too');
await p.locator('#reset').click(); await p.waitForTimeout(400);
ok((await names(p)).length===3 && (await names(p))[0]==='Bac de Roda', 'reset clears the filter and re-pins favourite');
ok(await p.locator('.fav[data-gym="bdr"]').getAttribute('aria-pressed')==='true', 'favourite survived the filter cycle');

// ---- 6. persistence ----
await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(600);
ok(await p.locator('.fav[data-gym="bdr"]').getAttribute('aria-pressed')==='true', 'favourite persists across reload');
ok((await names(p))[0]==='Bac de Roda', 'pin persists across reload');
const store = await p.evaluate(()=>({fav:localStorage.getItem('cet10hub.favourite'), sort:localStorage.getItem('cet10hub.sort'), open:localStorage.getItem('cet10hub.openNow')}));
ok(store.fav==='bdr' && !store.sort && !store.open, `stored in localStorage: ${JSON.stringify(store)}`);

// ---- 7. un-starring ----
await p.locator('.fav[data-gym="bdr"]').click(); await p.waitForTimeout(400);
ok((await names(p)).join(',')==='Bac de Roda,Júpiter,Maresme', 'un-starring returns to the plain default order');
ok(await p.locator('.quickbook__pill--fav').count()===0, 'no starred pill in quick book once cleared');
ok(await p.evaluate(()=>localStorage.getItem('cet10hub.favourite'))===null, 'favourite cleared from storage');

// ---- 8. tap targets ----
const favBox = await p.evaluate(()=>{const r=document.querySelector('.fav').getBoundingClientRect(); return {w:r.width,h:r.height};});
ok(favBox.w>=44 && favBox.h>=44, `star hit area ${favBox.w}x${favBox.h}`);

await ctx.close();
await b.close();
console.log(fails?`\n${fails} FAILED`:'\nFAVOURITE TESTS PASSED');
process.exit(fails?1:0);
