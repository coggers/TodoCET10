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
    shareCopied: 'Enllaç copiat!',
    shareTitle: 'Comparteix el CET10 Hub',
    shareLead: 'Que l’escanegin amb la càmera del mòbil. No cal intercanviar cap contacte.',
    shareQrAlt: 'Codi QR que obre todocet10.space',
    shareSheet: 'Compartir d’una altra manera',
    shareCopy: 'Copiar l’enllaç',
    listUpdated: (shown, total, how) => {
      const parts = [shown === total ? `${total} centres` : `${shown} de ${total} centres`];
      if (how.openOnly) parts.push('només oberts ara');
      if (how.distance) parts.push('ordenats per distància');
      return `${parts.join(', ')}.`;
    },
    privacy: 'Privacitat',
    privacyTitle: 'Privacitat',
    privacyUpdated: 'Actualitzat l’agost de 2026',
    privacySections: [
      ['Què és aquesta app',
       'CET10 Hub és una drecera no oficial cap als portals de reserva de tres centres CET10 de Barcelona. Aquí no hi ha compte ni inici de sessió. Quan toques un centre, surts d’aquesta app i s’aplica la política de privacitat del seu propi lloc web.'],
      ['El que es desa al teu dispositiu',
       'L’idioma, el centre preferit i si has fet servir l’ordre per distància o el filtre d’oberts es desen a l’emmagatzematge local del navegador perquè l’app ho recordi. Es queden al teu dispositiu i no s’envien enlloc. Si esborres les dades del lloc al navegador, o treus l’app de la pantalla d’inici, desapareixen.'],
      ['Ubicació',
       'Si toques «Més a prop», el navegador et demana permís i dona les teves coordenades a l’app. Es fan servir dins de la pàgina per ordenar la llista i després es descarten. No es transmeten mai, no es desen mai i no es comparteixen mai.'],
      ['Comentaris',
       'Si envies comentaris, el missatge que escrius, el correu opcional que hi posis i l’idioma triat s’envien a Web3Forms, que els fa arribar per correu electrònic. Web3Forms desa els enviaments fins a 30 dies, en servidors dels Estats Units, i l’empresa opera des de l’Índia: per tant, aquesta informació surt de l’EEE. Només es fa servir per llegir i respondre el teu missatge. Si us plau, no hi incloguis res sensible.'],
      ['Allotjament i enllaços externs',
       'El lloc s’allotja a GitHub Pages que, com qualsevol servidor web, pot registrar dades tècniques com la teva adreça IP als seus registres, per servir la pàgina i protegir-la d’abusos. Els enllaços als centres, als mapes i a GitHub obren els seus propis serveis, cadascun amb la seva política.'],
      ['Sense seguiment',
       'No hi ha analítica, ni publicitat, ni seguiment, ni perfilat, ni galetes. Res del que fas aquí es mesura ni se’ns envia. Per això no hi ha cap avís de consentiment: l’únic que es desa al teu dispositiu són les preferències que tries tu, que no requereixen consentiment.'],
      ['Els teus drets',
       'Segons el RGPD pots demanar una còpia de les dades personals que es tinguin sobre tu, demanar-ne l’esborrat o presentar una reclamació davant la teva autoritat de protecció de dades; a Espanya, l’AEPD. A la pràctica, l’únic que existeix són els comentaris que hagis decidit enviar. Pots demanar-ho amb el formulari de comentaris o obrint una incidència a GitHub.'],
    ],
    sourceCode: 'Codi font',
    feedback: 'Enviar comentaris',
    feedbackTitle: 'Enviar comentaris',
    feedbackMessage: 'Què vols explicar-nos?',
    feedbackContact: 'El teu correu (opcional, per poder-te respondre)',
    feedbackPrivacy: 'S’envia només el que escrius aquí, a través de Web3Forms (servidors fora de l’EEE), i només per llegir-ho i respondre. No es recull cap altra dada, ni la teva ubicació ni res del teu ús de l’app. Consulta l’avís de privacitat.',
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
    shareCopied: '¡Enlace copiado!',
    shareTitle: 'Comparte CET10 Hub',
    shareLead: 'Que lo escaneen con la cámara del móvil. No hace falta intercambiar ningún contacto.',
    shareQrAlt: 'Código QR que abre todocet10.space',
    shareSheet: 'Compartir de otra forma',
    shareCopy: 'Copiar el enlace',
    listUpdated: (shown, total, how) => {
      const parts = [shown === total ? `${total} centros` : `${shown} de ${total} centros`];
      if (how.openOnly) parts.push('solo abiertos ahora');
      if (how.distance) parts.push('ordenados por distancia');
      return `${parts.join(', ')}.`;
    },
    privacy: 'Privacidad',
    privacyTitle: 'Privacidad',
    privacyUpdated: 'Actualizado en agosto de 2026',
    privacySections: [
      ['Qué es esta app',
       'CET10 Hub es un acceso directo no oficial a los portales de reserva de tres centros CET10 de Barcelona. Aquí no hay cuenta ni inicio de sesión. Cuando tocas un centro, sales de esta app y se aplica la política de privacidad de su propio sitio web.'],
      ['Lo que se guarda en tu dispositivo',
       'El idioma, el centro favorito y si has usado el orden por distancia o el filtro de abiertos se guardan en el almacenamiento local del navegador para que la app los recuerde. Se quedan en tu dispositivo y no se envían a ningún sitio. Si borras los datos del sitio en el navegador, o quitas la app de la pantalla de inicio, desaparecen.'],
      ['Ubicación',
       'Si tocas «Más cerca», el navegador te pide permiso y da tus coordenadas a la app. Se usan dentro de la página para ordenar la lista y luego se descartan. Nunca se transmiten, nunca se almacenan y nunca se comparten.'],
      ['Comentarios',
       'Si envías comentarios, el mensaje que escribes, el correo opcional que indiques y el idioma elegido se envían a Web3Forms, que los entrega por correo electrónico. Web3Forms guarda los envíos hasta 30 días, en servidores de Estados Unidos, y la empresa opera desde India: por tanto, esta información sale del EEE. Solo se usa para leer y responder tu mensaje. Por favor, no incluyas nada sensible.'],
      ['Alojamiento y enlaces externos',
       'El sitio se aloja en GitHub Pages que, como cualquier servidor web, puede registrar datos técnicos como tu dirección IP en sus registros, para servir la página y protegerla de abusos. Los enlaces a los centros, a los mapas y a GitHub abren sus propios servicios, cada uno con su política.'],
      ['Sin seguimiento',
       'No hay analítica, ni publicidad, ni seguimiento, ni perfilado, ni cookies. Nada de lo que haces aquí se mide ni se nos envía. Por eso no hay aviso de consentimiento: lo único que se guarda en tu dispositivo son las preferencias que eliges tú, que no requieren consentimiento.'],
      ['Tus derechos',
       'Según el RGPD puedes pedir una copia de los datos personales que se tengan sobre ti, pedir su supresión o presentar una reclamación ante tu autoridad de protección de datos; en España, la AEPD. En la práctica, lo único que existe son los comentarios que hayas decidido enviar. Puedes solicitarlo con el formulario de comentarios o abriendo una incidencia en GitHub.'],
    ],
    sourceCode: 'Código fuente',
    feedback: 'Enviar comentarios',
    feedbackTitle: 'Enviar comentarios',
    feedbackMessage: '¿Qué nos quieres contar?',
    feedbackContact: 'Tu correo (opcional, para poder responderte)',
    feedbackPrivacy: 'Se envía solo lo que escribes aquí, a través de Web3Forms (servidores fuera del EEE), y solo para leerlo y responder. No se recoge ningún otro dato, ni tu ubicación ni nada de tu uso de la app. Consulta el aviso de privacidad.',
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
    shareCopied: 'Link copied!',
    shareTitle: 'Share CET10 Hub',
    shareLead: 'Let them scan this with their phone camera. No need to swap contact details.',
    shareQrAlt: 'QR code opening todocet10.space',
    shareSheet: 'Share another way',
    shareCopy: 'Copy the link',
    listUpdated: (shown, total, how) => {
      const parts = [shown === total ? `${total} centres` : `${shown} of ${total} centres`];
      if (how.openOnly) parts.push('open now only');
      if (how.distance) parts.push('sorted by distance');
      return `${parts.join(', ')}.`;
    },
    privacy: 'Privacy',
    privacyTitle: 'Privacy',
    privacyUpdated: 'Updated August 2026',
    privacySections: [
      ['What this app is',
       'CET10 Hub is an unofficial shortcut to the booking portals of three CET10 centres in Barcelona. There is no account and no login here. When you tap through to a centre you leave this app, and their own site and privacy policy apply.'],
      ['What is stored on your device',
       'Your language, your favourite centre, and whether you last used the distance sort or the open-now filter are saved in your browser’s local storage so the app remembers them. They stay on your device and are never sent anywhere. Clearing the site data in your browser, or removing the app from your home screen, deletes them.'],
      ['Location',
       'If you tap “Nearest first”, your browser asks your permission and gives the app your coordinates. They are used inside the page to order the list and are then discarded. They are never transmitted, never stored and never shared.'],
      ['Feedback',
       'If you send feedback, the message you type, the optional email address you give and your chosen language are sent to Web3Forms, which delivers them by email. Web3Forms keeps submissions for up to 30 days, on servers in the United States, and the company behind it operates from India — so this information leaves the EEA. It is used only to read and answer your message. Please do not include anything sensitive.'],
      ['Hosting and outbound links',
       'The site is served by GitHub Pages which, like any web host, may record technical information such as your IP address in its server logs in order to deliver the site and protect it from abuse. Links to the centres, to maps and to GitHub open their own services, each with its own privacy policy.'],
      ['No tracking',
       'There is no analytics, no advertising, no tracking, no profiling and no cookies. Nothing you do in this app is measured or sent to us. That is why there is no consent banner: the only things stored on your device are the preferences you set yourself, which do not require consent.'],
      ['Your rights',
       'Under the GDPR you may ask for a copy of any personal data held about you, ask for it to be deleted, or complain to your data protection authority — in Spain, the AEPD. In practice the only thing that exists is feedback you have chosen to send. Ask via the feedback form or by opening a GitHub issue.'],
    ],
    sourceCode: 'Source code',
    feedback: 'Send feedback',
    feedbackTitle: 'Send feedback',
    feedbackMessage: 'What would you like to tell us?',
    feedbackContact: 'Your email (optional, so we can reply)',
    feedbackPrivacy: 'Only what you type here is sent, via Web3Forms (servers outside the EEA), and only so it can be read and answered. Nothing else is collected — not your location, not anything about how you use the app. See the privacy notice.',
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
