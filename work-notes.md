# Thoko Restaurant and Takeaway

- **Public website** `/`, `/community` and `/privacy`.
- **Food ordering** `/order`. Prices are in whole MWK. Pickup is a request until staff confirm. Delivery requires a fee quote and recorded customer acceptance.
- **Management portal** `/portal`. Sign in with the Site owner's account to manage operating settings and delegate restaurant roles. The runtime key `THOKO_OWNER_EMAIL` identifies the initial owner. Its value belongs in the hosting environment.
- **Customer intake** begins paused. The owner enables pickup, delivery and community submissions individually in Staff & settings after assigning staff. Operations and finance staff record cleared receipts or refunds with references.
- **Finance** uses balanced journals. Record opening balances and post transactions from the underlying records and settlement evidence. The balance sheet covers posted journals through the chosen date. Tax and bill registers record due dates, estimates, and supporting references.
- **Community** publishes staff-managed updates and stores customer interests and private feedback. The inbox supports staff review. Email broadcast and payment processing require provider integrations.
- **Data** lives in D1. The Sites gateway establishes identity and the API enforces user ownership and staff roles. The first migration creates the business tables without sample records.

## Local verification

Run `npm run db:generate` after schema edits. Run TypeScript checks and the managed Sites build. Apply the generated D1 migration to the local database before previewing.

After building, run `node tests/workflow.mjs` for the isolated Worker and D1 acceptance test. It uses synthetic accounts and records in an in-memory database.
