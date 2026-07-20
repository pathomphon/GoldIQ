---
name: market-news-intelligence
description: Guidelines for fetching financial news RSS feeds, AI market brief generation (Ollama/OpenAI), and LLM stance extraction in GoldIQ.
---

# Market & News Intelligence Standards

This skill provides rules for news article ingestion, RSS parsing, and LLM-driven market brief generation in GoldIQ.

## 1. News Feed Ingestion

- Extract news from configured primary feeds (`NEWS_SOURCE_URLS`).
- De-duplicate articles using `urlHash` (SHA-256 of canonical URL).
- Store raw response hash and published timestamps to prevent duplicate processing.

## 2. LLM Market Brief Generation

- Support multiple providers (`OLLAMA`, `OPENAI`) via strategy adapters.
- Output schema must strictly conform to `MarketBrief` domain model:
  - `stance`: `BULLISH` | `NEUTRAL` | `BEARISH`
  - `confidence`: Decimal (0.000 to 1.000)
  - `bullishFactors`, `bearishFactors`, `riskFlags`, `unknowns`: JSON arrays
- Prompts must explicitly instruct LLM to refrain from guaranteeing financial returns.

## 3. Caching & Expiry

- Market briefs are cached with an expiration TTL (`RESEARCH_AGENT_BRIEF_TTL_MINUTES`).
- Shadow mode (`RECOMMENDATION_SHADOW_MODE_ENABLED`) allows testing new prompt versions without impacting user recommendations directly.
