'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { getOrders, createOrderFromQuotationAction } from '@/lib/actions/order.actions';
import { getQuotations } from '@/lib/actions/quotation.actions';
import { getActiveEmployees } from '@/lib/actions/lead.actions';
import { OrderRow, QuotationRow, UserProfile } from '@/types/database';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [stats, setStats] = useState({ totalValue: 0, deliveredValue: 0, pendingValue: 0 });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [acceptedQuotations, setAcceptedQuotations] = useState<QuotationRow[]>([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchOrdersData = useCallback(async () => {
    setIsLoading(true);
    const res = await getOrders({
      search,
      deliveryStatus: deliveryFilter,
      paymentStatus: paymentFilter,
      assignedTo: assignedFilter,
      page: currentPage,
      limit: 10,
    });
    setOrders(res.orders);
    setTotalPages(res.totalPages);
    setTotalEntries(res.totalEntries);
    setStats(res.stats);
    setIsLoading(false);
  }, [search, deliveryFilter, paymentFilter, assignedFilter, currentPage]);

  useEffect(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);

  useEffect(() => {
    getActiveEmployees().then(setEmployees);
    getQuotations({ status: 'accepted' }).then((res) => setAcceptedQuotations(res.quotations));
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotationId) {
      setFormError('Please select an accepted quotation.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const res = await createOrderFromQuotationAction(selectedQuotationId);
    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to create order.');
    } else {
      setIsAddModalOpen(false);
      fetchOrdersData();
      if (res.orderId) {
        window.location.href = `/orders/${res.orderId}`;
      }
    }
  };

  const columns: Column<OrderRow>[] = [
    {
      header: 'Order Number',
      cell: (row) => (
        <div>
          <Link href={`/orders/${row.id}`} className="font-semibold text-primary hover:underline block">
            {row.order_number}
          </Link>
          <span className="text-[11px] text-on-surface-variant font-label-md">
            Date: {new Date(row.order_date).toLocaleDateString('en-IN')}
          </span>
        </div>
      ),
    },
    {
      header: 'Order Value',
      cell: (row) => (
        <span className="font-bold text-on-surface">
          ₹{Number(row.total_amount || 0).toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Delivery Status',
      cell: (row) => {
        const variants: Record<string, 'gold' | 'info' | 'success' | 'maroon' | 'error' | 'neutral'> = {
          pending: 'gold',
          confirmed: 'info',
          processing: 'info',
          dispatched: 'maroon',
          delivered: 'success',
          cancelled: 'error',
        };
        return <Badge variant={variants[row.delivery_status] || 'neutral'}>{row.delivery_status.toUpperCase()}</Badge>;
      },
      align: 'center',
    },
    {
      header: 'Payment Status',
      cell: (row) => (
        <Badge variant={row.payment_status === 'paid' ? 'success' : row.payment_status === 'partially_paid' ? 'gold' : 'neutral'}>
          {row.payment_status.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
      align: 'center',
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/orders/${row.id}`}>
            <button className="p-1.5 text-on-surface-variant hover:text-primary rounded transition-colors" title="View Order Document">
              <span className="material-symbols-outlined text-[18px]">visibility</span>
            </button>
          </Link>
        </div>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Purchase Orders</h2>
          <p className="font-body-md text-on-surface-variant">Track confirmed commercial purchase orders, delivery statuses, and billing.</p>
        </div>
        <Button variant="primary" icon="add_shopping_cart" onClick={() => setIsAddModalOpen(true)}>
          Create Order
        </Button>
      </div>

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase">Total Sales Volume</span>
          <div className="font-headline-lg text-2xl font-bold text-on-surface mt-1">
            ₹{stats.totalValue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase">Delivered Orders Value</span>
          <div className="font-headline-lg text-2xl font-bold text-tertiary-container mt-1">
            ₹{stats.deliveredValue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase">Pending Dispatch Value</span>
          <div className="font-headline-lg text-2xl font-bold text-primary mt-1">
            ₹{stats.pendingValue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search order number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-md text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={deliveryFilter}
            onChange={(e) => {
              setDeliveryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Delivery: All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Payment: All</option>
            <option value="pending">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Table / Loading / Empty */}
      {isLoading ? (
        <LoadingState message="Fetching orders database..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No purchase orders found"
          description="There are no commercial purchase orders matching your filter criteria."
          actionLabel="Create Order"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          keyExtractor={(row) => row.id}
          totalEntries={totalEntries}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Create Order from Accepted Quotation Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Convert Accepted Quotation to Purchase Order" maxWidth="md">
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Select Accepted Quotation *</label>
            <select
              value={selectedQuotationId}
              onChange={(e) => setSelectedQuotationId(e.target.value)}
              required
              className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm font-body-md"
            >
              <option value="">Choose Quotation...</option>
              {acceptedQuotations.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.quotation_number} - ₹{Number(q.total_amount).toLocaleString('en-IN')} (Accepted)
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-on-surface-variant">
            Converting an accepted quotation copies all line item price snapshots, calculates commercial tax/discounts, updates the customer's total revenue metric, and issues a confirmed purchase order (`HIPA-ORD-2026-xxxx`).
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} icon="add_shopping_cart">
              Confirm Order Creation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
