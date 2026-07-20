import type { GoldProductCode } from '@/features/gold-price/types';

export interface SupportResistanceLevel {
  readonly level: number;
  readonly type: 'SUPPORT' | 'RESISTANCE';
  readonly label: string;
  readonly distancePercent: number;
}

export interface BollingerBands {
  readonly middle: number;
  readonly upper: number;
  readonly lower: number;
  readonly bandwidth: number;
  readonly percentB: number;
}

export interface PivotPoints {
  readonly pivot: number;
  readonly r1: number;
  readonly r2: number;
  readonly r3: number;
  readonly s1: number;
  readonly s2: number;
  readonly s3: number;
}

export interface TechnicalAnalysis {
  readonly productCode: GoldProductCode;
  readonly samples: readonly {
    readonly timestamp: string;
    readonly buyPrice: number;
    readonly sellPrice: number;
  }[];
  readonly sma?: Readonly<Record<'20' | '50' | '200', number | null>>;
  readonly ema: Readonly<Record<'20' | '50' | '100' | '200', number | null>>;
  readonly rsi: number | null;
  readonly macd: {
    readonly value: number;
    readonly signal: number;
    readonly histogram: number;
  } | null;
  readonly bollingerBands?: BollingerBands | null;
  readonly atr?: number | null;
  readonly pivotPoints?: PivotPoints | null;
  readonly support: readonly number[];
  readonly resistance: readonly number[];
  readonly supportResistanceLevels?: readonly SupportResistanceLevel[];
}

export interface AnalysisResult {
  readonly data: TechnicalAnalysis | null;
  readonly error: string | null;
}
