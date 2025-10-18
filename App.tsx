import { useEffect, useMemo, useState } from 'react'
import { getSnapshot } from './api'
import { computeSuggestions, type Suggestion } from './heuristics'

type Snapshot = {
  symbol: string
  name?: string
  exchange?: string
  sector?: string
  last?: number
  vwap?: number
  advUSD?: number
  sharesOut?: number
  floatShares?: number
  marketCap?: number
  currency?: string
}

function Field(props: any) { return (
  <div style={{display:'grid', gap:6}}>
    <label className="muted" style={{fontSize:12}}>{props.label}</label>
    {props.children}
  </div>
)}

function Pill({children}:{children:any}){ return <span className="pill">{children}</span> }

function Stat({label, value}:{label:string, value:any}){
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div style={{fontSize:18, fontWeight:700}}>{value ?? '—'}</div>
    </div>
  )
}

export default function App(){
  const [symbol, setSymbol] = useState('CTXR')
  const [marketCap, setMarketCap] = useState<number | ''>('') // USD millions (editable, auto-filled)
  const [sector, setSector] = useState('Biotech')
  const [budget, setBudget] = useState(100) // USD thousands
  const [demo, setDemo] = useState(true)
  const [loading, setLoading] = useState(false)
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  const avgVolUSD = snap?.advUSD
  const floatShares = snap?.floatShares

  const suggestions = useMemo(()=> computeSuggestions({
    symbol,
    marketCap: typeof marketCap === 'number' ? marketCap : ((snap?.marketCap ?? 0) / 1_000_000) || 0,
    sector,
    budget,
    avgDailyVolUSD: avgVolUSD,
    floatShares
  }), [symbol, marketCap, sector, budget, avgVolUSD, floatShares, snap?.marketCap])

  async function analyze(){
    setLoading(true); setError(null)
    try{
      const s = await getSnapshot(symbol, demo)
      setSnap(s)
      // Auto-fill fields if data exists
      if (typeof s.marketCap === 'number') setMarketCap(Math.round(s.marketCap / 1_000_000)) // -> millions
      if (s.sector) setSector(s.sector)
    }catch(e:any){
      setError(e?.message || 'Error'); setSnap(null)
    }finally{ setLoading(false) }
  }

  // Run once initially (demo data)
  useEffect(()=>{ analyze() /* eslint-disable-line */ }, [])

  return (
    <div className="wrap">
      <div className="title">
        <span>Raise Optimizer <span className="accent">·</span> <span className="accent2">Banker Edition</span></span>
        <Pill>React + Netlify Functions</Pill>
        <Pill>{demo ? 'DEMO MODE' : 'LIVE'}</Pill>
      </div>

      <div className="grid" style={{marginTop:16}}>
        <div className="card">
          <div className="row">
            <div className="col">
              <Field label="Ticker">
                <input value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())} placeholder="e.g., CTXR, TSLA, AAPL"/>
              </Field>
            </div>
            <div className="col">
              <Field label="Market Cap (USD millions)">
                <input type="number" value={marketCap} onChange={e=>setMarketCap(e.target.value === '' ? '' : parseFloat(e.target.value))}/>
              </Field>
            </div>
            <div className="col">
              <Field label="Sector">
                <input value={sector} onChange={e=>setSector(e.target.value)}/>
              </Field>
            </div>
            <div className="col">
              <Field label="Budget (USD thousands)">
                <input type="number" value={budget} onChange={e=>setBudget(parseFloat(e.target.value || '0'))}/>
              </Field>
            </div>
          </div>

          <div className="row" style={{marginTop:12, alignItems:'center'}}>
            <div className="col" style={{display:'flex', gap:10, alignItems:'center'}}>
              <input id="demo" type="checkbox" checked={demo} onChange={e=>setDemo(e.target.checked)} />
              <label htmlFor="demo" className="muted">Use demo/mock data (no API keys required)</label>
            </div>
            <div className="col" style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
              <button onClick={analyze} className="primary" disabled={loading}>{loading ? 'Fetching…' : 'Fetch + Optimize'}</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <span className="badge">Market Snapshot</span>
            <strong>{snap?.name ?? symbol}</strong>
            {snap?.exchange && <span className="badge">{snap.exchange}</span>}
            {snap?.currency && <span className="badge">{snap.currency}</span>}
          </div>
          {error && <div className="muted">Error: {error}</div>}
          {!snap && <div className="muted">Enter a symbol and click Fetch + Optimize.</div>}
          {snap && (
            <div className="grid" style={{marginTop:12}}>
              <Stat label="Last Price" value={typeof snap.last === 'number' ? ('$' + snap.last.toFixed(2)) : '—'} />
              <Stat label="Est. ADV (USD)" value={typeof snap.advUSD === 'number' ? ('$' + Intl.NumberFormat().format(Math.round(snap.advUSD))) : '—'} />
              <Stat label="Float (shares)" value={typeof snap.floatShares === 'number' ? Intl.NumberFormat().format(Math.round(snap.floatShares)) : '—'} />
              <Stat label="Shares Out" value={typeof snap.sharesOut === 'number' ? Intl.NumberFormat().format(Math.round(snap.sharesOut)) : '—'} />
              <Stat label="Market Cap" value={typeof snap.marketCap === 'number' ? ('$' + Intl.NumberFormat().format(Math.round(snap.marketCap))) : '—'} />
              <Stat label="Sector" value={snap.sector ?? '—'} />
            </div>
          )}
        </div>

        <div className="card">
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <span className="badge">Optimizer</span>
            <strong>Recommended Structures</strong>
          </div>
          <div className="grid" style={{marginTop:12}}>
            {suggestions.map((s, i)=>(
              <div key={i} className="card" style={{display:'grid', gap:8}}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <span className="badge">Rec</span>
                  <strong>{s.title}</strong>
                  <span className="badge">{s.risk?.toUpperCase()}</span>
                </div>
                <div className="muted">{s.summary}</div>
                {s.notes && <ul style={{margin:0, paddingLeft:18}}>{s.notes.map((n,ix)=><li key={ix} className="muted">{n}</li>)}</ul>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{marginTop:24, display:'flex', gap:8, flexWrap:'wrap'}}>
        <Pill>SEC-aware messaging only (no performance guarantees).</Pill>
        <Pill>For bankers/internal use.</Pill>
      </div>
    </div>
  )
}