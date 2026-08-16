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

## What's on it

Each centre gets a card with **Book a class** and **My bookings** as the primary actions,
plus secondary links for virtual reception, membership, sign in, portal, website, phone and
directions. A quick-book row at the top goes straight to any centre's class booking.

### Opening status

Each card shows whether the centre is open right now — green open, amber closing soon,
grey closed, amber on public holidays.

This is a convenience heuristic, not live data. It uses each centre's **published regular
timetable** ([`assets/data/hours.js`](assets/data/hours.js)) and the current time in
Barcelona, evaluated in the `Europe/Madrid` timezone so it stays correct when you travel.
Public holidays fall back to the Sunday timetable, which is the centres' own rule — all
three publish their reduced hours as *"Diumenges i festius"*. Catalan and Barcelona fixed
holidays are listed; Good Friday, Easter Monday and Whit Monday are computed from Easter so
the calendar does not expire after a year.

**It does not know about** summer timetables, maintenance closures or one-off changes, and
it never contacts the centre. The ⓘ button on each card says exactly this and links through
to the portal to confirm. If the trip matters, check.

### Sort by distance

Optional, off by default. Tapping it asks the browser for your location, computes the
distance to each centre and reorders the list. Your location is read **on the device only** —
there is no backend, and nothing is transmitted anywhere. Declining leaves the order alone.

## Add it to your home screen

- **iOS / Safari** — open the site, tap Share, then *Add to Home Screen*.
- **Android / Chrome** — open the site, tap the ⋮ menu, then *Install app* / *Add to Home screen*.

It launches without browser chrome and the shell works offline (the portals themselves
still need a connection).

### Updates

[`sw.js`](sw.js) is **network-first** for markup and code, so a deploy reaches an installed
home-screen copy on the next launch, and **cache-first** for images and the font, which
change only via a new filename. Bump `CACHE` whenever the shell file list changes.

This matters: the first version was cache-first for everything, which pinned an installed
copy to whatever version it was first opened with.

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
