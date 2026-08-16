import { chromium } from 'playwright';
const BASE=process.env.BASE_URL||(process.env.BASE_URL||'http://127.0.0.1:8080');
let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
const b=await chromium.launch();
const base={viewport:{width:390,height:844},locale:'en-GB'};

// ---- 1. footer links ----
{
  const c=await b.newContext(base); const p=await c.newPage();
  await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  const links=await p.$$eval('.footer-link',e=>e.map(x=>({t:x.textContent.trim(),href:x.getAttribute('href'),tag:x.tagName})));
  ok(links.length===3, `three footer links (${links.map(l=>l.t).join(', ')})`);
  ok(links.some(l=>/privacy/i.test(l.t)), 'privacy notice is linked from the footer');
  const repo=links.find(l=>l.tag==='A');
  ok(repo && repo.href==='https://github.com/coggers/TodoCET10', `repo link points at the repo (${repo?.href})`);
  ok(await p.locator('.footer-link[target="_blank"]').count()===1, 'repo link opens in a new tab');
  ok(links.some(l=>/feedback/i.test(l.t)), 'a feedback entry point exists');

  await c.close();
}

// ---- 2. no key configured -> GitHub fallback, never a dead form ----
{
  const c=await b.newContext(base);
  // Blank the key to exercise the fallback, whatever is actually shipped.
  await c.route('**/assets/data/feedback.js', async route => {
    const body=(await (await fetch(`${BASE}/assets/data/feedback.js`)).text())
      .replace(/export const ACCESS_KEY = '[^']*';/, "export const ACCESS_KEY = '';");
    route.fulfill({status:200, contentType:'text/javascript', body});
  });
  const p=await c.newPage();
  await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.locator('.footer-link').first().click(); await p.waitForTimeout(400);
  ok(await p.locator('#feedbackDialog').evaluate(d=>d.open), 'feedback dialog opens');
  ok(!(await p.locator('#feedbackForm').isVisible()), 'unconfigured: form is hidden, not broken');
  ok(await p.locator('#feedbackFallback').isVisible(), 'unconfigured: GitHub fallback shown');
  const href=await p.locator('#feedbackIssues').getAttribute('href');
  ok(href==='https://github.com/coggers/TodoCET10/issues/new', `fallback links to a new issue (${href})`);

  await p.locator('#feedbackFallbackClose').click(); await p.waitForTimeout(300);
  ok(!(await p.locator('#feedbackDialog').evaluate(d=>d.open)), 'dialog closes');
  await c.close();
}

// ---- 3. with a key: full form behaviour ----
const withKey = async (ctx) => {
  await ctx.route('**/assets/data/feedback.js', async route => {
    const body = (await (await fetch(`${BASE}/assets/data/feedback.js`)).text())
      .replace(/export const ACCESS_KEY = '[^']*';/, "export const ACCESS_KEY = 'test-key-1234';");
    route.fulfill({status:200, contentType:'text/javascript', body});
  });
};
{
  const c=await b.newContext(base); await withKey(c);
  let posted=null;
  let postHeaders=null;
  await c.route('https://api.web3forms.com/submit', route=>{
    posted=JSON.parse(route.request().postData());
    postHeaders=route.request().headers();
    route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true})});
  });
  const p=await c.newPage(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.locator('.footer-link').first().click(); await p.waitForTimeout(400);
  ok(await p.locator('#feedbackForm').isVisible(), 'configured: the form is shown');
  ok(!(await p.locator('#feedbackFallback').isVisible()), 'configured: no GitHub fallback');
  ok(/Only what you type/i.test(await p.locator('#feedbackPrivacy').textContent()), 'states plainly what is sent');

  // block the captcha script (no network in tests) and stub a solved token
  await p.route('https://web3forms.com/client/script.js', r=>r.fulfill({status:200,contentType:'text/javascript',body:''}));
  const solve = () => p.evaluate(() => {
    let ta = document.querySelector('textarea[name="h-captcha-response"]');
    if (!ta) { ta = document.createElement('textarea'); ta.name='h-captcha-response'; ta.hidden=true;
               document.getElementById('feedbackForm').append(ta); }
    ta.value = 'stub-captcha-token';
  });

  // empty submit is blocked with a message, not a silent no-op
  await p.locator('#feedbackSend').click(); await p.waitForTimeout(300);
  ok(await p.locator('#feedbackError').isVisible(), 'empty message is rejected visibly');
  ok(posted===null, 'nothing posted for an empty message');

  // an unsolved captcha must also block, before any network call
  await p.locator('#feedbackMessage').fill('The Maresme dot is wrong on Sundays');
  await p.locator('#feedbackSend').click(); await p.waitForTimeout(300);
  ok(posted===null, 'unsolved captcha blocks the submission');
  ok(/robot/i.test(await p.locator('#feedbackError').textContent()), 'and says why');

  await solve();
  await p.locator('#feedbackContact').fill('someone@example.com');
  await p.locator('#feedbackSend').click(); await p.waitForTimeout(600);
  ok(!!posted, 'submitting posts to the endpoint');
  ok(posted.access_key==='test-key-1234', 'sends the access key');
  ok(posted.message==='The Maresme dot is wrong on Sundays', 'sends the message verbatim');
  ok(posted.email==='someone@example.com', 'sends the optional reply address');
  ok(posted.language==='en', 'includes the UI language so replies match');
  ok(posted['h-captcha-response']==='stub-captcha-token', 'sends the hCaptcha token');
  const keys=Object.keys(posted).sort();
  ok(!keys.some(k=>/location|coords|lat|lon|favourite|userAgent/i.test(k)),
    `no personal or usage data attached (${keys.join(', ')})`);
  // The page-wide no-referrer policy also nulls Origin, which Web3Forms' free
  // tier uses to reject non-client-side posts. This call must opt back in.
  ok(!!(postHeaders?.referer || postHeaders?.origin),
    `submission identifies its origin (referer=${postHeaders?.referer ?? 'none'})`);
  const refPath = postHeaders?.referer ? new URL(postHeaders.referer).pathname : '/';
  ok(refPath === '/', `referer is origin-only, no path leaked (path=${refPath})`);
  ok(await p.locator('#feedbackDone').isVisible(), 'shows a thank-you');
  await p.waitForTimeout(1800);
  ok(!(await p.locator('#feedbackDialog').evaluate(d=>d.open)), 'closes itself afterwards');
  await c.close();
}

// ---- 4. network failure is surfaced, not swallowed ----
{
  const c=await b.newContext(base); await withKey(c);
  await c.route('https://api.web3forms.com/submit', route=>route.abort());
  const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.locator('.footer-link').first().click(); await p.waitForTimeout(300);
  await p.route('https://web3forms.com/client/script.js', r=>r.fulfill({status:200,contentType:'text/javascript',body:''}));
  await p.locator('#feedbackMessage').fill('test');
  await p.evaluate(() => { const ta=document.createElement('textarea'); ta.name='h-captcha-response';
    ta.hidden=true; ta.value='stub'; document.getElementById('feedbackForm').append(ta); });
  await p.locator('#feedbackSend').click(); await p.waitForTimeout(700);
  ok(await p.locator('#feedbackError').isVisible(), 'failure shows an error');
  ok(/Could not send/i.test(await p.locator('#feedbackError').textContent()), 'error explains what to do');
  ok(await p.locator('#feedbackSend').isEnabled(), 'send button re-enabled so it can be retried');
  ok((await p.locator('#feedbackMessage').inputValue())==='test', 'the typed message is not lost');
  ok(errs.length===0, `no uncaught errors (${errs.join('|')})`);
  await c.close();
}

// ---- 5. translations ----
for (const [code, needle] of [['ca','Codi font'],['es','Código fuente'],['en','Source code']]) {
  const c=await b.newContext(base); const p=await c.newPage();
  await p.goto(BASE,{waitUntil:'networkidle'});
  await p.evaluate(l=>localStorage.setItem('cet10hub.lang',l),code);
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
  const txt=await p.$$eval('.footer-link',e=>e.map(x=>x.textContent.trim()).join(' | '));
  ok(txt.includes(needle), `${code}: "${txt}"`);
  await c.close();
}

// ---- 6. the shipped configuration is live, not a placeholder ----
{
  const src = await (await fetch(`${BASE}/assets/data/feedback.js`)).text();
  const key = src.match(/export const ACCESS_KEY = '([^']*)';/)?.[1] ?? '';
  ok(/^[0-9a-f-]{36}$/.test(key), `a real access key is configured (${key ? key.slice(0,8)+'…' : 'EMPTY'})`);
  const c=await b.newContext(base); const p=await c.newPage();
  await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.locator('.footer-link').first().click(); await p.waitForTimeout(400);
  ok(await p.locator('#feedbackForm').isVisible(), 'the shipped app shows the real form, not the fallback');
  await c.close();
}

await b.close();
console.log(fails?`\n${fails} FAILED`:'\nFEEDBACK TESTS PASSED');
process.exit(fails?1:0);
