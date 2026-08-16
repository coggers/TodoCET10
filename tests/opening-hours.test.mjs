// Pure logic tests for the opening-hours model, run in node against the real module.
import { statusFor, holidaysFor, barcelonaNow } from '../assets/data/hours.js';
let fails = 0;
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fails++; };

// Barcelona is UTC+2 in summer, UTC+1 in winter — express cases in UTC deliberately.
const at = (iso) => new Date(iso);

// --- weekday / saturday / sunday rows ---
const cases = [
  // [iso UTC, gym, expected state, note]
  ['2026-08-18T05:00:00Z', 'bdr', 'open', 'Tue 07:00 local — bdr open (06:30)'],
  ['2026-08-18T04:00:00Z', 'bdr', 'closed', 'Tue 06:00 local — bdr shut (opens 06:30)'],
  ['2026-08-18T04:00:00Z', 'jupiter', 'closed', 'Tue 06:00 local — jupiter shut (opens 07:00)'],
  ['2026-08-18T21:45:00Z', 'bdr', 'closed', 'Tue 23:45 local — past bdr 23:30 close'],
  ['2026-08-18T20:45:00Z', 'bdr', 'soon', 'Tue 22:45 local — bdr closes 23:30, 45m left'],
  ['2026-08-18T19:00:00Z', 'bdr', 'open', 'Tue 21:00 local — bdr open'],
  ['2026-08-22T18:30:00Z', 'jupiter', 'closed', 'Sat 20:30 local — past jupiter 20:00 close'],
  ['2026-08-22T16:00:00Z', 'jupiter', 'open', 'Sat 18:00 local — 2h before jupiter 20:00 close'],
  ['2026-08-22T17:00:00Z', 'jupiter', 'soon', 'Sat 19:00 local — exactly 60m before close'],
  ['2026-08-23T12:00:00Z', 'maresme', 'soon', 'Sun 14:00 local — maresme closes 15:00'],
  ['2026-08-23T12:00:00Z', 'bdr', 'open', 'Sun 14:00 local — bdr closes 20:00'],
];
for (const [iso, gym, want, note] of cases) {
  const s = statusFor(gym, at(iso));
  ok(s.state === want, `${note} → got ${s.state} (opens ${s.opens} closes ${s.closes}${s.nextOpen ? ' next ' + s.nextOpen : ''})`);
}

// --- holidays follow the Sunday row ---
const xmas = statusFor('jupiter', at('2026-12-25T12:00:00Z')); // Fri 13:00 local
ok(xmas.isHoliday === true, 'Christmas Day flagged as holiday');
ok(xmas.closes === '15:00', `Christmas uses Sunday row for jupiter (closes ${xmas.closes}, not 23:00)`);

const diada = statusFor('bdr', at('2026-09-11T09:00:00Z')); // Fri 11:00 local
ok(diada.isHoliday === true, 'Diada (11 Sep) flagged as holiday');
ok(diada.closes === '20:00', `Diada uses Sunday row for bdr (closes ${diada.closes})`);

const normalFriday = statusFor('jupiter', at('2026-09-18T12:00:00Z'));
ok(normalFriday.isHoliday === false && normalFriday.closes === '23:00',
  `ordinary Friday uses weekday row (closes ${normalFriday.closes})`);

// --- Easter-derived movable feasts, two different years ---
const h26 = holidaysFor(2026), h27 = holidaysFor(2027);
ok(h26.has('04-03'), 'Good Friday 2026 = 3 Apr');
ok(h26.has('04-06'), 'Easter Monday 2026 = 6 Apr');
ok(h26.has('05-25'), 'Whit Monday 2026 = 25 May');
ok(h27.has('03-26'), 'Good Friday 2027 = 26 Mar');
ok(h27.has('03-29'), 'Easter Monday 2027 = 29 Mar');
ok(h27.has('05-17'), 'Whit Monday 2027 = 17 May');
ok(h26.has('09-24') && h27.has('09-24'), 'La Mercè fixed in both years');

// --- timezone independence: same instant, different device TZ ---
const instant = at('2026-08-18T05:00:00Z');
const local = barcelonaNow(instant);
ok(local.minutes === 7 * 60, `barcelonaNow reads 07:00 local from UTC 05:00 (got ${Math.floor(local.minutes/60)}:${String(local.minutes%60).padStart(2,'0')})`);
ok(local.weekday === 2, `weekday index Tue=2 (got ${local.weekday})`);

// winter offset check (UTC+1)
const winter = barcelonaNow(at('2026-12-25T11:00:00Z'));
ok(winter.minutes === 12 * 60, `DST-aware: UTC 11:00 in December = 12:00 local (got ${Math.floor(winter.minutes/60)}:00)`);

console.log(fails ? `\n${fails} FAILED` : '\nALL HOURS TESTS PASSED');
process.exit(fails ? 1 : 0);
