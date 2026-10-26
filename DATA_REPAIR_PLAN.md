# Market-data repair plan (review only)

The existing app is manual-first. Its Frankfurter/ECB rates are daily reference fixings, **not** live executable FOREX.com quotes. Historical reference fixings cannot supply true Monday OHLC or broker D1 opens.

## Safe repair scope
1. Preserve localStorage keys gregPlan and gregGoldPlan, the journal, and all intended pair biases.
2. Display each pair's price source, as-of timestamp, age, and LIVE/DELAYED/REFERENCE/MANUAL/NO DATA label. Never call an ECB fixing live.
3. Separate last refreshed UI time from last observed market candle date; do not use the phone date as proof of fresh market data.
4. Keep FOREX.com MT4 D1 CSV imports as authoritative for Monday high/low/midpoint, Y/Q/M/W/D opens and 18 EMA. Show missing data explicitly.
5. Add a provider adapter only after confirming an authorized candle endpoint, instrument coverage, time zone, licensing, API credentials handling, and browser CORS. Never embed broker secrets in GitHub Pages.
6. For H1/H4 confirmation require closed candles; a wick is not a breakout. Do not issue actionable alerts on unverified levels.
7. Provide refresh errors and per-pair data diagnostics without overwriting saved manual levels.
8. Add a regression check for AUDCAD BUY, EURCHF BUY, AUDCHF BUY, NZDUSD SELL and existing watch pairs.

## Why NO DATA appears
The pair board requires a manually stored price plus all six Y/Q/M/W/D/EMA levels to display full alignment. Fetching an ECB reference rate alone does not populate these verified broker levels.

## Deployment
Review and test this plan first. No production code or main branch changes are included in this draft PR.
