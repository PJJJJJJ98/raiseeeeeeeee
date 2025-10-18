export type Inputs = {
  symbol: string
  marketCap: number // in USD millions
  sector: string
  budget: number // in USD thousands
  avgDailyVolUSD?: number
  floatShares?: number
}

export type Suggestion = {
  title: string
  summary: string
  notes?: string[]
  risk?: 'low' | 'med' | 'high'
}

export function computeSuggestions(i: Inputs): Suggestion[] {
  const mc = i.marketCap
  const budget = i.budget
  const vol = i.avgDailyVolUSD ?? (mc * 1e6 * 0.01) // heuristic fallback
  const float = i.floatShares ?? 100_000_000

  const out: Suggestion[] = []

  // Basic tilting by liquidity & size
  const liquid = vol > 2_000_000
  const micro = mc < 150
  const small = mc >= 150 && mc <= 750
  const nano = mc < 50

  // Budget bands (K)
  const b = budget
  const tiny = b < 50
  const mid = b >= 50 && b < 150
  const big = b >= 150

  // 1) Awareness/IR + ATM support
  if (liquid && (small || mc > 750)) {
    out.push({
      title: "ATM + Liquidity Support",
      summary: "Use light awareness to keep spreads tight; feed ATM opportunistically into strength.",
      notes: [
        "Focus on tier-1 channels, news-aligned bursts",
        "VWAP-proximate executions, keep daily % of ADV small",
      ],
      risk: "low"
    })
  }

  // 2) Registered Direct / PIPE
  if (micro || nano) {
    const size = small ? "mid" : nano ? "micro" : "small"
    out.push({
      title: "Registered Direct / PIPE (Lead + Follow)",
      summary: `Structure a ${size}-cap friendly RD/PIPE with warrant coverage, price protection, and defined use-of-proceeds.`,
      notes: [
        "Target sector-aligned specialist funds",
        "Consider 1:1 or 1:0.5 coverage; reset bands as needed",
      ],
      risk: "med"
    })
  }

  // 3) Convertible (non-toxic)
  if (!liquid && (micro || nano)) {
    out.push({
      title: "Senior Convertible (Non-Toxic)",
      summary: "Fixed conversion floors, limited OID, measured tranche schedule contingent on volume KPIs.",
      notes: ["Board-level risk framing; limit share overhang", "Couple with awareness to meet KPI gates"],
      risk: "med"
    })
  }

  // 4) Shelf/Resale cleanup
  out.push({
    title: "File/Refresh Shelf + Resale",
    summary: "Maintain headroom and clean resale for speed. Align vendors before catalyst windows.",
    notes: ["Audit timeline, comfort letters schedule", "Underwriter counsel pre-cleared"],
    risk: "low"
  })

  // Budget-driven recommendations
  if (tiny) {
    out.push({
      title: "Pilot Awareness (KPI-Gated)",
      summary: "1–3 day pilot to validate audience fit, measure CTR→Volume, before scaling spend.",
      notes: ["Cap daily spend; turn off if KPIs miss", "Use learnings to tune creative and channel mix"],
      risk: "low"
    })
  } else if (mid) {
    out.push({
      title: "4–10 Day Wave + Data Room",
      summary: "Sustained liquidity program overlapping with banker outreach and NDAs.",
      notes: ["Establish data room + tracking sheet", "Align catalysts to mid-campaign"],
      risk: "med"
    })
  } else if (big) {
    out.push({
      title: "Catalyst-Aligned 2–6 Week Program",
      summary: "Run multi-phase campaign tied to filings/PR to enable lead + follow-on demand.",
      notes: ["Weekly KPI review with syndicate", "Stress-test borrow/locate dynamics"],
      risk: "med"
    })
  }

  // Sector tweaks
  if (i.sector.toLowerCase().includes('biotech')) {
    out.push({
      title: "Biotech Adjust: Data Milestones",
      summary: "Sequence around readouts and FDA interactions; pre-brief KOLs.",
      notes: ["Risk manage binary events", "Consider warrants premium for risk"],
      risk: "high"
    })
  }

  return out
}