import { chromium } from 'playwright';
import { statusFor } from '../assets/data/hours.js';
const BASE=process.env.BASE_URL||(process.env.BASE_URL||'http://127.0.0.1:8080');
const IOS='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
const b=await chromium.launch();
const states=Object.fromEntries(['bdr','jupiter','maresme'].map(id=>[id,statusFor(id).state]));
console.log('   states now:', JSON.stringify(states));
const ALPHA='Bac de Roda,Júpiter,Maresme';
const names=p=>p.$$eval('.gym__name',e=>e.map(x=>x.textContent.replace('CEM','').trim()));
const qb=p=>p.$$eval('.quickbook__pill',e=>e.map(x=>({
  name:x.textContent.trim(),
  dot:[...x.classList].join(' '),
  dotState:(x.querySelector('.quickbook__dot')?.className.match(/--(\w+)/)||[])[1],
  dimmed:x.classList.contains('quickbook__pill--dimmed'),
  opacity:parseFloat(getComputedStyle(x).opacity),
  pointer:getComputedStyle(x).pointerEvents,
  href:x.getAttribute('href'),
})));

const c=await b.newContext({viewport:{width:390,height:844},userAgent:IOS,
  permissions:['geolocation'],geolocation:{latitude:41.4099,longitude:2.2094}});
const p=await c.newPage();
await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(600);

// ---- 1. alphabetical default ----
ok((await names(p)).join(',')===ALPHA, `list default is alphabetical (${(await names(p)).join(', ')})`);
ok((await qb(p)).map(x=>x.name).join(',')===ALPHA, `quick book is alphabetical (${(await qb(p)).map(x=>x.name).join(', ')})`);

// favourite still pins above, rest stay alphabetical
await p.locator('.fav[data-gym="maresme"]').click(); await p.waitForTimeout(400);
ok((await names(p)).join(',')==='Maresme,Bac de Roda,Júpiter',
  `favourite pins on top, remainder alphabetical (${(await names(p)).join(', ')})`);
ok((await qb(p)).map(x=>x.name).join(',')===ALPHA, 'quick book stays alphabetical regardless of favourite');
await p.locator('.fav[data-gym="maresme"]').click(); await p.waitForTimeout(400);

// ---- 2. status dot in quick book ----
const rows=await qb(p);
ok(rows.every(r=>!!r.dotState), `every pill has a status dot (${rows.map(r=>r.dotState).join(', ')})`);
const byName={'Bac de Roda':'bdr','Júpiter':'jupiter','Maresme':'maresme'};
ok(rows.every(r=>r.dotState===states[byName[r.name]]),
  'dot state matches the card status for each centre');
const dotStyle=await p.evaluate(()=>{const d=document.querySelector('.quickbook__dot');const s=getComputedStyle(d);
  const card=getComputedStyle(document.querySelector('.status__pill'),'::before');
  return {w:s.width,h:s.height,radius:s.borderTopLeftRadius,shadow:s.boxShadow,cardW:card.width};});
ok(dotStyle.w==='7px'&&dotStyle.h==='7px', `dot is small and dot-sized (${dotStyle.w})`);
ok(dotStyle.shadow==='none', `dot has no outline (${dotStyle.shadow})`);
ok(dotStyle.w===dotStyle.cardW, `dot matches the card status dot (${dotStyle.w} vs ${dotStyle.cardW})`);
const dotText=await p.evaluate(()=>document.querySelector('.quickbook__dot').textContent);
ok(dotText==='', 'dot carries no text — just the dot');
// distinct colours per state
const colours=await p.evaluate(()=>['open','soon','closed'].map(s=>{
  const el=document.createElement('span'); el.className=`quickbook__dot quickbook__dot--${s}`;
  document.body.append(el); const c=getComputedStyle(el).backgroundColor; el.remove(); return c;}));
ok(new Set(colours).size===3, `three distinct dot colours (${colours.join(' / ')})`);

// ---- 3. dimmed when the filter is on, but still live ----
ok((await qb(p)).every(r=>!r.dimmed), 'nothing dimmed before filtering');
await p.locator('#openNow').click(); await p.waitForTimeout(500);
const after=await qb(p);
const shouldDim=after.filter(r=>states[byName[r.name]]==='closed');
const didDim=after.filter(r=>r.dimmed);
ok(didDim.length===shouldDim.length && didDim.every(r=>states[byName[r.name]]==='closed'),
  `closed centres dimmed while filtering (${didDim.map(r=>r.name).join(', ')||'none'})`);
ok(after.filter(r=>states[byName[r.name]]!=='closed').every(r=>!r.dimmed), 'open centres are not dimmed');
ok(after.length===3, 'all three still present in quick book');
for (const r of didDim) {
  ok(r.opacity<1 && r.opacity>0, `${r.name} visually dimmed (opacity ${r.opacity})`);
  ok(r.pointer!=='none', `${r.name} still receives taps (pointer-events: ${r.pointer})`);
  ok(!!r.href && r.href.endsWith('/reserva-clases'), `${r.name} keeps a working booking link`);
}
// prove a dimmed pill is genuinely clickable
if (didDim.length) {
  const target=didDim[0].name;
  const el=p.locator('.quickbook__pill--dimmed').first();
  ok(await el.isEnabled(), `${target} reports enabled`);
  const hit=await p.evaluate(()=>{const el=document.querySelector('.quickbook__pill--dimmed');
    const r=el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(r.left+r.width/2, r.top+r.height/2));});
  ok(hit, `${target} is hit-testable at its centre — dimmed, not disabled`);
}


await p.locator('#reset').click(); await p.waitForTimeout(400);
ok((await qb(p)).every(r=>!r.dimmed), 'reset clears the dimming');

await c.close(); await b.close();
console.log(fails?`\n${fails} FAILED`:'\nALPHA/DOT/DIM TESTS PASSED');
process.exit(fails?1:0);
