// Fails the build on any WCAG 2.2 AA violation, in both colour schemes.
// This is what stops contrast regressions creeping back in.
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';

let fails = 0;
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fails++; };

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const b = await chromium.launch();

for (const scheme of ['light', 'dark']) {
  // bypassCSP only so axe can be injected; the app's own CSP is tested separately.
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme, bypassCSP: true });
  const p = await c.newPage();
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  await p.addScriptTag({ content: axe });

  const res = await p.evaluate(async (tags) =>
    window.axe.run(document, { runOnly: { type: 'tag', values: tags } }), TAGS);

  ok(res.violations.length === 0, `${scheme}: 0 violations`);
  for (const v of res.violations) {
    console.log(`          [${v.impact}] ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 4)) {
      console.log(`             ${n.target.join(' ')} — ${(n.failureSummary || '').split('\n')[1] || ''}`);
    }
  }
  await c.close();
}

// Structural checks axe cannot assert on its own.
{
  const c = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await c.newPage();
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);

  ok(await p.locator('h1').count() === 1, 'exactly one h1');
  ok(await p.locator('main').count() === 1, 'a main landmark');
  ok(await p.locator('[aria-live]').count() >= 1, 'a polite live region for list changes');
  ok(await p.locator('html').getAttribute('lang') !== null, 'html has a lang attribute');

  // every control reachable and labelled
  const unlabelled = await p.$$eval('button, a[href]', els => els
    .filter(e => !e.closest('dialog:not([open])'))
    .filter(e => !(e.textContent.trim() || e.getAttribute('aria-label')))
    .map(e => e.className || e.tagName));
  ok(unlabelled.length === 0, `every control has an accessible name ${unlabelled.join(', ')}`);
  await c.close();
}

await b.close();
console.log(fails ? `\n${fails} FAILED` : '\nACCESSIBILITY TESTS PASSED');
process.exit(fails ? 1 : 0);
