import { chromium } from 'playwright';
import fs from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname.replace(/\/$/, '');

const BASE=process.env.BASE_URL||(process.env.BASE_URL||'http://127.0.0.1:8080'), FILE=ROOT+'/index.html';
const orig = fs.readFileSync(FILE,'utf8');
let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
const b = await chromium.launch();
const ctx = await b.newContext({viewport:{width:390,height:844}});
const p = await ctx.newPage();
try {
  // 1. first visit installs and activates the worker
  await p.goto(BASE,{waitUntil:'networkidle'});
  await p.evaluate(()=>navigator.serviceWorker.ready);
  await p.waitForFunction(()=>!!navigator.serviceWorker.controller, {timeout:10000});
  ok(true, 'service worker active and controlling the page');
  const v = await p.evaluate(async()=>(await caches.keys()));
  ok(v.includes('cet10hub-v3'), `cache is ${v.join(',')}`);

  // 2. offline still renders (cache fallback)
  await ctx.setOffline(true);
  await p.reload({waitUntil:'domcontentloaded'}).catch(()=>{});
  await p.waitForTimeout(600);
  ok(await p.locator('.gym').count()===3, 'renders offline from cache');
  await ctx.setOffline(false);

  // 3. THE regression: deploy a change, reload, must see new content
  fs.writeFileSync(FILE, orig.replace('</main>', '</main>\n<p id="deployMarker">v3-deployed</p>'));
  await p.reload({waitUntil:'networkidle'});
  await p.waitForTimeout(800);
  const marker = await p.locator('#deployMarker').count();
  ok(marker===1, `changed index.html reaches an installed client on reload (marker found: ${marker===1})`);

  // 4. a changed JS module, checked the way the app is really used: relaunch, not reload.
  // (An in-place reload can reuse Chromium's per-renderer module cache, which never
  // happens when reopening from the home screen.)
  const APP=ROOT+'/assets/js/app.js';
  const appOrig = fs.readFileSync(APP,'utf8');
  fs.writeFileSync(APP, appOrig.replace("const SORT_KEY = 'cet10hub.sort';", "const SORT_KEY = 'cet10hub.sort'; window.__deployProbe = 'fresh';"));
  await p.close();
  const p2 = await ctx.newPage();
  await p2.goto(BASE,{waitUntil:'networkidle'});
  await p2.waitForTimeout(900);
  ok(await p2.evaluate(()=>window.__deployProbe)==='fresh', 'changed app.js reaches an installed client on relaunch');
  ok(await p2.evaluate(()=>!!navigator.serviceWorker.controller), 'still SW-controlled after the update');
  fs.writeFileSync(APP, appOrig);
} finally {
  fs.writeFileSync(FILE, orig);
  await b.close();
}
console.log(fails?`\n${fails} FAILED`:'\nSW UPDATE TESTS PASSED');
process.exit(fails?1:0);
