import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import type { CandleResolution } from '../../domain/gold-price.types';

const ALLOWED_RESOLUTIONS: readonly CandleResolution[] = ['M1', 'M5', 'M15', 'H1', 'D1'];

@Injectable()
export class ParseCandleResolutionPipe implements PipeTransform<
  string | undefined,
  CandleResolution | undefined
> {
  transform(value: string | undefined): CandleResolution | undefined {
    if (!value) return undefined;
    const upper = value.toUpperCase() as CandleResolution;
    if (ALLOWED_RESOLUTIONS.includes(upper)) {
      return upper;
    }
    throw new BadRequestException(`resolution must be one of: ${ALLOWED_RESOLUTIONS.join(', ')}`);
  }
}
