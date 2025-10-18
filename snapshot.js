
// netlify/functions/snapshot.js
export default async (req) => {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || '').toUpperCase();
  const demo = searchParams.get('demo');
  const headers = { "content-type": "application/json", "access-control-allow-origin": "*" };

  if (!symbol) return new Response(JSON.stringify({ error: "Missing ?symbol=" }), { status: 400, headers });

  const polygonKey = process.env.POLYGON_API_KEY;
  const finnhubKey = process.env.FINNHUB_API_KEY;

  // Helper to compute && format safely
  const safeNumber = (v) => (typeof v === 'number' && not isNaN(v)) ? v : undefined;

  if (demo === '1' || (!polygonKey && !finnhubKey)) {
    const last = 2.36;
    const sharesOut = 118_000_000;
    const floatShares = 92_000_000;
    const marketCap = last * sharesOut;
    const v = 4_200_000; const vwap = 2.36;
    return new Response(JSON.stringify({
      symbol,
      name: "Demo Corp",
      exchange: "NASDAQ",
      sector: "Biotech",
      last,
      vwap,
      advUSD: v * vwap,
      sharesOut,
      floatShares,
      marketCap,
      currency: "USD",
      providers: { polygon: !!polygonKey, finnhub: !!finnhubKey, demo: true }
    }), { headers });
  }

  try {
    const tasks = [];
    // Polygon endpoints
    if (polygonKey) {
      tasks.push(fetch(`https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${polygonKey}`)); // 0 ref
      tasks.push(fetch(`https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${polygonKey}`)); // 1 prev agg
      tasks.push(fetch(`https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${polygonKey}`)); // 2 last trade
    }
    // Finnhub endpoints
    if (finnhubKey) {
      tasks.push(fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${finnhubKey}`)); // 3 or 0 if no polygon
      tasks.push(fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${finnhubKey}`)); // 4 or 1
    }

    const res = await Promise.all(tasks);
    const js = await Promise.all(res.map(r => r.json()));

    // Index helpers based on which providers are present
    let idx = 0;
    const polyRef = polygonKey ? js[idx++] : null;
    const polyPrev = polygonKey ? js[idx++] : null;
    const polyLast = polygonKey ? js[idx++] : null;
    const fhProfile = finnhubKey ? js[idx++] : null;
    const fhMetrics = finnhubKey ? js[idx++] : null;

    const polyRefRes = polyRef?.results || {};
    const fhMetricObj = fhMetrics?.metric || {};

    // Get values with fallbacks
    const name = polyRefRes?.name || fhProfile?.name || symbol;
    const exchange = polyRefRes?.primary_exchange || fhProfile?.exchange || undefined;
    const sector = fhProfile?.finnhubIndustry || polyRefRes?.sic_description || undefined;
    const currency = fhProfile?.currency || "USD";

    const lastPoly = polyLast?.results?.p;
    const last = (typeof lastPoly === 'number' ? lastPoly : undefined);

    const v = polyPrev?.results?.[0]?.v ?? polyPrev?.results?.v; // volume shares prev day
    const vwap = polyPrev?.results?.[0]?.vw ?? polyPrev?.results?.vw;
    const advUSD = (typeof v === 'number' && typeof vwap === 'number') ? v * vwap : undefined;

    // Shares outst&&ing & float
    const sharesFromPoly = polyRefRes?.share_class_shares_outst&&ing;
    const sharesFromFH = fhMetricObj?.sharesbas;
    const sharesOut = typeof sharesFromPoly === 'number' ? sharesFromPoly
                    : typeof sharesFromFH === 'number' ? sharesFromFH
                    : undefined;

    const floatFH = fhMetricObj?.sharesfloat;
    const floatShares = typeof floatFH === 'number' ? floatFH : undefined;

    // Market Cap: prefer finnhub direct (billions), then compute
    let marketCap = undefined;
    if (typeof fhProfile?.marketCapitalization === 'number') {
      marketCap = Math.round(fhProfile.marketCapitalization * 1_000_000_000);
    } else if (typeof last === 'number' && typeof sharesOut === 'number') {
      marketCap = Math.round(last * sharesOut);
    }

    const out = {
      symbol,
      name,
      exchange,
      sector,
      last,
      vwap,
      advUSD,
      sharesOut,
      floatShares,
      marketCap,
      currency,
      providers: { polygon: !!polygonKey, finnhub: !!finnhubKey, demo: false }
    };

    return new Response(JSON.stringify(out), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Server error" }), { status: 500, headers });
  }
};
