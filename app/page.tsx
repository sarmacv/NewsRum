'use client';

import { useMemo, useState } from 'react';

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

export default function Home() {
  const [tab, setTab] = useState<'overview' | 'news' | 'portfolio'>('overview');
  const [investment, setInvestment] = useState(25000);
  const [monthly, setMonthly] = useState(750);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(8);
  const [filter, setFilter] = useState('All');

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

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Signalist home"><span className="brand-mark">S</span><span>Signalist</span></a>
        <nav className="nav-tabs" aria-label="Primary navigation">
          {(['overview', 'news', 'portfolio'] as const).map((item) => (
            <button key={item} className={tab === item ? 'active' : ''} onClick={() => { setTab(item); document.getElementById(item)?.scrollIntoView({ behavior: 'smooth' }); }}>{item}</button>
          ))}
        </nav>
        <button className="watch-btn">Watchlist <span>6</span></button>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow"><span className="pulse" /> Market intelligence · Sample data</p>
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
              <div className="price-row"><strong>${pick.price.toLocaleString()}</strong><span className={pick.change >= 0 ? 'up' : 'down'}>{pick.change >= 0 ? '↗' : '↘'} {Math.abs(pick.change)}%</span></div>
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
            {filteredNews.map(item => (
              <article className="news-item" key={item.title}>
                <div className="source-icon">{item.source.slice(0, 1)}</div>
                <div className="news-copy"><div className="news-meta"><span>{item.source}</span><i>•</i><time>{item.time} ago</time><em>{item.tag}</em></div><h3>{item.title}</h3><div className="news-tags"><span className={item.tone.toLowerCase()}>{item.tone}</span>{item.tickers.map(t => <b key={t}>{t}</b>)}</div></div>
                <button className="save" aria-label={`Save ${item.title}`}>☆</button>
              </article>
            ))}
          </div>
          <aside className="source-card"><p className="kicker">Source quality</p><h3>Trust is the filter</h3><p>Signalist prioritizes primary documents and outlets with transparent editorial standards.</p>{sources.map(source => <div className="source-row" key={source.name}><span>✓</span><div><b>{source.name}</b><small>{source.type}</small></div><em>{source.trust}</em></div>)}</aside>
        </div>
      </section>

      <section className="portfolio-section" id="portfolio">
        <div className="section-heading light"><div><p className="kicker">Scenario planner</p><h2>Give your goals a number</h2><p>Explore how consistent investing and compounding could shape a long-term portfolio.</p></div></div>
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
