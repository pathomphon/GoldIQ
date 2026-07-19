import type { FetchNewsResult } from './news.types';

export const NEWS_PROVIDER_PORT = Symbol('NEWS_PROVIDER_PORT');

export interface NewsProviderPort {
  fetchLatest(): Promise<FetchNewsResult>;
}
