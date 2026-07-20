import type { GoldProductCode } from './gold-product';
import type { GoldPriceSnapshot } from './gold-price.types';

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
    readonly timestamp: Date;
    readonly buyPrice: number;
    readonly sellPrice: number;
  }[];
  readonly sma: Readonly<Record<'20' | '50' | '200', number | null>>;
  readonly ema: Readonly<Record<'20' | '50' | '100' | '200', number | null>>;
  readonly rsi: number | null;
  readonly macd: {
    readonly value: number;
    readonly signal: number;
    readonly histogram: number;
  } | null;
  readonly bollingerBands: BollingerBands | null;
  readonly atr: number | null;
  readonly pivotPoints: PivotPoints | null;
  readonly support: readonly number[];
  readonly resistance: readonly number[];
  readonly supportResistanceLevels?: readonly SupportResistanceLevel[];
}

function sma(values: readonly number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  const result = slice.reduce((sum, value) => sum + value, 0) / period;
  return Number(result.toFixed(2));
}

function ema(values: readonly number[], period: number): number | null {
  if (values.length < period) return null;
  const multiplier = 2 / (period + 1);
  let result = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  for (const value of values.slice(period)) result = (value - result) * multiplier + result;
  return Number(result.toFixed(2));
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
  const result = 100 - 100 / (1 + gains / losses);
  return Number(result.toFixed(2));
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
  return {
    value: Number(value.toFixed(2)),
    signal: Number(signal.toFixed(2)),
    histogram: Number((value - signal).toFixed(2)),
  };
}

function bollingerBands(
  values: readonly number[],
  period = 20,
  multiplier = 2,
): BollingerBands | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  const middle = slice.reduce((sum, v) => sum + v, 0) / period;
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  const upper = middle + multiplier * stdDev;
  const lower = middle - multiplier * stdDev;
  const bandwidth = middle > 0 ? ((upper - lower) / middle) * 100 : 0;
  const currentPrice = values.at(-1) ?? middle;
  const percentB = upper !== lower ? (currentPrice - lower) / (upper - lower) : 0.5;

  return {
    middle: Number(middle.toFixed(2)),
    upper: Number(upper.toFixed(2)),
    lower: Number(lower.toFixed(2)),
    bandwidth: Number(bandwidth.toFixed(2)),
    percentB: Number(percentB.toFixed(4)),
  };
}

function atr(
  samples: readonly { buyPrice: number; sellPrice: number }[],
  period = 14,
): number | null {
  if (samples.length <= period) return null;
  const trs: number[] = [];
  for (let i = 1; i < samples.length; i++) {
    const current = samples[i];
    const previous = samples[i - 1];
    if (!current || !previous) continue;
    const currentHigh = current.sellPrice;
    const currentLow = current.buyPrice;
    const previousClose = previous.sellPrice;
    const tr = Math.max(
      currentHigh - currentLow,
      Math.abs(currentHigh - previousClose),
      Math.abs(currentLow - previousClose),
    );
    trs.push(tr);
  }
  if (trs.length < period) return null;
  const recentTrs = trs.slice(-period);
  const value = recentTrs.reduce((sum, v) => sum + v, 0) / period;
  return Number(value.toFixed(2));
}

function pivotPoints(
  samples: readonly { buyPrice: number; sellPrice: number }[],
): PivotPoints | null {
  if (samples.length === 0) return null;
  const high = Math.max(...samples.map((s) => s.sellPrice));
  const low = Math.min(...samples.map((s) => s.buyPrice));
  const close = samples.at(-1)?.sellPrice ?? high;
  const pivot = (high + low + close) / 3;
  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + (high - low);
  const s2 = pivot - (high - low);
  const r3 = high + 2 * (pivot - low);
  const s3 = low - 2 * (high - pivot);

  return {
    pivot: Number(pivot.toFixed(2)),
    r1: Number(r1.toFixed(2)),
    r2: Number(r2.toFixed(2)),
    r3: Number(r3.toFixed(2)),
    s1: Number(s1.toFixed(2)),
    s2: Number(s2.toFixed(2)),
    s3: Number(s3.toFixed(2)),
  };
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
  const currentPrice = values.at(-1) ?? 0;

  const rawSupport = distinct.slice(0, 3);
  const rawResistance = distinct.slice(-3).reverse();

  const supportResistanceLevels: SupportResistanceLevel[] = [
    ...rawSupport.map((level, idx) => ({
      level,
      type: 'SUPPORT' as const,
      label: `แนวรับ S${idx + 1}`,
      distancePercent:
        currentPrice > 0 ? Number((((level - currentPrice) / currentPrice) * 100).toFixed(2)) : 0,
    })),
    ...rawResistance.map((level, idx) => ({
      level,
      type: 'RESISTANCE' as const,
      label: `แนวต้าน R${idx + 1}`,
      distancePercent:
        currentPrice > 0 ? Number((((level - currentPrice) / currentPrice) * 100).toFixed(2)) : 0,
    })),
  ];

  const samples = chronological.map((snapshot) => ({
    timestamp: snapshot.sourceUpdatedAt,
    buyPrice: snapshot.buyPrice,
    sellPrice: snapshot.sellPrice,
  }));

  return {
    productCode,
    samples,
    sma: {
      '20': sma(values, 20),
      '50': sma(values, 50),
      '200': sma(values, 200),
    },
    ema: {
      '20': ema(values, 20),
      '50': ema(values, 50),
      '100': ema(values, 100),
      '200': ema(values, 200),
    },
    rsi: rsi(values),
    macd: macd(values),
    bollingerBands: bollingerBands(values, 20, 2),
    atr: atr(samples, 14),
    pivotPoints: pivotPoints(samples),
    support: rawSupport,
    resistance: rawResistance,
    supportResistanceLevels,
  };
}
