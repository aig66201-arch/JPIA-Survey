# BSAIS 3A Survey — Cloudflare + GitHub + Google Apps Script

## Architecture
Browser → Cloudflare Worker → Google Apps Script → Google Sheet / Email

The repository is ready for Cloudflare deployment. The Apps Script backend is included in `apps-script/Code.gs`.

## Cloudflare deployment
1. Push this repository to GitHub.
2. In Cloudflare Workers & Pages, create a Worker from the GitHub repository.
3. Use the repository root as the project directory.
4. Build command: `npm run deploy`
5. Deploy.

For direct Wrangler deployment:
```bash
npm install
npx wrangler deploy
```

## Google Apps Script
The included `apps-script/Code.gs` is the backend used by the Worker. It must be deployed once as a Google Apps Script Web App with:
- Execute as: Me
- Who has access: Anyone

The Worker already points to the supplied `/exec` deployment URL.

## Files
- `public/survey.html` — survey UI
- `src/worker.js` — Cloudflare proxy/API
- `apps-script/Code.gs` — Google Sheets + email backend
- `wrangler.toml` — Cloudflare configuration
- `package.json` — deployment package

PM PRINT, ISU printing, and other projects are not included.
