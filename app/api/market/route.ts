import { NextRequest, NextResponse } from 'next/server';

type ChartPoint = { time: number; close: number };

async function getQuote(symbol: string) {
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d&includePrePost=false`;
  let response: Response | undefined;
  for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
    response = await fetch(`https://${host}${path}`, { headers: { 'User-Agent': 'Mozilla/5.0 Signalist/1.0', Accept: 'application/json' }, next: { revalidate: 60 } });
    if (response.ok) break;
  }
  if (!response?.ok) throw new Error(`Market data unavailable for ${symbol}`);
  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  if (!result) throw new Error(`Unknown symbol ${symbol}`);
  const timestamps: number[] = result.timestamp ?? [];
  const closes: Array<number | null> = result.indicators?.quote?.[0]?.close ?? [];
  const history: ChartPoint[] = timestamps.flatMap((time, index) => closes[index] == null ? [] : [{ time, close: Number(closes[index]!.toFixed(2)) }]);
  const price = Number((result.meta?.regularMarketPrice ?? history.at(-1)?.close ?? 0).toFixed(2));
  const previous = Number((result.meta?.chartPreviousClose ?? history.at(-2)?.close ?? price).toFixed(2));
  return { symbol, name: result.meta?.longName ?? result.meta?.shortName ?? symbol, price, previous, changePercent: previous ? Number((((price - previous) / previous) * 100).toFixed(2)) : 0, currency: result.meta?.currency ?? 'USD', marketState: result.meta?.marketState ?? 'CLOSED', history };
}

export async function GET(request: NextRequest) {
  const symbols = (request.nextUrl.searchParams.get('symbols') ?? 'SPY,MSFT,NVDA,JPM,LLY')
    .split(',').map(symbol => symbol.trim().toUpperCase()).filter(symbol => /^[A-Z.\-]{1,10}$/.test(symbol)).slice(0, 20);
  const settled = await Promise.allSettled(symbols.map(getQuote));
  const quotes = settled.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
  return NextResponse.json({ quotes, refreshedAt: new Date().toISOString(), errors: settled.length - quotes.length }, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=90' } });
}
