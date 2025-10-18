export async function getQuote(symbol: string, demo = false) {
  const r = await fetch(`/.netlify/functions/quote?symbol=${encodeURIComponent(symbol)}${demo ? '&demo=1' : ''}`)
  if (!r.ok) throw new Error(`Quote error ${r.status}`)
  return r.json()
}
export async function getTicker(symbol: string, demo = false) {
  const r = await fetch(`/.netlify/functions/ticker?symbol=${encodeURIComponent(symbol)}${demo ? '&demo=1' : ''}`)
  if (!r.ok) throw new Error(`Ticker error ${r.status}`)
  return r.json()
}
export async function getSnapshot(symbol: string, demo = false) {
  const r = await fetch(`/.netlify/functions/snapshot?symbol=${encodeURIComponent(symbol)}${demo ? '&demo=1' : ''}`)
  if (!r.ok) throw new Error(`Snapshot error ${r.status}`)
  return r.json()
}