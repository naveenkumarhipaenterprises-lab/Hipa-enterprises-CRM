'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { getQuotationById, updateQuotationStatusAction } from '@/lib/actions/quotation.actions';
import { createOrderFromQuotationAction } from '@/lib/actions/order.actions';
import { QuotationRow, QuotationItemRow, CustomerRow, ActivityRow } from '@/types/database';
import Link from 'next/link';

export default function QuotationDetailPage({ params }: { params: { id: string } }) {
  const [quotation, setQuotation] = useState<QuotationRow | null>(null);
  const [items, setItems] = useState<QuotationItemRow[]>([]);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await getQuotationById(params.id);
    setQuotation(res.quotation);
    setItems(res.items);
    setCustomer(res.customer);
    setActivities(res.activities);
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) return <LoadingState message="Loading commercial quotation document..." />;
  if (!quotation) return <ErrorState title="Quotation Not Found" message="The requested price proposal record could not be found." />;

  const handleStatusChange = async (newStatus: string) => {
    setIsSubmitting(true);
    setActionError(null);
    const res = await updateQuotationStatusAction(quotation.id, newStatus);
    setIsSubmitting(false);

    if (!res.success) {
      setActionError(res.error || 'Failed to update quotation status.');
    } else {
      loadData();
    }
  };

  const handleCreateOrder = async () => {
    setIsSubmitting(true);
    setActionError(null);
    const res = await createOrderFromQuotationAction(quotation.id);
    setIsSubmitting(false);

    if (!res.success) {
      setActionError(res.error || 'Failed to create order.');
    } else {
      window.location.href = `/orders/${res.orderId}`;
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
          <Link href="/quotations">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold">{quotation.quotation_number}</h1>
              <Badge variant={quotation.status === 'accepted' ? 'success' : quotation.status === 'rejected' ? 'error' : 'info'}>
                {quotation.status.toUpperCase()}
              </Badge>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              Issued for: {customer?.name || 'Client Account'} • Valid until: {new Date(quotation.valid_until).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" icon="print" onClick={handlePrint}>Print / PDF</Button>
          {quotation.status === 'draft' && (
            <Button variant="primary" size="sm" icon="send" isLoading={isSubmitting} onClick={() => handleStatusChange('sent')}>
              Mark Sent
            </Button>
          )}
          {quotation.status === 'sent' && (
            <>
              <Button variant="primary" size="sm" icon="check_circle" isLoading={isSubmitting} onClick={() => handleStatusChange('accepted')}>
                Mark Accepted
              </Button>
              <Button variant="danger" size="sm" icon="cancel" isLoading={isSubmitting} onClick={() => handleStatusChange('rejected')}>
                Mark Rejected
              </Button>
            </>
          )}
          {quotation.status === 'accepted' && (
            <Button variant="primary" size="sm" icon="add_shopping_cart" isLoading={isSubmitting} onClick={handleCreateOrder}>
              Convert to Order
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

      {/* PRINT-READY COMMERCIAL QUOTATION DOCUMENT */}
      <div className="bg-surface-container-lowest p-8 border border-outline-variant rounded-xl shadow-sm space-y-6 font-body-md text-on-surface print:border-none print:shadow-none print:p-0">
        <div className="flex justify-between items-start border-b border-outline-variant pb-6">
          <div>
            <h2 className="font-headline-lg text-2xl font-bold text-primary">HIPA MASALA CRM</h2>
            <p className="text-xs text-on-surface-variant mt-1">Premium Wholesale Spices &amp; Seasonings</p>
            <p className="text-xs text-on-surface-variant">Plot 42, Spice Industrial Zone, Mumbai, MH</p>
            <p className="text-xs text-on-surface-variant">Email: orders@hipamasala.com • GSTIN: 27AAAAA0000A1Z5</p>
          </div>

          <div className="text-right">
            <h3 className="text-lg font-bold text-on-surface">COMMERCIAL QUOTATION</h3>
            <p className="text-sm font-semibold text-primary mt-1">{quotation.quotation_number}</p>
            <p className="text-xs text-on-surface-variant mt-1">Date: {new Date(quotation.created_at).toLocaleDateString('en-IN')}</p>
            <p className="text-xs text-on-surface-variant">Valid Until: {new Date(quotation.valid_until).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 p-4 bg-surface rounded-xl border border-outline-variant/60">
          <div>
            <span className="text-[10px] font-label-md text-on-surface-variant uppercase block mb-1">Quotation Prepared For</span>
            <p className="font-bold text-on-surface">{customer?.name || 'Client'}</p>
            {customer?.company_name && <p className="text-xs text-on-surface-variant">{customer.company_name}</p>}
            <p className="text-xs text-on-surface-variant mt-1">{customer?.location || 'Address not specified'}</p>
          </div>

          <div className="text-right sm:text-left">
            <span className="text-[10px] font-label-md text-on-surface-variant uppercase block mb-1">Contact Reference</span>
            <p className="text-xs font-semibold text-on-surface">Phone: {customer?.phone || 'N/A'}</p>
            <p className="text-xs text-on-surface-variant">Email: {customer?.email || 'N/A'}</p>
            <p className="text-xs text-on-surface-variant">Code: {customer?.customer_code || 'N/A'}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-bright font-label-md uppercase text-on-surface-variant">
                <th className="p-3">#</th>
                <th className="p-3">Item &amp; Pack Size</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Unit Price (₹)</th>
                <th className="p-3 text-right">Discount (%)</th>
                <th className="p-3 text-right">GST (%)</th>
                <th className="p-3 text-right">Total (₹)</th>
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
                  <td className="p-3 text-right">{item.discount_percent}%</td>
                  <td className="p-3 text-right">{item.tax_percent}%</td>
                  <td className="p-3 text-right font-bold text-on-surface">₹{Number(item.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4">
          <div className="w-64 space-y-2 text-xs font-body-md border-t border-outline-variant pt-3">
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal:</span>
              <span className="font-semibold text-on-surface">₹{Number(quotation.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Discount Amount:</span>
              <span className="font-semibold text-on-surface">- ₹{Number(quotation.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>GST Tax Amount:</span>
              <span className="font-semibold text-on-surface">+ ₹{Number(quotation.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t border-outline-variant pt-2 text-sm font-bold text-primary">
              <span>Grand Total (INR):</span>
              <span>₹{Number(quotation.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-surface rounded-xl border border-outline-variant/60 text-xs space-y-2">
          <span className="font-label-md text-[10px] uppercase text-on-surface-variant block font-bold">Commercial Terms &amp; Conditions</span>
          <p className="text-on-surface font-body-sm whitespace-pre-wrap">{quotation.terms || 'Payment 50% advance, balance on dispatch.'}</p>
        </div>
      </div>

      <div className="print:hidden">
        <Card title="Quotation Activity Log" subtitle="Status changes & document events">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">No quotation activities logged.</p>
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
    </div>
  );
}
