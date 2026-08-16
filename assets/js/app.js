import { GYMS, portalUrl, mapsUrl, inkFor, distanceKm } from '../data/gyms.js';
import { statusFor, bookingGapAhead } from '../data/hours.js';
import { LANGS, detectLang, setLang, t } from './i18n.js';
import { ACCESS_KEY, ENDPOINT, REPO_URL, ISSUES_URL, hasForm } from '../data/feedback.js';

const gymList = document.getElementById('gyms');
const quickBook = document.getElementById('quickbook');
const langBar = document.getElementById('langs');
const offlineBanner = document.getElementById('offline');
const sortButton = document.getElementById('sort');
const openNowButton = document.getElementById('openNow');
const resetButton = document.getElementById('reset');
const sortNote = document.getElementById('sortNote');
const emptyNote = document.getElementById('empty');
const bookingNotice = document.getElementById('bookingNotice');
const liveStatus = document.getElementById('liveStatus');
const infoDialog = document.getElementById('infoDialog');

const SORT_KEY = 'cet10hub.sort';
const OPEN_KEY = 'cet10hub.openNow';
const FAV_KEY = 'cet10hub.favourite';

let lang = detectLang();
/** Set once geolocation succeeds; keys are gym ids, values km. */
let distances = null;
let sortMode = localStorage.getItem(SORT_KEY) === 'distance' ? 'distance' : 'default';
let openOnly = localStorage.getItem(OPEN_KEY) === '1';
/** Gym id, or null. Survives reloads; unaffected by sort, filter or reset. */
let favourite = GYMS.some((g) => g.id === localStorage.getItem(FAV_KEY))
  ? localStorage.getItem(FAV_KEY)
  : null;
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
  reset: '<path d="M20 12a8 8 0 11-2.6-5.9"/><path d="M20 4v4.5h-4.5"/>',
  install: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M12 8v7"/><path d="M9 12l3 3 3-3"/>',
  share: '<path d="M12 3v12"/><path d="M8 6.5L12 2.7l4 3.8"/><path d="M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"/>',
  check: '<path d="M4.5 12.5l5 5 10-11"/>',
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

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Run a DOM update inside a View Transition so cards glide between positions
 * instead of snapping. Progressive enhancement in both directions: browsers
 * without the API, and anyone who has asked for reduced motion, get the plain
 * update. Only user-initiated reorders and hides go through here — the
 * once-a-minute status refresh must never animate.
 */
function animate(update) {
  if (!document.startViewTransition || reducedMotion.matches) {
    update();
  } else {
    document.startViewTransition(update);
  }
  // Reordering and filtering rewrite the list silently; say what happened.
  announceList();
}

/**
 * Politely announce the resulting list. Only called from user actions — the
 * once-a-minute refresh must not chatter at screen-reader users.
 */
function announceList() {
  const strings = t(lang);
  const shown = visibleGyms().length;
  liveStatus.textContent = strings.listUpdated(shown, GYMS.length, {
    distance: sortMode === 'distance' && !!distances,
    openOnly,
  });
}

/** Closing soon still counts as open — you can still get a session in. */
const isOpenNow = (gym) => statusFor(gym.id).state !== 'closed';

/** True when the user has asked for an explicit ordering or subset. */
const hasCustomView = () => (sortMode === 'distance' && distances) || openOnly;

/**
 * The resting order everywhere: alphabetical by name, collated for the active
 * language so "Júpiter" sorts on J rather than on its accent.
 */
const alphabetical = () => [...GYMS].sort((a, b) => a.name.localeCompare(b.name, lang));

/**
 * Default view: the favourite pinned to the top, everything else alphabetical.
 * Array#sort is stable, so pinning preserves the alphabetical order below it.
 */
const favouriteFirst = () => {
  const list = alphabetical();
  return favourite
    ? list.sort((a, b) => (b.id === favourite) - (a.id === favourite))
    : list;
};

/**
 * Gyms for the main list. Sorting or filtering is an explicit request, so it
 * overrides the favourite's pinned position rather than fighting with it.
 */
function visibleGyms() {
  let list;
  if (sortMode === 'distance' && distances) {
    list = [...GYMS].sort((a, b) => distances[a.id] - distances[b.id]);
  } else {
    list = openOnly ? alphabetical() : favouriteFirst();
  }
  return openOnly ? list.filter(isOpenNow) : list;
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

/** Star toggle overlaid on the card photo. One favourite at a time. */
function favouriteButton(gym, strings) {
  const isFav = favourite === gym.id;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'fav';
  button.dataset.gym = gym.id;
  button.setAttribute('aria-pressed', String(isFav));
  button.setAttribute('aria-label',
    isFav ? strings.unsetFavourite(gym.name) : strings.setFavourite(gym.name));
  button.innerHTML = starSvg(isFav, 'fav__icon');

  button.addEventListener('click', () => {
    favourite = isFav ? null : gym.id;
    if (favourite) localStorage.setItem(FAV_KEY, favourite);
    else localStorage.removeItem(FAV_KEY);
    animate(render);
  });

  return button;
}

const starSvg = (filled, className) =>
  `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"
     fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.7"
     stroke-linecap="round" stroke-linejoin="round">${ICONS.join}</svg>`;

function renderGym(gym, strings, index) {
  const item = document.createElement('li');
  item.className = 'gym';
  item.style.setProperty('--accent', gym.accent);
  item.style.setProperty('--ink', inkFor(gym.accent));
  // Stable per centre, so the browser can match a card across a reorder and
  // tween it to its new position rather than cross-fading the whole list.
  item.style.viewTransitionName = `gym-${gym.id}`;

  const media = document.createElement('div');
  media.className = 'gym__media';
  // The first card's photo is the LCP element; lazy-loading it delays the
  // largest paint for no benefit, since it is above the fold on every phone.
  const eager = index === 0;
  media.innerHTML = `
    <img src="${gym.photo}" alt="" width="1000" height="563"
         loading="${eager ? 'eager' : 'lazy'}"
         fetchpriority="${eager ? 'high' : 'auto'}" decoding="async">
    <h2 class="gym__name"><span class="gym__cem">CEM</span>${gym.name}</h2>`;
  media.append(favouriteButton(gym, strings));

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

/**
 * Quick book deliberately ignores the sort and the filter: it is the one place
 * where every centre stays in the same spot, so the tap is muscle memory.
 * The favourite is marked with a star but is not moved, for the same reason.
 */
function renderQuickBook(strings) {
  quickBook.replaceChildren();

  const label = document.createElement('span');
  label.className = 'quickbook__label';
  label.textContent = strings.quickBook;

  const gyms = alphabetical();
  const row = document.createElement('div');
  row.className = 'quickbook__row';
  row.style.setProperty('--cols', String(gyms.length));

  for (const gym of gyms) {
    const isFav = favourite === gym.id;
    const status = statusFor(gym.id);
    const excluded = openOnly && status.state === 'closed';

    const label = [
      strings.quickBookFor(gym.name),
      isFav ? strings.favourite : null,
      // The dot is decorative, so the state has to reach screen readers here.
      status.state === 'closed' ? strings.statusClosed(status.nextOpen)
        : status.state === 'soon' ? strings.statusSoon(status.minutesToClose)
          : strings.statusOpen(status.closes),
    ].filter(Boolean).join(' — ');

    const pill = externalLink(portalUrl(gym, 'book'), 'quickbook__pill', gym.name, label);
    pill.style.setProperty('--accent', gym.accent);
    pill.style.setProperty('--ink', inkFor(gym.accent));

    // Dimmed, never disabled: the filter is about the list, not about whether
    // you may book. Booking a closed centre for tomorrow is entirely valid.
    if (excluded) pill.classList.add('quickbook__pill--dimmed');

    const dot = document.createElement('span');
    dot.className = `quickbook__dot quickbook__dot--${status.state}`;
    pill.prepend(dot);

    if (isFav) {
      pill.classList.add('quickbook__pill--fav');
      pill.insertAdjacentHTML('afterbegin', starSvg(true, 'quickbook__star'));
    }
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

  // Only offer a reset when there is something to reset.
  resetButton.hidden = !hasCustomView();
  resetButton.replaceChildren();
  resetButton.insertAdjacentHTML('afterbegin', icon('reset', 'pill-btn__icon'));
  resetButton.append(document.createTextNode(strings.reset));
  resetButton.setAttribute('aria-label', strings.resetAria);
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
  gymList.replaceChildren(...gyms.map((gym, i) => renderGym(gym, strings, i)));
  renderQuickBook(strings);
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
      animate(render);
    });
    emptyNote.append(clear);
  }

  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = strings[node.dataset.i18n];
  }
  renderLangs();
  renderFooterLinks(strings);
  refreshInstallButton();

  // First paint is done; release the reserved height so a filtered list can
  // shrink normally.
  gymList.removeAttribute('data-reserving');

  // Only worth saying on the days when the booking window lands on the weekend.
  bookingNotice.hidden = !bookingGapAhead();
  bookingNotice.textContent = strings.bookingGap;
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
      animate(render);
    },
    () => {
      // Denied, unavailable or timed out — say so and leave the order alone.
      locating = false;
      sortMode = 'default';
      noteKey = 'locationDenied';
      localStorage.removeItem(SORT_KEY);
      animate(render);
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
  animate(render);
});

// Clears the view only — the favourite is a separate preference and survives.
resetButton.addEventListener('click', () => {
  sortMode = 'default';
  openOnly = false;
  noteKey = 'locationPrivacy';
  localStorage.removeItem(SORT_KEY);
  localStorage.removeItem(OPEN_KEY);
  animate(render);
});

infoDialog.addEventListener('click', (event) => {
  // Click on the backdrop (the dialog element itself) closes it.
  if (event.target === infoDialog) infoDialog.close();
});

// ---------------------------------------------------------------- install

/**
 * Adding to the home screen differs sharply by platform:
 *
 *  - Chromium (Android, desktop) fires `beforeinstallprompt`, which we defer and
 *    replay on a tap. That is a genuine one-tap install.
 *  - iOS has no equivalent. Safari implements no install API at all, so the only
 *    honest option there is to show the actual steps.
 *  - Inside another app's web view (Instagram, Facebook…) there is no way to
 *    install at all, so say that rather than give steps that will not work.
 */
const installButton = document.getElementById('install');
const installDialog = document.getElementById('installDialog');

let deferredPrompt = null;

const ua = navigator.userAgent;
const isIOS = /iphone|ipad|ipod/i.test(ua)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isInAppBrowser = /FBAN|FBAV|Instagram|Line\/|Twitter|WhatsApp|MicroMessenger/i.test(ua);

const isInstalled = () => matchMedia('(display-mode: standalone)').matches
  || matchMedia('(display-mode: fullscreen)').matches
  || navigator.standalone === true;

/**
 * One button, two jobs. Before install it offers to add the app; afterwards it
 * turns into Share, so there is always something useful there — and so the
 * person who already installed it can still hand the link to someone else.
 */
/**
 * Icon-only in the header, so it stays a 44px target without crowding the
 * lockup. The label lives on aria-label rather than beside it.
 */
function refreshInstallButton() {
  const strings = t(lang);
  const installed = isInstalled();

  installButton.dataset.mode = installed ? 'share' : 'install';
  installButton.setAttribute('aria-label', installed ? strings.share : strings.install);
  installButton.title = installed ? strings.share : strings.install;
  installButton.innerHTML = icon(installed ? 'share' : 'install', 'header-action__icon');
}

/** The URL the QR encodes, and what the share sheet passes on. */
const CANONICAL_URL = 'https://todocet10.space/';

const shareDialog = document.getElementById('shareDialog');
const shareNative = document.getElementById('shareNative');

function openShare() {
  const strings = t(lang);
  document.getElementById('shareTitle').textContent = strings.shareTitle;
  document.getElementById('shareLead').textContent = strings.shareLead;
  document.getElementById('shareQr').alt = strings.shareQrAlt;
  document.getElementById('shareUrl').textContent = CANONICAL_URL.replace(/^https:\/\//, '');

  // Native sheet where it exists, copy-to-clipboard everywhere else.
  shareNative.textContent = navigator.share ? strings.shareSheet : strings.shareCopy;
  document.getElementById('shareClose').textContent = strings.infoClose;
  shareDialog.showModal();
}

async function shareApp() {
  const strings = t(lang);
  const payload = { title: 'CET10 Hub', text: strings.shareText, url: CANONICAL_URL };

  if (navigator.share) {
    try {
      await navigator.share(payload);
      return;
    } catch {
      // Cancelled, or the platform refused — fall through to copying.
    }
  }

  try {
    await navigator.clipboard.writeText(CANONICAL_URL);
    const original = shareNative.textContent;
    shareNative.textContent = strings.shareCopied;
    setTimeout(() => { shareNative.textContent = original; }, 2000);
  } catch {
    // Clipboard blocked (insecure context, permissions): the URL is already
    // on screen under the QR, so say nothing rather than throwing.
  }
}

shareNative.addEventListener('click', shareApp);
document.getElementById('shareClose').addEventListener('click', () => shareDialog.close());
shareDialog.addEventListener('click', (event) => {
  if (event.target === shareDialog) shareDialog.close();
});

function openInstallDialog() {
  const strings = t(lang);
  document.getElementById('installTitle').textContent = strings.installTitle;

  const lead = document.getElementById('installLead');
  lead.hidden = !isInAppBrowser;
  lead.textContent = isInAppBrowser ? strings.installInApp : '';

  const steps = isIOS ? strings.installIos : strings.installGeneric;
  document.getElementById('installSteps').replaceChildren(...steps.map((step) => {
    const li = document.createElement('li');
    li.textContent = step;
    return li;
  }));

  const close = document.getElementById('installClose');
  close.textContent = strings.infoClose;
  close.onclick = () => installDialog.close();

  installDialog.showModal();
}

addEventListener('beforeinstallprompt', (event) => {
  // Suppress Chrome's own mini-infobar so our button is the single entry point.
  event.preventDefault();
  deferredPrompt = event;
  refreshInstallButton();
});

addEventListener('appinstalled', () => {
  deferredPrompt = null;
  refreshInstallButton();
});

installButton.addEventListener('click', async () => {
  if (installButton.dataset.mode === 'share') {
    openShare();
    return;
  }

  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // The deferred event is single-use; Chrome will fire a fresh one if declined.
    deferredPrompt = null;
    if (outcome === 'accepted') refreshInstallButton();
    return;
  }
  openInstallDialog();
});

installDialog.addEventListener('click', (event) => {
  if (event.target === installDialog) installDialog.close();
});

// Installing while the page is open should retire the button immediately.
matchMedia('(display-mode: standalone)').addEventListener('change', refreshInstallButton);

// ---------------------------------------------------------------- feedback

const footerLinks = document.getElementById('footerLinks');
const feedbackDialog = document.getElementById('feedbackDialog');
const feedbackForm = document.getElementById('feedbackForm');
const feedbackFallback = document.getElementById('feedbackFallback');
const feedbackDone = document.getElementById('feedbackDone');
const feedbackError = document.getElementById('feedbackError');
const feedbackMessage = document.getElementById('feedbackMessage');
const feedbackContact = document.getElementById('feedbackContact');

const privacyDialog = document.getElementById('privacyDialog');

/**
 * GDPR Article 13 transparency notice. Lives in a dialog like everything else,
 * but `#privacy` opens it directly so it still has a linkable address — useful
 * if the app is ever listed somewhere that demands a privacy URL.
 */
function openPrivacy(strings) {
  document.getElementById('privacyTitle').textContent = strings.privacyTitle;
  document.getElementById('privacyUpdated').textContent = strings.privacyUpdated;

  document.getElementById('privacyBody').replaceChildren(
    ...strings.privacySections.flatMap(([heading, body]) => {
      const h = document.createElement('h3');
      h.className = 'privacy__heading';
      h.textContent = heading;
      const p = document.createElement('p');
      p.textContent = body;
      return [h, p];
    }),
  );

  const close = document.getElementById('privacyClose');
  close.textContent = strings.infoClose;
  close.onclick = () => privacyDialog.close();

  if (!privacyDialog.open) privacyDialog.showModal();
}

privacyDialog.addEventListener('click', (event) => {
  if (event.target === privacyDialog) privacyDialog.close();
});

// Drop the fragment on close so reloading does not reopen it.
privacyDialog.addEventListener('close', () => {
  if (location.hash === '#privacy') {
    history.replaceState(null, '', location.pathname + location.search);
  }
});

function renderFooterLinks(strings) {
  footerLinks.replaceChildren();

  const feedback = document.createElement('button');
  feedback.type = 'button';
  feedback.className = 'footer-link';
  feedback.textContent = strings.feedback;
  feedback.addEventListener('click', () => openFeedback(strings));

  const privacy = document.createElement('button');
  privacy.type = 'button';
  privacy.className = 'footer-link';
  privacy.textContent = strings.privacy;
  privacy.addEventListener('click', () => openPrivacy(strings));

  const repo = externalLink(REPO_URL, 'footer-link', strings.sourceCode);

  footerLinks.append(feedback, privacy, repo);
}

/**
 * Web3Forms' client script renders the hCaptcha widget and injects the
 * textarea that carries its token. It is loaded on first use rather than at
 * page load, so simply visiting the hub still contacts nobody — which is what
 * the privacy notice claims and what the tests assert.
 */
const CAPTCHA_SCRIPT = 'https://web3forms.com/client/script.js';
let captchaRequested = false;

function loadCaptcha() {
  if (captchaRequested || !hasForm()) return;
  captchaRequested = true;
  const tag = document.createElement('script');
  tag.src = CAPTCHA_SCRIPT;
  tag.async = true;
  tag.defer = true;
  document.head.append(tag);
}

/** The token Web3Forms' script writes into a hidden textarea once solved. */
const captchaToken = () =>
  document.querySelector('textarea[name="h-captcha-response"]')?.value ?? '';

function openFeedback(strings) {
  document.getElementById('feedbackTitle').textContent = strings.feedbackTitle;

  // No key configured yet: offer GitHub rather than a form that would fail.
  const configured = hasForm();
  feedbackForm.hidden = !configured;
  feedbackFallback.hidden = configured;
  feedbackDone.hidden = true;
  feedbackError.hidden = true;

  if (configured) {
    loadCaptcha();
    document.getElementById('feedbackMessageLabel').textContent = strings.feedbackMessage;
    document.getElementById('feedbackContactLabel').textContent = strings.feedbackContact;
    document.getElementById('feedbackPrivacy').textContent = strings.feedbackPrivacy;
    document.getElementById('feedbackSend').textContent = strings.feedbackSend;
    document.getElementById('feedbackCancel').textContent = strings.feedbackCancel;
  } else {
    document.getElementById('feedbackFallbackText').textContent = strings.feedbackFallback;
    const issues = document.getElementById('feedbackIssues');
    issues.href = ISSUES_URL;
    issues.textContent = strings.feedbackIssues;
    document.getElementById('feedbackFallbackClose').textContent = strings.feedbackCancel;
  }

  feedbackDialog.showModal();
}

async function submitFeedback(event) {
  event.preventDefault();
  const strings = t(lang);
  const message = feedbackMessage.value.trim();

  if (!message) {
    feedbackError.textContent = strings.feedbackEmpty;
    feedbackError.hidden = false;
    feedbackMessage.focus();
    return;
  }

  const captcha = captchaToken();
  if (!captcha) {
    feedbackError.textContent = strings.feedbackCaptcha;
    feedbackError.hidden = false;
    return;
  }

  const send = document.getElementById('feedbackSend');
  send.disabled = true;
  feedbackError.hidden = true;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      // The page sets no-referrer globally, which also nulls the Origin header.
      // Web3Forms' free tier only accepts client-side submissions and uses those
      // headers to tell them apart, so this one call opts back in — origin only,
      // never the path.
      referrerPolicy: 'strict-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: ACCESS_KEY,
        subject: 'CET10 Hub feedback',
        from_name: 'CET10 Hub',
        // Only what the user typed, plus the language so replies match.
        message,
        email: feedbackContact.value.trim() || undefined,
        language: lang,
        'h-captcha-response': captcha,
      }),
    });
    if (!response.ok) throw new Error(String(response.status));

    feedbackForm.hidden = true;
    feedbackDone.textContent = strings.feedbackDone;
    feedbackDone.hidden = false;
    feedbackMessage.value = '';
    feedbackContact.value = '';
    window.hcaptcha?.reset();
    setTimeout(() => feedbackDialog.close(), 1600);
  } catch {
    feedbackError.textContent = strings.feedbackFailed;
    feedbackError.hidden = false;
    // The token is consumed by the attempt, so a retry needs a fresh one.
    window.hcaptcha?.reset();
  } finally {
    send.disabled = false;
  }
}

feedbackForm.addEventListener('submit', submitFeedback);
document.getElementById('feedbackCancel').addEventListener('click', () => feedbackDialog.close());
document.getElementById('feedbackFallbackClose').addEventListener('click', () => feedbackDialog.close());
feedbackDialog.addEventListener('click', (event) => {
  if (event.target === feedbackDialog) feedbackDialog.close();
});

// ---------------------------------------------------------------- online state

function syncOnlineState() {
  offlineBanner.hidden = navigator.onLine;
}

render();
syncOnlineState();

// /#privacy is a stable address for the notice.
if (location.hash === '#privacy') openPrivacy(t(lang));
addEventListener('hashchange', () => {
  if (location.hash === '#privacy') openPrivacy(t(lang));
});
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
