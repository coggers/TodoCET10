import { chromium } from 'playwright';
const BASE=process.env.BASE_URL||(process.env.BASE_URL||'http://127.0.0.1:8080');
let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
const b=await chromium.launch();
const base={viewport:{width:390,height:844},locale:'en-GB'};

// ---- 1. the notice exists, is reachable and is complete ----
{
  const c=await b.newContext(base); const p=await c.newPage();
  await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  const links=await p.$$eval('.footer-link',e=>e.map(x=>x.textContent.trim()));
  ok(links.includes('Privacy'), `privacy link in footer (${links.join(' | ')})`);
  await p.getByRole('button',{name:'Privacy'}).click(); await p.waitForTimeout(400);
  ok(await p.locator('#privacyDialog').evaluate(d=>d.open), 'notice opens');
  const headings=await p.$$eval('.privacy__heading',e=>e.map(x=>x.textContent));
  ok(headings.length===7, `${headings.length} sections`);
  const text=(await p.locator('#privacyDialog').textContent()).toLowerCase();

  // Article 13 essentials
  for (const [needle,label] of [
    ['local storage','names the device storage used'],
    ['location','covers geolocation'],
    ['web3forms','names the form processor'],
    ['hcaptcha','names the spam-check third party'],
    ['30 days','states the retention period'],
    ['united states','discloses where the data goes'],
    ['eea','flags the transfer out of the EEA'],
    ['github pages','discloses the host and its logs'],
    ['ip address','mentions server-log IPs'],
    ['gdpr','cites the regulation'],
    ['aepd','names a supervisory authority'],
    ['deleted','covers erasure'],
    ['no analytics','states there is no analytics'],
    ['consent banner','explains why there is no banner'],
    ['cookie','discloses the captcha cookie'],
  ]) ok(text.includes(needle), `${label} ("${needle}")`);

  await p.locator('#privacyClose').click(); await p.waitForTimeout(300);
  ok(!(await p.locator('#privacyDialog').evaluate(d=>d.open)), 'notice closes');
  await c.close();
}

// ---- 2. stable URL ----
{
  const c=await b.newContext(base); const p=await c.newPage();
  await p.goto(`${BASE}/#privacy`,{waitUntil:'networkidle'}); await p.waitForTimeout(700);
  ok(await p.locator('#privacyDialog').evaluate(d=>d.open), '#privacy opens the notice directly');
  await p.locator('#privacyClose').click(); await p.waitForTimeout(300);
  ok(await p.evaluate(()=>location.hash)==='', 'closing clears the fragment so reload does not reopen');
  await c.close();
}

// ---- 3. still no consent-requiring behaviour ----
{
  const c=await b.newContext(base);
  const thirdParty=[];
  await c.route('**', route=>{
    const u=new URL(route.request().url());
    if (!['127.0.0.1','localhost'].includes(u.hostname)) thirdParty.push(u.hostname);
    route.continue();
  });
  const p=await c.newPage();
  await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(800);
  // Exercise everything except the feedback form: sorting, filtering, the
  // status dialog, the privacy notice, the share sheet.
  await p.locator('#openNow').click(); await p.waitForTimeout(300);
  await p.locator('#reset').click(); await p.waitForTimeout(300);
  await p.locator('.status__info').first().click(); await p.waitForTimeout(300);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.getByRole('button',{name:'Privacy'}).click(); await p.waitForTimeout(300);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(thirdParty.length===0, `no third-party requests while simply using the app (${[...new Set(thirdParty)].join(', ')||'none'})`);
  // The "no cookies" claim is about using the app, so measure it here — before
  // the user opts into the spam check, which sets one of its own.
  const cookiesBefore = await c.cookies();
  ok(cookiesBefore.length===0, `no cookies from using the app (${cookiesBefore.length})`);

  // Opening the feedback form is an opt-in, and may reach only the spam-check
  // and form hosts the privacy notice names.
  await p.getByRole('button',{name:'Send feedback'}).click(); await p.waitForTimeout(1200);
  const hosts=[...new Set(thirdParty)];
  const allowed=/^(web3forms\.com|.*\.?hcaptcha\.com|api\.web3forms\.com)$/;
  ok(hosts.length>0, `opening feedback does load the captcha (${hosts.join(', ')||'none'})`);
  ok(hosts.every(h=>allowed.test(h)), `and only disclosed hosts (${hosts.join(', ')})`);

  // Only now can the captcha have set anything. Assert any cookie belongs to a
  // host the notice names, so an undisclosed third party would fail the build.
  const cookiesAfter = await c.cookies();
  ok(cookiesAfter.every(k=>allowed.test(k.domain.replace(/^\./,''))),
    `any cookie set belongs to a disclosed host (${cookiesAfter.map(k=>k.domain).join(', ')||'none'})`);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  const stored=await p.evaluate(()=>Object.keys(localStorage));
  ok(stored.every(k=>k.startsWith('cet10hub.')), `only first-party preference keys (${stored.join(', ')})`);
  ok(stored.length<=4, `at most four preference keys (${stored.length})`);
  // First-party specifically: the captcha's cookie lives on its own domain, and
  // this site must still set none of its own.
  ok(await p.evaluate(()=>document.cookie)==='', 'this origin sets no cookie of its own');
  await c.close();
}

// ---- 4. translated ----
for (const [code,needle,heading] of [['ca','Privacitat','RGPD'],['es','Privacidad','RGPD'],['en','Privacy','GDPR']]) {
  const c=await b.newContext(base); const p=await c.newPage();
  await p.goto(BASE,{waitUntil:'networkidle'});
  await p.evaluate(l=>localStorage.setItem('cet10hub.lang',l),code);
  // Full reload: a hash-only navigation would not re-run the module.
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.evaluate(()=>{ location.hash='#privacy'; }); await p.waitForTimeout(500);
  const links=await p.$$eval('.footer-link',e=>e.map(x=>x.textContent.trim()));
  ok(links.includes(needle), `${code}: footer link "${needle}"`);
  ok((await p.locator('#privacyDialog').textContent()).includes(heading), `${code}: notice translated (mentions ${heading})`);
  await c.close();
}

// ---- 5. feedback disclosure names the processor ----
{
  const c=await b.newContext(base);
  await c.route('**/assets/data/feedback.js', async route=>{
    const body=(await (await fetch(`${BASE}/assets/data/feedback.js`)).text())
      .replace("export const ACCESS_KEY = '';","export const ACCESS_KEY = 'k';");
    route.fulfill({status:200,contentType:'text/javascript',body});
  });
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.locator('.footer-link').first().click(); await p.waitForTimeout(400);
  const note=await p.locator('#feedbackPrivacy').textContent();
  ok(/Web3Forms/i.test(note), 'form names the processor at the point of collection');
  ok(/EEA/i.test(note), 'form flags the transfer at the point of collection');
  await c.close();
}

await b.close();
console.log(fails?`\n${fails} FAILED`:'\nCOMPLIANCE TESTS PASSED');
process.exit(fails?1:0);
