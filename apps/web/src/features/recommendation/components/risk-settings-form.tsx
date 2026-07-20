'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import type { RiskProfile, RiskSettings } from '@/features/recommendation/types';

interface FormState {
  riskProfile: RiskProfile;
  availableCash: string;
  minimumCashReserve: string;
  maxAllocationPercent: string;
  profitTargetPercent: string;
  sellPartialPercent: string;
  stopBuyAbovePrice: string;
}

function initialState(settings: RiskSettings): FormState {
  return {
    riskProfile: settings.riskProfile,
    availableCash: String(settings.availableCash),
    minimumCashReserve: String(settings.minimumCashReserve),
    maxAllocationPercent: String(settings.maxAllocationPercent),
    profitTargetPercent: String(settings.profitTargetPercent),
    sellPartialPercent: String(settings.sellPartialPercent),
    stopBuyAbovePrice:
      settings.stopBuyAbovePrice === null ? '' : String(settings.stopBuyAbovePrice),
  };
}

export function RiskSettingsForm({ settings }: { readonly settings: RiskSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialState(settings));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update<Key extends keyof FormState>(key: Key, value: FormState[Key]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const response = await fetch('/api/recommendations/settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        riskProfile: form.riskProfile,
        availableCash: Number(form.availableCash),
        minimumCashReserve: Number(form.minimumCashReserve),
        maxAllocationPercent: Number(form.maxAllocationPercent),
        profitTargetPercent: Number(form.profitTargetPercent),
        sellPartialPercent: Number(form.sellPartialPercent),
        stopBuyAbovePrice:
          form.stopBuyAbovePrice.trim() === '' ? null : Number(form.stopBuyAbovePrice),
      }),
    });
    setSubmitting(false);
    if (!response.ok) {
      setMessage('บันทึกการตั้งค่าไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง');
      return;
    }
    setMessage('บันทึกการตั้งค่าแล้ว');
    router.refresh();
  }

  return (
    <form className="rec-risk-form" onSubmit={submit}>
      <div className="rec-risk-grid">
        <label className="rec-risk-field">
          <span>โปรไฟล์ความเสี่ยง</span>
          <select
            onChange={(event) => update('riskProfile', event.target.value as RiskProfile)}
            value={form.riskProfile}
          >
            <option value="CONSERVATIVE">ระมัดระวัง</option>
            <option value="BALANCED">ปานกลาง</option>
            <option value="AGGRESSIVE">เชิงรุก</option>
          </select>
        </label>
        <label className="rec-risk-field">
          <span>เงินสดที่มีอยู่ (฿)</span>
          <input
            min="0"
            onChange={(event) => update('availableCash', event.target.value)}
            required
            step="0.01"
            type="number"
            value={form.availableCash}
          />
        </label>
        <label className="rec-risk-field">
          <span>เงินสำรองขั้นต่ำ (฿)</span>
          <input
            min="0"
            onChange={(event) => update('minimumCashReserve', event.target.value)}
            required
            step="0.01"
            type="number"
            value={form.minimumCashReserve}
          />
        </label>
        <label className="rec-risk-field">
          <span>จัดสรรสูงสุด (%)</span>
          <input
            max="100"
            min="1"
            onChange={(event) => update('maxAllocationPercent', event.target.value)}
            required
            step="0.01"
            type="number"
            value={form.maxAllocationPercent}
          />
        </label>
        <label className="rec-risk-field">
          <span>เป้าหมายกำไร (%)</span>
          <input
            max="100"
            min="0.01"
            onChange={(event) => update('profitTargetPercent', event.target.value)}
            required
            step="0.01"
            type="number"
            value={form.profitTargetPercent}
          />
        </label>
        <label className="rec-risk-field">
          <span>ขายกำไรบางส่วน (%)</span>
          <input
            max="100"
            min="1"
            onChange={(event) => update('sellPartialPercent', event.target.value)}
            required
            step="0.01"
            type="number"
            value={form.sellPartialPercent}
          />
        </label>
        <label className="rec-risk-field rec-risk-field--wide">
          <span>เพดานหยุดซื้อ (฿) — ไม่บังคับ</span>
          <input
            onChange={(event) => update('stopBuyAbovePrice', event.target.value)}
            placeholder="ไม่กำหนด"
            step="0.01"
            type="number"
            value={form.stopBuyAbovePrice}
          />
        </label>
      </div>
      <div className="rec-risk-submit">
        <button className="button button--primary" disabled={submitting} type="submit">
          {submitting ? 'กำลังบันทึก…' : 'บันทึกการตั้งค่า'}
        </button>
        {message ? (
          <p className={message.includes('แล้ว') ? 'form-success' : 'form-message'} role="status">
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );

}
