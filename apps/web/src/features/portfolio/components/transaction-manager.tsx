'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import type { GoldProductCode } from '@/features/gold-price/types';
import type { GoldTransaction } from '@/features/portfolio/types';

interface TransactionManagerProps {
  readonly transactions: readonly GoldTransaction[];
  readonly defaultPurchasedAt: string;
}

interface FormState {
  productCode: GoldProductCode;
  purchasedAt: string;
  purchasePrice: string;
  investmentAmount: string;
  fee: string;
  notes: string;
}

function createInitialForm(defaultPurchasedAt: string): FormState {
  return {
    productCode: 'GOLD_BAR_965',
    purchasedAt: defaultPurchasedAt,
    purchasePrice: '',
    investmentAmount: '',
    fee: '0',
    notes: '',
  };
}

const productOptions: ReadonlyArray<{
  code: GoldProductCode;
  label: string;
}> = [
  { code: 'GOLD_BAR_965', label: 'ทองคำแท่ง 96.5%' },
  { code: 'GOLD_ORNAMENT_965', label: 'ทองรูปพรรณ 96.5%' },
  { code: 'GOLD_9999', label: 'ทองคำ 99.99%' },
];

const numberFormatter = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toLocalInput(timestamp: string): string {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function TransactionManager({ transactions, defaultPurchasedAt }: TransactionManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => createInitialForm(defaultPurchasedAt));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm(): void {
    setForm(createInitialForm(defaultPurchasedAt));
    setEditingId(null);
    setMessage(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const response = await fetch(
      editingId ? `/api/portfolio/transactions/${editingId}` : '/api/portfolio/transactions',
      {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productCode: form.productCode,
          purchasedAt: new Date(form.purchasedAt).toISOString(),
          purchasePrice: Number(form.purchasePrice),
          investmentAmount: Number(form.investmentAmount),
          fee: Number(form.fee),
          notes: form.notes,
        }),
      },
    );

    setSubmitting(false);
    if (!response.ok) {
      setMessage('บันทึกรายการไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง');
      return;
    }

    resetForm();
    router.refresh();
  }

  function startEditing(transaction: GoldTransaction): void {
    setEditingId(transaction.id);
    setForm({
      productCode: transaction.productCode,
      purchasedAt: toLocalInput(transaction.purchasedAt),
      purchasePrice: String(transaction.purchasePrice),
      investmentAmount: String(transaction.investmentAmount),
      fee: String(transaction.fee),
      notes: transaction.notes ?? '',
    });
    setMessage(null);
    document.getElementById('transaction-form')?.scrollIntoView({
      behavior: 'smooth',
    });
  }

  async function remove(id: string): Promise<void> {
    const response = await fetch(`/api/portfolio/transactions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      setMessage('ลบรายการไม่สำเร็จ');
      return;
    }
    setPendingDeleteId(null);
    if (editingId === id) {
      resetForm();
    }
    router.refresh();
  }

  return (
    <div className="portfolio-workspace">
      <section
        aria-labelledby="transaction-form-title"
        className="transaction-panel"
        id="transaction-form"
      >
        <p className="eyebrow">{editingId ? 'EDIT PURCHASE' : 'ADD PURCHASE'}</p>
        <h2 id="transaction-form-title">{editingId ? 'แก้ไขรายการซื้อ' : 'เพิ่มรายการซื้อ'}</h2>
        <form className="transaction-form" onSubmit={submit}>
          <label>
            ประเภททอง
            <select
              onChange={(event) =>
                updateField('productCode', event.target.value as GoldProductCode)
              }
              value={form.productCode}
            >
              {productOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            วันที่และเวลาซื้อ
            <input
              onChange={(event) => updateField('purchasedAt', event.target.value)}
              required
              type="datetime-local"
              value={form.purchasedAt}
            />
          </label>
          <label>
            ราคาทองต่อบาท
            <input
              min="0.01"
              onChange={(event) => updateField('purchasePrice', event.target.value)}
              required
              step="0.01"
              type="number"
              value={form.purchasePrice}
            />
          </label>
          <label>
            เงินที่ลงทุน
            <input
              min="0.01"
              onChange={(event) => updateField('investmentAmount', event.target.value)}
              required
              step="0.01"
              type="number"
              value={form.investmentAmount}
            />
          </label>
          <label>
            ค่าธรรมเนียม
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
              rows={3}
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
              {submitting ? 'กำลังบันทึก…' : editingId ? 'บันทึกการแก้ไข' : 'เพิ่มรายการซื้อ'}
            </button>
            {editingId ? (
              <button className="button button--secondary" onClick={resetForm} type="button">
                ยกเลิก
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section aria-labelledby="transaction-list-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PURCHASE HISTORY</p>
            <h2 id="transaction-list-title">รายการซื้อทั้งหมด</h2>
          </div>
          <span>{transactions.length} รายการ</span>
        </div>
        {transactions.length === 0 ? (
          <div className="notice" role="status">
            <strong>ยังไม่มีรายการซื้อ</strong>
            <span>เพิ่มรายการแรกเพื่อเริ่มคำนวณมูลค่าพอร์ต</span>
          </div>
        ) : (
          <div className="transaction-list">
            {transactions.map((transaction) => (
              <article className="transaction-item" key={transaction.id}>
                <div>
                  <strong>{transaction.productName}</strong>
                  <small>
                    {new Intl.DateTimeFormat('th-TH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'Asia/Bangkok',
                    }).format(new Date(transaction.purchasedAt))}
                  </small>
                </div>
                <dl>
                  <div>
                    <dt>ลงทุน</dt>
                    <dd>฿{numberFormatter.format(transaction.investmentAmount)}</dd>
                  </div>
                  <div>
                    <dt>น้ำหนัก</dt>
                    <dd>{transaction.goldWeight.toFixed(6)} บาททอง</dd>
                  </div>
                  <div>
                    <dt>ราคาซื้อ</dt>
                    <dd>฿{numberFormatter.format(transaction.purchasePrice)}</dd>
                  </div>
                </dl>
                <div className="row-actions">
                  {pendingDeleteId === transaction.id ? (
                    <>
                      <button
                        className="text-button text-button--danger"
                        onClick={() => void remove(transaction.id)}
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
                        onClick={() => startEditing(transaction)}
                        type="button"
                      >
                        แก้ไข
                      </button>
                      <button
                        className="text-button text-button--danger"
                        onClick={() => setPendingDeleteId(transaction.id)}
                        type="button"
                      >
                        ลบ
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
