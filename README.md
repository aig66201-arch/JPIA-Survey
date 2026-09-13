# BSAIS 3A Survey — Cloudflare + GitHub + Google Apps Script

This repository is based on the existing BSAIS 3A Survey repository and uses the same Cloudflare HTML-serving pattern as the supplied `latest(5).zip` reference implementation.

## Cloudflare serving architecture

`src/worker.js` handles `/api/*` requests. All non-API requests are passed to the Cloudflare Assets binding:

`return env.ASSETS.fetch(request);`

The survey HTML is also present as `public/index.html`. Therefore the main Worker URL `/` resolves directly to the survey without requiring `/survey.html`.

## Routes

- `/` → `public/index.html` → BSAIS 3A Survey
- `/survey.html` → same survey file
- `/api/survey` → Google Apps Script submission endpoint
- `/api/survey/names` → Google Apps Script submitted-names endpoint

## Google Apps Script backend

The Worker uses the existing Apps Script Web App:

https://script.google.com/macros/s/AKfycbwz8zKhr8vFzwcS8FCUXIHtUVakEc2DcbRo9TvPlpTDzVfpmn55dfFNTB2l-5bAzqtG/exec

The Apps Script handles Google Sheet storage, submitted names, confirmation email, validation, alphabetical sorting, and spreadsheet dropdown/data-validation preservation.

## Deploy

Push this repository to GitHub and deploy it as a Cloudflare Worker using Wrangler:

```bash
npm install
npx wrangler deploy
```

`wrangler.toml` already configures the `public/` directory as Cloudflare Assets.

No PM PRINT, ISU Printing, or unrelated project is included.
