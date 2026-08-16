# Working on CET10 Hub

Guidance for anyone — human or agent — picking this project up. It is written from how
this codebase has actually been built, including the mistakes worth not repeating.

## What this is

A static launcher for three CET10 gym booking portals in Barcelona, at
[todocet10.space](https://todocet10.space). Plain HTML, CSS and ES modules. No framework,
no bundler, no runtime dependencies. The deployed site is the files in the repo.

**The core goal is to stay a launcher.** It links to the gyms' own portals; it does not
reimplement them. Timetables, live occupancy and actual booking all live on the other side
of that line and stay there. When a feature request would pull the app across it, say so.

## Non-negotiables

These have each been decided deliberately. Changing one is a real decision, not a detail.

1. **No tracking.** No analytics, advertising, profiling or cookies. The privacy notice
   says so and a test enforces it — `tests/privacy.test.mjs` fails on any third-party
   request during ordinary use, any cookie, or any storage key outside `cet10hub.`.
2. **Third parties are opt-in and disclosed.** hCaptcha and Web3Forms load only when
   someone opens the feedback form, never on page load, and both are named in the notice.
3. **Nothing leaves the device unless the user asked.** Location is read in-page for
   sorting and discarded. Only the feedback form transmits anything.
4. **Content-Security-Policy is real and tested.** `script-src` is `'self'` plus the two
   captcha hosts. This rules out CDN libraries entirely — see "Constraints that bite".
5. **It has to work on a phone, offline, installed.** Every change is checked at 390px.

## Constraints that bite

Things that have already caused wrong turns here:

- **No third-party scripts.** The CSP forbids them. When the share dialog needed a QR
  code, the answer was a build-time SVG, not a QR library. Prefer generating an asset over
  adding a runtime dependency.
- **The service worker can strand people on an old build.** It was once cache-first with a
  fixed cache name, which pinned installed copies to whatever version they first opened.
  It is now network-first for markup and code, with `cache: 'no-store'` because the
  browser's own HTTP cache re-serves stale scripts underneath it. **Bump `CACHE` in
  `sw.js` whenever the shell file list changes.**
- **`Europe/Barcelona` is not a timezone.** The IANA zone is `Europe/Madrid`. Asking for
  the wrong one throws a `RangeError` and takes down the whole page.
- **`no-referrer` also nulls `Origin`.** Web3Forms' free tier rejects submissions that
  look server-side, so that one `fetch` sets `referrerPolicy: 'strict-origin'`. Do not
  "tidy" it away.
- **The list is rendered by JS**, so the first paint would shove the footer down. `.gyms`
  carries a `data-reserving` attribute holding the exact computed height until the first
  render completes. Measured CLS is ~0.002; check it if you touch card layout.
- **This sandbox cannot reach the gym portals or Web3Forms.** Cloudflare blocks the
  datacenter IP. You can verify URLs are *well-formed*, never that they *resolve*. Say
  which you did.

## Ways of working

### Verify, don't assert

Every claim in a summary should be something that was actually checked. This has repeatedly
mattered:

- The "pool occupancy" feature looked obvious until the links turned out to be seasonal
  PDFs that 404 each term. Checking took two minutes and saved shipping rot.
- Hover's email forwarding was assumed free; it costs $5/year. The free route was elsewhere.
- The QR was decoded back to its URL at three sizes before shipping, because a QR that
  does not scan is worse than no QR.

When something cannot be verified, **say so plainly and say why**, rather than implying it
was. "I could not test delivery because this environment cannot reach the host" is a
useful sentence.

### Measure before optimising

CLS was fixed by measuring 0.806, deriving the card-height formula from real geometry at
five viewports, and re-measuring 0.002 — not by sprinkling `min-height` and hoping.
Accessibility work is driven by axe-core output, not intuition.

### Tests are the deliverable, not the receipt

Sixteen suites live in `tests/`, run by `tests/run.mjs`, wired to CI. They exist because
this project has been iterated on hard and the regressions are real: the timezone crash,
the stale service worker, the referrer bug, the contrast failures.

- **When behaviour changes, update the assertion to the new contract.** Do not leave a
  test passing against a rule that no longer applies, and do not delete it. Several suites
  here now assert the *opposite* of what they once did, deliberately.
- **A failing test is information.** Three "failures" in the opening-hours suite turned
  out to be wrong expectations, not wrong code. Check which before changing anything.
- Prefer asserting the property that matters over the implementation. "The hit area
  reaches ±19px" survives a refactor; "the element is 44px" does not.

### Scope discipline

Do the work asked. If something nearby is genuinely broken, fix it and say so. If a
proposed feature is not worth its weight, say that instead of building it — recent examples
declined on purpose: analytics, real-user monitoring, responsive `srcset`, a skip link,
uptime checks against a host that blocks datacenter IPs.

### Honesty in summaries

- Lead with what the user needs to know, including bad news.
- Name what was not verified.
- Flag decisions that were judgement calls, so they can be overridden.
- Do not describe a heuristic as if it were data. The opening-status badge is a timetable
  lookup, and both the UI and the docs say so.

## Repository conventions

- **Branch**: `main` is protected. Develop on `claude/gym-reservation-hub-ctv58u`, push it,
  and **open a pull request** — never push to `main` directly, and never fast-forward it
  locally. Merging the PR is what deploys.
- **Check the output of `git checkout`.** It aborts if local edits conflict with the target
  branch, and work has more than once been committed to the wrong branch by not reading
  that. Confirm `git rev-parse --abbrev-ref HEAD` before committing, not after.
- **Deploy**: merging to `main` triggers `.github/workflows/pages.yml`, which assembles a
  `_site` directory. Anything not copied there is not published. `CNAME` must be included
  or the custom domain drops.
- **Verify the live site after deploying**, not just the build.
- **Copy**: British English. All user-facing strings live in `assets/js/i18n.js` in
  Catalan, Spanish and English — all three, always.
- **Comments** explain *why*, especially where the code looks odd on purpose. Most of the
  awkward-looking lines in this repo are load-bearing.

## Layout of the code

```
index.html              markup, CSP, dialogs
assets/js/app.js        rendering, state, all interaction
assets/js/i18n.js       every user-facing string, ca/es/en
assets/data/gyms.js     the three centres: URLs, coords, accents
assets/data/hours.js    timetable, holiday calendar, status logic (pure, unit-tested)
assets/data/feedback.js Web3Forms key and repo URLs
sw.js                   offline shell — bump CACHE when the shell changes
tests/                  16 suites + runner
```

State lives in module-scope variables in `app.js` and persists to `localStorage` under the
`cet10hub.` prefix. `render()` rebuilds from that state; user actions that reorder or hide
go through `animate()` so they get a View Transition, while the once-a-minute status
refresh deliberately does not.
