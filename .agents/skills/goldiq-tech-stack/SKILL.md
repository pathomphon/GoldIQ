---
name: goldiq-tech-stack
description: Tech stack standards, monorepo structure, architectural patterns (NestJS, Next.js, Prisma, Redis, Docker) for GoldIQ.
---

# GoldIQ Tech Stack & Architecture Guidelines

This skill provides architectural conventions and technical stack standards for the GoldIQ workspace.

## 1. Project Structure & Monorepo

GoldIQ is organized as an npm workspace monorepo:

- `apps/web`: **Frontend** built with Next.js (App Router), React, TypeScript, and Vanilla CSS/Tailwind.
- `apps/api`: **Backend** built with NestJS, TypeScript, Prisma ORM, and Redis.
- `apps/mock-hsh`: **Mock Server** simulating Hua Seng Heng API endpoints during local development and testing.

## 2. Backend Architectural Pattern (NestJS)

`apps/api` follows a **Modular Monolith** with **Ports and Adapters (Hexagonal Architecture)** per feature module (`src/modules/<feature>`):

```
src/modules/<feature>/
├── domain/            # Domain models, entities, repository ports (interfaces/symbols)
├── application/       # Use cases, application services, schedulers
├── infrastructure/    # Concrete adapters (Prisma, Redis, HTTP clients)
└── presentation/      # NestJS Controllers, DTOs, Validation Pipes
```

### Key Practices:

- **Dependency Inversion**: Inject ports using `Symbol` tokens (e.g., `GOLD_PRICE_REPOSITORY_PORT`, `DISTRIBUTED_LOCK_PORT`).
- **Configuration**: Use `ConfigService` with strictly typed schemas (`config/environment.schema.ts`).
- **Distributed Locks**: Critical schedulers and background tasks must acquire a Redis lock using `DISTRIBUTED_LOCK_PORT`.

## 3. Database & ORM (PostgreSQL + Prisma)

- **Database**: PostgreSQL 17.
- **ORM**: Prisma ORM (`apps/api/prisma/schema.prisma`).
- **Naming Conventions**:
  - Prisma models: `PascalCase` (e.g., `GoldPriceCandle`)
  - Database tables & columns: `snake_case` via `@map` and `@@map`
  - CUIDs for primary keys (`@id @default(cuid())`)
  - Always generate client with `npx prisma generate` after schema updates.

## 4. Cache & Distributed Lock (Redis)

- **Image**: Redis 8 Alpine.
- **Key Namespacing**:
  - Distributed Locks: `goldiq:locks:<lock-name>`
  - Cache Keys: `goldiq:cache:<domain>:<id>`

## 5. Development Verification & Workflow

Follow the project's **Development Testing Policy** in `AGENTS.md`:

1. Run TypeScript type checking (`tsc`).
2. Run linting for modified files (`eslint`).
3. Verify production build when routing, dependencies, or schema change.
4. Keep verification focused and targeted (no unnecessary full test suite execution).
