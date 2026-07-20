---
name: hua-seng-heng-price-adapter
description: Best practices for integrating Hua Seng Heng Gold Price APIs, raw response normalization, retry/backoff, and distributed scheduler locks.
---

# Hua Seng Heng Gold Price Integration Standards

This skill governs external API communication, response normalization, and scheduler reliability for Hua Seng Heng gold prices in GoldIQ.

## 1. External API Integration

- **Endpoints**:
  - Gold 96.5%: `https://apicheckpricev3.huasengheng.com/api/values/getprice/`
  - Gold 99.99%: `https://apigoldprice99.huasengheng.com/api/values`
- **Adapter Pattern**: Never leak raw API payload fields into application logic. Always convert external JSON into `NormalizedGoldPriceQuote`.

## 2. Deduplication & Hashing

- Compute SHA-256 hash (`rawResponseHash`) of raw JSON response string.
- Database table `gold_prices` enforces `@@unique([productId, rawResponseHash])`.
- Repository uses `skipDuplicates: true` to prevent inserting identical unchanged price records.

## 3. Reliability & Distributed Locking

- **Scheduler**: Standard poll frequency is defined by `HSH_POLL_CRON` (default `*/1 * * * *`).
- **Distributed Lock**: Must use `DISTRIBUTED_LOCK_PORT` (`runWithLock`) with lock key `goldiq:locks:gold-price-refresh` to ensure single execution across multiple container instances.
- **Retry Logic**: Handle network timeouts and HTTP errors with exponential backoff before throwing exceptions.
