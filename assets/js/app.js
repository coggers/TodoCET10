import { GYMS, portalUrl, mapsUrl, inkFor } from '../data/gyms.js';
import { LANGS, detectLang, setLang, t } from './i18n.js';

const gymList = document.getElementById('gyms');
const langBar = document.getElementById('langs');
const offlineBanner = document.getElementById('offline');

let lang = detectLang();

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
};

const icon = (key) =>
  `<svg class="chip__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"
     fill="none" stroke="currentColor" stroke-width="1.7"
     stroke-linecap="round" stroke-linejoin="round">${ICONS[key]}</svg>`;

/** Secondary links, in the order they appear under each card. */
const EXTRAS = [
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

  item.append(media, actions, more);
  return item;
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

  gymList.replaceChildren(...GYMS.map((gym) => renderGym(gym, strings)));
  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = strings[node.dataset.i18n];
  }
  renderLangs();
}

function syncOnlineState() {
  offlineBanner.hidden = navigator.onLine;
}

render();
syncOnlineState();
addEventListener('online', syncOnlineState);
addEventListener('offline', syncOnlineState);

if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* offline support is a nicety; the hub works without it */
    });
  });
}
