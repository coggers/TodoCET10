import { chromium } from 'playwright';
const BASE=process.env.BASE_URL||(process.env.BASE_URL||'http://127.0.0.1:8080');
let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
const b=await chromium.launch();

// spy on startViewTransition so we can count real usage
const SPY = `(() => { window.__vt = 0; const orig = document.startViewTransition;
  if (orig) document.startViewTransition = function (cb) { window.__vt++; return orig.call(this, cb); }; })()`;

// ---- 1. dots: no ring, same size/colour as the card ----
{
  const c=await b.newContext({viewport:{width:390,height:844}});
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  const d=await p.evaluate(()=>{const s=getComputedStyle(document.querySelector('.quickbook__dot'));
    return {w:s.width,h:s.height,shadow:s.boxShadow,bg:s.backgroundColor};});
  ok(d.shadow==='none', `quick-book dot has no outline (box-shadow: ${d.shadow})`);
  ok(d.w==='7px'&&d.h==='7px', `dot is 7px, matching the card dot (${d.w})`);
  const cardDot=await p.evaluate(()=>{const el=document.querySelector('.status__pill');
    return getComputedStyle(el,'::before').width;});
  ok(cardDot===d.w, `same size as the card status dot (${cardDot})`);
  // same colour source for the same state
  const same=await p.evaluate(()=>{
    const pill=document.querySelector('.status__pill');
    const state=[...pill.classList].find(x=>x.startsWith('status__pill--')).split('--')[1];
    const cardColour=getComputedStyle(pill).color;
    const qbDot=document.querySelector(`.quickbook__dot--${state}`);
    return qbDot ? {state, cardColour, dotColour:getComputedStyle(qbDot).backgroundColor} : null;
  });
  if (same) ok(same.cardColour===same.dotColour,
    `'${same.state}' colour identical in both places (${same.dotColour})`);

  await c.close();
}

// ---- 2. view transitions fire on reorder/hide actions ----
{
  const c=await b.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference',
    permissions:['geolocation'],geolocation:{latitude:41.4099,longitude:2.2094}});
  await c.addInitScript({content:SPY});
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  ok(await p.evaluate(()=>typeof document.startViewTransition==='function'), 'browser supports View Transitions');
  ok(await p.evaluate(()=>window.__vt)===0, 'nothing animates on first paint');

  const names=await p.$$eval('.gym',e=>e.map(x=>getComputedStyle(x).viewTransitionName));
  ok(names.every(n=>n&&n!=='none'), `each card has a view-transition-name (${names.join(', ')})`);
  ok(new Set(names).size===3, 'names are unique so cards can be matched across a reorder');

  const step = async (label, action, expect) => {
    const before = await p.evaluate(()=>window.__vt);
    await action(); await p.waitForTimeout(700);
    const after = await p.evaluate(()=>window.__vt);
    ok(after-before===expect, `${label} -> ${after-before} transition(s)`);
  };
  await step('favourite toggle', ()=>p.locator('.fav[data-gym="maresme"]').click(), 1);
  await step('open-now filter',  ()=>p.locator('#openNow').click(), 1);
  await step('reset',            ()=>p.locator('#reset').click(), 1);
  await step('sort by distance', ()=>p.locator('#sort').click(), 1);

  // final state must still be correct after animating
  ok(await p.locator('.gym').count()===3, 'DOM correct after transitions');
  ok((await p.locator('.gym__name').first().textContent()).includes('Maresme'), 'sort result correct post-animation');
  await c.close();
}

// ---- 3. the minute tick must NOT animate ----
{
  const c=await b.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  await c.addInitScript({content:SPY});
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(400);
  const n = await p.evaluate(async()=>{
    const before=window.__vt;
    // invoke the same paths the timer and tab-focus use
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(r=>setTimeout(r,300));
    return window.__vt-before;
  });
  ok(n===0, `background refresh triggers no animation (${n})`);
  await c.close();
}

// ---- 4. reduced motion is honoured ----
{
  const c=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await c.addInitScript({content:SPY});
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.locator('#openNow').click(); await p.waitForTimeout(500);
  ok(await p.evaluate(()=>window.__vt)===0, 'reduced motion: startViewTransition never called');
  ok(await p.locator('#openNow').getAttribute('aria-pressed')==='true', 'reduced motion: the action still works');
  await c.close();
}

// ---- 5. graceful when the API is absent ----
{
  const c=await b.newContext({viewport:{width:390,height:844}});
  await c.addInitScript(()=>{ delete Document.prototype.startViewTransition;
    Object.defineProperty(document,'startViewTransition',{value:undefined,configurable:true}); });
  const p=await c.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.locator('#openNow').click(); await p.waitForTimeout(400);
  ok(errs.length===0, `no API: no errors ${errs.slice(0,2).join('|')}`);
  ok(await p.locator('#openNow').getAttribute('aria-pressed')==='true', 'no API: filter still applies');
  await p.locator('#reset').click(); await p.waitForTimeout(300);
  ok(await p.locator('.gym').count()===3, 'no API: reset still works');
  await c.close();
}

// ---- 6. durations are subtle, not showy ----
{
  const css = await (await fetch(`${BASE}/assets/css/styles.css`)).text();
  const durations=[...css.matchAll(/animation-duration:\s*(\d+)ms/g)].map(m=>+m[1]);
  ok(durations.length>0, `durations declared (${durations.join(', ')}ms)`);
  ok(durations.every(d=>d<=300), 'every duration is <= 300ms — subtle, not showy');
  ok(/prefers-reduced-motion: reduce[\s\S]*?animation: none/.test(css), 'reduced-motion CSS kill-switch present');
}

await b.close();
console.log(fails?`\n${fails} FAILED`:'\nMOTION + DOT TESTS PASSED');
process.exit(fails?1:0);
