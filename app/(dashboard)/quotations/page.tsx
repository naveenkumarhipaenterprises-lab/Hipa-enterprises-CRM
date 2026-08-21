'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getQuotations,
  createQuotationAction,
  getProductsForQuotation,
  CreateQuotationItemInput,
} from '@/lib/actions/quotation.actions';
import { getCustomers } from '@/lib/actions/customer.actions';
import { getActiveEmployees } from '@/lib/actions/lead.actions';
import { QuotationRow, CustomerRow, ProductRow, ProductVariantRow, UserProfile } from '@/types/database';
import Link from 'next/link';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [stats, setStats] = useState({ totalValue: 0, sentValue: 0, acceptedValue: 0 });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [variants, setVariants] = useState<ProductVariantRow[]>([]);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0]
  );
  const [terms, setTerms] = useState('Payment 50% advance, 50% on delivery. Prices inclusive of 5% GST.');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CreateQuotationItemInput[]>([
    {
      productId: '',
      variantId: '',
      productName: 'HIPA Pure Turmeric Powder',
      packSize: '500g pouch',
      quantity: 100,
      unitPrice: 120.0,
      discountPercent: 5.0,
      taxPercent: 5.0,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchQuotationsData = useCallback(async () => {
    setIsLoading(true);
    const res = await getQuotations({
      search,
      status: statusFilter,
      assignedTo: assignedFilter,
      page: currentPage,
      limit: 10,
    });
    setQuotations(res.quotations);
    setTotalPages(res.totalPages);
    setTotalEntries(res.totalEntries);
    setStats(res.stats);
    setIsLoading(false);
  }, [search, statusFilter, assignedFilter, currentPage]);

  useEffect(() => {
    fetchQuotationsData();
  }, [fetchQuotationsData]);

  useEffect(() => {
    getActiveEmployees().then(setEmployees);
    getCustomers().then((res) => setCustomers(res.customers));
    getProductsForQuotation().then((res) => {
      setProducts(res.products);
      setVariants(res.variants);
    });
  }, []);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: '',
        variantId: '',
        productName: 'HIPA Product Item',
        packSize: '100g pack',
        quantity: 50,
        unitPrice: 65.0,
        discountPercent: 0,
        taxPercent: 5.0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CreateQuotationItemInput, value: unknown) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setFormError('Please select a target Customer profile.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    const res = await createQuotationAction(selectedCustomerId, validUntil, items, terms, notes);
    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to create quotation.');
    } else {
      setIsAddModalOpen(false);
      fetchQuotationsData();
      if (res.quotationId) {
        window.location.href = `/quotations/${res.quotationId}`;
      }
    }
  };

  const columns: Column<QuotationRow>[] = [
    {
      header: 'Quotation No.',
      cell: (row) => (
        <div>
          <Link href={`/quotations/${row.id}`} className="font-semibold text-primary hover:underline block">
            {row.quotation_number}
          </Link>
          <span className="text-[11px] text-on-surface-variant font-label-md">
            Valid until {new Date(row.valid_until).toLocaleDateString('en-IN')}
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
      header: 'Subtotal & Tax',
      cell: (row) => (
        <div className="flex flex-col text-xs text-on-surface-variant font-body-sm text-right">
          <span>Subtotal: ₹{Number(row.subtotal || 0).toLocaleString('en-IN')}</span>
          <span>Tax: ₹{Number(row.tax_amount || 0).toLocaleString('en-IN')}</span>
        </div>
      ),
      align: 'right',
    },
    {
      header: 'Status',
      cell: (row) => {
        const variants: Record<string, 'gold' | 'info' | 'success' | 'maroon' | 'error' | 'neutral'> = {
          draft: 'neutral',
          sent: 'info',
          viewed: 'gold',
          accepted: 'success',
          rejected: 'error',
          expired: 'maroon',
        };
        return <Badge variant={variants[row.status] || 'neutral'}>{row.status.toUpperCase()}</Badge>;
      },
      align: 'center',
    },
    {
      header: 'Created Date',
      cell: (row) => <span className="text-xs font-label-md text-on-surface">{new Date(row.created_at).toLocaleDateString('en-IN')}</span>,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/quotations/${row.id}`}>
            <button className="p-1.5 text-on-surface-variant hover:text-primary rounded transition-colors" title="View Print Document">
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
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Price Quotations</h2>
          <p className="font-body-md text-on-surface-variant">Issue formal price proposals, line item proposals, and commercial terms.</p>
        </div>
        <Button variant="primary" icon="add" onClick={() => setIsAddModalOpen(true)}>
          Create Quotation
        </Button>
      </div>

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase">Total Quotations Value</span>
          <div className="font-headline-lg text-2xl font-bold text-on-surface mt-1">
            ₹{stats.totalValue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase">Pending Sent Value</span>
          <div className="font-headline-lg text-2xl font-bold text-primary mt-1">
            ₹{stats.sentValue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase">Accepted Quotes Value</span>
          <div className="font-headline-lg text-2xl font-bold text-tertiary-container mt-1">
            ₹{stats.acceptedValue.toLocaleString('en-IN')}
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
              placeholder="Search quotation number..."
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
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={assignedFilter}
            onChange={(e) => {
              setAssignedFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Executive: All</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table / Loading / Empty */}
      {isLoading ? (
        <LoadingState message="Fetching quotations database..." />
      ) : quotations.length === 0 ? (
        <EmptyState
          title="No price quotations found"
          description="There are no commercial quotations matching your filter criteria."
          actionLabel="Create Quotation"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={quotations}
          keyExtractor={(row) => row.id}
          totalEntries={totalEntries}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Create Quotation Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Generate Commercial Quotation" maxWidth="xl">
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-label-md uppercase mb-1">Target Customer Profile *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full bg-surface border border-outline-variant p-2 rounded text-sm font-body-md"
              >
                <option value="">Select Customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company_name || 'Individual'}) - {c.customer_code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-label-md uppercase mb-1">Valid Until Date *</label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full border p-2 rounded text-sm bg-surface-bright"
              />
            </div>
          </div>

          {/* Line Items Table Builder */}
          <div className="space-y-2 pt-2 border-t border-outline-variant">
            <div className="flex justify-between items-center">
              <span className="font-label-md text-xs uppercase font-bold text-primary">Line Items &amp; Spice Products</span>
              <Button variant="outline" size="sm" type="button" icon="add" onClick={handleAddItem}>
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="p-3 bg-surface border border-outline-variant rounded-lg space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-label-md uppercase">Product Name Snapshot</label>
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                      className="w-full border p-1.5 rounded text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-label-md uppercase">Pack Size</label>
                    <input
                      type="text"
                      value={item.packSize}
                      onChange={(e) => handleItemChange(index, 'packSize', e.target.value)}
                      className="w-full border p-1.5 rounded text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-label-md uppercase">Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full border p-1.5 rounded text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-[10px] font-label-md uppercase">Unit Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full border p-1.5 rounded text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-label-md uppercase">Discount (%)</label>
                    <input
                      type="number"
                      value={item.discountPercent}
                      onChange={(e) => handleItemChange(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                      className="w-full border p-1.5 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-label-md uppercase">GST Tax (%)</label>
                    <input
                      type="number"
                      value={item.taxPercent}
                      onChange={(e) => handleItemChange(index, 'taxPercent', parseFloat(e.target.value) || 0)}
                      className="w-full border p-1.5 rounded text-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-error text-xs hover:underline p-1"
                      >
                        Remove Item
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Commercial Terms &amp; Conditions</label>
            <textarea
              rows={2}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full border p-2 rounded text-xs bg-surface-bright"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} icon="request_quote">
              Generate Quotation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
