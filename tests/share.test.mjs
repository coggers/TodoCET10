import { chromium } from 'playwright';
const BASE=process.env.BASE_URL||(process.env.BASE_URL||'http://127.0.0.1:8080');
const IOS='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
const b=await chromium.launch();

const installed = () => ({ viewport:{width:390,height:844}, userAgent:IOS, locale:'en-GB' });

// ---- not installed: install mode, and it is VISIBLE ----
{
  const c=await b.newContext(installed());
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  ok(await p.locator('#install').isVisible(), 'not installed: button visible');
  ok(await p.locator('#install').getAttribute('data-mode')==='install', 'mode=install');
  ok((await p.locator('#install').textContent()).includes('Add to Home Screen'), 'labelled for install');
  await c.close();
}

// ---- installed: share mode, visible, and sharing works ----
{
  const c=await b.newContext(installed());
  await c.addInitScript(()=>{
    Object.defineProperty(navigator,'standalone',{get:()=>true});
    window.__shared=null;
    Object.defineProperty(navigator,'share',{value:async d=>{window.__shared=d;},configurable:true});
  });
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  ok(await p.locator('#install').isVisible(), 'installed: button is visible (the reported problem)');
  ok(await p.locator('#install').getAttribute('data-mode')==='share', 'installed: mode=share');
  const label=(await p.locator('#install').textContent()).trim();
  ok(label.includes('Share'), `installed: labelled "${label}"`);

  await p.locator('#install').click(); await p.waitForTimeout(400);
  const shared=await p.evaluate(()=>window.__shared);
  ok(!!shared, 'tapping calls the native share sheet');
  ok(shared.url && shared.url.startsWith('http'), `shares a URL (${shared?.url})`);
  ok(!shared.url.includes('#'), 'URL has no fragment');
  ok(shared.title==='CET10 Hub', `share title "${shared?.title}"`);
  ok(shared.text && shared.text.length>20, `share text present ("${shared?.text?.slice(0,40)}…")`);
  ok(!(await p.locator('#installDialog').evaluate(d=>d.open)), 'share mode does not open the install dialog');
  await c.close();
}

// ---- installed, no Web Share API: falls back to clipboard + confirmation ----
{
  const c=await b.newContext({...installed(), permissions:['clipboard-read','clipboard-write']});
  await c.addInitScript(()=>{
    Object.defineProperty(navigator,'standalone',{get:()=>true});
    Object.defineProperty(navigator,'share',{value:undefined,configurable:true});
    window.__copied=null;
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.__copied=t;}},configurable:true});
  });
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.locator('#install').click(); await p.waitForTimeout(300);
  ok(((await p.evaluate(()=>window.__copied)) ?? '').startsWith('http'), 'no share API: copies the link instead');
  ok((await p.locator('#install').textContent()).includes('Link copied'), 'shows a copied confirmation');
  await p.waitForTimeout(2400);
  ok((await p.locator('#install').textContent()).includes('Share'), 'confirmation reverts to Share');
  await c.close();
}

// ---- share cancelled must not break anything ----
{
  const c=await b.newContext(installed());
  await c.addInitScript(()=>{
    Object.defineProperty(navigator,'standalone',{get:()=>true});
    Object.defineProperty(navigator,'share',{value:async()=>{throw new DOMException('cancel','AbortError');},configurable:true});
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{}},configurable:true});
  });
  const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.locator('#install').click(); await p.waitForTimeout(400);
  ok(errs.length===0, `cancelling the share sheet throws nothing (${errs.join('|')})`);
  ok(await p.locator('.gym').count()===3, 'app still fine after a cancelled share');
  await c.close();
}

// ---- translated in both modes ----
for (const [code, inst, shr] of [['ca','pantalla d’inici','Compartir'],['es','pantalla de inicio','Compartir'],['en','Home Screen','Share']]) {
  for (const [standalone, needle, mode] of [[false,inst,'install'],[true,shr,'share']]) {
    const c=await b.newContext(installed());
    if (standalone) await c.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
    const p=await c.newPage();
    await p.goto(BASE,{waitUntil:'networkidle'});
    await p.evaluate(l=>localStorage.setItem('cet10hub.lang',l), code);
    await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
    const txt=(await p.locator('#install').textContent()).trim();
    ok(txt.includes(needle), `${code}/${mode}: "${txt}"`);
    await c.close();
  }
}

await b.close();
console.log(fails?`\n${fails} FAILED`:'\nSHARE/INSTALL TESTS PASSED');
process.exit(fails?1:0);
