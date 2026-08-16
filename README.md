# CET10 Hub

A one-page launcher for the three CET10 municipal sports centres in Sant Martí, Barcelona.
Each centre has its own separate Deporsite booking portal on a near-identical subdomain;
this puts all three one tap away from the phone's home screen.

| Centre | Portal | Website |
| --- | --- | --- |
| CEM Bac de Roda | `cet10bdr.deporsite.net` | [bacderodasport.com](https://bacderodasport.com/) |
| CEM Júpiter | `cet10jupiter.deporsite.net` | [jupitersport.cat](https://jupitersport.cat/) |
| CEM Maresme | `cet10maresme.deporsite.net` | [cemmaresme.com](https://cemmaresme.com/) |

It is a launcher, not a client: it opens the official portals and does nothing with your
account or credentials. Not affiliated with CET10.

## Add it to your home screen

- **iOS / Safari** — open the site, tap Share, then *Add to Home Screen*.
- **Android / Chrome** — open the site, tap the ⋮ menu, then *Install app* / *Add to Home screen*.

It launches without browser chrome and the shell works offline (the portals themselves
still need a connection).

## Editing links, gyms, and colours

Everything lives in [`assets/data/gyms.js`](assets/data/gyms.js). Portal URLs are built from
each gym's `slug` plus a path in `PATHS`, so a Deporsite URL change is a one-line fix that
applies to all three centres:

```js
export const PATHS = {
  book: '/reserva-clases',
  manage: '/area-usuario/reservas',
  join: '/alta-abonados',
  login: '/login',
  home: '/',
};
```

Interface text is in [`assets/js/i18n.js`](assets/js/i18n.js) — Catalan, Spanish and English.
The language follows the device, falls back to English, and can be overridden with the
buttons in the footer (the choice is remembered).

## Design

Colours and type are taken from the centres' own sites: the shared CET10 blue `#61B4E4`,
Roboto, and a per-centre accent so the three cards are tellable apart at a glance —
Bac de Roda `#D1E605`, Júpiter `#61CE70`, Maresme `#FF9900`.

## Running it locally

No build step, no dependencies — it is plain static files:

```sh
python3 -m http.server 8080
```

Then open <http://127.0.0.1:8080>. A server is needed rather than opening `index.html`
directly, because the page uses ES modules and a service worker.

## Deployment

Pushes to `main` deploy via [`.github/workflows/pages.yml`](.github/workflows/pages.yml).
Enable it once under **Settings → Pages → Source: GitHub Actions**.

## Photos

Facility photos are each centre's own, taken from their public sites and resized for the web.
