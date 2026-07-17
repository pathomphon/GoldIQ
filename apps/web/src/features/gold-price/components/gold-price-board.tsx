import Link from 'next/link';

import type { CurrentGoldPrices, GoldPriceSnapshot } from '@/features/gold-price/types';

interface GoldPriceBoardProps {
  readonly prices: CurrentGoldPrices;
}

const priceFormatter = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'ไม่ทราบเวลา';
  }

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Bangkok',
  }).format(date);
}

function Change({ value }: Readonly<{ value: number | null }>) {
  if (value === null) {
    return <span className="price-change price-change--neutral">—</span>;
  }

  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  const prefix = value > 0 ? '+' : '';
  return (
    <span className={`price-change price-change--${direction}`}>
      {prefix}
      {priceFormatter.format(value)}
    </span>
  );
}

function PriceRow({ price }: Readonly<{ price: GoldPriceSnapshot }>) {
  return (
    <article className="price-row">
      <div className="product-cell">
        <span className="purity-mark">{price.purity}%</span>
        <span>
          <strong>{price.productName}</strong>
          <small>อัปเดต {formatTimestamp(price.sourceUpdatedAt)}</small>
        </span>
      </div>
      <div className="quote-cell">
        <span className="mobile-label">รับซื้อ</span>
        <strong>฿{formatPrice(price.buyPrice)}</strong>
        <Change value={price.buyChange} />
      </div>
      <div className="quote-cell">
        <span className="mobile-label">ขายออก</span>
        <strong>฿{formatPrice(price.sellPrice)}</strong>
        <Change value={price.sellChange} />
      </div>
    </article>
  );
}

export function GoldPriceBoard({ prices }: GoldPriceBoardProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link aria-label="GoldIQ home" className="wordmark" href="/">
          <span>Gold</span>IQ
        </Link>
        <nav aria-label="Primary navigation">
          <Link aria-current="page" className="nav-link nav-link--active" href="/">
            Gold prices
          </Link>
          <Link className="nav-link" href="/portfolio">
            Portfolio
          </Link>
          <Link className="nav-link" href="/buy-plan">
            Buy plan
          </Link>
          <Link className="nav-link" href="/system-status">
            System status
          </Link>
        </nav>
      </header>

      <main className="price-page">
        <section aria-labelledby="page-title">
          <p className="eyebrow">HUA SENG HENG · LIVE MARKET</p>
          <h1 id="page-title">ราคาทองวันนี้</h1>
          <p className="lede">ราคาซื้อและขายล่าสุดจากฮั่วเซ่งเฮง หน่วยบาท</p>

          {prices.error ? (
            <div className="notice notice--error" role="alert">
              <strong>ไม่สามารถโหลดราคาล่าสุดได้</strong>
              <span>{prices.error}</span>
            </div>
          ) : prices.data.length === 0 ? (
            <div className="notice" role="status">
              <strong>กำลังรอข้อมูลราคารอบแรก</strong>
              <span>ระบบจะอัปเดตอัตโนมัติเมื่อได้รับข้อมูลจากผู้ให้บริการ</span>
            </div>
          ) : (
            <div className="price-board" aria-label="Current gold prices">
              <div className="price-row price-row--header" aria-hidden="true">
                <span>ประเภททอง</span>
                <span>ราคารับซื้อ / เปลี่ยนแปลง</span>
                <span>ราคาขายออก / เปลี่ยนแปลง</span>
              </div>
              {prices.data.map((price) => (
                <PriceRow key={price.productCode} price={price} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer>
        <span>Phase 2</span>
        <i aria-hidden="true" />
        <span>Price data foundation</span>
      </footer>
    </div>
  );
}
