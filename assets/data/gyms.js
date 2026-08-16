/**
 * Single source of truth for the hub.
 *
 * Every portal link is derived from `slug` + a path in `PATHS`, so there is
 * exactly one place to edit if Deporsite ever moves a page.
 */

export const PORTAL_HOST = 'deporsite.net';

export const PATHS = {
  book: '/reserva-clases',
  manage: '/area-usuario/reservas',
  join: '/alta-abonados',
  login: '/login',
  home: '/',
};

export const GYMS = [
  {
    id: 'bdr',
    slug: 'cet10bdr',
    name: 'Bac de Roda',
    accent: '#D1E605',
    photo: 'assets/img/bdr.webp',
    address: 'Rambla Guipúscoa 25, 08018 Barcelona',
    phone: '+34932663445',
    site: 'https://bacderodasport.com/',
  },
  {
    id: 'jupiter',
    slug: 'cet10jupiter',
    name: 'Júpiter',
    accent: '#61CE70',
    photo: 'assets/img/jupiter.webp',
    address: 'Carrer de l’Agricultura 232, 08020 Barcelona',
    phone: '+34933148820',
    site: 'https://jupitersport.cat/',
  },
  {
    id: 'maresme',
    slug: 'cet10maresme',
    name: 'Maresme',
    accent: '#FF9900',
    photo: 'assets/img/maresme.webp',
    address: 'Carrer de Pallars 484, 08019 Barcelona',
    phone: '+34933083553',
    site: 'https://cemmaresme.com/',
  },
];

/** Absolute URL for one of the PATHS keys on a given gym's portal. */
export function portalUrl(gym, key) {
  return `https://${gym.slug}.${PORTAL_HOST}${PATHS[key]}`;
}

/**
 * Apple Maps on Apple platforms, Google Maps everywhere else — both open the
 * native app when it is installed and fall back to the web when it is not.
 */
export function mapsUrl(gym) {
  const query = encodeURIComponent(`CEM ${gym.name}, ${gym.address}`);
  const apple = /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent) &&
    !/android/i.test(navigator.userAgent);
  return apple
    ? `https://maps.apple.com/?q=${query}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Pick black or white text for a background colour using the WCAG relative
 * luminance formula, so accents like the lime #D1E605 get dark ink.
 */
export function inkFor(hex) {
  const channel = (c) => {
    const v = parseInt(hex.slice(1 + c * 2, 3 + c * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  return luminance > 0.4 ? '#10242e' : '#ffffff';
}
