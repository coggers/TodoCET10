import { chromium } from 'playwright';
const BASE=process.env.BASE_URL||(process.env.BASE_URL||'http://127.0.0.1:8080');
let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
const b=await chromium.launch();

const freeze = iso => `(() => { const fixed = new Date('${iso}').getTime(); const R = Date;
  Date = class extends R { constructor(...a){ return a.length ? new R(...a) : new R(fixed); } static now(){ return fixed; } }; })()`;

async function open(iso, locale='en-GB') {
  const c = await b.newContext({viewport:{width:390,height:844}, locale});
  await c.addInitScript({content: freeze(iso)});
  const p = await c.newPage();
  await p.goto(BASE,{waitUntil:'networkidle'});
  await p.waitForTimeout(500);
  return {c,p};
}

// ---- Friday: notice shown, under quick book ----
{
  const {c,p} = await open('2026-08-21T12:00:00Z'); // Friday 14:00 Barcelona
  ok(await p.locator('#bookingNotice').isVisible(), 'Friday: notice is shown');
  const text = await p.locator('#bookingNotice').textContent();
  ok(/Friday/i.test(text), 'names the day');
  ok(/48 hours|weekend/i.test(text), 'explains the weekend/48h reason');
  ok(/normally|usually|may/i.test(text), 'hedged, not stated as fact');
  // position: below quick book, above the toolbar
  const pos = await p.evaluate(()=>{
    const q=document.querySelector('#quickbook').getBoundingClientRect();
    const n=document.querySelector('#bookingNotice').getBoundingClientRect();
    const t=document.querySelector('.toolbar').getBoundingClientRect();
    return {belowQuickBook:n.top>=q.bottom-1, aboveToolbar:n.bottom<=t.top+1};
  });
  ok(pos.belowQuickBook, 'sits below the quick-book panel');
  ok(pos.aboveToolbar, 'sits above the sort/filter toolbar');
  ok(await p.locator('#bookingNotice').getAttribute('role')==='note', 'exposed as a note to assistive tech');
  const noScroll = await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1);
  ok(noScroll, 'no horizontal overflow with the notice present');


  await c.close();
}

// ---- other days: hidden ----
for (const [iso, day] of [
  ['2026-08-17T12:00:00Z','Monday'], ['2026-08-20T12:00:00Z','Thursday'],
  ['2026-08-22T12:00:00Z','Saturday'], ['2026-08-23T12:00:00Z','Sunday'],
]) {
  const {c,p} = await open(iso);
  ok(!(await p.locator('#bookingNotice').isVisible()), `${day}: notice hidden`);
  await c.close();
}

// ---- translated ----
for (const [code, needle] of [['ca','divendres'],['es','viernes'],['en','Friday']]) {
  const c = await b.newContext({viewport:{width:390,height:844}});
  await c.addInitScript({content: freeze('2026-08-21T12:00:00Z')});
  const p = await c.newPage();
  await p.goto(BASE,{waitUntil:'networkidle'});
  await p.evaluate(l=>localStorage.setItem('cet10hub.lang',l), code);
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(500);
  const txt = await p.locator('#bookingNotice').textContent();
  ok(txt.toLowerCase().includes(needle.toLowerCase()), `${code}: "${txt.slice(0,58)}…"`);
  await c.close();
}

// ---- does not interfere with the rest of the UI ----
{
  const {c,p} = await open('2026-08-21T12:00:00Z');
  ok(await p.locator('.gym').count()===3, 'cards still render on Friday');
  ok((await p.$$eval('.quickbook__pill',e=>e.length))===3, 'quick book intact');
  await p.locator('#openNow').click(); await p.waitForTimeout(400);
  ok(await p.locator('#bookingNotice').isVisible(), 'notice survives filtering');
  await p.locator('#reset').click(); await p.waitForTimeout(300);
  ok(await p.locator('#bookingNotice').isVisible(), 'notice survives reset');
  await c.close();
}

await b.close();
console.log(fails?`\n${fails} FAILED`:'\nNOTICE UI TESTS PASSED');
process.exit(fails?1:0);
