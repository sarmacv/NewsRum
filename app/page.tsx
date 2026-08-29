'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Quote = { symbol: string; name: string; price: number; previous: number; changePercent: number; currency: string; marketState: string; history: Array<{ time: number; close: number }> };
type Holding = { symbol: string; quantity: number; averageCost: number };
type LiveNews = { id: string; title: string; source: string; link: string; publishedAt: string; tag: string };

const picks = [
  { ticker: 'NVDA', name: 'NVIDIA', score: 88, price: 174.18, change: 2.4, confidence: 'High', signals: ['AI demand', 'Estimate revisions', 'Momentum'], risk: 'Elevated valuation' },
  { ticker: 'MSFT', name: 'Microsoft', score: 84, price: 498.72, change: 1.1, confidence: 'High', signals: ['Cloud growth', 'Strong cash flow', 'Low volatility'], risk: 'AI capex intensity' },
  { ticker: 'JPM', name: 'JPMorgan Chase', score: 78, price: 291.34, change: 0.7, confidence: 'Medium', signals: ['Net interest income', 'Capital strength', 'Value'], risk: 'Credit cycle' },
  { ticker: 'LLY', name: 'Eli Lilly', score: 75, price: 1021.40, change: -0.3, confidence: 'Medium', signals: ['Pipeline', 'Revenue growth', 'Defensive'], risk: 'Premium multiple' },
];

const news = [
  { source: 'Reuters', time: '18m', title: 'Chipmakers rise as data-center demand stays resilient', tag: 'Semiconductors', tone: 'Positive', tickers: ['NVDA', 'AMD'] },
  { source: 'SEC EDGAR', time: '43m', title: 'Microsoft files quarterly report with updated risk factors', tag: 'Filing', tone: 'Neutral', tickers: ['MSFT'] },
  { source: 'Federal Reserve', time: '1h', title: 'Latest policy statement keeps markets focused on inflation data', tag: 'Macro', tone: 'Neutral', tickers: ['SPY', 'JPM'] },
  { source: 'Associated Press', time: '2h', title: 'Markets edge higher as investors weigh earnings outlooks', tag: 'Markets', tone: 'Positive', tickers: ['SPY'] },
];

const sources = [
  { name: 'Reuters', type: 'Independent reporting', trust: 'Editorial standards' },
  { name: 'SEC EDGAR', type: 'Company filings', trust: 'Primary source' },
  { name: 'Federal Reserve', type: 'Macro & policy', trust: 'Primary source' },
  { name: 'Associated Press', type: 'Independent reporting', trust: 'Editorial standards' },
];

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function Sparkline({ values, positive = true }: { values: number[]; positive?: boolean }) {
  if (values.length < 2) return <span className="spark-empty">Awaiting trend</span>;
  const min = Math.min(...values), max = Math.max(...values), spread = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${34 - ((value - min) / spread) * 30}`).join(' ');
  return <svg className="sparkline" viewBox="0 0 100 36" preserveAspectRatio="none" aria-label="Thirty-day price trend"><polyline points={points} fill="none" stroke={positive ? '#79a928' : '#c96d5e'} strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}

export default function Home() {
  const [tab, setTab] = useState<'overview' | 'news' | 'portfolio'>('overview');
  const [investment, setInvestment] = useState(25000);
  const [monthly, setMonthly] = useState(750);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(8);
  const [filter, setFilter] = useState('All');
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [liveNews, setLiveNews] = useState<LiveNews[]>([]);
  const [symbol, setSymbol] = useState('AAPL');
  const [quantity, setQuantity] = useState(10);
  const [averageCost, setAverageCost] = useState(200);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('signalist-portfolio');
    setHoldings(saved ? JSON.parse(saved) : [{ symbol: 'MSFT', quantity: 12, averageCost: 410 }, { symbol: 'NVDA', quantity: 30, averageCost: 142 }]);
  }, []);

  useEffect(() => {
    if (holdings.length || localStorage.getItem('signalist-portfolio')) localStorage.setItem('signalist-portfolio', JSON.stringify(holdings));
  }, [holdings]);

  async function refreshData() {
    setRefreshing(true);
    try {
      const symbols = [...new Set([...holdings.map(item => item.symbol), ...picks.map(item => item.ticker), 'SPY'])].join(',');
      const [marketResponse, newsResponse] = await Promise.all([fetch(`/api/market?symbols=${symbols}`), fetch('/api/news')]);
      const market = await marketResponse.json();
      const feed = await newsResponse.json();
      setQuotes(Object.fromEntries((market.quotes ?? []).map((quote: Quote) => [quote.symbol, quote])));
      if (feed.items?.length) setLiveNews(feed.items);
      setLastRefresh(new Date());
    } finally { setRefreshing(false); }
  }

  useEffect(() => {
    refreshData();
    const timer = window.setInterval(refreshData, 60_000);
    return () => window.clearInterval(timer);
  }, [holdings.map(item => item.symbol).join(',')]);

  function addHolding(event: FormEvent) {
    event.preventDefault();
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!/^[A-Z.\-]{1,10}$/.test(cleanSymbol) || quantity <= 0 || averageCost < 0) return;
    setHoldings(current => current.some(item => item.symbol === cleanSymbol)
      ? current.map(item => item.symbol === cleanSymbol ? { symbol: cleanSymbol, quantity: item.quantity + quantity, averageCost: ((item.quantity * item.averageCost) + (quantity * averageCost)) / (item.quantity + quantity) } : item)
      : [...current, { symbol: cleanSymbol, quantity, averageCost }]);
    setSymbol('');
  }

  const projection = useMemo(() => {
    let value = investment;
    const points = [value];
    for (let y = 1; y <= years; y++) {
      value = value * (1 + rate / 100) + monthly * 12;
      points.push(value);
    }
    return { value, gain: value - investment - monthly * 12 * years, points };
  }, [investment, monthly, years, rate]);

  const maxPoint = Math.max(...projection.points);
  const chart = projection.points.map((point, i) => `${(i / Math.max(1, projection.points.length - 1)) * 100},${100 - (point / maxPoint) * 82}`).join(' ');
  const filteredNews = filter === 'All' ? news : news.filter((item) => item.tag === filter);
  const portfolioRows = holdings.map(holding => {
    const quote = quotes[holding.symbol];
    const price = quote?.price ?? holding.averageCost;
    const value = price * holding.quantity;
    const cost = holding.averageCost * holding.quantity;
    return { ...holding, quote, price, value, cost, gain: value - cost, gainPercent: cost ? ((value - cost) / cost) * 100 : 0 };
  });
  const portfolioValue = portfolioRows.reduce((sum, row) => sum + row.value, 0);
  const portfolioCost = portfolioRows.reduce((sum, row) => sum + row.cost, 0);
  const longestHistory = Math.max(0, ...portfolioRows.map(row => row.quote?.history.length ?? 0));
  const portfolioHistory = Array.from({ length: longestHistory }, (_, index) => portfolioRows.reduce((sum, row) => {
    const history = row.quote?.history ?? [];
    const alignedIndex = history.length - longestHistory + index;
    return sum + (alignedIndex >= 0 ? history[alignedIndex].close * row.quantity : 0);
  }, 0)).filter(value => value > 0);
  const liveFilteredNews = filter === 'All' ? liveNews : liveNews.filter(item => item.tag === filter);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Signalist home"><span className="brand-mark">S</span><span>Signalist</span></a>
        <nav className="nav-tabs" aria-label="Primary navigation">
          {(['overview', 'news', 'portfolio'] as const).map((item) => (
            <button key={item} className={tab === item ? 'active' : ''} onClick={() => { setTab(item); document.getElementById(item)?.scrollIntoView({ behavior: 'smooth' }); }}>{item}</button>
          ))}
        </nav>
        <button className="watch-btn" onClick={refreshData}>{refreshing ? 'Refreshing…' : 'Refresh live data'} <span>{holdings.length}</span></button>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow"><span className="pulse" /> Market intelligence · {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Connecting live data'}</p>
          <h1>See the signal.<br />Skip the noise.</h1>
          <p className="hero-copy">Trusted financial news, explainable stock rankings, and portfolio scenarios—brought together in one focused workspace.</p>
        </div>
        <div className="market-card">
          <div><span>Market pulse</span><strong>Constructive</strong></div>
          <div className="market-score"><b>72</b><small>/100</small></div>
          <div className="meter"><i /></div>
          <p>Momentum is positive while volatility remains moderate.</p>
        </div>
      </section>

      <section className="section" id="overview">
        <div className="section-heading"><div><p className="kicker">Ranked opportunities</p><h2>Today’s strongest signals</h2></div><p className="method-note">7-factor score · Refreshed 9:42 AM CT</p></div>
        <div className="pick-grid">
          {picks.map((pick, index) => (
            <article className="pick-card" key={pick.ticker}>
              <div className="pick-top"><span className="rank">0{index + 1}</span><span className={`confidence ${pick.confidence.toLowerCase()}`}>{pick.confidence} confidence</span></div>
              <div className="ticker-row"><div><h3>{pick.ticker}</h3><p>{pick.name}</p></div><div className="score-ring" style={{'--score': `${pick.score * 3.6}deg`} as React.CSSProperties}><span>{pick.score}</span></div></div>
              <div className="price-row"><strong>${(quotes[pick.ticker]?.price ?? pick.price).toLocaleString()}</strong><span className={(quotes[pick.ticker]?.changePercent ?? pick.change) >= 0 ? 'up' : 'down'}>{(quotes[pick.ticker]?.changePercent ?? pick.change) >= 0 ? '↗' : '↘'} {Math.abs(quotes[pick.ticker]?.changePercent ?? pick.change)}%</span></div>
              <Sparkline values={(quotes[pick.ticker]?.history ?? []).map(point => point.close)} positive={(quotes[pick.ticker]?.changePercent ?? pick.change) >= 0} />
              <div className="chips">{pick.signals.map(signal => <span key={signal}>{signal}</span>)}</div>
              <div className="risk"><span>Watch</span>{pick.risk}</div>
            </article>
          ))}
        </div>
        <div className="disclosure"><b>How rankings work</b><p>Scores blend earnings quality, analyst revisions, valuation, price momentum, volatility, news sentiment, and macro sensitivity. Rankings are research prompts—not predictions, guarantees, or personalized investment advice.</p></div>
      </section>

      <section className="news-section" id="news">
        <div className="section-heading"><div><p className="kicker">Verified feed</p><h2>News that moves markets</h2></div><div className="filters">{['All', 'Markets', 'Macro', 'Filing'].map(item => <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'active' : ''}>{item}</button>)}</div></div>
        <div className="news-layout">
          <div className="news-list">
            {liveFilteredNews.length ? liveFilteredNews.map(item => (
              <article className="news-item" key={item.id}>
                <div className="source-icon">{item.source.slice(0, 1)}</div>
                <div className="news-copy"><div className="news-meta"><span>{item.source}</span><i>•</i><time>{item.publishedAt ? new Date(item.publishedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Live'}</time><em>{item.tag}</em></div><h3><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a></h3><div className="news-tags"><span>Verified source</span></div></div>
                <a className="save" href={item.link} target="_blank" rel="noreferrer" aria-label={`Open ${item.title}`}>↗</a>
              </article>
            )) : filteredNews.map(item => (
              <article className="news-item" key={item.title}><div className="source-icon">{item.source.slice(0, 1)}</div><div className="news-copy"><div className="news-meta"><span>{item.source}</span><i>•</i><time>{item.time} ago</time><em>{item.tag}</em></div><h3>{item.title}</h3><div className="news-tags"><span className={item.tone.toLowerCase()}>{item.tone}</span>{item.tickers.map(t => <b key={t}>{t}</b>)}</div></div></article>
            ))}
          </div>
          <aside className="source-card"><p className="kicker">Source quality</p><h3>Trust is the filter</h3><p>Signalist prioritizes primary documents and outlets with transparent editorial standards.</p>{sources.map(source => <div className="source-row" key={source.name}><span>✓</span><div><b>{source.name}</b><small>{source.type}</small></div><em>{source.trust}</em></div>)}</aside>
        </div>
      </section>

      <section className="portfolio-section" id="portfolio">
        <div className="section-heading light"><div><p className="kicker">Scenario planner</p><h2>Give your goals a number</h2><p>Explore how consistent investing and compounding could shape a long-term portfolio.</p></div></div>
        <div className="portfolio-live">
          <div className="portfolio-summary">
            <div className="total-value"><p>Current portfolio value</p><h3>{money(portfolioValue)}</h3><span className={portfolioValue - portfolioCost >= 0 ? 'gain' : 'loss'}>{portfolioValue - portfolioCost >= 0 ? '+' : ''}{money(portfolioValue - portfolioCost)} · {portfolioCost ? (((portfolioValue - portfolioCost) / portfolioCost) * 100).toFixed(2) : '0.00'}%</span><Sparkline values={portfolioHistory} positive={portfolioValue >= portfolioCost} /></div>
            <form className="add-stock" onSubmit={addHolding}>
              <label>Symbol<input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL" maxLength={10} required /></label>
              <label>Quantity<input type="number" min="0.0001" step="any" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required /></label>
              <label>Average cost<input type="number" min="0" step="0.01" value={averageCost} onChange={e => setAverageCost(Number(e.target.value))} required /></label>
              <button type="submit">Add position</button>
            </form>
          </div>
          <div className="holdings-table" role="region" aria-label="Portfolio holdings" tabIndex={0}>
            <div className="holding-row holding-head"><span>Position</span><span>30-day trend</span><span>Price</span><span>Quantity</span><span>Market value</span><span>Total return</span><span /></div>
            {portfolioRows.map(row => (
              <div className="holding-row" key={row.symbol}>
                <span className="holding-name"><b>{row.symbol}</b><small>{row.quote?.name ?? 'Loading market data…'}</small></span>
                <span><Sparkline values={(row.quote?.history ?? []).map(point => point.close)} positive={row.gain >= 0} /></span>
                <span><b>${row.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b><small className={(row.quote?.changePercent ?? 0) >= 0 ? 'gain' : 'loss'}>{(row.quote?.changePercent ?? 0) >= 0 ? '+' : ''}{row.quote?.changePercent ?? 0}% today</small></span>
                <span><input aria-label={`${row.symbol} quantity`} type="number" min="0.0001" step="any" value={row.quantity} onChange={e => setHoldings(current => current.map(item => item.symbol === row.symbol ? { ...item, quantity: Number(e.target.value) } : item))} /></span>
                <span><b>{money(row.value)}</b><small>Cost {money(row.cost)}</small></span>
                <span className={row.gain >= 0 ? 'gain' : 'loss'}><b>{row.gain >= 0 ? '+' : ''}{money(row.gain)}</b><small>{row.gainPercent.toFixed(2)}%</small></span>
                <span><button className="delete-stock" aria-label={`Delete ${row.symbol}`} onClick={() => setHoldings(current => current.filter(item => item.symbol !== row.symbol))}>×</button></span>
              </div>
            ))}
            {!portfolioRows.length && <div className="empty-portfolio">Add a stock above to start tracking your portfolio.</div>}
          </div>
          <p className="data-note">Prices refresh every 60 seconds while this page is open. Thirty-day trends use daily closes. Quotes may be delayed and should be confirmed with your broker before trading.</p>
        </div>
        <div className="planner">
          <div className="controls">
            <label>Starting investment <strong>{money(investment)}</strong><input aria-label="Starting investment" type="range" min="1000" max="100000" step="1000" value={investment} onChange={e => setInvestment(Number(e.target.value))} /></label>
            <label>Monthly contribution <strong>{money(monthly)}</strong><input aria-label="Monthly contribution" type="range" min="0" max="3000" step="50" value={monthly} onChange={e => setMonthly(Number(e.target.value))} /></label>
            <label>Time horizon <strong>{years} years</strong><input aria-label="Time horizon" type="range" min="1" max="30" value={years} onChange={e => setYears(Number(e.target.value))} /></label>
            <label>Assumed annual return <strong>{rate}%</strong><input aria-label="Assumed annual return" type="range" min="1" max="14" step="0.5" value={rate} onChange={e => setRate(Number(e.target.value))} /></label>
          </div>
          <div className="projection">
            <p>Estimated portfolio value</p><h3>{money(projection.value)}</h3><span>{money(projection.gain)} estimated growth</span>
            <div className="chart-wrap"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Portfolio growth projection"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c8f35d" stopOpacity=".35"/><stop offset="1" stopColor="#c8f35d" stopOpacity="0"/></linearGradient></defs><polygon points={`0,100 ${chart} 100,100`} fill="url(#fill)"/><polyline points={chart} fill="none" stroke="#c8f35d" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg><div><span>Today</span><span>Year {years}</span></div></div>
            <p className="fine-print">Illustrative projection using annual compounding and end-of-year contributions. Actual returns vary and may be negative.</p>
          </div>
        </div>
      </section>

      <footer><div className="brand"><span className="brand-mark">S</span><span>Signalist</span></div><p>Research clearly. Invest thoughtfully.</p><p>© 2026 · Educational use only · Not financial advice</p></footer>
    </main>
  );
}
