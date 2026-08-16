/**
 * Tiny i18n layer: Catalan and Spanish because that is what the centres and the
 * Deporsite portals speak, English as the fallback for everything else.
 */

const STORAGE_KEY = 'cet10hub.lang';

export const LANGS = { ca: 'Català', es: 'Español', en: 'English' };

const STRINGS = {
  ca: {
    tagline: 'Reserva classes als teus centres',
    book: 'Reservar classes',
    manage: 'Les meves reserves',
    join: 'Alta d’abonat',
    login: 'Iniciar sessió',
    home: 'Portal',
    site: 'Web del centre',
    call: 'Trucar',
    directions: 'Com arribar',
    more: 'Més opcions',
    moreFor: (name) => `Més opcions per a CEM ${name}`,
    bookFor: (name) => `Reservar classes a CEM ${name}`,
    manageFor: (name) => `Les meves reserves a CEM ${name}`,
    language: 'Idioma',
    footer: 'Enllaça als portals oficials de CET10. No és una app oficial.',
    offline: 'Sense connexió — els enllaços s’obriran quan tornis a tenir xarxa.',
  },
  es: {
    tagline: 'Reserva clases en tus centros',
    book: 'Reservar clases',
    manage: 'Mis reservas',
    join: 'Alta de abonado',
    login: 'Iniciar sesión',
    home: 'Portal',
    site: 'Web del centro',
    call: 'Llamar',
    directions: 'Cómo llegar',
    more: 'Más opciones',
    moreFor: (name) => `Más opciones para CEM ${name}`,
    bookFor: (name) => `Reservar clases en CEM ${name}`,
    manageFor: (name) => `Mis reservas en CEM ${name}`,
    language: 'Idioma',
    footer: 'Enlaza a los portales oficiales de CET10. No es una app oficial.',
    offline: 'Sin conexión — los enlaces se abrirán cuando vuelvas a tener red.',
  },
  en: {
    tagline: 'Book classes at your centres',
    book: 'Book a class',
    manage: 'My bookings',
    join: 'Membership',
    login: 'Sign in',
    home: 'Portal',
    site: 'Website',
    call: 'Call',
    directions: 'Directions',
    more: 'More options',
    moreFor: (name) => `More options for CEM ${name}`,
    bookFor: (name) => `Book a class at CEM ${name}`,
    manageFor: (name) => `My bookings at CEM ${name}`,
    language: 'Language',
    footer: 'Links to the official CET10 portals. Not an official app.',
    offline: 'Offline — links will open once you are back on a network.',
  },
};

/** Saved override, else the first device language we support, else English. */
export function detectLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && STRINGS[saved]) return saved;

  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (STRINGS[base]) return base;
  }
  return 'en';
}

export function setLang(lang) {
  localStorage.setItem(STORAGE_KEY, lang);
}

export function t(lang) {
  return STRINGS[lang] ?? STRINGS.en;
}
