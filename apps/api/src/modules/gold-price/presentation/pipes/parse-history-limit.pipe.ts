import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseHistoryLimitPipe implements PipeTransform<
  string | undefined,
  number | undefined
> {
  transform(value: string | undefined): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException('limit must be a positive integer');
    }

    return parsed;
  }
}
