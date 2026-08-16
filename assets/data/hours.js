/**
 * Opening-hours model for the three centres.
 *
 * Everything here is a *published regular timetable*, not live data — the hub never
 * contacts the centres. See the info dialog in the UI, which says so to the user.
 *
 * Hours are taken verbatim from each centre's own "HORARI DEL CENTRE" block. All three
 * word it as "Diumenges i festius", so public holidays follow the Sunday row — that is
 * the centres' rule, not an assumption of ours.
 */

/**
 * Barcelona's wall clock. The IANA zone for mainland Spain is Europe/Madrid — there is no
 * "Europe/Barcelona" zone, and asking for one throws a RangeError.
 */
export const TZ = 'Europe/Madrid';

/** Minutes before closing at which we switch to the amber "closing soon" state. */
export const CLOSING_SOON_MINS = 60;

export const HOURS = {
  bdr: { weekday: ['06:30', '23:30'], sat: ['08:00', '21:00'], sun: ['09:00', '20:00'] },
  jupiter: { weekday: ['07:00', '23:00'], sat: ['09:00', '20:00'], sun: ['09:00', '15:00'] },
  maresme: { weekday: ['07:00', '23:00'], sat: ['09:00', '20:00'], sun: ['09:00', '15:00'] },
};

/** Fixed-date public holidays in Barcelona (Catalonia + the two city holidays). */
const FIXED_HOLIDAYS = [
  '01-01', // Cap d'Any
  '01-06', // Reis
  '05-01', // Festa del Treball
  '06-24', // Sant Joan
  '08-15', // L'Assumpció
  '09-11', // Diada Nacional de Catalunya
  '09-24', // La Mercè (Barcelona)
  '10-12', // Festa Nacional d'Espanya
  '11-01', // Tots Sants
  '12-06', // Dia de la Constitució
  '12-08', // La Immaculada
  '12-25', // Nadal
  '12-26', // Sant Esteve
];

/**
 * Easter Sunday, by the Anonymous Gregorian algorithm. The movable feasts are computed
 * rather than listed so the calendar does not quietly expire after one year.
 */
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(year, month - 1, day);
}

const DAY_MS = 86400000;
const monthDay = (ms) => new Date(ms).toISOString().slice(5, 10);

const holidayCache = new Map();

/** Every 'MM-DD' holiday for a given year, fixed plus Easter-derived. */
export function holidaysFor(year) {
  if (!holidayCache.has(year)) {
    const easter = easterSunday(year);
    holidayCache.set(year, new Set([
      ...FIXED_HOLIDAYS,
      monthDay(easter - 2 * DAY_MS),  // Divendres Sant
      monthDay(easter + 1 * DAY_MS),  // Dilluns de Pasqua
      monthDay(easter + 50 * DAY_MS), // Dilluns de Pasqua Granada (Barcelona)
    ]));
  }
  return holidayCache.get(year);
}

const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const PART_OPTIONS = {
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
};

/**
 * A formatter pinned to Barcelona, falling back to the device clock if the runtime has
 * no timezone data. A wrong-by-an-hour badge is a far better failure than a page that
 * throws on load.
 */
const formatter = (() => {
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, ...PART_OPTIONS });
  } catch {
    return new Intl.DateTimeFormat('en-GB', PART_OPTIONS);
  }
})();

/** The wall-clock date in Barcelona, whatever the device's own timezone is. */
export function barcelonaNow(date = new Date()) {
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value]),
  );

  return {
    year: Number(parts.year),
    monthDay: `${parts.month}-${parts.day}`,
    weekday: WEEKDAYS[parts.weekday],
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Which of the three rows applies on a given weekday, holidays counting as Sunday. */
function rowFor(gymId, weekday, isHoliday) {
  const hours = HOURS[gymId];
  if (isHoliday || weekday === 0) return hours.sun;
  if (weekday === 6) return hours.sat;
  return hours.weekday;
}

/**
 * Open/closed state for one centre at a given instant.
 *
 * Returns `{ state, opens, closes, isHoliday, minutesToClose, nextOpen }` where state is
 * 'open' | 'soon' | 'closed'. `nextOpen` is set only when closed.
 */
export function statusFor(gymId, date = new Date()) {
  const now = barcelonaNow(date);
  const isHoliday = holidaysFor(now.year).has(now.monthDay);
  const [opens, closes] = rowFor(gymId, now.weekday, isHoliday);
  const openMins = toMinutes(opens);
  const closeMins = toMinutes(closes);

  if (now.minutes < openMins) {
    return { state: 'closed', opens, closes, isHoliday, nextOpen: opens };
  }

  if (now.minutes >= closeMins) {
    // Every centre opens daily, so the next opening is simply tomorrow's row.
    const tomorrow = new Date(date.getTime() + DAY_MS);
    const next = barcelonaNow(tomorrow);
    const nextHoliday = holidaysFor(next.year).has(next.monthDay);
    const [nextOpen] = rowFor(gymId, next.weekday, nextHoliday);
    return { state: 'closed', opens, closes, isHoliday, nextOpen };
  }

  const minutesToClose = closeMins - now.minutes;
  return {
    state: minutesToClose <= CLOSING_SOON_MINS ? 'soon' : 'open',
    opens,
    closes,
    isHoliday,
    minutesToClose,
  };
}
