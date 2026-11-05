# Time Clock – maintenance guide for Claude Code

Time Clock is a small installable web app (PWA) that Torah Live staff use to record work hours
(clock in / clock out, daily entries, monthly summary) and to export the monthly hours report in the
Torah Live Excel template. It was built for the company by Shlomo Rotenberg.

- Live site (GitHub Pages, branch `main`, folder `/`): https://sdr5323647-prog.github.io/TLV_Time_clock/
- Repo: https://github.com/sdr5323647-prog/TLV_Time_clock
- **This repo is the source of truth.** There is no build step: the files in the repo root are exactly what is served.
  Pushing to `main` deploys automatically (1–2 minutes).
- UI language: English, left-to-right. Visual style: Torah Live design system (see "Design" below).

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app: `<style>` (CSS + embedded fonts), markup shell, one inline `<script>` (an IIFE). |
| `sw.js` | Service worker (offline cache). **Bump `CACHE` on every release** (`timeclock-v4` → `timeclock-v5`…). |
| `manifest.webmanifest`, `icon-192.png`, `icon-512.png` | Install metadata and icons. |
| `jszip.min.js` | JSZip 3.10.1, used to build the Excel file. |
| `sync-config.js` | `window.SYNC_CONFIG = { googleClientId }`. The Client ID is public (not a secret). |
| `privacy.html`, `terms.html` | Linked from the Google OAuth consent screen. Their statements must stay true. |
| `README.txt` | Setup notes for the owner. |

`index.html` contains a few **very long lines** (base64 fonts in `<style>`, `TEMPLATE_B64`, the logo data-URI).
Never `cat` or print the whole file. Use `grep -n "…" index.html | cut -c1-200`, `sed -n 'A,Bp'` on ranges,
and targeted edits (exact-string replace). After editing, check that the file still ends with `</html>`.

## Data model (all in the browser, key `timeclock-v1` in localStorage)

```
data = {
  shifts:   [{ id, start, end, note }],      // start/end = epoch ms; end === null while on shift
  dayNotes: { 'YYYY-MM-DD': 'text' },        // note for a day off / holiday (goes into the Excel report)
  settings: { target, rate, currency, workdays:[0-6], name, email, autoBreak },
  meta:     { u:{key:ts}, del:{key:1}, dirty:{key:1}, uid, account }   // sync bookkeeping
}
```
- Record keys: `s_<shiftId>`, `n_<date>`, `cfg`. `meta.u[key]` = last-change timestamp, `meta.del[key]` = tombstone.
- **Mutation pattern:** `snapshot()` → change `data.shifts` → `save()` (which diffs, calls `touch()`, persists, queues sync).
  For notes/settings call `touch('n_' + date, deleted)` / `touch('cfg')` before `save()`.
  Undo restores the snapshot and goes through the same `save()`.
- Only one open shift (`end === null`) is allowed.
- A shift belongs to the day it **started**. An end time earlier than the start means "next day".
- **Backward compatibility is mandatory:** people already have data in localStorage and in their Drive. Any change to
  these structures must read old data without loss (add fields with defaults; never rename/remove).

## Cloud sync (optional, per user)

- Sign in with Google (Google Identity Services token flow, scopes `drive.appdata` + `userinfo.email`).
- Data lives **only in the user's own Google Drive**, hidden app folder, one file `timeclock-data.json`
  (`{ v:1, records:{ key: {t,..., d, u} } }`). The developer/host cannot read it. There is no backend and no database.
  Do not add analytics, servers, or anything that sends hours/emails elsewhere.
- `syncCycle()`: list file(s) → read → merge into local (`applyRemote`, newest `u` wins per record) → write back if
  local is newer or the file is missing records → delete duplicate files. Self-healing; never overwrites an unreadable file.
- Triggers: a few seconds after a change, app open/focus, online, every 60 s while visible.
- Access tokens last 1 hour and renewing needs a user gesture, so the next click renews it (`state: needtoken`).
- Switching Google account on a device asks before replacing local data.

## Excel report (Torah Live template)

`exportModal()` → `makeXlsx(month, name)` loads the company template embedded as `TEMPLATE_B64` (Hebrew, RTL, sheet1) with JSZip and
edits `xl/worksheets/sheet1.xml` by string replacement. Do **not** re-create the workbook from scratch; the template's
styles and formulas must be preserved.
- `A1` title (Hebrew prefix + month name + year), `A2` "שם העובד/ת: " + name, `A4` = first day of month (Excel serial);
  rows 4–34 = days of the month. Per day: `C` start time and `D` end time (fractions of a day), `E` break minutes.
  If a day has no shifts but has a day note, the note goes into `C` only.
- Several shifts in a day → first start, last end, gaps (+ `autoBreak`) as break minutes.
- Formulas in `F`–`I` and totals `G37:I37` stay as in the template; their cached values are recomputed in JS
  (`OT_REGULAR = 8.4`, `OT_125 = 2` = template cells `C37`, `C38`) and `fullCalcOnLoad="1"` is set so Excel recalculates.
- File name: `<Name> – <Month> <Year>.xlsx`. "Share" uses the Web Share API, falling back to download + `mailto:` (recipient from settings).
- To inspect the template: decode `TEMPLATE_B64` to a file and open it (`python3 -c "import base64,re; …"`).
- If you change this, verify with LibreOffice: recalculate the exported file and compare to the cached values.

## Design (Torah Live design system)

- Dark ground `#141414` / `#0f1117`, white text, secondary text `rgba(255,255,255,.7)`. Tokens are the CSS variables in `:root`
  (`--red #ef004c`, `--red-bright`, `--purple`, `--teal`, `--mint`, …). Use variables, not hard-coded colours.
- **One red primary button per view.** All buttons are fully rounded pills; label weight 600, ≥16px. Secondary = transparent with 2px white
  border (`.btn.ghost`). Light pill = `.btn.light`. The crimson→purple gradient is used only for the italic "Clock" in the title.
- Radius: 24px cards/modals, 16px stat tiles, 12px list rows. Headlines weight 800–900, tight tracking.
- Fonts: Source Sans Pro (+ Assistant Hebrew for Hebrew text), embedded as base64 `@font-face`.
- The Torah Live wordmark (dark version) is an `<img>` data-URI in the header. Never recolour or redraw it.
- No emoji. Icons are simple line SVGs. Touch targets ≥ 44px. Respect `prefers-reduced-motion`. Keep the print stylesheet (light page).
- Tablet/phone sizes were not defined by the design system; the current responsive rules are our own.

## Hard rules

1. Never commit secrets. (The Google **client secret** is not used by this app and must never appear in the repo.)
2. Do not change the Google Client ID, OAuth scopes, `privacy.html` or `terms.html` without asking the owner.
3. Keep it working offline and installable; keep everything in the browser (no external requests except Google sign-in / Drive API).
4. Don't break existing users' data (see Data model) or the Excel layout (see Excel report).
5. Keep the UI English; keep `<html lang="en" dir="ltr">`.

## Release procedure (do all of it yourself, no manual steps for the owner)

1. Clone/pull the repo; work on `main` (small, focused commits).
2. Edit with targeted replacements; check `node --check` on the extracted script
   (`python3 - <<'EOF' … re.search(r'<script>(.*)</script>', html, re.S) …` → file → `node --check file.js`).
   Watch for duplicate top-level function/const names in the IIFE (a later declaration silently overrides an earlier one).
3. Test locally: `python3 -m http.server 8000` and open `http://localhost:8000/`.
   If Playwright is available, run a smoke test: clock in/out, add/edit/delete an entry, undo, month view, settings,
   Excel export download (open it and check the cells), offline reload, no console errors.
   Google sign-in cannot be tested locally with the real service; mock `google.accounts.oauth2` and the
   `https://www.googleapis.com/**` requests if you change sync.
4. Bump `CACHE` in `sw.js`. If you add a new file that must work offline, add it to `FILES` in `sw.js`.
5. `git add -A && git commit -m "<clear message>" && git push origin main`.
6. Confirm Pages deployed (open the live URL after ~1–2 min). Then tell the owner, in a few lines, what changed and that
   installed copies update after the app is closed completely and reopened (sometimes twice).

## Known limits (explain, don't "fix" silently)

- Sync is not instant (seconds to a minute) and Google asks for a re-connect tap every hour.
- Google shows "hasn't verified this app" on sign-in (the app is unverified; only low-risk scopes are used).
- The repo and site are public: do not put anything private in them.
