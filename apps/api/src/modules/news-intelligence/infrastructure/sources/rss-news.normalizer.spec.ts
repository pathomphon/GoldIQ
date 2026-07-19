import { describe, expect, it } from 'vitest';

import { normalizeRssOrAtomFeed } from './rss-news.normalizer';

const fetchedAt = new Date('2026-07-19T10:00:00.000Z');

describe('normalizeRssOrAtomFeed', () => {
  it('normalizes RSS and removes tracking parameters and markup', () => {
    const articles = normalizeRssOrAtomFeed(
      `<?xml version="1.0"?>
       <rss><channel><item>
         <guid>fed-1</guid>
         <title>Federal Reserve &amp; policy update</title>
         <link>https://www.federalreserve.gov/newsevents/test.htm?utm_source=rss</link>
         <description><![CDATA[<p>Policy evidence only.</p>]]></description>
         <pubDate>Sun, 19 Jul 2026 09:30:00 GMT</pubDate>
       </item></channel></rss>`,
      'FEDERALRESERVE.GOV',
      fetchedAt,
    );

    expect(articles).toHaveLength(1);
    expect(articles[0]!).toMatchObject({
      externalId: 'fed-1',
      canonicalUrl: 'https://www.federalreserve.gov/newsevents/test.htm',
      excerpt: 'Policy evidence only.',
      sourceTier: 'PRIMARY',
    });
    expect(articles[0]!.rawHash).toHaveLength(64);
  });

  it('normalizes Atom and rejects future-dated or non-HTTPS entries', () => {
    const articles = normalizeRssOrAtomFeed(
      `<feed>
        <entry>
          <id>valid</id><title>Valid release</title>
          <link rel="alternate" href="https://home.treasury.gov/news/valid"/>
          <published>2026-07-19T09:00:00Z</published>
        </entry>
        <entry>
          <id>future</id><title>Future release</title>
          <link href="https://home.treasury.gov/news/future"/>
          <published>2026-07-20T09:00:00Z</published>
        </entry>
        <entry>
          <id>insecure</id><title>Insecure release</title>
          <link href="http://home.treasury.gov/news/insecure"/>
          <published>2026-07-19T09:00:00Z</published>
        </entry>
      </feed>`,
      'TREASURY.GOV',
      fetchedAt,
    );

    expect(articles.map((article) => article.externalId)).toEqual(['valid']);
  });
});
