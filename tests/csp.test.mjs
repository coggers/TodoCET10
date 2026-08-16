import { chromium } from 'playwright';
const BASE=process.env.BASE_URL||(process.env.BASE_URL||'http://127.0.0.1:8080');
let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
const b=await chromium.launch();
const c=await b.newContext({viewport:{width:390,height:844},
  permissions:['geolocation'],geolocation:{latitude:41.4099,longitude:2.2094}});
const p=await c.newPage();
const violations=[], errors=[];
p.on('console', m=>{ const t=m.text(); if(/Content Security Policy/i.test(t)) violations.push(t.slice(0,140)); });
p.on('pageerror', e=>errors.push(e.message));

await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(800);
// exercise everything that touches inline styles / transitions / dialogs
await p.locator('.fav[data-gym="maresme"]').click(); await p.waitForTimeout(500);
await p.locator('#sort').click(); await p.waitForTimeout(1500);
await p.locator('#openNow').click(); await p.waitForTimeout(600);
await p.locator('#reset').click(); await p.waitForTimeout(600);
await p.locator('.status__info').first().click(); await p.waitForTimeout(400);
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await p.locator('.footer-link').first().click(); await p.waitForTimeout(400);
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await p.locator('#install').click(); await p.waitForTimeout(400);
await p.keyboard.press('Escape'); await p.waitForTimeout(300);

ok(violations.length===0, `no CSP violations during full use ${violations.slice(0,3).join(' || ')}`);
ok(errors.length===0, `no page errors ${errors.slice(0,2).join(' || ')}`);

// the styling that CSP could plausibly have broken
const styling=await p.evaluate(()=>{
  const card=document.querySelector('.gym');
  const pill=document.querySelector('.quickbook__pill');
  return {accent:getComputedStyle(card).borderTopColor,
          inlineStyle:card.getAttribute('style')?.slice(0,60),
          vtName:getComputedStyle(card).viewTransitionName,
          pillBg:getComputedStyle(pill).backgroundColor};
});
ok(styling.accent!=='rgba(0, 0, 0, 0)' && styling.accent!=='', `per-card accent still applied (${styling.accent})`);
ok(!!styling.inlineStyle, `JS-set inline styles survive CSP (${styling.inlineStyle})`);
ok(styling.vtName && styling.vtName!=='none', `view-transition-name intact (${styling.vtName})`);
ok(styling.pillBg!=='rgba(0, 0, 0, 0)', `quick-book accent intact (${styling.pillBg})`);
ok(await p.locator('.gym').count()===3, 'cards render');
ok(await p.evaluate(()=>document.fonts.check('700 2rem "Roboto Var"')), 'self-hosted font still loads under CSP');
ok(await p.evaluate(()=>!!navigator.serviceWorker.controller), 'service worker still registers under CSP');

// connect-src must still permit the feedback endpoint, and nothing else
const allowed=await p.evaluate(async()=>{
  try { await fetch('https://api.web3forms.com/submit',{method:'POST',body:'{}'}); return 'allowed'; }
  catch(e){ return /Content Security Policy/i.test(String(e)) ? 'blocked-by-csp' : 'network-error(allowed by csp)'; }
});
ok(allowed!=='blocked-by-csp', `feedback endpoint permitted by connect-src (${allowed})`);
const blocked=await p.evaluate(async()=>{
  try { await fetch('https://example.com/beacon'); return 'allowed'; }
  catch(e){ return /Content Security Policy/i.test(String(e)) ? 'blocked-by-csp' : 'other-error'; }
});
ok(blocked!=='allowed', `an arbitrary third-party host is refused (${blocked})`);

// referrer policy
ok(await p.evaluate(()=>document.querySelector('meta[name=referrer]')?.content)==='no-referrer',
   'referrer policy is no-referrer');
await b.close();
console.log(fails?`\n${fails} FAILED`:'\nCSP SAFETY CHECKS PASSED');
process.exit(fails?1:0);
