# GoldIQ

GoldIQ คือเว็บแอปส่วนตัวสำหรับติดตามราคาทอง จัดการพอร์ต และแจ้งเตือนระดับราคา
repository นี้ทำเสร็จถึง **Phase 6: Recommendation Engine** ตาม `requirement.txt`

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
- กราฟประวัติราคาและตัวชี้วัด EMA, RSI, MACD, Support และ Resistance
- Recommendation Engine แบบ rule-based พร้อมเหตุผลสำหรับ BUY, WAIT, HOLD, REVIEW_PROFIT และ SELL_PARTIAL
- ตั้งค่าโปรไฟล์ความเสี่ยง เงินสดสำรอง สัดส่วนจัดสรร เป้ากำไร สัดส่วนขาย และเพดานหยุดซื้อได้
- Phase 7A News Intelligence ดึง RSS/Atom จากแหล่งปฐมภูมิที่อยู่ใน allowlist พร้อม normalize, hash deduplication, scheduler และ Redis lock
- Phase 7B Gold Research Agent สร้าง market brief แบบ structured พร้อม citations, data confidence, bullish/bearish factors, risk flags และ unknowns
- Phase 7C เชื่อม market brief เข้า Recommendation Engine แบบ conservative shadow mode โดยไม่เปลี่ยน live action หรือ override hard-risk rules
- Phase 8 บันทึกการขายแบบผูกล็อต รองรับขายบางส่วน คำนวณ realized/unrealized P/L และ Win Rate จากล็อตที่ปิดแล้ว
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
- Analysis: <http://localhost:3000/analysis>
- Recommendation: <http://localhost:3000/recommendation>
- System status: <http://localhost:3000/system-status>

API:

- `GET /api/v1/gold-prices/current`
- `GET /api/v1/gold-prices/history`
- `GET /api/v1/gold-prices/analysis`
- `GET /api/v1/recommendations/current`
- `GET /api/v1/recommendations/settings`
- `PATCH /api/v1/recommendations/settings`
- `GET /api/v1/news?source=FEDERALRESERVE.GOV&limit=30`
- `GET /api/v1/news/brief/latest`
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

News Intelligence ปิดอยู่โดยค่าเริ่มต้น เปิดใช้งานด้วย `NEWS_ENABLED=true`
และกำหนด RSS/Atom feeds แบบคั่นด้วย comma ผ่าน `NEWS_SOURCE_URLS`
ระบบยอมรับเฉพาะ HTTPS feeds จาก allowlist ของหน่วยงานหลัก เช่น Federal Reserve,
US Treasury, BLS, BEA, CFTC, Bank of Thailand และ ECB

Gold Research Agent ปิดอยู่โดยค่าเริ่มต้น เปิดด้วย `RESEARCH_AGENT_ENABLED=true`
และเลือก `RESEARCH_AGENT_PROVIDER=openai` (ต้องกำหนด `OPENAI_API_KEY`) หรือ
`RESEARCH_AGENT_PROVIDER=ollama` พร้อม `OLLAMA_BASE_URL` สำหรับโมเดลในเครื่อง Agent อ่านเฉพาะข่าวที่ระบบเก็บไว้,
ใช้ Structured Outputs, ตรวจ evidence IDs ซ้ำใน domain layer และไม่มีสิทธิ์แก้พอร์ต,
Buy Plan, risk settings หรือสร้างคำสั่งซื้อขาย หากไม่มีข่าวใหม่ระบบจะไม่เรียกโมเดลซ้ำ

### แหล่งอ้างอิงสำหรับการวิเคราะห์ทองคำ

- แหล่งข้อมูลหลัก (`PRIMARY`): ข่าวและประกาศจากธนาคารกลางหรือหน่วยงานสถิติทางการ
- แหล่งข้อมูลรอง (`SECONDARY`): บทวิเคราะห์ InterGold และ FINNOMENA
- FINNOMENA ใช้ feed ข่าวแท็ก Gold พร้อมราคาอ้างอิงทองคำไทยและ Gold Spot จากหน้า
  `https://www.finnomena.com/gold`
- ราคา FINNOMENA ใช้เป็นหลักฐานประกอบ Research Agent เท่านั้น ราคาหลักสำหรับพอร์ต,
  Buy Plan และ Alert ยังคงเป็นข้อมูลจากฮั่วเซ่งเฮง
- ระบบเลือกเฉพาะ snapshot ราคา FINNOMENA ล่าสุดของแต่ละประเภทในแต่ละรอบวิเคราะห์
  เพื่อไม่ให้ข้อมูลราคาซ้ำกลบข่าวและหลักฐานจากแหล่งอื่น

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

Phase 7C ทำงานแบบ conservative shadow mode: API ส่งทั้ง live action และ shadow action
โดยข่าวจะลด BUY เป็น WAIT ได้เฉพาะในผลจำลอง แต่ไม่สามารถเปลี่ยน live action,
สร้าง BUY/SELL_PARTIAL หรือ override hard-risk rules ได้
