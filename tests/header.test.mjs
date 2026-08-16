// The masthead: control placement, and that dark mode is actually dark.
import { chromium } from 'playwright';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
let fails = 0;
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fails++; };
const b = await chromium.launch();

const luminance = (rgb) => {
  const [r, g, b2] = rgb.match(/\d+/g).slice(0, 3).map(Number).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
};

for (const scheme of ['light', 'dark']) {
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
  const p = await c.newPage();
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);

  const m = await p.evaluate(() => {
    const head = document.querySelector('.masthead');
    const btn = document.getElementById('install');
    const h1 = document.querySelector('.lockup');
    const hb = head.getBoundingClientRect();
    const bb = btn.getBoundingClientRect();
    const cs = getComputedStyle(document.documentElement);
    return {
      from: cs.getPropertyValue('--masthead-from').trim(),
      to: cs.getPropertyValue('--masthead-to').trim(),
      cut: getComputedStyle(document.querySelector('.lockup__mark-cut')).fill,
      inHeader: head.contains(btn),
      rightAligned: hb.right - bb.right < 40 && bb.left > hb.width / 2,
      sameRowAsLockup: Math.abs(bb.top - h1.getBoundingClientRect().top) < 24,
      size: `${Math.round(bb.width)}x${Math.round(bb.height)}`,
      themeColor: [...document.querySelectorAll('meta[name=theme-color]')]
        .map((x) => `${x.media}=${x.content}`).join(' | '),
    };
  });

  ok(m.inHeader, `${scheme}: the install/share control lives in the header`);
  ok(m.rightAligned, `${scheme}: it is right-aligned`);
  ok(m.sameRowAsLockup, `${scheme}: it sits on the lockup's row`);
  ok(m.size === '44x44', `${scheme}: 44x44 tap target (${m.size})`);
  ok(await p.locator('footer #install').count() === 0, `${scheme}: no leftover copy in the footer`);

  // the lockup mark punches through to the header colour, so they must agree
  const hex = (v) => v.replace('#', '').toLowerCase();
  const cutRgb = m.cut.startsWith('rgb') ? m.cut : null;
  ok(!!m.from && !!m.to, `${scheme}: masthead tokens defined (${m.from} → ${m.to})`);

  const headerBg = await p.evaluate(() => {
    const s = getComputedStyle(document.querySelector('.masthead')).backgroundImage;
    return s.match(/rgb\([^)]*\)/g) ?? [];
  });
  ok(headerBg.length >= 2, `${scheme}: header is a gradient (${headerBg.join(' → ')})`);

  const topLum = luminance(headerBg[0]);
  if (scheme === 'dark') {
    ok(topLum < 0.12, `dark: header is genuinely dark (luminance ${topLum.toFixed(3)})`);
    ok(cutRgb && luminance(cutRgb) < 0.12, `dark: lockup cut-outs track the dark header (${m.cut})`);
    ok(/prefers-color-scheme: dark\)=#12303d/.test(m.themeColor), `dark theme-color matches the header (${m.themeColor})`);
  } else {
    ok(topLum > 0.3, `light: header stays bright CET10 blue (luminance ${topLum.toFixed(3)})`);
  }
  await c.close();
}

await b.close();
console.log(fails ? `\n${fails} FAILED` : '\nHEADER TESTS PASSED');
process.exit(fails ? 1 : 0);
