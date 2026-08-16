/**
 * Simulates a runner that can actually reach the network.
 *
 * This exists because a bug shipped that passed locally and failed in CI: the
 * sandbox these tests were written in has no outbound network, so the real
 * hCaptcha widget never loaded and never injected its own — empty —
 * `h-captcha-response` textarea. Tests that appended a second textarea then
 * passed locally and failed on CI, where `querySelector` returned the real
 * empty one first.
 *
 * Rather than stub the widget away here, fake it faithfully: inject an empty
 * textarea and set a cookie, exactly as the real script does, and assert the
 * app behaves. No network required, so it holds on any runner.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
let fails = 0;
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fails++; };

/** What web3forms/client/script.js does, reduced to what matters to us. */
const FAKE_WIDGET = `
  (function () {
    document.cookie = "hcaptcha_sim=1; path=/";
    document.querySelectorAll('.h-captcha').forEach(function (el) {
      var ta = document.createElement('textarea');
      ta.name = 'h-captcha-response';
      ta.value = '';
      ta.hidden = true;
      el.appendChild(ta);
    });
  })();`;

const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-GB' });
await c.route('https://web3forms.com/client/script.js',
  (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE_WIDGET }));
await c.route('https://api.web3forms.com/submit', (r) => r.abort());

const p = await c.newPage();
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(500);

// The captcha must not load until the form is opened.
ok(!(await p.evaluate(() => document.cookie)).includes('hcaptcha_sim'),
  'no captcha, and no captcha cookie, before opening the form');

await p.locator('.footer-link').first().click();
await p.waitForTimeout(700);

ok(await p.$$eval('textarea[name="h-captcha-response"]', (e) => e.length) === 1,
  'opening the form loads the widget, which injects exactly one response field');
ok((await p.evaluate(() => document.cookie)).includes('hcaptcha_sim'),
  'the captcha sets its cookie — which the privacy notice discloses');

// An unsolved widget must block before any network call.
await p.locator('#feedbackMessage').fill('a real message');
await p.locator('#feedbackSend').click();
await p.waitForTimeout(400);
ok(/robot/i.test(await p.locator('#feedbackError').textContent()),
  'an unsolved captcha blocks the send with the captcha message');

// Solving the widget's own field — not a second one — must let it through.
await p.evaluate(() => {
  document.querySelector('textarea[name="h-captcha-response"]').value = 'solved';
});
await p.locator('#feedbackSend').click();
await p.waitForTimeout(900);
ok(/Could not send/i.test(await p.locator('#feedbackError').textContent()),
  'a solved captcha reaches the network, so the aborted request reports a send failure');
ok((await p.locator('#feedbackMessage').inputValue()) === 'a real message',
  'and the typed message survives the failure');

await c.close();
await b.close();
console.log(fails ? `\n${fails} FAILED` : '\nCAPTCHA WIDGET TESTS PASSED');
process.exit(fails ? 1 : 0);
