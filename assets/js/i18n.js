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

    install: 'Afegir a la pantalla d’inici',
    installTitle: 'Afegir a la pantalla d’inici',
    installIos: [
      'Toca el botó Compartir a la barra de Safari (el quadrat amb la fletxa cap amunt).',
      'Baixa per la llista i tria «Afegir a la pantalla d’inici».',
      'Toca «Afegir». El CET10 Hub apareixerà amb la resta d’aplicacions.',
    ],
    installGeneric: [
      'Obre el menú del navegador.',
      'Tria «Instal·lar aplicació» o «Afegir a la pantalla d’inici».',
      'Confirma-ho. El CET10 Hub apareixerà amb la resta d’aplicacions.',
    ],
    installInApp: 'Estàs dins del navegador d’una altra app. Obre aquesta pàgina a Safari o Chrome per poder afegir-la.',

    share: 'Compartir',
    shareCopied: 'Enllaç copiat',
    sourceCode: 'Codi font',
    feedback: 'Enviar comentaris',
    feedbackTitle: 'Enviar comentaris',
    feedbackMessage: 'Què vols explicar-nos?',
    feedbackContact: 'El teu correu (opcional, per poder-te respondre)',
    feedbackPrivacy: 'S’envia només el que escrius aquí. No es recull cap altra dada, ni la teva ubicació ni res del teu ús de l’app.',
    feedbackSend: 'Enviar',
    feedbackCancel: 'Cancel·lar',
    feedbackEmpty: 'Escriu un missatge abans d’enviar.',
    feedbackFailed: 'No s’ha pogut enviar. Comprova la connexió i torna-ho a provar.',
    feedbackDone: 'Gràcies! Comentaris enviats.',
    feedbackFallback: 'El formulari encara no està configurat. Pots obrir una incidència a GitHub.',
    feedbackIssues: 'Obrir una incidència',
    shareText: 'Reserva classes al CEM Bac de Roda, Júpiter i Maresme des d’un sol lloc.',

    bookingGap: 'És divendres: les properes 48 hores són el cap de setmana, quan normalment no hi ha classes dirigides. Com que les reserves solen obrir-se amb uns 2 dies d’antelació, potser encara no hi ha res per reservar fins que s’obrin les de dilluns.',
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

    install: 'Añadir a la pantalla de inicio',
    installTitle: 'Añadir a la pantalla de inicio',
    installIos: [
      'Toca el botón Compartir en la barra de Safari (el cuadrado con la flecha hacia arriba).',
      'Baja por la lista y elige «Añadir a pantalla de inicio».',
      'Toca «Añadir». CET10 Hub aparecerá junto al resto de tus aplicaciones.',
    ],
    installGeneric: [
      'Abre el menú del navegador.',
      'Elige «Instalar aplicación» o «Añadir a la pantalla de inicio».',
      'Confírmalo. CET10 Hub aparecerá junto al resto de tus aplicaciones.',
    ],
    installInApp: 'Estás dentro del navegador de otra app. Abre esta página en Safari o Chrome para poder añadirla.',

    share: 'Compartir',
    shareCopied: 'Enlace copiado',
    sourceCode: 'Código fuente',
    feedback: 'Enviar comentarios',
    feedbackTitle: 'Enviar comentarios',
    feedbackMessage: '¿Qué nos quieres contar?',
    feedbackContact: 'Tu correo (opcional, para poder responderte)',
    feedbackPrivacy: 'Se envía solo lo que escribes aquí. No se recoge ningún otro dato, ni tu ubicación ni nada de tu uso de la app.',
    feedbackSend: 'Enviar',
    feedbackCancel: 'Cancelar',
    feedbackEmpty: 'Escribe un mensaje antes de enviar.',
    feedbackFailed: 'No se ha podido enviar. Comprueba la conexión e inténtalo de nuevo.',
    feedbackDone: '¡Gracias! Comentarios enviados.',
    feedbackFallback: 'El formulario aún no está configurado. Puedes abrir una incidencia en GitHub.',
    feedbackIssues: 'Abrir una incidencia',
    shareText: 'Reserva clases en el CEM Bac de Roda, Júpiter y Maresme desde un solo sitio.',

    bookingGap: 'Es viernes: las próximas 48 horas son el fin de semana, cuando normalmente no hay clases dirigidas. Como las reservas suelen abrirse con unos 2 días de antelación, puede que aún no haya nada que reservar hasta que se abran las del lunes.',
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

    install: 'Add to Home Screen',
    installTitle: 'Add to your home screen',
    installIos: [
      'Tap the Share button in Safari’s toolbar (the square with an arrow pointing up).',
      'Scroll down the list and choose “Add to Home Screen”.',
      'Tap “Add”. CET10 Hub will appear alongside your other apps.',
    ],
    installGeneric: [
      'Open your browser’s menu.',
      'Choose “Install app” or “Add to Home screen”.',
      'Confirm. CET10 Hub will appear alongside your other apps.',
    ],
    installInApp: 'You are inside another app’s browser. Open this page in Safari or Chrome to add it.',

    share: 'Share',
    shareCopied: 'Link copied',
    sourceCode: 'Source code',
    feedback: 'Send feedback',
    feedbackTitle: 'Send feedback',
    feedbackMessage: 'What would you like to tell us?',
    feedbackContact: 'Your email (optional, so we can reply)',
    feedbackPrivacy: 'Only what you type here is sent. Nothing else is collected — not your location, not anything about how you use the app.',
    feedbackSend: 'Send',
    feedbackCancel: 'Cancel',
    feedbackEmpty: 'Please write a message before sending.',
    feedbackFailed: 'Could not send. Check your connection and try again.',
    feedbackDone: 'Thanks! Feedback sent.',
    feedbackFallback: 'The form is not configured yet. You can open an issue on GitHub instead.',
    feedbackIssues: 'Open an issue',
    shareText: 'Book classes at CEM Bac de Roda, Júpiter and Maresme from one place.',

    bookingGap: 'It’s Friday: the next 48 hours are the weekend, when there are normally no timetabled classes. Since bookings usually open about 2 days ahead, there may be nothing to book yet until Monday’s classes open up.',
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
