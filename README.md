# BSAIS 3A Survey — Cloudflare + GitHub + Google Apps Script

This repository is the BSAIS 3A Survey only.

## Architecture

Browser
→ Cloudflare Worker
→ Google Apps Script
→ Google Sheet + confirmation email

The browser never connects directly to Google Apps Script.

## Repository

```text
JPIA-Survey-main/
├── public/
│   └── survey.html
├── src/
│   └── worker.js
├── apps-script/
│   └── Code.gs
├── wrangler.toml
├── package.json
└── README.md
```

## Cloudflare deployment

Deploy this as a **Cloudflare Worker**, not as a normal static Pages site.

### GitHub / Workers Builds

Connect this GitHub repository to **Cloudflare Workers & Pages → Workers → Create → Import a repository** (the exact dashboard wording may vary).

Use:

- Root directory: `/`
- Build command: `npx wrangler deploy`
- Deploy command/output: handled by `wrangler.toml`
- No separate static output directory is required.

The `wrangler.toml` file already defines the static assets directory:

```toml
[assets]
directory = "./public"
binding = "ASSETS"
```

The Worker explicitly calls `env.ASSETS.fetch(request)` for the website.

After deployment, opening the Worker URL `/` should display `public/survey.html`.

## Google Apps Script

`apps-script/Code.gs` is the backend.

Deploy that file as a Google Apps Script Web App:

- Execute as: Me
- Who has access: Anyone

The Worker is already configured to use the supplied Apps Script `/exec` URL.

## Google Sheet

The Apps Script is configured for:

- Spreadsheet ID: `11l-WmtmjIuWxGlpcVJQyWXZrn3286S2RYQCbSiIDlgo`
- Sheet: `BSAIS 3A`
- First data row: `19`
- Course: `Bachelor of Science in Accounting Information System`

The backend also copies existing Google Sheets data-validation/dropdown rules to a new submission row before writing the new values.

## API routes

- `GET /api/survey/names`
- `POST /api/survey`

All other requests are served from `public/`.

## Important

If Cloudflare shows:

> There is nothing here yet

the project was deployed as a static Pages project or the Worker was not deployed from `wrangler.toml`.

Use the **Worker** deployment with `npx wrangler deploy`.

PM PRINT, ISU printing, and other projects are not included.
