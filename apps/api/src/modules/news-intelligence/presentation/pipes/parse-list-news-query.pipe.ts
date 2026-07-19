import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

export interface ListNewsQuery {
  readonly limit?: number;
  readonly source?: string;
}

@Injectable()
export class ParseListNewsQueryPipe implements PipeTransform<
  Record<string, unknown>,
  ListNewsQuery
> {
  transform(value: Record<string, unknown>): ListNewsQuery {
    const keys = Object.keys(value);
    if (keys.some((key) => key !== 'limit' && key !== 'source')) {
      throw new BadRequestException('Unsupported news query parameter');
    }

    const rawLimit = value.limit;
    const rawSource = value.source;
    if (
      rawLimit !== undefined &&
      (typeof rawLimit !== 'string' ||
        !/^\d+$/.test(rawLimit) ||
        Number(rawLimit) < 1 ||
        Number(rawLimit) > 500)
    ) {
      throw new BadRequestException('News limit must be an integer between 1 and 500');
    }
    if (
      rawSource !== undefined &&
      (typeof rawSource !== 'string' ||
        rawSource.length === 0 ||
        rawSource.length > 100 ||
        !/^[A-Za-z0-9.-]+$/.test(rawSource))
    ) {
      throw new BadRequestException('Invalid news source');
    }

    return {
      limit: typeof rawLimit === 'string' ? Number(rawLimit) : undefined,
      source: typeof rawSource === 'string' ? rawSource.toUpperCase() : undefined,
    };
  }
}
