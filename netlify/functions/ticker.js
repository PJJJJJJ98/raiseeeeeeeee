// netlify/functions/ticker.js
export default async (req) => {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || '').toUpperCase();
  const demo = searchParams.get('demo');
  const headers = { "content-type": "application/json", "access-control-allow-origin": "*" };

  if (!symbol) {
    return new Response(JSON.stringify({ error: "Missing ?symbol=" }), { status: 400, headers });
  }

  const polygonKey = process.env.POLYGON_API_KEY;
  const finnhubKey = process.env.FINNHUB_API_KEY;

  // Demo or no keys -> return mock deterministic data
  if (demo === '1' || (!polygonKey && !finnhubKey)) {
    const mock = {
      symbol,
      polygon: {
        ref: { ticker: symbol, name: "Demo Corp", primary_exchange: "NASDAQ", share_class_shares_outstanding: 120_000_000 },
        prevAgg: { c: 2.35, h: 2.5, l: 2.2, n: 12000, o: 2.3, t: Date.now(), v: 4_200_000, vw: 2.36 },
        financials: [{ fiscal_year: 2024, revenue: 82_000_000, net_income: -12_300_000 }]
      },
      finnhub: {
        profile: { marketCapitalization: 210.4, currency: "USD", exchange: "NASDAQ/NMS (GLOBAL MARKET)" },
        metrics: { metric: { sharesbas: 118_000_000, beta: 1.4, "52WeekHigh": 4.9, "52WeekLow": 0.95 } }
      }
    };
    return new Response(JSON.stringify(mock), { headers });
  }

  try {
    const tasks = [];
    if (polygonKey) {
      tasks.push(fetch(`https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${polygonKey}`));
      tasks.push(fetch(`https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${polygonKey}`));
      tasks.push(fetch(`https://api.polygon.io/v3/reference/financials?ticker=${symbol}&apiKey=${polygonKey}`));
    }
    if (finnhubKey) {
      tasks.push(fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${finnhubKey}`));
      tasks.push(fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${finnhubKey}`));
    }

    const responses = await Promise.all(tasks);
    const jsons = await Promise.all(responses.map(r => r.json()));

    const out = {
      symbol,
      polygon: polygonKey ? {
        ref: jsons[0]?.results || null,
        prevAgg: jsons[1]?.results?.[0] || jsons[1] || null,
        financials: jsons[2]?.results || null
      } : null,
      finnhub: finnhubKey ? {
        profile: polygonKey ? jsons[3] : jsons[0],
        metrics: polygonKey ? jsons[4] : jsons[1]
      } : null
    };

    return new Response(JSON.stringify(out), { headers, status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Server error" }), { headers, status: 500 });
  }
};
