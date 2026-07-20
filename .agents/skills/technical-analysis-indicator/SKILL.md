---
name: technical-analysis-indicator
description: Instructions for technical analysis calculations (SMA, EMA, RSI, MACD, Support/Resistance) and OHLC time-series candle processing in GoldIQ.
---

# Technical Analysis & Time-Series Standards

This skill provides guidelines for computing technical analysis indicators and handling OHLC time-series data in GoldIQ.

## 1. Time-Series Candle Bucketing Rules

- **Standard Resolutions**: `M1` (1-min), `M5` (5-min), `M15` (15-min), `H1` (1-hour), `D1` (1-day).
- **UTC Alignment**: Always compute `bucketStart` timestamps using UTC methods (`setUTCHours`, `setUTCMinutes`, etc.) to remain consistent across timezone configurations.
- **Dual Side OHLC**: Every candle must store OHLC values for BOTH Buy price (`openBuy`, `highBuy`, `lowBuy`, `closeBuy`) and Sell price (`openSell`, `highSell`, `lowSell`, `closeSell`).

## 2. Technical Indicator Formulas

- **Simple Moving Average (SMA)**:
  Mean of the last $N$ closing prices. Requires at least $N$ historical samples.
- **Exponential Moving Average (EMA)**:
  Multiplier $K = \frac{2}{N + 1}$.
  $$\text{EMA}_{\text{today}} = (\text{Price}_{\text{today}} \times K) + (\text{EMA}_{\text{yesterday}} \times (1 - K))$$
  Standard periods: 20, 50, 100, 200.
- **Relative Strength Index (RSI 14)**:
  Requires at least 15 historical data points.
  $$\text{RS} = \frac{\text{Average Gain}}{\text{Average Loss}}$$
  $$\text{RSI} = 100 - \left(\frac{100}{1 + \text{RS}}\right)$$
  If Average Loss is $0$, set RSI to $100$.
- **MACD (12, 26, 9)**:
  $$\text{MACD Line} = \text{EMA}_{12} - \text{EMA}_{26}$$
  $$\text{Signal Line} = \text{EMA}_{9}(\text{MACD Line})$$
  $$\text{Histogram} = \text{MACD Line} - \text{Signal Line}$$

## 3. Support & Resistance Levels

- Extract distinct price peaks and troughs from chronological price history.
- Distances must be calculated relative to current sell price as percentage:
  $$\text{Distance \%} = \frac{\text{Level Price} - \text{Current Price}}{\text{Current Price}} \times 100$$
- Always handle edge cases where insufficient samples exist by returning empty/null indicators safely without throwing runtime errors.
