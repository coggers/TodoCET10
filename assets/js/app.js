import { GYMS, portalUrl, mapsUrl, inkFor, distanceKm } from '../data/gyms.js';
import { statusFor } from '../data/hours.js';
import { LANGS, detectLang, setLang, t } from './i18n.js';

const gymList = document.getElementById('gyms');
const quickBook = document.getElementById('quickbook');
const langBar = document.getElementById('langs');
const offlineBanner = document.getElementById('offline');
const sortButton = document.getElementById('sort');
const openNowButton = document.getElementById('openNow');
const sortNote = document.getElementById('sortNote');
const emptyNote = document.getElementById('empty');
const infoDialog = document.getElementById('infoDialog');

const SORT_KEY = 'cet10hub.sort';
const OPEN_KEY = 'cet10hub.openNow';

let lang = detectLang();
/** Set once geolocation succeeds; keys are gym ids, values km. */
let distances = null;
let sortMode = localStorage.getItem(SORT_KEY) === 'distance' ? 'distance' : 'default';
let openOnly = localStorage.getItem(OPEN_KEY) === '1';
let locating = false;
/** Which i18n key the line under the sort button is currently showing. */
let noteKey = 'locationPrivacy';

/**
 * Inline SVG rather than symbol characters (✆, ⧉, …), which render
 * inconsistently across platforms and turn into colour emoji on some.
 */
const ICONS = {
  join: '<path d="M12 3.5l2.5 5.3 5.8.8-4.2 4 1 5.7-5.1-2.8-5.1 2.8 1-5.7-4.2-4 5.8-.8z"/>',
  login: '<path d="M14 3h5a2 2 0 012 2v14a2 2 0 01-2 2h-5"/><path d="M10 16.5L14.5 12 10 7.5"/><path d="M14.5 12H3"/>',
  home: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  site: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.9 2.6 15.1 0 18M12 3c-2.6 2.9-2.6 15.1 0 18"/>',
  call: '<path d="M7.7 4H4.4A1.4 1.4 0 003 5.5 15.5 15.5 0 0018.5 21a1.4 1.4 0 001.5-1.4v-3.3l-3.6-1.2-1.9 1.9a12.4 12.4 0 01-5.5-5.5l1.9-1.9z"/>',
  directions: '<path d="M19 10.4c0 5-7 10.6-7 10.6s-7-5.6-7-10.6a7 7 0 1114 0z"/><circle cx="12" cy="10.2" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>',
  reception: '<path d="M4 13a8 8 0 1116 0"/><path d="M4 13v3a2 2 0 002 2h1v-5H6a2 2 0 00-2 2z"/><path d="M20 13v3a2 2 0 01-2 2h-1v-5h1a2 2 0 012 2z"/><path d="M17 18v.6a2.4 2.4 0 01-2.4 2.4H13"/>',
};

const icon = (key, className = 'chip__icon') =>
  `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"
     fill="none" stroke="currentColor" stroke-width="1.7"
     stroke-linecap="round" stroke-linejoin="round">${ICONS[key]}</svg>`;

/** Secondary links, in the order they appear under each card. */
const EXTRAS = [
  { key: 'reception', href: (gym) => gym.reception },
  { key: 'join', href: (gym) => portalUrl(gym, 'join') },
  { key: 'login', href: (gym) => portalUrl(gym, 'login') },
  { key: 'home', href: (gym) => portalUrl(gym, 'home') },
  { key: 'site', href: (gym) => gym.site },
  { key: 'call', href: (gym) => `tel:${gym.phone}` },
  { key: 'directions', href: (gym) => mapsUrl(gym) },
];

function externalLink(href, className, text, label) {
  const a = document.createElement('a');
  a.href = href;
  a.className = className;
  a.textContent = text;
  if (label) a.setAttribute('aria-label', label);
  // tel: must stay in-page or iOS refuses to hand off to the dialer
  if (!href.startsWith('tel:')) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
}

/** Closing soon still counts as open — you can still get a session in. */
const isOpenNow = (gym) => statusFor(gym.id).state !== 'closed';

/** Gyms to show, after the distance sort and the open-now filter. */
function visibleGyms() {
  const sorted = sortMode === 'distance' && distances
    ? [...GYMS].sort((a, b) => distances[a.id] - distances[b.id])
    : GYMS;
  return openOnly ? sorted.filter(isOpenNow) : sorted;
}

function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// ---------------------------------------------------------------- status badge

function renderStatus(gym, strings) {
  const status = statusFor(gym.id);
  const wrap = document.createElement('div');
  wrap.className = 'status';

  const pill = document.createElement('span');
  // A holiday is worth flagging even when the centre is currently open.
  pill.className = `status__pill status__pill--${status.isHoliday ? 'soon' : status.state}`;
  pill.setAttribute('aria-label', strings.statusLabel);

  if (status.state === 'closed') {
    pill.textContent = strings.statusClosed(status.nextOpen);
  } else if (status.state === 'soon') {
    pill.textContent = strings.statusSoon(status.minutesToClose);
  } else {
    pill.textContent = strings.statusOpen(status.closes);
  }
  wrap.append(pill);

  if (status.isHoliday) {
    const holiday = document.createElement('span');
    holiday.className = 'status__holiday';
    holiday.textContent = strings.statusHoliday;
    wrap.append(holiday);
  }

  const info = document.createElement('button');
  info.type = 'button';
  info.className = 'status__info';
  info.textContent = 'i';
  info.setAttribute('aria-label', strings.infoAria);
  info.addEventListener('click', () => openInfo(gym, strings));
  wrap.append(info);

  if (distances && sortMode === 'distance') {
    const dist = document.createElement('span');
    dist.className = 'status__distance';
    dist.textContent = formatDistance(distances[gym.id]);
    wrap.append(dist);
  }

  return wrap;
}

function openInfo(gym, strings) {
  document.getElementById('infoTitle').textContent = strings.infoTitle;
  const body = document.getElementById('infoBody');
  body.replaceChildren(...strings.infoBody.map((line) => {
    const p = document.createElement('p');
    p.textContent = line;
    return p;
  }));

  const portal = document.getElementById('infoPortal');
  portal.href = portalUrl(gym, 'home');
  portal.textContent = strings.infoOpenPortal;

  const close = document.getElementById('infoClose');
  close.textContent = strings.infoClose;
  close.onclick = () => infoDialog.close();

  infoDialog.showModal();
}

// ---------------------------------------------------------------- rendering

function renderGym(gym, strings) {
  const item = document.createElement('li');
  item.className = 'gym';
  item.style.setProperty('--accent', gym.accent);
  item.style.setProperty('--ink', inkFor(gym.accent));

  const media = document.createElement('div');
  media.className = 'gym__media';
  media.innerHTML = `
    <img src="${gym.photo}" alt="" width="1000" height="563" loading="lazy" decoding="async">
    <h2 class="gym__name"><span class="gym__cem">CEM</span>${gym.name}</h2>`;

  const actions = document.createElement('div');
  actions.className = 'gym__actions';
  actions.append(
    externalLink(portalUrl(gym, 'book'), 'btn btn--primary', strings.book,
      strings.bookFor(gym.name)),
    externalLink(portalUrl(gym, 'manage'), 'btn btn--ghost', strings.manage,
      strings.manageFor(gym.name)),
  );

  const more = document.createElement('div');
  more.className = 'gym__more';
  more.setAttribute('aria-label', strings.moreFor(gym.name));
  for (const extra of EXTRAS) {
    const chip = externalLink(extra.href(gym), 'chip', strings[extra.key]);
    chip.insertAdjacentHTML('afterbegin', icon(extra.key));
    more.append(chip);
  }

  item.append(media, renderStatus(gym, strings), actions, more);
  return item;
}

function renderQuickBook(gyms, strings) {
  quickBook.replaceChildren();
  // Nothing to quick-book when the filter has emptied the list.
  quickBook.hidden = gyms.length === 0;
  if (!gyms.length) return;

  const label = document.createElement('span');
  label.className = 'quickbook__label';
  label.textContent = strings.quickBook;

  const row = document.createElement('div');
  row.className = 'quickbook__row';
  row.style.setProperty('--cols', String(gyms.length));
  for (const gym of gyms) {
    const pill = externalLink(portalUrl(gym, 'book'), 'quickbook__pill', gym.name,
      strings.quickBookFor(gym.name));
    pill.style.setProperty('--accent', gym.accent);
    pill.style.setProperty('--ink', inkFor(gym.accent));
    row.append(pill);
  }

  const panel = document.createElement('div');
  panel.className = 'quickbook__panel';
  panel.append(label, row);
  quickBook.append(panel);
}

/**
 * The sort button is an action, not a toggle: tapping it always re-reads your
 * location, so moving between centres re-orders the list.
 */
function renderSort(strings) {
  sortButton.replaceChildren();
  sortButton.insertAdjacentHTML('afterbegin', icon('directions', 'pill-btn__icon'));
  sortButton.append(document.createTextNode(locating ? strings.locating : strings.sortByDistance));
  sortButton.setAttribute('aria-pressed', String(sortMode === 'distance'));
  sortButton.disabled = locating;

  openNowButton.replaceChildren();
  openNowButton.insertAdjacentHTML('afterbegin', icon('clock', 'pill-btn__icon'));
  openNowButton.append(document.createTextNode(strings.openNow));
  openNowButton.setAttribute('aria-pressed', String(openOnly));
}

function renderLangs() {
  langBar.replaceChildren();
  for (const [code, label] of Object.entries(LANGS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lang';
    button.textContent = label;
    button.lang = code;
    button.setAttribute('aria-pressed', String(code === lang));
    button.addEventListener('click', () => {
      lang = code;
      setLang(code);
      render();
    });
    langBar.append(button);
  }
}

function render() {
  const strings = t(lang);
  document.documentElement.lang = lang;

  const gyms = visibleGyms();
  gymList.replaceChildren(...gyms.map((gym) => renderGym(gym, strings)));
  renderQuickBook(gyms, strings);
  renderSort(strings);
  sortNote.textContent = strings[noteKey];

  // The filter can legitimately match nothing — say so, with a way back.
  emptyNote.hidden = gyms.length > 0;
  if (!gyms.length) {
    emptyNote.replaceChildren(document.createTextNode(strings.noneOpen + ' '));
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'empty__clear';
    clear.textContent = strings.showAll;
    clear.addEventListener('click', () => {
      openOnly = false;
      localStorage.removeItem(OPEN_KEY);
      render();
    });
    emptyNote.append(clear);
  }

  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = strings[node.dataset.i18n];
  }
  renderLangs();
}

// ---------------------------------------------------------------- distance sort

function requestDistanceSort() {
  const strings = t(lang);

  if (!navigator.geolocation) {
    noteKey = 'locationDenied';
    render();
    return;
  }

  locating = true;
  renderSort(strings);

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      distances = Object.fromEntries(GYMS.map((gym) => [
        gym.id, distanceKm(coords.latitude, coords.longitude, gym.lat, gym.lon),
      ]));
      sortMode = 'distance';
      locating = false;
      noteKey = 'locationPrivacy';
      localStorage.setItem(SORT_KEY, sortMode);
      render();
    },
    () => {
      // Denied, unavailable or timed out — say so and leave the order alone.
      locating = false;
      sortMode = 'default';
      noteKey = 'locationDenied';
      localStorage.removeItem(SORT_KEY);
      render();
    },
    // maximumAge 0: never reuse an old fix, or re-tapping could not re-sort.
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
  );
}

// Always re-request — the point is to re-sort after you have moved.
sortButton.addEventListener('click', requestDistanceSort);

openNowButton.addEventListener('click', () => {
  openOnly = !openOnly;
  if (openOnly) localStorage.setItem(OPEN_KEY, '1');
  else localStorage.removeItem(OPEN_KEY);
  render();
});

infoDialog.addEventListener('click', (event) => {
  // Click on the backdrop (the dialog element itself) closes it.
  if (event.target === infoDialog) infoDialog.close();
});

// ---------------------------------------------------------------- online state

function syncOnlineState() {
  offlineBanner.hidden = navigator.onLine;
}

render();
syncOnlineState();
addEventListener('online', syncOnlineState);
addEventListener('offline', syncOnlineState);

// Keep the badge honest if the page is left open across an opening or closing time.
setInterval(() => render(), 60000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) render();
});

// A remembered distance sort needs the location again; ask on load so the order is right.
if (sortMode === 'distance') requestDistanceSort();

if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* offline support is a nicety; the hub works without it */
    });
  });
}
