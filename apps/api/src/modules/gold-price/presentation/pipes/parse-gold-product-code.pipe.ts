import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

import { GOLD_PRODUCT_CODES, type GoldProductCode } from '../../domain/gold-product';

@Injectable()
export class ParseGoldProductCodePipe implements PipeTransform<
  string | undefined,
  GoldProductCode | undefined
> {
  transform(value: string | undefined): GoldProductCode | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (GOLD_PRODUCT_CODES.includes(value as GoldProductCode)) {
      return value as GoldProductCode;
    }

    throw new BadRequestException(`productCode must be one of: ${GOLD_PRODUCT_CODES.join(', ')}`);
  }
}
