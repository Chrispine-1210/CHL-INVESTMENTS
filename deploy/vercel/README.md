# Thoko on Vercel

Production storefront: https://thoko-restaurant.vercel.app

Set the Vercel project's Root Directory to `deploy/vercel` when connecting this repository. Use the Other framework preset and the checked-in deployment settings. The storefront requires no runtime environment variables.

Vercel serves the homepage, founder story, journal, privacy notice and public assets through rewrites to the production Thoko site. Ordering, community submissions, and staff access open directly on the production site. That origin owns sign-in, role checks and Cloudflare D1 business records. Private APIs and login callbacks are outside the public rewrite rules.

After deployment, confirm the homepage, journal and a media asset return HTTP 200. Confirm `/order` and `/portal/ledger` redirect to the production Thoko origin. Confirm `/api/portal/ledger` returns HTTP 404 on the Vercel hostname. The `/health.json` route verifies Vercel routing only.

The repository root contains the full Worker application. Its active Sites source commit when this configuration was deployed was `a3ebe93480987b09f1a903766f0fa9e80ed2cad2`.
