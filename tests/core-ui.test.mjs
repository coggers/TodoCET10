import { chromium } from 'playwright';
const BASE = (process.env.BASE_URL||'http://127.0.0.1:8080');
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const b = await chromium.launch();
let fails = 0;
const ok = (c, m) => { console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c) fails++; };

// ---------- 1. base render, no errors ----------
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, userAgent:IOS });
const p = await ctx.newPage();
const errors=[];
p.on('pageerror', e=>errors.push(e.message));
p.on('console', m=>{ if(m.type()==='error') errors.push('console: '+m.text()); });
await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(700);
ok(errors.length===0, `no page errors ${errors.length?JSON.stringify(errors.slice(0,3)):''}`);
ok(await p.locator('.gym').count()===3, 'three gym cards');

// ---------- 2. quick book row ----------
const qb = await p.$$eval('.quickbook__pill', els=>els.map(a=>({t:a.textContent.trim(), h:a.href, bg:getComputedStyle(a).backgroundColor})));
ok(qb.length===3, `quick-book row has 3 pills`);
ok(await p.locator('.quickbook__panel').count()===1, 'quick-book sits in its own separated panel');
ok(qb.every(x=>x.h.endsWith('/reserva-clases')), 'every quick-book pill goes to /reserva-clases');
ok(new Set(qb.map(x=>x.bg)).size===3, `quick-book pills use 3 distinct accents`);
ok(qb.map(x=>x.t).join(',')==='Bac de Roda,Júpiter,Maresme', `default order: ${qb.map(x=>x.t).join(', ')}`);

// ---------- 3. reception chip ----------
const chips = await p.$$eval('.gym', els=>els.map(el=>[...el.querySelectorAll('.chip')].map(a=>a.getAttribute('href'))));
ok(chips.every(c=>c.length===7), `7 secondary chips per card (got ${chips[0].length})`);
const rec = await p.$$eval('.chip', els=>els.map(a=>a.getAttribute('href')).filter(h=>h.includes('atenciousuari')));
ok(rec.length===3 && rec.every(h=>h.endsWith('/hc/ca')), `3 virtual-reception links → ${rec[0]}`);
ok(new Set(rec).size===3, 'each card links its own reception host');

// ---------- 4. status badge ----------
const st = await p.$$eval('.status', els=>els.map(el=>({
  pill: el.querySelector('.status__pill').textContent.trim(),
  cls: el.querySelector('.status__pill').className,
  hasInfo: !!el.querySelector('.status__info'),
})));
ok(st.length===3, 'status badge on every card');
ok(st.every(s=>/--(open|soon|closed)/.test(s.cls)), `status classes ok: ${st.map(s=>s.cls.split('--')[1]).join(',')}`);
ok(st.every(s=>s.hasInfo), 'info button on every card');
console.log('   badges:', st.map(s=>s.pill).join(' | '));

// ---------- 5. info dialog ----------
await p.locator('.status__info').first().click();
await p.waitForTimeout(300);
ok(await p.locator('#infoDialog').evaluate(d=>d.open), 'info dialog opens');
const bodyText = await p.locator('#infoBody').textContent();
ok(/summer|maintenance/i.test(bodyText), 'dialog explains it can be wrong');
ok((await p.locator('#infoPortal').getAttribute('href')).includes('deporsite.net'), 'dialog links the portal');
await p.locator('#infoClose').click(); await p.waitForTimeout(250);
ok(!(await p.locator('#infoDialog').evaluate(d=>d.open)), 'info dialog closes');

// ---------- 6. privacy copy visible before any tap ----------
const note = (await p.locator('#sortNote').textContent()).trim();
ok(/never sent anywhere/i.test(note), `privacy line shown up-front: "${note.slice(0,60)}…"`);
ok(await p.locator('#sortNote').isVisible(), 'privacy line is visible without interacting');

await ctx.close();

// ---------- 7. distance sort, two positions ----------
for (const [name, coords, expected] of [
  ['near Maresme', {latitude:41.4099, longitude:2.2094}, 'Maresme'],
  ['near Bac de Roda', {latitude:41.4143, longitude:2.1941}, 'Bac de Roda'],
]) {
  const c = await b.newContext({ viewport:{width:390,height:844}, permissions:['geolocation'], geolocation:coords, userAgent:IOS });
  const pg = await c.newPage();
  await pg.goto(BASE,{waitUntil:'networkidle'});
  await pg.locator('#sort').click();
  await pg.waitForFunction(()=>document.querySelector('#sort')?.getAttribute('aria-pressed')==='true', {timeout:8000}).catch(()=>{});
  await pg.waitForTimeout(400);
  const first = (await pg.locator('.gym__name').first().textContent()).replace('CEM','').trim();
  const dists = await pg.$$eval('.status__distance', e=>e.map(x=>x.textContent));
  ok(first===expected, `${name} → nearest first = ${first} (distances ${dists.join(', ')})`);
  ok(dists.length===3, `${name} → distance shown on all 3 cards`);
  const qbOrder = await pg.$$eval('.quickbook__pill', e=>e.map(x=>x.textContent.trim()));
  ok(qbOrder.join(',')==='Bac de Roda,Júpiter,Maresme',
    `${name} → quick-book row stays fixed for muscle memory (${qbOrder.join(', ')})`);
  if (name==='near Maresme') await pg.screenshot({ path:'v2-sorted.png', fullPage:true });
  await c.close();
}

// ---------- 8. denial falls back gracefully ----------
{
  const c = await b.newContext({ viewport:{width:390,height:844}, userAgent:IOS });
  await c.grantPermissions([]); // no geolocation
  const pg = await c.newPage();
  await pg.goto(BASE,{waitUntil:'networkidle'});
  await pg.locator('#sort').click();
  await pg.waitForTimeout(2500);
  const first = (await pg.locator('.gym__name').first().textContent()).replace('CEM','').trim();
  const note2 = await pg.locator('#sortNote').textContent();
  ok(first==='Bac de Roda', `denied → original order kept (first = ${first})`);
  ok(/Could not get your location/i.test(note2), `denied → explains why ("${note2.trim().slice(0,45)}…")`);
  ok(await pg.locator('#sort').getAttribute('aria-pressed')==='false', 'denied → button not left in pressed state');
  await c.close();
}

// ---------- 9. language persistence across reload ----------
{
  const c = await b.newContext({ viewport:{width:390,height:844}, locale:'en-GB' });
  const pg = await c.newPage();
  await pg.goto(BASE,{waitUntil:'networkidle'});
  await pg.locator('.lang[lang="ca"]').click(); await pg.waitForTimeout(200);
  ok((await pg.locator('.btn--primary').first().textContent()).trim()==='Reservar classes', 'switching to Catalan applies immediately');
  await pg.reload({waitUntil:'networkidle'}); await pg.waitForTimeout(400);
  const after = (await pg.locator('.btn--primary').first().textContent()).trim();
  ok(after==='Reservar classes', `Catalan survives reload (got "${after}")`);
  ok(await pg.getAttribute('html','lang')==='ca', 'html lang persists as ca');
  const sortLbl = (await pg.locator('#sort').textContent()).trim();
  ok(/prop|cerca|nearest/i.test(sortLbl), `new UI is translated too ("${sortLbl}")`);
  const openLbl = (await pg.locator('#openNow').textContent()).trim();
  ok(/obert/i.test(openLbl), `open-now button translated ("${openLbl}")`);
  await c.close();
}

// ---------- 10. timezone independence ----------
{
  const badges = {};
  for (const tz of ['Europe/Madrid','America/New_York','Asia/Tokyo']) {
    const c = await b.newContext({ viewport:{width:390,height:844}, timezoneId: tz, locale:'en-GB' });
    const pg = await c.newPage();
    await pg.goto(BASE,{waitUntil:'networkidle'}); await pg.waitForTimeout(400);
    badges[tz] = (await pg.$$eval('.status__pill', e=>e.map(x=>x.textContent.trim()))).join(' | ');
    await c.close();
  }
  const unique = new Set(Object.values(badges));
  ok(unique.size===1, `badge identical across device timezones (${unique.size} variant(s))`);
  console.log('   ', badges['Asia/Tokyo']);
}

// ---------- 11. no horizontal scroll / tap targets ----------
{
  for (const [w,h,label] of [[390,844,'iPhone'],[412,915,'Pixel']]) {
    const c = await b.newContext({ viewport:{width:w,height:h} });
    const pg = await c.newPage();
    await pg.goto(BASE,{waitUntil:'networkidle'}); await pg.waitForTimeout(300);
    const s = await pg.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth}));
    ok(s.sw<=s.cw+1, `${label} no horizontal scroll (${s.sw}<=${s.cw})`);
    const small = await pg.$$eval('a.btn, a.chip, button.lang, a.quickbook__pill, #sort', els=>els
      .filter(e=>!e.closest('dialog:not([open])'))
      .filter(e=>e.getBoundingClientRect().height<36)
      .map(e=>e.textContent.trim().slice(0,20)));
    ok(small.length===0, `${label} tap targets >= 36px ${small.length?JSON.stringify(small):''}`);
    // the info glyph is deliberately 20px; assert its *hit area* is 44px via hit-testing
    const hit = await pg.evaluate(() => {
      const btn = document.querySelector('.status__info');
      const r = btn.getBoundingClientRect();
      const probe = (dx, dy) => document.elementFromPoint(r.left + r.width/2 + dx, r.top + r.height/2 + dy) === btn;
      return { size: r.width, up: probe(0,-19), down: probe(0,19), left: probe(-19,0), right: probe(19,0) };
    });
    ok(hit.up && hit.down && hit.left && hit.right,
      `${label} info glyph is ${hit.size}px but hit area reaches +/-19px on all sides`);
    if (label==='Pixel') await pg.screenshot({ path:'v2-android.png', fullPage:true });
    await c.close();
  }
}

// ---------- 12. dark mode ----------
{
  const c = await b.newContext({ viewport:{width:390,height:844}, colorScheme:'dark', deviceScaleFactor:2 });
  const pg = await c.newPage();
  await pg.goto(BASE,{waitUntil:'networkidle'}); await pg.waitForTimeout(500);
  ok(await pg.evaluate(()=>getComputedStyle(document.body).backgroundColor)==='rgb(15, 27, 34)','dark background');

  await c.close();
}

// ---------- 13. manifest + icons ----------
{
  const c = await b.newContext(); const pg = await c.newPage();
  const mf = await (await pg.request.get(`${BASE}/manifest.webmanifest`)).json();
  ok(mf.background_color==='#0E2733', `manifest background_color = ${mf.background_color}`);
  ok(mf.theme_color==='#61B4E4', 'theme_color still brand blue');
  for (const i of mf.icons) ok((await pg.request.get(`${BASE}/${i.src}`)).ok(), `${i.src} 200`);
  ok((await pg.request.get(`${BASE}/assets/img/apple-touch-icon.png`)).ok(),'apple-touch-icon 200');
  await c.close();
}

// ---- search engines are kept out while the photos are being replaced ----
{
  const c=await b.newContext(); const p=await c.newPage();
  const r=await p.request.get(`${BASE}/robots.txt`);
  ok(r.ok(), `robots.txt is served (${r.status()})`);
  const body=await r.text();
  ok(/User-agent:\s*\*/i.test(body), 'robots.txt targets all agents');
  ok(/Disallow:\s*\/\s*$/m.test(body), 'robots.txt disallows everything');

  await p.goto(BASE,{waitUntil:'domcontentloaded'});
  const meta=await p.getAttribute('meta[name="robots"]','content');
  ok(/noindex/i.test(meta ?? ''), `noindex meta present (${meta})`);

  // The deploy copies a fixed file list into _site; a root file missing from
  // that list silently never ships. That is the failure this guards.
  const { readFileSync } = await import('node:fs');
  const wf = readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  ok(/cp -r [^\n]*\brobots\.txt\b/.test(wf), 'robots.txt is on the deploy copy list');
  await c.close();
}

await b.close();
console.log(fails? `\n${fails} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
process.exit(fails?1:0);
