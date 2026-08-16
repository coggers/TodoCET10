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

    reception: 'Recepció virtual',
    quickBook: 'Reserva ràpida',
    quickBookFor: (name) => `Reservar classes a CEM ${name}`,

    sortByDistance: 'Més a prop',
    locationPrivacy: 'La teva ubicació es llegeix només al teu dispositiu, per ordenar aquesta llista. No s’envia enlloc.',
    locationDenied: 'No s’ha pogut obtenir la ubicació. Es manté l’ordre original.',
    locating: 'Obtenint ubicació…',
    openNow: 'Obert ara',
    reset: 'Restablir',
    resetAria: 'Restablir l’ordre i el filtre',
    noneOpen: 'Ara mateix no hi ha cap centre obert.',
    showAll: 'Mostra’ls tots',
    favourite: 'Preferit',
    setFavourite: (name) => `Marcar CEM ${name} com a preferit`,
    unsetFavourite: (name) => `Treure CEM ${name} dels preferits`,
    isFavourite: (name) => `CEM ${name} és el teu centre preferit`,

    statusOpen: (close) => `Obert fins a les ${close}`,
    statusSoon: (mins) => `Tanca en ${mins} min`,
    statusClosed: (open) => `Tancat · obre a les ${open}`,
    statusHoliday: 'Festiu — horari de diumenge',
    statusLabel: 'Estat d’obertura',

    infoTitle: 'Com es calcula l’horari',
    infoBody: [
      'Aquest indicador utilitza l’horari habitual publicat pel centre i l’hora actual a Barcelona.',
      'Els dies festius s’apliquen els horaris de diumenge, tal com indica el mateix centre.',
      'No té en compte horaris d’estiu, tancaments per manteniment ni canvis puntuals, i mai consulta el centre en directe.',
      'Si t’hi jugues el viatge, comprova-ho al portal del centre.',
    ],
    infoOpenPortal: 'Obrir el portal per comprovar-ho',
    infoClose: 'Entesos',
    infoAria: 'Com es calcula l’horari',
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

    reception: 'Recepción virtual',
    quickBook: 'Reserva rápida',
    quickBookFor: (name) => `Reservar clases en CEM ${name}`,

    sortByDistance: 'Más cerca',
    locationPrivacy: 'Tu ubicación se lee solo en tu dispositivo, para ordenar esta lista. No se envía a ningún sitio.',
    locationDenied: 'No se ha podido obtener la ubicación. Se mantiene el orden original.',
    locating: 'Obteniendo ubicación…',
    openNow: 'Abierto ahora',
    reset: 'Restablecer',
    resetAria: 'Restablecer el orden y el filtro',
    noneOpen: 'Ahora mismo no hay ningún centro abierto.',
    showAll: 'Mostrarlos todos',
    favourite: 'Favorito',
    setFavourite: (name) => `Marcar CEM ${name} como favorito`,
    unsetFavourite: (name) => `Quitar CEM ${name} de favoritos`,
    isFavourite: (name) => `CEM ${name} es tu centro favorito`,

    statusOpen: (close) => `Abierto hasta las ${close}`,
    statusSoon: (mins) => `Cierra en ${mins} min`,
    statusClosed: (open) => `Cerrado · abre a las ${open}`,
    statusHoliday: 'Festivo — horario de domingo',
    statusLabel: 'Estado de apertura',

    infoTitle: 'Cómo se calcula el horario',
    infoBody: [
      'Este indicador usa el horario habitual publicado por el centro y la hora actual en Barcelona.',
      'Los días festivos se aplican los horarios de domingo, tal como indica el propio centro.',
      'No tiene en cuenta horarios de verano, cierres por mantenimiento ni cambios puntuales, y nunca consulta al centro en directo.',
      'Si te juegas el viaje, compruébalo en el portal del centro.',
    ],
    infoOpenPortal: 'Abrir el portal para comprobarlo',
    infoClose: 'Entendido',
    infoAria: 'Cómo se calcula el horario',
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

    reception: 'Virtual reception',
    quickBook: 'Quick book',
    quickBookFor: (name) => `Book a class at CEM ${name}`,

    sortByDistance: 'Nearest first',
    locationPrivacy: 'Your location is read on your device only, to order this list. It is never sent anywhere.',
    locationDenied: 'Could not get your location. Keeping the original order.',
    locating: 'Getting your location…',
    openNow: 'Open now',
    reset: 'Reset',
    resetAria: 'Reset the order and filter',
    noneOpen: 'No centre is open right now.',
    showAll: 'Show all',
    favourite: 'Favourite',
    setFavourite: (name) => `Make CEM ${name} your favourite`,
    unsetFavourite: (name) => `Remove CEM ${name} as your favourite`,
    isFavourite: (name) => `CEM ${name} is your favourite centre`,

    statusOpen: (close) => `Open until ${close}`,
    statusSoon: (mins) => `Closes in ${mins} min`,
    statusClosed: (open) => `Closed · opens ${open}`,
    statusHoliday: 'Public holiday — Sunday hours',
    statusLabel: 'Opening status',

    infoTitle: 'How this opening status works',
    infoBody: [
      'This uses the centre’s published regular timetable and the current time in Barcelona.',
      'On public holidays the Sunday hours are applied, which is the centre’s own rule.',
      'It does not account for summer timetables, maintenance closures or one-off changes, and it never checks with the centre live.',
      'If the trip matters, confirm on the centre’s portal.',
    ],
    infoOpenPortal: 'Open the portal to check',
    infoClose: 'Got it',
    infoAria: 'How this opening status works',
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
