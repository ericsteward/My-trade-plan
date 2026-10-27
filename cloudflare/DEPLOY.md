# Secure Twelve Data connection — deployment handoff
The GitHub app preview has been wired to the Cloudflare Worker address shown in the user's screenshot:
`https://forex-marketdata.spoonie9001.workers.dev`.

## Remaining account-owner steps (not done by ChatGPT)
1. Open Cloudflare > Workers & Pages > forex-marketdata > Edit code. Replace Hello World with the complete content of `cloudflare/forex-market-data.worker.js` and deploy.
2. Open Worker Settings > Variables and Secrets. Add a **Secret** named `TWELVE_DATA_API_KEY` with a newly rotated Twelve Data key. Never paste it into GitHub, app JavaScript, or chat.
3. Add a **Text** variable `ALLOWED_ORIGIN` = `https://ericsteward.github.io`.
4. Visit `/health` and verify `keyConfigured:true`; test `/candles?pair=AUDCAD`. The service should return 300 daily candles if allowed by provider quota.
5. Check the provider's actual symbol coverage, 300-candle credit usage, and caching rules; set Cloudflare rate limits or Access protections before relying on a publicly accessible endpoint.
6. Review and merge PR only after Worker responds correctly, dashboard has been smoke-tested, and user has backed up localStorage data.

## Known limitations
- Twelve Data candles are NOT authoritative FOREX.com MT4 D1 candles. Weekend dates, duplicate Oct 4 rows, provider time zone, and DST need explicit reconciliation.
- This app **does not** automatically fill the authoritative Y/Q/M/W/D levels or EMA from Twelve Data; these remain manual/FOREX.com D1 history sourced.
- H1/H4 confirmations and VantagePoint data are not supplied by the daily endpoint; no trading alerts or orders are issued.
- The preview does not overwrite `gregPlan`, `gregGoldPlan`, or journals.
- API key is server-side only. The public endpoint has a pair allowlist and 15-minute cache, but should still have abuse/rate limits configured.
- Do not claim the app is live until deployment and smoke tests succeed.
