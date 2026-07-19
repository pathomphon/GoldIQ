import type { GoldProductCode } from '@/features/gold-price/types';

export interface TechnicalAnalysis {
  readonly productCode: GoldProductCode;
  readonly samples: readonly {
    readonly timestamp: string;
    readonly buyPrice: number;
    readonly sellPrice: number;
  }[];
  readonly ema: Readonly<Record<'20' | '50' | '100' | '200', number | null>>;
  readonly rsi: number | null;
  readonly macd: {
    readonly value: number;
    readonly signal: number;
    readonly histogram: number;
  } | null;
  readonly support: readonly number[];
  readonly resistance: readonly number[];
}

export interface AnalysisResult {
  readonly data: TechnicalAnalysis | null;
  readonly error: string | null;
}
