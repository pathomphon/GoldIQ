import type { GoldProductCode } from './gold-product';
import type { GoldPriceSnapshot } from './gold-price.types';

export interface TechnicalAnalysis {
  readonly productCode: GoldProductCode;
  readonly samples: readonly {
    readonly timestamp: Date;
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

function ema(values: readonly number[], period: number): number | null {
  if (values.length < period) return null;
  const multiplier = 2 / (period + 1);
  let result = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  for (const value of values.slice(period)) result = (value - result) * multiplier + result;
  return result;
}

function emaSeries(values: readonly number[], period: number): readonly number[] {
  if (values.length < period) return [];
  const series = [values.slice(0, period).reduce((sum, value) => sum + value, 0) / period];
  const multiplier = 2 / (period + 1);
  for (const value of values.slice(period)) {
    const previous = series.at(-1);
    if (previous === undefined) return [];
    series.push((value - previous) * multiplier + previous);
  }
  return series;
}

function rsi(values: readonly number[], period = 14): number | null {
  if (values.length <= period) return null;
  const changes = values.slice(1).map((value, index) => value - (values[index] ?? value));
  const recent = changes.slice(-period);
  const gains = recent.reduce((sum, value) => sum + Math.max(value, 0), 0) / period;
  const losses = recent.reduce((sum, value) => sum + Math.max(-value, 0), 0) / period;
  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

function macd(values: readonly number[]): TechnicalAnalysis['macd'] {
  const fast = emaSeries(values, 12);
  const slow = emaSeries(values, 26);
  if (slow.length < 9) return null;
  const offset = fast.length - slow.length;
  const line = slow.map((value, index) => (fast[index + offset] ?? value) - value);
  const signal = ema(line, 9);
  if (signal === null) return null;
  const value = line[line.length - 1];
  if (value === undefined) return null;
  return { value, signal, histogram: value - signal };
}

export function calculateTechnicalAnalysis(
  productCode: GoldProductCode,
  history: readonly GoldPriceSnapshot[],
): TechnicalAnalysis {
  const chronological = history.toSorted(
    (left, right) => left.sourceUpdatedAt.getTime() - right.sourceUpdatedAt.getTime(),
  );
  const values = chronological.map((snapshot) => snapshot.sellPrice);
  const distinct = [...new Set(values)].toSorted((left, right) => left - right);

  return {
    productCode,
    samples: chronological.map((snapshot) => ({
      timestamp: snapshot.sourceUpdatedAt,
      buyPrice: snapshot.buyPrice,
      sellPrice: snapshot.sellPrice,
    })),
    ema: {
      '20': ema(values, 20),
      '50': ema(values, 50),
      '100': ema(values, 100),
      '200': ema(values, 200),
    },
    rsi: rsi(values),
    macd: macd(values),
    support: distinct.slice(0, 3),
    resistance: distinct.slice(-3).reverse(),
  };
}
