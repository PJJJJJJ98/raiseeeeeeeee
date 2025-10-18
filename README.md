# Raise Optimizer (Banker Edition)

A React + Netlify Functions app that ingests market data (Polygon, Finnhub, etc.) and suggests raise structures (ATM, PIPE, RD, Convertible, Warrants, etc.) based on market cap, sector, float/liquidity, and a proposed budget.

## One‑Click Flow
1. **Upload this folder as a ZIP to a new GitHub repo** (you can drag & drop on GitHub).
2. **Netlify → Add New Site → Import from Git** → select your repo.
   - Build command: `cd client && npm ci && npm run build`
   - Publish directory: `client/dist`
3. Set **Environment variables** on Netlify (Site settings → Build & deploy → Environment):
   - `POLYGON_API_KEY`
   - `FINNHUB_API_KEY` (optional)
4. Deploy. Visit `/.netlify/functions/ticker?symbol=CTXR&demo=1` to test mock mode.

## Local Dev
```bash
npm i
cd client && npm i && cd ..
npm run dev
# open http://localhost:8888
```

## Environment Variables
- Keys are **never** committed. Set them on Netlify or locally via `.env` (not committed).

## Functions
- `/.netlify/functions/ticker?symbol=TSLA` → merged reference/fundamentals
- `/.netlify/functions/quote?symbol=TSLA` → last trade
- Add more functions as needed.

## Mock Mode
Append `&demo=1` **or** omit API keys to receive deterministic mock responses. Great for demos.

## License
MIT (use at your own risk; verify all outputs for compliance).

## New consolidated endpoint
- `/.netlify/functions/snapshot?symbol=TSLA` → returns `{ last, marketCap, floatShares, sharesOut, advUSD, sector, exchange, currency }`, with fallbacks and demo mode via `&demo=1`.
