'use client';

import {
  ColorType,
  createChart,
  LineSeries,
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';

import type { TechnicalAnalysis } from '@/features/analysis/types';

interface PriceChartProps {
  readonly samples: TechnicalAnalysis['samples'];
  readonly support?: readonly number[];
  readonly resistance?: readonly number[];
}

interface HoverSnapshot {
  readonly time: string;
  readonly sellPrice: number;
  readonly buyPrice: number;
  readonly spread: number;
}

const money = new Intl.NumberFormat('th-TH', {
  maximumFractionDigits: 0,
});

export function PriceChart({ samples, support = [], resistance = [] }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const sellSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const buySeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  const [showSupport, setShowSupport] = useState(true);
  const [showResistance, setShowResistance] = useState(true);
  const [hoverData, setHoverData] = useState<HoverSnapshot | null>(null);

  const latestSample = samples.at(-1);
  const defaultSnapshot: HoverSnapshot | null = latestSample
    ? {
        time: new Intl.DateTimeFormat('th-TH', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'Asia/Bangkok',
        }).format(new Date(latestSample.timestamp)),
        sellPrice: latestSample.sellPrice,
        buyPrice: latestSample.buyPrice,
        spread: latestSample.sellPrice - latestSample.buyPrice,
      }
    : null;

  useEffect(() => {
    if (!chartContainerRef.current || samples.length < 2) return;

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 340,
      layout: {
        background: { type: ColorType.Solid, color: '#161a23' },
        textColor: '#a0aec0',
        fontSize: 12,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        vertLine: { color: '#fcd535', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#fcd535', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: { top: 0.15, bottom: 0.15 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const sellSeries = chart.addSeries(LineSeries, {
      color: '#f87171',
      lineWidth: 2,
      title: 'ราคาขายออก',
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });

    const buySeries = chart.addSeries(LineSeries, {
      color: '#4ade80',
      lineWidth: 2,
      title: 'ราคารับซื้อ',
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });

    sellSeriesRef.current = sellSeries;
    buySeriesRef.current = buySeries;

    // Prepare time-series data with strictly ascending timestamps
    const rawData = samples.map((s, idx) => {
      const baseSecs = Math.floor(new Date(s.timestamp).getTime() / 1000);
      return {
        timeSec: baseSecs + idx, // ensure strictly unique time seconds
        isoTime: s.timestamp,
        buyPrice: s.buyPrice,
        sellPrice: s.sellPrice,
      };
    });

    rawData.sort((a, b) => a.timeSec - b.timeSec);

    const sellData = rawData.map((d) => ({
      time: d.timeSec as UTCTimestamp,
      value: d.sellPrice,
    }));

    const buyData = rawData.map((d) => ({
      time: d.timeSec as UTCTimestamp,
      value: d.buyPrice,
    }));

    sellSeries.setData(sellData);
    buySeries.setData(buyData);

    chart.timeScale().fitContent();

    // Crosshair listener for hover info card
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHoverData(null);
        return;
      }

      const sellPoint = param.seriesData.get(sellSeries) as { value?: number } | undefined;
      const buyPoint = param.seriesData.get(buySeries) as { value?: number } | undefined;

      const sellVal = sellPoint?.value;
      const buyVal = buyPoint?.value;

      if (sellVal !== undefined && buyVal !== undefined) {
        const timeSec = param.time as number;
        const matched = rawData.find((d) => d.timeSec === timeSec);
        const timeStr = matched
          ? new Intl.DateTimeFormat('th-TH', {
              dateStyle: 'short',
              timeStyle: 'short',
              timeZone: 'Asia/Bangkok',
            }).format(new Date(matched.isoTime))
          : 'N/A';

        setHoverData({
          time: timeStr,
          sellPrice: sellVal,
          buyPrice: buyVal,
          spread: sellVal - buyVal,
        });
      }
    });

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [samples]);

  // Update Support & Resistance price lines on chart
  useEffect(() => {
    const sellSeries = sellSeriesRef.current;
    if (!sellSeries) return;

    // Clear old lines
    priceLinesRef.current.forEach((line) => sellSeries.removePriceLine(line));
    priceLinesRef.current = [];

    if (showResistance) {
      resistance.forEach((price) => {
        const line = sellSeries.createPriceLine({
          price,
          color: '#f87171',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: '',
          axisLabelColor: '#ef4444',
          axisLabelTextColor: '#ffffff',
        });
        priceLinesRef.current.push(line);
      });
    }

    if (showSupport) {
      support.forEach((price) => {
        const line = sellSeries.createPriceLine({
          price,
          color: '#4ade80',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: '',
          axisLabelColor: '#22c55e',
          axisLabelTextColor: '#ffffff',
        });
        priceLinesRef.current.push(line);
      });
    }
  }, [support, resistance, showSupport, showResistance]);

  if (samples.length < 2) {
    return <div className="analysis-empty">กำลังสะสมข้อมูลสำหรับกราฟราคา</div>;
  }

  const activeDisplay = hoverData ?? defaultSnapshot;

  return (
    <div className="price-chart-container" aria-label="กราฟประวัติราคารับซื้อและขายออก">
      <div className="price-chart-toolbar">
        <div className="chart-toggles">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showSupport}
              onChange={(e) => setShowSupport(e.target.checked)}
            />
            <span className="badge badge--support">แนวรับ ({support.length})</span>
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showResistance}
              onChange={(e) => setShowResistance(e.target.checked)}
            />
            <span className="badge badge--resistance">แนวต้าน ({resistance.length})</span>
          </label>
        </div>

        {activeDisplay ? (
          <div className="chart-hover-card" role="status">
            <span className="hover-time">{activeDisplay.time}</span>
            <div className="hover-metrics">
              <span className="hover-item text-sell">
                ขายออก: <strong>฿{money.format(activeDisplay.sellPrice)}</strong>
              </span>
              <span className="hover-item text-buy">
                รับซื้อ: <strong>฿{money.format(activeDisplay.buyPrice)}</strong>
              </span>
              <span className="hover-item text-muted">
                ส่วนต่าง: <strong>฿{money.format(activeDisplay.spread)}</strong>
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="price-chart-canvas-wrapper" ref={chartContainerRef} />

      <div className="chart-legend">
        <span className="sell">ขายออก (Sell)</span>
        <span className="buy">รับซื้อ (Buy)</span>
        {showResistance && <span className="resistance-legend">แนวต้าน (R)</span>}
        {showSupport && <span className="support-legend">แนวรับ (S)</span>}
      </div>
    </div>
  );
}
