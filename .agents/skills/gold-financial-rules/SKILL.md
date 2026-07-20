---
name: gold-financial-rules
description: Standards and guidelines for financial calculations, portfolio profit/loss, average gold cost, buy plan execution, and alert trigger logic in GoldIQ.
---

# Gold Financial & Portfolio Rules

This skill provides mandatory business logic guidelines for financial and portfolio operations in GoldIQ.

## 1. Floating Point & Precision Guidelines

- **Always use `Decimal`** (Prisma Decimal / `decimal.js`) for price amounts, gold weights, and money investments.
- **Never use standard JavaScript `number` arithmetic** for financial computations where rounding accumulation errors could occur.
- **Precision standards**:
  - Currency amounts (`buyPrice`, `sellPrice`, `investmentAmount`, `fee`): 2 decimal places (`Decimal(12, 2)`).
  - Gold weights (`goldWeight`): 6 decimal places (`Decimal(14, 6)`).
  - Purity (`purity`): 2 decimal places e.g., `96.50`, `99.99` (`Decimal(5, 2)`).

## 2. Portfolio Valuation & Profit/Loss Formulas

- **Average Purchase Cost per Baht**:
  $$\text{Average Cost} = \frac{\sum \text{Investment Amount}}{\sum \text{Gold Weight}}$$
- **Current Portfolio Market Value**:
  Calculated using current **Buy Price** (`buyPrice`) for the respective gold product type:
  $$\text{Portfolio Value} = \text{Total Gold Weight} \times \text{Current Buy Price}$$
- **Unrealized Profit / Loss**:
  $$\text{Unrealized P/L} = \text{Portfolio Value} - \text{Total Invested Amount}$$
- **Unrealized P/L Percentage**:
  $$\text{P/L \%} = \frac{\text{Unrealized P/L}}{\text{Total Invested Amount}} \times 100$$
- **Breakeven Price**:
  $$\text{Breakeven Price} = \frac{\text{Total Invested Amount} + \sum \text{Transaction Fees}}{\text{Total Gold Weight}}$$

## 3. Buy Plan Level Progression

Buy plan levels strictly transition through the following states:

1. `WAITING`: Active level monitoring target buy price.
2. `TRIGGERED`: Observed price dropped to or below `targetPrice`. Alert event dispatched.
3. `EXECUTED`: User confirmed purchase transaction linked to this level.
4. `CANCELLED`: Level manually deactivated or superseded by user.

## 4. Price Alert Deduplication

- Alerts must be recorded in `alert_events`.
- System must use Redis/Database state checks to **prevent duplicate notifications** for the same level within the lock TTL or until the price crosses out and back into the threshold zone.
