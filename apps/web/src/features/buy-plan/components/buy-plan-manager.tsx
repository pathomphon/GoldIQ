'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import type { BuyPlan, BuyPlanLevelStatus } from '@/features/buy-plan/types';
import type { GoldProductCode } from '@/features/gold-price/types';

interface Props {
  readonly plans: readonly BuyPlan[];
}

interface LevelForm {
  readonly targetPrice: string;
  readonly investmentAmount: string;
}

const initialLevels: readonly LevelForm[] = [
  { targetPrice: '63300', investmentAmount: '20000' },
  { targetPrice: '63100', investmentAmount: '15000' },
  { targetPrice: '62900', investmentAmount: '15000' },
];

const money = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 });

export function BuyPlanManager({ plans }: Props) {
  const router = useRouter();
  const [name, setName] = useState('แผนแบ่งไม้หลัก');
  const [productCode, setProductCode] = useState<GoldProductCode>('GOLD_BAR_965');
  const [levels, setLevels] = useState<readonly LevelForm[]>(initialLevels);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateLevel(index: number, field: keyof LevelForm, value: string): void {
    setLevels((current) =>
      current.map((level, levelIndex) =>
        levelIndex === index ? { ...level, [field]: value } : level,
      ),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const response = await fetch('/api/buy-plans', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        productCode,
        levels: levels.map((level, index) => ({
          targetPrice: Number(level.targetPrice),
          investmentAmount: Number(level.investmentAmount),
          sequence: index + 1,
        })),
      }),
    });
    setSubmitting(false);
    if (!response.ok) {
      setMessage('สร้างแผนไม่สำเร็จ กรุณาตรวจสอบข้อมูล');
      return;
    }
    setMessage('สร้างแผนเรียบร้อย');
    router.refresh();
  }

  async function setStatus(id: string, status: BuyPlanLevelStatus): Promise<void> {
    const response = await fetch(`/api/buy-plans/levels/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) setMessage('อัปเดตสถานะไม่สำเร็จ');
    else router.refresh();
  }

  async function removePlan(id: string): Promise<void> {
    const response = await fetch(`/api/buy-plans/${id}`, { method: 'DELETE' });
    if (!response.ok) setMessage('ลบแผนไม่สำเร็จ');
    else router.refresh();
  }

  return (
    <div className="buy-plan-workspace">
      <section className="transaction-panel" aria-labelledby="buy-plan-form-title">
        <p className="eyebrow">CREATE BUY PLAN</p>
        <h2 id="buy-plan-form-title">สร้างแผนแบ่งไม้</h2>
        <form className="transaction-form" onSubmit={submit}>
          <label className="field-wide">
            ชื่อแผน
            <input
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>
          <label className="field-wide">
            ประเภททอง
            <select
              onChange={(event) => setProductCode(event.target.value as GoldProductCode)}
              value={productCode}
            >
              <option value="GOLD_BAR_965">ทองคำแท่ง 96.5%</option>
              <option value="GOLD_ORNAMENT_965">ทองรูปพรรณ 96.5%</option>
              <option value="GOLD_9999">ทองคำ 99.99%</option>
            </select>
          </label>
          {levels.map((level, index) => (
            <div className="buy-level-form field-wide" key={index}>
              <strong>ไม้ #{index + 1}</strong>
              <label>
                ราคาเป้าหมาย
                <input
                  min="0.01"
                  onChange={(event) => updateLevel(index, 'targetPrice', event.target.value)}
                  required
                  step="0.01"
                  type="number"
                  value={level.targetPrice}
                />
              </label>
              <label>
                เงินลงทุน
                <input
                  min="0.01"
                  onChange={(event) => updateLevel(index, 'investmentAmount', event.target.value)}
                  required
                  step="0.01"
                  type="number"
                  value={level.investmentAmount}
                />
              </label>
            </div>
          ))}
          <button
            className="text-button field-wide"
            onClick={() =>
              setLevels((current) => [...current, { targetPrice: '', investmentAmount: '' }])
            }
            type="button"
          >
            + เพิ่มไม้
          </button>
          {message ? (
            <p className="form-message" role="status">
              {message}
            </p>
          ) : null}
          <button className="button button--primary field-wide" disabled={submitting}>
            {submitting ? 'กำลังสร้าง…' : 'สร้างแผน'}
          </button>
        </form>
      </section>

      <section aria-labelledby="buy-plan-list-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ACTIVE PLANS</p>
            <h2 id="buy-plan-list-title">แผนทั้งหมด</h2>
          </div>
          <span>{plans.length} แผน</span>
        </div>
        {plans.length === 0 ? (
          <div className="notice" role="status">
            <strong>ยังไม่มีแผนแบ่งไม้</strong>
            <span>สร้างแผนแรกเพื่อเริ่มติดตามราคาเป้าหมาย</span>
          </div>
        ) : (
          <div className="buy-plan-list">
            {plans.map((plan) => (
              <article className="buy-plan-card" key={plan.id}>
                <div className="buy-plan-card__header">
                  <div>
                    <strong>{plan.name}</strong>
                    <small>{plan.productName}</small>
                  </div>
                  <button
                    className="text-button text-button--danger"
                    onClick={() => void removePlan(plan.id)}
                    type="button"
                  >
                    ลบแผน
                  </button>
                </div>
                <div className="buy-level-list">
                  {plan.levels.map((level) => (
                    <div className="buy-level-row" key={level.id}>
                      <span className={`status-pill status-pill--${level.status.toLowerCase()}`}>
                        {level.status}
                      </span>
                      <strong>ไม้ #{level.sequence}</strong>
                      <span>เป้า ฿{money.format(level.targetPrice)}</span>
                      <span>ลงทุน ฿{money.format(level.investmentAmount)}</span>
                      <div className="row-actions">
                        {level.status === 'TRIGGERED' ? (
                          <button
                            className="text-button"
                            onClick={() => void setStatus(level.id, 'EXECUTED')}
                            type="button"
                          >
                            ซื้อแล้ว
                          </button>
                        ) : null}
                        {level.status === 'WAITING' ? (
                          <button
                            className="text-button text-button--danger"
                            onClick={() => void setStatus(level.id, 'CANCELLED')}
                            type="button"
                          >
                            ยกเลิก
                          </button>
                        ) : (
                          <button
                            className="text-button"
                            onClick={() => void setStatus(level.id, 'WAITING')}
                            type="button"
                          >
                            เปิดใหม่
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
