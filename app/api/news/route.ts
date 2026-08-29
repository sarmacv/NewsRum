import { NextResponse } from 'next/server';

const trusted = ['Reuters', 'Associated Press', 'SEC', 'Federal Reserve'];

function clean(value: string) {
  return value.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

export async function GET() {
  const query = encodeURIComponent('(site:reuters.com OR site:apnews.com OR site:sec.gov OR site:federalreserve.gov) markets stocks economy when:1d');
  try {
    const response = await fetch(`https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`, { headers: { 'User-Agent': 'Signalist/1.0' }, next: { revalidate: 300 } });
    if (!response.ok) throw new Error('News feed unavailable');
    const xml = await response.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 12).map((match, index) => {
      const item = match[1];
      const title = clean(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'Market update');
      const link = clean(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? '#');
      const publishedAt = clean(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? '');
      const sourceFromXml = clean(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? '');
      const source = trusted.find(name => sourceFromXml.toLowerCase().includes(name.toLowerCase())) ?? sourceFromXml ?? 'Trusted source';
      return { id: `${index}-${publishedAt}`, title: title.replace(/\s+-\s+[^-]+$/, ''), source, link, publishedAt, tag: source === 'SEC' ? 'Filing' : source === 'Federal Reserve' ? 'Macro' : 'Markets' };
    });
    return NextResponse.json({ items, refreshedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=300' } });
  } catch {
    return NextResponse.json({ items: [], refreshedAt: new Date().toISOString(), error: 'Live news is temporarily unavailable.' });
  }
}
