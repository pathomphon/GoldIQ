'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import type { GoldSale, GoldTransaction } from '@/features/portfolio/types';

interface SaleManagerProps {
  readonly transaction: GoldTransaction;
  readonly defaultSoldAt: string;
}

interface SaleForm {
  soldAt: string;
  salePrice: string;
  goldWeight: string;
  fee: string;
  notes: string;
}

const numberFormatter = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function initialForm(defaultSoldAt: string): SaleForm {
  return {
    soldAt: defaultSoldAt,
    salePrice: '',
    goldWeight: '',
    fee: '0',
    notes: '',
  };
}

function localInput(timestamp: string): string {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function SaleManager({ transaction, defaultSoldAt }: SaleManagerProps) {
  const router = useRouter();
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState<SaleForm>(() => initialForm(defaultSoldAt));
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const editingSale = editingSaleId
    ? transaction.sales.find((sale) => sale.id === editingSaleId)
    : undefined;
  const maximumWeight = transaction.remainingGoldWeight + (editingSale?.goldWeight ?? 0);

  function updateField<Key extends keyof SaleForm>(key: Key, value: SaleForm[Key]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function closeForm(): void {
    setFormVisible(false);
    setEditingSaleId(null);
    setForm(initialForm(defaultSoldAt));
    setMessage(null);
  }

  function startCreating(): void {
    setEditingSaleId(null);
    setForm(initialForm(defaultSoldAt));
    setFormVisible(true);
    setMessage(null);
  }

  function startEditing(sale: GoldSale): void {
    setEditingSaleId(sale.id);
    setForm({
      soldAt: localInput(sale.soldAt),
      salePrice: String(sale.salePrice),
      goldWeight: String(sale.goldWeight),
      fee: String(sale.fee),
      notes: sale.notes ?? '',
    });
    setFormVisible(true);
    setMessage(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const response = await fetch(
      editingSaleId ? `/api/portfolio/sales/${editingSaleId}` : '/api/portfolio/sales',
      {
        method: editingSaleId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...(editingSaleId ? {} : { purchaseTransactionId: transaction.id }),
          soldAt: new Date(form.soldAt).toISOString(),
          salePrice: Number(form.salePrice),
          goldWeight: Number(form.goldWeight),
          fee: Number(form.fee),
          notes: form.notes,
        }),
      },
    );
    setSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setMessage(payload?.message ?? 'บันทึกรายการขายไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง');
      return;
    }

    closeForm();
    router.refresh();
  }

  async function remove(id: string): Promise<void> {
    const response = await fetch(`/api/portfolio/sales/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setMessage('ลบรายการขายไม่สำเร็จ');
      return;
    }
    setPendingDeleteId(null);
    if (editingSaleId === id) {
      closeForm();
    }
    router.refresh();
  }

  return (
    <div className="sale-manager">
      {transaction.status !== 'CLOSED' ? (
        <button className="button button--secondary" onClick={startCreating} type="button">
          บันทึกขาย
        </button>
      ) : (
        <span className="status-pill status-pill--executed">ปิดล็อตแล้ว</span>
      )}

      {formVisible ? (
        <form className="sale-form" onSubmit={submit}>
          <div className="sale-form__heading">
            <strong>{editingSaleId ? 'แก้ไขรายการขาย' : 'บันทึกการขาย'}</strong>
            <span>ขายได้สูงสุด {maximumWeight.toFixed(6)} บาททอง</span>
          </div>
          <label>
            วันที่และเวลาขาย
            <input
              min={localInput(transaction.purchasedAt)}
              onChange={(event) => updateField('soldAt', event.target.value)}
              required
              type="datetime-local"
              value={form.soldAt}
            />
          </label>
          <label>
            ราคาขายต่อบาททอง
            <input
              min="0.01"
              onChange={(event) => updateField('salePrice', event.target.value)}
              required
              step="0.01"
              type="number"
              value={form.salePrice}
            />
          </label>
          <label>
            น้ำหนักที่ขาย
            <input
              max={maximumWeight}
              min="0.000001"
              onChange={(event) => updateField('goldWeight', event.target.value)}
              required
              step="0.000001"
              type="number"
              value={form.goldWeight}
            />
          </label>
          <label>
            ค่าธรรมเนียมขาย
            <input
              min="0"
              onChange={(event) => updateField('fee', event.target.value)}
              required
              step="0.01"
              type="number"
              value={form.fee}
            />
          </label>
          <label className="field-wide">
            หมายเหตุ
            <textarea
              maxLength={1_000}
              onChange={(event) => updateField('notes', event.target.value)}
              rows={2}
              value={form.notes}
            />
          </label>
          {message ? (
            <p className="form-message" role="alert">
              {message}
            </p>
          ) : null}
          <div className="form-actions field-wide">
            <button className="button button--primary" disabled={submitting}>
              {submitting ? 'กำลังบันทึก…' : 'บันทึกรายการขาย'}
            </button>
            <button className="button button--secondary" onClick={closeForm} type="button">
              ยกเลิก
            </button>
          </div>
        </form>
      ) : null}

      {transaction.sales.length > 0 ? (
        <section aria-label="ประวัติการขาย" className="sale-history">
          <h3>ประวัติการขาย</h3>
          {transaction.sales.map((sale) => (
            <div className="sale-history__row" key={sale.id}>
              <div>
                <strong>{sale.goldWeight.toFixed(6)} บาททอง</strong>
                <small>
                  {new Intl.DateTimeFormat('th-TH', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Asia/Bangkok',
                  }).format(new Date(sale.soldAt))}
                </small>
              </div>
              <div>
                <span>ราคาขาย ฿{numberFormatter.format(sale.salePrice)}</span>
                <strong className={sale.realizedProfitLoss >= 0 ? 'profit-up' : 'profit-down'}>
                  {sale.realizedProfitLoss >= 0 ? '+' : ''}฿
                  {numberFormatter.format(sale.realizedProfitLoss)}
                </strong>
              </div>
              <div className="row-actions">
                {pendingDeleteId === sale.id ? (
                  <>
                    <button
                      className="text-button text-button--danger"
                      onClick={() => void remove(sale.id)}
                      type="button"
                    >
                      ยืนยันลบ
                    </button>
                    <button
                      className="text-button"
                      onClick={() => setPendingDeleteId(null)}
                      type="button"
                    >
                      ยกเลิก
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="text-button"
                      onClick={() => startEditing(sale)}
                      type="button"
                    >
                      แก้ไขการขาย
                    </button>
                    <button
                      className="text-button text-button--danger"
                      onClick={() => setPendingDeleteId(sale.id)}
                      type="button"
                    >
                      ลบการขาย
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
