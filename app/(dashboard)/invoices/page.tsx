'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { getInvoices, createInvoiceFromOrderAction } from '@/lib/actions/invoice.actions';
import { getOrders } from '@/lib/actions/order.actions';
import { InvoiceRow, OrderRow } from '@/types/database';
import Link from 'next/link';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [stats, setStats] = useState({ totalInvoiced: 0, totalCollected: 0, outstandingBalance: 0 });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmedOrders, setConfirmedOrders] = useState<OrderRow[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchInvoicesData = useCallback(async () => {
    setIsLoading(true);
    const res = await getInvoices({
      search,
      status: statusFilter,
      page: currentPage,
      limit: 10,
    });
    setInvoices(res.invoices);
    setTotalPages(res.totalPages);
    setTotalEntries(res.totalEntries);
    setStats(res.stats);
    setIsLoading(false);
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    fetchInvoicesData();
  }, [fetchInvoicesData]);

  useEffect(() => {
    getOrders().then((res) => setConfirmedOrders(res.orders));
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setFormError('Please select a purchase order.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    const res = await createInvoiceFromOrderAction(selectedOrderId);
    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to generate invoice.');
    } else {
      setIsAddModalOpen(false);
      fetchInvoicesData();
      if (res.invoiceId) {
        window.location.href = `/invoices/${res.invoiceId}`;
      }
    }
  };

  const columns: Column<InvoiceRow>[] = [
    {
      header: 'Invoice Number',
      cell: (row) => (
        <div>
          <Link href={`/invoices/${row.id}`} className="font-semibold text-primary hover:underline block">
            {row.invoice_number}
          </Link>
          <span className="text-[11px] text-on-surface-variant font-label-md">
            Issued: {new Date(row.issue_date).toLocaleDateString('en-IN')} • Due: {new Date(row.due_date).toLocaleDateString('en-IN')}
          </span>
        </div>
      ),
    },
    {
      header: 'Grand Total',
      cell: (row) => (
        <span className="font-bold text-on-surface">
          ₹{Number(row.total_amount || 0).toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Amount Paid',
      cell: (row) => (
        <span className="font-bold text-tertiary-container">
          ₹{Number(row.amount_paid || 0).toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Balance Due',
      cell: (row) => (
        <span className={`font-bold ${Number(row.balance_due) > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
          ₹{Number(row.balance_due || 0).toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Status',
      cell: (row) => {
        const variants: Record<string, 'gold' | 'info' | 'success' | 'maroon' | 'error' | 'neutral'> = {
          draft: 'neutral',
          issued: 'info',
          partially_paid: 'gold',
          paid: 'success',
          overdue: 'error',
          cancelled: 'maroon',
        };
        return <Badge variant={variants[row.status] || 'neutral'}>{row.status.replace('_', ' ').toUpperCase()}</Badge>;
      },
      align: 'center',
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/invoices/${row.id}`}>
            <button className="p-1.5 text-on-surface-variant hover:text-primary rounded transition-colors" title="View Print Invoice">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
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
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Commercial Invoices &amp; Payments</h2>
          <p className="font-body-md text-on-surface-variant font-medium">Generate GST tax invoices, record payment receipts, and track accounts receivable balances.</p>
        </div>
        <Button variant="primary" icon="receipt_long" onClick={() => setIsAddModalOpen(true)}>
          Generate Invoice
        </Button>
      </div>

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Total Billed Revenue</span>
          <div className="font-headline-lg text-2xl font-bold text-on-surface mt-1">
            ₹{stats.totalInvoiced.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Total Payments Collected</span>
          <div className="font-headline-lg text-2xl font-bold text-tertiary-container mt-1">
            ₹{stats.totalCollected.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Outstanding Accounts Receivable</span>
          <div className="font-headline-lg text-2xl font-bold text-error mt-1">
            ₹{stats.outstandingBalance.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-3 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search invoice number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-md text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Status: All</option>
            <option value="issued">Issued</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Fully Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table / Loading / Empty */}
      {isLoading ? (
        <LoadingState message="Fetching commercial invoices database..." />
      ) : invoices.length === 0 ? (
        <EmptyState
          title="No commercial invoices found"
          description="There are no tax invoices matching your filter parameters."
          actionLabel="Generate Invoice"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={invoices}
          keyExtractor={(row) => row.id}
          totalEntries={totalEntries}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Generate Invoice Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Generate Tax Invoice from Order" maxWidth="md">
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Select Purchase Order *</label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              required
              className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm font-body-md"
            >
              <option value="">Choose Order...</option>
              {confirmedOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_number} - ₹{Number(o.total_amount).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-on-surface-variant">
            Converting a purchase order copies all line items and line-item pricing snapshots, calculates GST taxes, and generates a formal Tax Invoice (`HIPA-INV-2026-xxxx`).
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} icon="receipt_long">
              Generate Tax Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
