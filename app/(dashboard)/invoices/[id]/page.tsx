'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { getInvoiceById, recordPaymentAction } from '@/lib/actions/invoice.actions';
import { InvoiceRow, InvoiceItemRow, PaymentRow, CustomerRow, OrderRow, ActivityRow, PaymentMethod } from '@/types/database';
import Link from 'next/link';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<InvoiceRow | null>(null);
  const [items, setItems] = useState<InvoiceItemRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await getInvoiceById(params.id);
    setInvoice(res.invoice);
    setItems(res.items);
    setPayments(res.payments);
    setCustomer(res.customer);
    setOrder(res.order);
    setActivities(res.activities);
    if (res.invoice) setPaymentAmount(Number(res.invoice.balance_due));
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) return <LoadingState message="Loading GST tax invoice document..." />;
  if (!invoice) return <ErrorState title="Invoice Not Found" message="The requested commercial tax invoice record could not be found." />;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    const res = await recordPaymentAction(invoice.id, paymentAmount, paymentMethod, referenceNumber, notes);
    setIsSubmitting(false);

    if (!res.success) {
      setActionError(res.error || 'Failed to record payment receipt.');
    } else {
      setIsPaymentModalOpen(false);
      loadData();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action Header Bar (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 border border-outline-variant rounded-xl shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold">{invoice.invoice_number}</h1>
              <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'partially_paid' ? 'gold' : invoice.status === 'overdue' ? 'error' : 'info'}>
                {invoice.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              Customer: {customer?.name || 'Client Account'} • Due: {new Date(invoice.due_date).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" icon="print" onClick={handlePrint}>Print Invoice</Button>
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <Button
              variant="primary"
              size="sm"
              icon="payments"
              onClick={() => {
                setPaymentAmount(Number(invoice.balance_due));
                setIsPaymentModalOpen(true);
              }}
            >
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-sm flex items-center gap-2 font-body-md print:hidden">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{actionError}</span>
        </div>
      )}

      {/* PRINT-READY GST TAX INVOICE DOCUMENT */}
      <div className="bg-surface-container-lowest p-8 border border-outline-variant rounded-xl shadow-sm space-y-6 font-body-md text-on-surface print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-outline-variant pb-6">
          <div>
            <h2 className="font-headline-lg text-2xl font-bold text-primary">HIPA MASALA CRM</h2>
            <p className="text-xs text-on-surface-variant mt-1">Official GST Commercial Tax Invoice</p>
            <p className="text-xs text-on-surface-variant">Plot 42, Spice Industrial Zone, Mumbai, MH</p>
            <p className="text-xs text-on-surface-variant">Email: accounts@hipamasala.com • GSTIN: 27AAAAA0000A1Z5</p>
          </div>

          <div className="text-right">
            <h3 className="text-lg font-bold text-on-surface">TAX INVOICE</h3>
            <p className="text-sm font-semibold text-primary mt-1">{invoice.invoice_number}</p>
            <p className="text-xs text-on-surface-variant mt-1">Issue Date: {new Date(invoice.issue_date).toLocaleDateString('en-IN')}</p>
            <p className="text-xs text-on-surface-variant">Due Date: {new Date(invoice.due_date).toLocaleDateString('en-IN')}</p>
            {order && <p className="text-xs text-on-surface-variant font-semibold">Ref Order: {order.order_number}</p>}
          </div>
        </div>

        {/* Customer & Billing Details */}
        <div className="grid grid-cols-2 gap-6 p-4 bg-surface rounded-xl border border-outline-variant/60">
          <div>
            <span className="text-[10px] font-label-md text-on-surface-variant uppercase block mb-1">Billed To Account</span>
            <p className="font-bold text-on-surface">{customer?.name || 'Client'}</p>
            {customer?.company_name && <p className="text-xs text-on-surface-variant">{customer.company_name}</p>}
            <p className="text-xs text-on-surface-variant mt-1">{customer?.location || 'Address not specified'}</p>
          </div>

          <div className="text-right sm:text-left">
            <span className="text-[10px] font-label-md text-on-surface-variant uppercase block mb-1">Tax &amp; Account Reference</span>
            <p className="text-xs font-semibold text-on-surface">Phone: {customer?.phone || 'N/A'}</p>
            <p className="text-xs text-on-surface-variant">Email: {customer?.email || 'N/A'}</p>
            <p className="text-xs text-on-surface-variant">Code: {customer?.customer_code || 'N/A'}</p>
          </div>
        </div>

        {/* Invoice Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-bright font-label-md uppercase text-on-surface-variant">
                <th className="p-3">#</th>
                <th className="p-3">Product Item &amp; Pack Size</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3 text-right">Unit Price (₹)</th>
                <th className="p-3 text-right">Total Price (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 font-body-sm">
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="p-3 font-semibold">{index + 1}</td>
                  <td className="p-3 font-medium">
                    <div className="font-bold text-on-surface">{item.product_name_snapshot}</div>
                    <div className="text-[11px] text-on-surface-variant">{item.pack_size_snapshot}</div>
                  </td>
                  <td className="p-3 text-right font-semibold">{item.quantity}</td>
                  <td className="p-3 text-right">₹{Number(item.unit_price).toFixed(2)}</td>
                  <td className="p-3 text-right font-bold text-on-surface">₹{Number(item.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Balance Box */}
        <div className="flex justify-end pt-4">
          <div className="w-72 space-y-2 text-xs font-body-md border-t border-outline-variant pt-3">
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal:</span>
              <span className="font-semibold text-on-surface">₹{Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Discount Amount:</span>
              <span className="font-semibold text-on-surface">- ₹{Number(invoice.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>GST Tax Amount:</span>
              <span className="font-semibold text-on-surface">+ ₹{Number(invoice.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t border-outline-variant pt-2 text-sm font-bold text-on-surface">
              <span>Grand Total Billed:</span>
              <span>₹{Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-tertiary-container font-semibold">
              <span>Total Payments Collected:</span>
              <span>₹{Number(invoice.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t border-outline-variant pt-2 text-sm font-bold text-error">
              <span>Balance Due (Receivable):</span>
              <span>₹{Number(invoice.balance_due).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Receipts History Table (Hidden on Print) */}
      <div className="print:hidden">
        <Card title={`Payment Receipts (${payments.length})`} subtitle="Ledger of payment collections applied to this invoice">
          {payments.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-4">No payments collected yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-bright font-label-md uppercase text-on-surface-variant">
                    <th className="p-3">Payment No.</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Reference No.</th>
                    <th className="p-3 text-right">Amount Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40 font-body-sm">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-bold text-primary">{p.payment_number}</td>
                      <td className="p-3 text-on-surface">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3">
                        <Badge variant="gold">{p.payment_method.replace('_', ' ').toUpperCase()}</Badge>
                      </td>
                      <td className="p-3 text-on-surface-variant">{p.reference_number || 'N/A'}</td>
                      <td className="p-3 text-right font-bold text-tertiary-container">
                        ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Audit Activity Log (Hidden on Print) */}
      <div className="print:hidden">
        <Card title="Invoice Audit Log" subtitle="Issue dates & payment history">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">No invoice activities logged.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs font-body-sm pb-3 border-b border-outline-variant/40 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="text-on-surface font-medium">{act.description}</p>
                    <p className="text-on-surface-variant text-[10px] mt-0.5">{new Date(act.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Record Payment Receipt Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Record Payment Receipt for ${invoice.invoice_number}`} maxWidth="md">
        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{actionError}</span>
          </div>
        )}
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-surface rounded-xl border border-outline-variant/60 flex justify-between items-center text-xs">
            <span>Remaining Balance Due:</span>
            <strong className="text-error font-bold text-sm">₹{Number(invoice.balance_due).toLocaleString('en-IN')}</strong>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-label-md uppercase mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                max={Number(invoice.balance_due)}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full border p-2.5 rounded text-sm font-bold text-primary bg-surface-bright"
              />
            </div>

            <div>
              <label className="block text-xs font-label-md uppercase mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-surface border border-outline-variant p-2 rounded text-sm font-body-md"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="upi">UPI / Online</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="card">Credit/Debit Card</option>
              </select>
            </div>
          </div>

          <Input
            label="Transaction / Reference Number"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. NEFT-9988776655 or Cheque #001234"
          />

          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Payment Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received partial advance payment via HDFC Bank"
              className="w-full border p-2 rounded text-xs bg-surface-bright"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} icon="payments">
              Confirm Payment Receipt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
