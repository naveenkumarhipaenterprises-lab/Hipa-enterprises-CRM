'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { getOrderById, updateOrderStatusAction } from '@/lib/actions/order.actions';
import { createInvoiceFromOrderAction } from '@/lib/actions/invoice.actions';
import { OrderRow, OrderItemRow, CustomerRow, QuotationRow, ActivityRow } from '@/types/database';
import Link from 'next/link';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [quotation, setQuotation] = useState<QuotationRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await getOrderById(params.id);
    setOrder(res.order);
    setItems(res.items);
    setCustomer(res.customer);
    setQuotation(res.quotation);
    setActivities(res.activities);
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) return <LoadingState message="Loading purchase order document..." />;
  if (!order) return <ErrorState title="Order Not Found" message="The requested commercial purchase order record could not be found." />;

  const handleDeliveryStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDelivery = e.target.value;
    setIsSubmitting(true);
    setActionError(null);
    const res = await updateOrderStatusAction(order.id, newDelivery, undefined);
    setIsSubmitting(false);

    if (!res.success) setActionError(res.error || 'Failed to update delivery status.');
    else loadData();
  };

  const handlePaymentStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPayment = e.target.value;
    setIsSubmitting(true);
    setActionError(null);
    const res = await updateOrderStatusAction(order.id, undefined, newPayment);
    setIsSubmitting(false);

    if (!res.success) setActionError(res.error || 'Failed to update payment status.');
    else loadData();
  };

  const handleGenerateInvoice = async () => {
    setIsSubmitting(true);
    setActionError(null);
    const res = await createInvoiceFromOrderAction(order.id);
    setIsSubmitting(false);

    if (!res.success) {
      setActionError(res.error || 'Failed to generate invoice.');
    } else {
      window.location.href = `/invoices/${res.invoiceId}`;
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
          <Link href="/orders">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold">{order.order_number}</h1>
              <Badge variant={order.delivery_status === 'delivered' ? 'success' : order.delivery_status === 'dispatched' ? 'maroon' : 'gold'}>
                {order.delivery_status.toUpperCase()}
              </Badge>
              <Badge variant={order.payment_status === 'paid' ? 'success' : 'neutral'}>
                PAYMENT: {order.payment_status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              Customer: {customer?.name || 'Client Account'} • Order Date: {new Date(order.order_date).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" icon="print" onClick={handlePrint}>Print Invoice</Button>
          <Button variant="primary" size="sm" icon="receipt_long" isLoading={isSubmitting} onClick={handleGenerateInvoice}>
            Generate Tax Invoice
          </Button>
          <div className="flex items-center gap-1 bg-surface p-1 rounded border border-outline-variant">
            <span className="text-[10px] font-label-md uppercase px-1">Delivery:</span>
            <select
              value={order.delivery_status}
              onChange={handleDeliveryStatusChange}
              disabled={isSubmitting}
              className="bg-transparent text-xs font-semibold text-primary focus:outline-none"
            >
              <option value="pending">PENDING</option>
              <option value="confirmed">CONFIRMED</option>
              <option value="processing">PROCESSING</option>
              <option value="dispatched">DISPATCHED</option>
              <option value="delivered">DELIVERED</option>
              <option value="cancelled">CANCELLED</option>
            </select>
          </div>
          <div className="flex items-center gap-1 bg-surface p-1 rounded border border-outline-variant">
            <span className="text-[10px] font-label-md uppercase px-1">Payment:</span>
            <select
              value={order.payment_status}
              onChange={handlePaymentStatusChange}
              disabled={isSubmitting}
              className="bg-transparent text-xs font-semibold text-primary focus:outline-none"
            >
              <option value="pending">UNPAID</option>
              <option value="partially_paid">PARTIAL</option>
              <option value="paid">PAID</option>
            </select>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-sm flex items-center gap-2 font-body-md print:hidden">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{actionError}</span>
        </div>
      )}

      {/* PRINT-READY COMMERCIAL ORDER DOCUMENT */}
      <div className="bg-surface-container-lowest p-8 border border-outline-variant rounded-xl shadow-sm space-y-6 font-body-md text-on-surface print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-outline-variant pb-6">
          <div>
            <h2 className="font-headline-lg text-2xl font-bold text-primary">HIPA MASALA CRM</h2>
            <p className="text-xs text-on-surface-variant mt-1">Commercial Spice Order Dispatch Manifest</p>
            <p className="text-xs text-on-surface-variant">Plot 42, Spice Industrial Zone, Mumbai, MH</p>
            <p className="text-xs text-on-surface-variant">GSTIN: 27AAAAA0000A1Z5</p>
          </div>

          <div className="text-right">
            <h3 className="text-lg font-bold text-on-surface">PURCHASE ORDER</h3>
            <p className="text-sm font-semibold text-primary mt-1">{order.order_number}</p>
            <p className="text-xs text-on-surface-variant mt-1">Order Date: {new Date(order.order_date).toLocaleDateString('en-IN')}</p>
            {quotation && <p className="text-xs text-on-surface-variant font-semibold">Ref Quote: {quotation.quotation_number}</p>}
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-2 gap-6 p-4 bg-surface rounded-xl border border-outline-variant/60">
          <div>
            <span className="text-[10px] font-label-md text-on-surface-variant uppercase block mb-1">Billed &amp; Dispatched To</span>
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

        {/* Order Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-bright font-label-md uppercase text-on-surface-variant">
                <th className="p-3">#</th>
                <th className="p-3">Item &amp; Pack Size</th>
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

        {/* Financial Summary Box */}
        <div className="flex justify-end pt-4">
          <div className="w-64 space-y-2 text-xs font-body-md border-t border-outline-variant pt-3">
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal:</span>
              <span className="font-semibold text-on-surface">₹{Number(order.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Discount Amount:</span>
              <span className="font-semibold text-on-surface">- ₹{Number(order.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>GST Tax Amount:</span>
              <span className="font-semibold text-on-surface">+ ₹{Number(order.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t border-outline-variant pt-2 text-sm font-bold text-primary">
              <span>Grand Total Payable:</span>
              <span>₹{Number(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="p-4 bg-surface rounded-xl border border-outline-variant/60 text-xs space-y-1">
            <span className="font-label-md text-[10px] uppercase text-on-surface-variant block font-bold">Order Dispatch Notes</span>
            <p className="text-on-surface font-body-sm whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Audit Activity Log (Hidden on Print) */}
      <div className="print:hidden">
        <Card title="Order Audit Activity Log" subtitle="Dispatch updates & order history">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">No order activities logged.</p>
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
