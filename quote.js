// netlify/functions/quote.js
export default async (req) => {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || '').toUpperCase();
  const demo = searchParams.get('demo');
  const headers = { "content-type": "application/json", "access-control-allow-origin": "*" };

  if (!symbol) return new Response(JSON.stringify({ error: "Missing ?symbol=" }), { status: 400, headers });

  const polygonKey = process.env.POLYGON_API_KEY;

  if (demo === '1' || !polygonKey) {
    return new Response(JSON.stringify({
      symbol, last: 2.36, ts: Date.now(), source: demo === '1' ? "demo" : "no-key-mock"
    }), { headers });
  }

  try {
    const r = await fetch(`https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${polygonKey}`);
    const data = await r.json();
    return new Response(JSON.stringify({ symbol, last: data?.results?.p, ts: data?.results?.t }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { headers, status: 500 });
  }
};