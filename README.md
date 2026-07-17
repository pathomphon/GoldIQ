# GoldIQ

GoldIQ คือเว็บแอปส่วนตัวสำหรับติดตามราคาทอง จัดการพอร์ต และแจ้งเตือนระดับราคา
repository นี้ทำเสร็จถึง **Phase 4: Buy Plan และ Alerts** ตาม `requirement.txt`

## ความสามารถปัจจุบัน

- Next.js + React + strict TypeScript frontend
- NestJS + strict TypeScript backend
- PostgreSQL + Prisma พร้อม migrations และ database constraints
- Redis สำหรับ health check และ distributed scheduler lock
- Hua Seng Heng adapter สำหรับทองคำแท่ง 96.5%, ทองรูปพรรณ 96.5% และทอง 99.99%
- provider payload normalization, validation, timeout และ exponential-backoff retry
- scheduler ดึงราคาเมื่อเริ่มระบบและทุกนาที พร้อมป้องกันงานซ้ำหลาย instances
- price history แบบ idempotent ด้วย provider payload hash
- Portfolio CRUD: เพิ่ม แก้ไข และลบรายการซื้อ
- คำนวณน้ำหนักทอง ต้นทุนเฉลี่ย มูลค่าปัจจุบัน กำไร/ขาดทุน เปอร์เซ็นต์ และจุดคุ้มทุน
- Portfolio valuation ใช้ราคารับซื้อล่าสุดแยกตามประเภททอง
- Buy Plan แบบหลายไม้ พร้อมสถานะ Waiting, Triggered, Executed และ Cancelled
- Alert scheduler ทุก 30 วินาที พร้อม Redis lock และ atomic database transition ป้องกันแจ้งซ้ำ
- เก็บ Alert history และรองรับ Telegram Bot หรือ LINE Messaging API ผ่าน environment variables
- Responsive UI สำหรับ Gold prices, Portfolio และ System status
- Docker Compose สำหรับ web, API, PostgreSQL, Redis และ mock Hua Seng Heng API
- unit, component และ HTTP integration tests

## โครงสร้างสำคัญ

```text
.
├── apps
│   ├── api
│   │   ├── prisma
│   │   └── src
│   │       ├── infrastructure
│   │       └── modules
│   │           ├── gold-price
│   │           ├── portfolio
│   │           └── health
│   ├── mock-hsh
│   └── web
├── compose.yaml
└── .env.example
```

Domain calculator แยกจาก NestJS, Prisma และ provider response เพื่อให้สูตรธุรกิจทดสอบได้โดยตรง
ข้อมูลจำนวนเงินและน้ำหนักใช้ PostgreSQL `DECIMAL` พร้อมข้อกำหนดค่าบวกในฐานข้อมูล

## เริ่มด้วย Docker

```powershell
Copy-Item .env.example .env
docker compose up --build
```

หน้าเว็บ:

- Gold prices: <http://localhost:3000>
- Portfolio: <http://localhost:3000/portfolio>
- Buy plan: <http://localhost:3000/buy-plan>
- System status: <http://localhost:3000/system-status>

API:

- `GET /api/v1/gold-prices/current`
- `GET /api/v1/gold-prices/history`
- `GET /api/v1/portfolio`
- `POST /api/v1/portfolio/transactions`
- `PATCH /api/v1/portfolio/transactions/:id`
- `DELETE /api/v1/portfolio/transactions/:id`
- `GET /api/v1/buy-plans`
- `POST /api/v1/buy-plans`
- `PATCH /api/v1/buy-plans/levels/:id`
- `DELETE /api/v1/buy-plans/:id`
- `GET /api/v1/health/liveness`
- `GET /api/v1/health/readiness`

ตัวอย่างสร้างรายการซื้อ:

```json
{
  "productCode": "GOLD_BAR_965",
  "purchasedAt": "2026-07-17T10:00:00.000Z",
  "purchasePrice": 63300,
  "investmentAmount": 20000,
  "fee": 0,
  "notes": "ไม้แรก"
}
```

น้ำหนักทองคำนวณจาก `investmentAmount / purchasePrice`
ส่วนต้นทุนรวมที่ใช้คำนวณกำไรขาดทุนรวมค่าธรรมเนียม

หยุดระบบโดยเก็บข้อมูลใน named volumes:

```powershell
docker compose down
```

`docker compose down --volumes` จะลบข้อมูล local ด้วย จึงควรใช้เมื่อตั้งใจล้างระบบเท่านั้น

## Local development

ต้องมี Node.js 22+, npm 10+ และ Docker

```powershell
docker compose up -d postgres redis mock-hsh
npm install
npm run prisma:generate
Copy-Item .env.example .env
npm run prisma:migrate
npm run dev:api
```

เปิดอีก terminal:

```powershell
npm run dev:web
```

Docker stack ใช้ mock provider ที่เลียนแบบ payload จริงและสร้าง timestamp ใหม่ทุกรอบ
หากใช้ provider จริง ให้กำหนด URL และ token ผ่าน environment เท่านั้น

## Reliability

- Redis lock ป้องกัน scheduler ทำงานซ้ำ
- provider requests มี timeout และ retry
- price history มี unique `(product_id, raw_response_hash)`
- transaction validation ทำงานทั้ง API และ database constraints
- foreign-key columns มี indexes สำหรับ portfolio joins
- scheduler errors ถูก log โดยไม่ทำให้ API process หยุด
- readiness ตรวจ PostgreSQL และ Redis พร้อม latency

ดู environment contract ที่ [.env.example](./.env.example)

## Quality gates

```powershell
npm run verify
```

ครอบคลุม formatting, lint, typecheck, unit/component tests, HTTP integration tests
และ production builds ทุก workspace

## ขอบเขตถัดไป

Phase 5–6 ได้แก่ charts, indicators และ recommendation engine
