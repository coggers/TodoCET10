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

### Weekend booking notice

On Fridays a short amber note appears under the quick-book row, because the next 48 hours
are the weekend, timetabled classes do not generally run then, and the portals only open
bookings around two days ahead — so there is often nothing to book until Monday's classes
open up.

It is derived from two constants in [`assets/data/hours.js`](assets/data/hours.js),
`NO_CLASS_DAYS` and `BOOKING_WINDOW_HOURS`, rather than hardcoding "Friday". Change either
and the notice moves to whatever day it should then apply to. Like the opening status, this
is the centres' usual practice rather than a published guarantee, so the wording is hedged.

### Sort by distance

Optional, off by default. Tapping it asks the browser for your location, computes the
distance to each centre and reorders the list. Your location is read **on the device only** —
there is no backend, and nothing is transmitted anywhere. Declining leaves the order alone.

## Add it to your home screen

There is a button in the footer that switches between two jobs. Before the app is installed
it offers to add it; once installed it becomes **Share**, so you can still hand the link to
someone at the gym. It is never hidden — an earlier version hid it once installed, which
meant the person who installed it could never find it again. What it does depends on the platform, because the platforms genuinely differ:

- **Android / Chromium** — captures `beforeinstallprompt` and replays it on tap, so this is
  a real one-tap install. Chrome's own mini-infobar is suppressed so the button is the only
  entry point. The manifest carries `description` and `screenshots`, which is what makes
  Chrome show its rich install dialog rather than a bare info bar.
- **iOS / Safari** — shows the steps instead. This is not a shortcut: Safari implements no
  install API at all and there is no way to trigger *Add to Home Screen* programmatically,
  so accurate instructions are the best that exists.
- **Inside another app's browser** (Instagram, Facebook…) — says so and asks you to reopen
  in Safari or Chrome, rather than giving steps that cannot work there.

Manually, it is Share → *Add to Home Screen* on iOS, or ⋮ → *Install app* on Android.

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

## Privacy and EU compliance

There is a privacy notice in the footer, also reachable at `/#privacy`, translated into all
three languages. It exists because GDPR Article 13 requires a transparency notice as soon
as any personal data is processed — here, feedback submissions and the host's server logs.

**There is deliberately no cookie or consent banner, and none is required.** The ePrivacy
rule on storing information on a user's device exempts storage that is strictly necessary
for a service the user explicitly asked for. The only things stored are four preferences
the user sets themselves — language, favourite centre, sort and filter — and there is no
analytics, advertising, tracking, profiling or third-party cookie anywhere in the app. A
test asserts this stays true: it fails if normal use produces any third-party request, any
cookie, or any storage key outside the `cet10hub.` prefix.

Location is read on the device and discarded; it is never transmitted or stored, so the
browser's own permission prompt is the only consent mechanism needed.

### If donations or advertising are added later

- **Donations** change little. A payment provider becomes a separate controller and the
  notice needs a paragraph. Still no consent banner.
- **Advertising changes everything.** Ad tech sets non-essential identifiers, which require
  prior opt-in consent with a real reject option — in practice a consent management
  platform, plus the accompanying legal work. Do not add ad code without that; retrofitting
  consent is far harder than the ad tag itself.

## Feedback

The footer has a **Send feedback** link opening an in-app form, and a **Source code** link
to this repository.

The form posts to [Web3Forms](https://web3forms.com), which is free and needs no backend of
our own. Turning it on is a two-line job — get an access key emailed to you, paste it into
[`assets/data/feedback.js`](assets/data/feedback.js), redeploy. Until then the dialog offers
GitHub Issues instead, so there is never a form that silently fails.

Only the typed message, an optional reply address and the UI language are sent. No location,
no usage data, nothing about which centres you use — there is a test asserting the request
body contains nothing else.

Note that Hover charges $5/year for email forwarding. If you would rather have plain email,
ImprovMX and Forward Email both forward a custom domain for free using MX records added at
Hover, with no need to move the domain or change nameservers.

## Motion

Reordering and filtering run through the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API):
each card carries a stable `view-transition-name`, so the browser matches it across a
reorder and tweens it to its new position rather than snapping. No animation library.

It is progressive enhancement in both directions — browsers without the API, and anyone
with `prefers-reduced-motion: reduce`, get the plain instant update. Only user-initiated
reorders and hides animate; the once-a-minute status refresh deliberately does not, or the
page would twitch on its own. Durations are 180–260 ms: enough to show what moved where,
not enough to wait for.

## Design

Colours and type are taken from the centres' own sites: the shared CET10 blue `#61B4E4`,
Roboto, and a per-centre accent so the three cards are tellable apart at a glance —
Bac de Roda `#D1E605`, Júpiter `#61CE70`, Maresme `#FF9900`.

## Tests and CI

Fifteen suites in [`tests/`](tests), run by [`tests/run.mjs`](tests/run.mjs), which serves the
site on an ephemeral port and executes each one. They cover the opening-hours model and
holiday calendar, the Friday booking-gap rule, sorting, filtering, favourites, the install
and share modes, the feedback form, the privacy notice, motion, the service worker's update
behaviour, the Content-Security-Policy, and a full axe-core accessibility pass in both
colour schemes.

```sh
npm install
npx playwright install chromium
npm test
```

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs them on every push and pull
request. For a static site with no backend this is the observability that pays: there is no
server to watch, and the realistic failure mode is a regression shipping unnoticed.

Deliberately **not** added: analytics, real-user monitoring or error tracking. They would
contradict the privacy position above, add weight and a third party, and there is no
decision they would inform.

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
