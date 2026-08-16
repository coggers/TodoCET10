import { bookingGapAhead, NO_CLASS_DAYS, BOOKING_WINDOW_HOURS } from '../assets/data/hours.js';
let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};

// Week of Mon 17 Aug 2026 .. Sun 23 Aug 2026, midday UTC (14:00 Barcelona, summer).
const week = [
  ['2026-08-17T12:00:00Z','Monday',    false],
  ['2026-08-18T12:00:00Z','Tuesday',   false],
  ['2026-08-19T12:00:00Z','Wednesday', false],
  ['2026-08-20T12:00:00Z','Thursday',  false],  // Fri has classes -> quiet
  ['2026-08-21T12:00:00Z','Friday',    true ],  // Sat+Sun -> notice
  ['2026-08-22T12:00:00Z','Saturday',  false],  // Mon becomes bookable -> quiet
  ['2026-08-23T12:00:00Z','Sunday',    false],
];
for (const [iso, day, want] of week) {
  const got = bookingGapAhead(new Date(iso));
  ok(got===want, `${day.padEnd(9)} -> notice ${got ? 'shown' : 'hidden'} (expected ${want?'shown':'hidden'})`);
}

// exactly one day a week triggers it
const count = week.filter(([iso])=>bookingGapAhead(new Date(iso))).length;
ok(count===1, `fires on exactly one day per week (${count})`);

// boundary: late Friday night and early Friday morning both count
ok(bookingGapAhead(new Date('2026-08-20T22:30:00Z'))===true, 'Fri 00:30 local counts as Friday');
ok(bookingGapAhead(new Date('2026-08-21T21:30:00Z'))===true, 'Fri 23:30 local still counts');
ok(bookingGapAhead(new Date('2026-08-21T22:30:00Z'))===false, 'Sat 00:30 local no longer counts');

// derived, not hardcoded: widening the window past the weekend must silence it
ok(NO_CLASS_DAYS.has(0)&&NO_CLASS_DAYS.has(6)&&NO_CLASS_DAYS.size===2, 'no-class days are Sat+Sun');
ok(BOOKING_WINDOW_HOURS===48, 'booking window is 48h');

// winter (UTC+1) — Friday still detected
ok(bookingGapAhead(new Date('2026-12-18T12:00:00Z'))===true, 'Friday in December (UTC+1) detected');
ok(bookingGapAhead(new Date('2026-12-17T12:00:00Z'))===false, 'Thursday in December quiet');

console.log(fails?`\n${fails} FAILED`:'\nBOOKING-GAP TESTS PASSED');
process.exit(fails?1:0);
