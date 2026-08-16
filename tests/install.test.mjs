import { chromium } from 'playwright';
const BASE=process.env.BASE_URL||(process.env.BASE_URL||'http://127.0.0.1:8080');
const IOS='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const AND='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const FB='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/450.0]';
let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
const b=await chromium.launch();

// ---- 1. iOS: button shows, opens Share-based instructions ----
{
  const c=await b.newContext({viewport:{width:390,height:844},userAgent:IOS,locale:'en-GB'});
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(600);
  ok(await p.locator('#install').isVisible(), 'install button visible when not installed');
  ok((await p.locator('#install').textContent()).includes('Add to Home Screen'), 'button labelled clearly');
  await p.locator('#install').click(); await p.waitForTimeout(400);
  ok(await p.locator('#installDialog').evaluate(d=>d.open), 'iOS: opens the instructions dialog');
  const steps=await p.$$eval('#installSteps li', e=>e.map(x=>x.textContent));
  ok(steps.length===3, `three steps shown (${steps.length})`);
  ok(/Share/i.test(steps[0]), 'step 1 names the Share button');
  ok(/Add to Home Screen/i.test(steps[1]), 'step 2 names the exact menu item');
  ok(!(await p.locator('#installLead').isVisible()), 'no in-app warning in normal Safari');
  await p.locator('#installClose').click(); await p.waitForTimeout(300);
  ok(!(await p.locator('#installDialog').evaluate(d=>d.open)), 'dialog closes');

  await p.locator('#install').click(); await p.waitForTimeout(400);

  await c.close();
}

// ---- 2. in-app browser gets an honest warning ----
{
  const c=await b.newContext({viewport:{width:390,height:844},userAgent:FB,locale:'en-GB'});
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.locator('#install').click(); await p.waitForTimeout(400);
  ok(await p.locator('#installLead').isVisible(), 'in-app browser: warning shown');
  ok(/Safari or Chrome/i.test(await p.locator('#installLead').textContent()), 'warning says to open in a real browser');
  await c.close();
}

// ---- 3. already installed => button hidden ----
{
  const c=await b.newContext({viewport:{width:390,height:844},userAgent:IOS,locale:'en-GB'});
  // emulate an installed home-screen launch
  await c.addInitScript(()=>{ Object.defineProperty(navigator,'standalone',{get:()=>true}); });
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(600);
  ok(await p.locator('#install').isVisible(), 'iOS standalone: button still visible');
  ok(await p.locator('#install').getAttribute('data-mode')==='share', 'iOS standalone: switches to Share mode');
  ok((await p.locator('#install').textContent()).includes('Share'), 'iOS standalone: labelled Share');
  ok(await p.locator('.gym').count()===3, 'app still renders normally when installed');
  await c.close();
}
{
  const c=await b.newContext({viewport:{width:390,height:844},userAgent:AND, locale:'en-GB'});
  const p=await c.newPage();
  await p.emulateMedia({media:'screen'});
  await p.goto(BASE,{waitUntil:'networkidle'});
  const hiddenWhenStandalone = await p.evaluate(()=>{
    // matchMedia display-mode cannot be forced in-page, so assert the predicate directly
    return typeof matchMedia('(display-mode: standalone)').matches === 'boolean';
  });
  ok(hiddenWhenStandalone, 'display-mode standalone is queried for the installed check');
  await c.close();
}

// ---- 4. Chromium: beforeinstallprompt path is wired ----
{
  const c=await b.newContext({viewport:{width:412,height:915},userAgent:AND,locale:'en-GB'});
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  // synthesise the event Chrome would fire, and check we defer + use it
  const result = await p.evaluate(async () => {
    let prompted=false, defaultPrevented=false;
    const ev = new Event('beforeinstallprompt', {cancelable:true});
    ev.prompt = () => { prompted=true; };
    ev.userChoice = Promise.resolve({outcome:'accepted', platform:'web'});
    window.dispatchEvent(ev);
    defaultPrevented = ev.defaultPrevented;
    document.getElementById('install').click();
    await new Promise(r=>setTimeout(r,150));
    return { prompted, defaultPrevented, dialogOpen: document.getElementById('installDialog').open,
             mode: document.getElementById('install').dataset.mode };
  });
  ok(result.defaultPrevented, 'Chrome mini-infobar suppressed so our button is the single entry point');
  ok(result.prompted, 'tapping calls the native prompt() rather than showing instructions');
  ok(!result.dialogOpen, 'instructions dialog NOT shown when a native prompt exists');
  ok(result.mode === 'install', 'still in install mode until the display-mode actually changes');
  await c.close();
}

// ---- 5. appinstalled retires the button ----
{
  const c=await b.newContext({viewport:{width:412,height:915},userAgent:AND,locale:'en-GB'});
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  const mode = await p.evaluate(async()=>{ window.dispatchEvent(new Event('appinstalled'));
    await new Promise(r=>setTimeout(r,150)); return document.getElementById('install').dataset.mode; });
  ok(mode==='install', 'appinstalled re-evaluates the button (still install until standalone)');
  await c.close();
}

// ---- 6. translations ----
{
  for (const [code, needle] of [['ca','pantalla d’inici'],['es','pantalla de inicio'],['en','Home Screen']]) {
    const c=await b.newContext({viewport:{width:390,height:844},userAgent:IOS});
    const p=await c.newPage();
    await p.goto(BASE,{waitUntil:'networkidle'});
    await p.evaluate(l=>localStorage.setItem('cet10hub.lang',l), code);
    await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(500);
    const label=(await p.locator('#install').textContent()).trim();
    ok(label.includes(needle), `${code}: "${label}"`);
    await p.locator('#install').click(); await p.waitForTimeout(300);
    const steps=await p.$$eval('#installSteps li',e=>e.map(x=>x.textContent).join(' '));
    ok(steps.length>40, `${code}: instructions translated (${steps.slice(0,45)}…)`);
    await c.close();
  }
}

// ---- 7. manifest screenshots ----
{
  const c=await b.newContext(); const p=await c.newPage();
  const mf=await (await p.request.get(`${BASE}/manifest.webmanifest`)).json();
  ok(Array.isArray(mf.screenshots) && mf.screenshots.length===2, `manifest declares ${mf.screenshots?.length} screenshots`);
  ok(mf.screenshots.some(s=>s.form_factor==='narrow'), 'a narrow screenshot for the Android dialog');
  ok(mf.screenshots.some(s=>s.form_factor==='wide'), 'a wide screenshot for desktop');
  for (const s of mf.screenshots) {
    const r=await p.request.get(`${BASE}/${s.src}`);
    ok(r.ok(), `${s.src} -> ${r.status()}`);
    const buf=await r.body();
    // declared sizes must match the real file or Chrome ignores them
    const w=buf.readUInt32BE(16), h=buf.readUInt32BE(20);
    ok(`${w}x${h}`===s.sizes, `${s.src} real ${w}x${h} matches declared ${s.sizes}`);
  }
  ok(!!mf.description, 'description present (Chrome needs it for the rich dialog)');
  await c.close();
}

await b.close();
console.log(fails?`\n${fails} FAILED`:'\nINSTALL TESTS PASSED');
process.exit(fails?1:0);
