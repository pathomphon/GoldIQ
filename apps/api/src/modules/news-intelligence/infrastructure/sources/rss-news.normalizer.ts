import { createHash } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';

import type { NormalizedNewsArticle } from '../../domain/news.types';

type XmlRecord = Record<string, unknown>;

const parser = new XMLParser({
  attributeNamePrefix: '@_',
  ignoreAttributes: false,
  parseTagValue: false,
  processEntities: false,
  textNodeName: '#text',
  trimValues: true,
});

function record(value: unknown): XmlRecord | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as XmlRecord)
    : undefined;
}

function records(value: unknown): readonly XmlRecord[] {
  if (Array.isArray(value)) return value.map(record).filter((item) => item !== undefined);
  const item = record(value);
  return item ? [item] : [];
}

function text(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  const item = record(value);
  return item ? text(item['#text']) : undefined;
}

function link(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim();
  const candidates = Array.isArray(value) ? value : [value];
  for (const candidate of candidates) {
    const item = record(candidate);
    const href = text(item?.['@_href']) ?? text(item?.['#text']);
    const relation = text(item?.['@_rel']);
    if (href && (!relation || relation === 'alternate')) return href;
  }
  return undefined;
}

function cleanMarkup(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const cleaned = raw
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned ? cleaned.slice(0, 1_000) : null;
}

function canonicalizeUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return undefined;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function feedEntries(document: XmlRecord): readonly XmlRecord[] {
  const rss = record(document.rss);
  const channel = record(rss?.channel);
  if (channel) return records(channel.item);

  const feed = record(document.feed);
  return feed ? records(feed.entry) : [];
}

export function normalizeRssOrAtomFeed(
  xml: string,
  source: string,
  fetchedAt: Date,
): readonly NormalizedNewsArticle[] {
  const document = record(parser.parse(xml));
  if (!document) throw new Error(`Invalid XML document from ${source}`);

  return feedEntries(document).flatMap((entry) => {
    const title = cleanMarkup(entry.title);
    const rawUrl = link(entry.link);
    const canonicalUrl = rawUrl ? canonicalizeUrl(rawUrl) : undefined;
    const publishedText =
      text(entry.pubDate) ?? text(entry.published) ?? text(entry.updated) ?? text(entry.date);
    const publishedAt = publishedText ? new Date(publishedText) : undefined;

    if (
      !title ||
      !canonicalUrl ||
      !publishedAt ||
      Number.isNaN(publishedAt.getTime()) ||
      publishedAt.getTime() > fetchedAt.getTime() + 5 * 60_000
    ) {
      return [];
    }

    const externalId = text(entry.guid) ?? text(entry.id) ?? canonicalUrl;
    const excerpt =
      cleanMarkup(entry.description) ?? cleanMarkup(entry.summary) ?? cleanMarkup(entry.content);
    const rawHash = sha256(
      [source, externalId, canonicalUrl, title, excerpt ?? '', publishedAt.toISOString()].join(
        '\0',
      ),
    );

    return [
      {
        source,
        externalId,
        canonicalUrl,
        title,
        excerpt,
        sourceTier: 'PRIMARY' as const,
        publishedAt,
        fetchedAt,
        rawHash,
        urlHash: sha256(canonicalUrl),
      },
    ];
  });
}
