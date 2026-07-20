import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import type { ChartTimeframe } from '../../domain/gold-price.types';

const ALLOWED_TIMEFRAMES: readonly ChartTimeframe[] = ['INTRADAY', '7D', '30D', '3M', '1Y', 'ALL'];

@Injectable()
export class ParseChartTimeframePipe implements PipeTransform<
  string | undefined,
  ChartTimeframe | undefined
> {
  transform(value: string | undefined): ChartTimeframe | undefined {
    if (!value) return undefined;
    const upper = value.toUpperCase() as ChartTimeframe;
    if (ALLOWED_TIMEFRAMES.includes(upper)) {
      return upper;
    }
    throw new BadRequestException(`timeframe must be one of: ${ALLOWED_TIMEFRAMES.join(', ')}`);
  }
}
