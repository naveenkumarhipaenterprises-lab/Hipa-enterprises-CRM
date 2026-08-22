'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { getSuppliers, createSupplierAction } from '@/lib/actions/supplier.actions';
import { SupplierRow } from '@/types/database';
import Link from 'next/link';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSuppliersData = useCallback(async () => {
    setIsLoading(true);
    const res = await getSuppliers({
      search,
      isActive: statusFilter,
      page: currentPage,
      limit: 10,
    });
    setSuppliers(res.suppliers);
    setTotalPages(res.totalPages);
    setTotalEntries(res.totalEntries);
    setIsLoading(false);
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    fetchSuppliersData();
  }, [fetchSuppliersData]);

  const handleCreateSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createSupplierAction(formData);

    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to register supplier.');
    } else {
      setIsAddModalOpen(false);
      fetchSuppliersData();
    }
  };

  const columns: Column<SupplierRow>[] = [
    {
      header: 'Supplier Code / Name',
      cell: (row) => (
        <div>
          <span className="font-bold text-primary text-sm block">{row.name}</span>
          <div className="text-xs text-on-surface-variant font-label-md">
            Code: {row.supplier_code} • Contact: {row.contact_person || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Phone & Email',
      cell: (row) => (
        <div className="flex flex-col text-xs font-body-sm text-on-surface">
          <span className="font-semibold">{row.phone}</span>
          <span className="text-on-surface-variant">{row.email || 'No Email'}</span>
        </div>
      ),
    },
    {
      header: 'GSTIN',
      cell: (row) => <span className="text-xs font-label-md text-on-surface">{row.gstin || 'Unregistered'}</span>,
    },
    {
      header: 'Payment Terms',
      cell: (row) => <Badge variant="gold">{row.payment_terms || 'Net 30'}</Badge>,
    },
    {
      header: 'Status',
      cell: (row) => <Badge variant={row.is_active ? 'success' : 'neutral'}>{row.is_active ? 'ACTIVE VENDOR' : 'INACTIVE'}</Badge>,
      align: 'center',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Supplier &amp; Vendor Management</h2>
          <p className="font-body-md text-on-surface-variant font-medium">Manage spice farmers, raw material suppliers, GSTIN numbers, and procurement payment terms.</p>
        </div>
        <Button variant="primary" icon="add" onClick={() => setIsAddModalOpen(true)}>
          Register Supplier
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Registered Suppliers</span>
          <div className="font-headline-lg text-2xl font-bold text-on-surface mt-1">{totalEntries} Vendors</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Active Suppliers</span>
          <div className="font-headline-lg text-2xl font-bold text-tertiary-container mt-1">
            {suppliers.filter((s) => s.is_active).length} Active
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Standard Terms</span>
          <div className="font-headline-lg text-2xl font-bold text-primary mt-1">Net 30 Days</div>
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
              placeholder="Search supplier name, code, contact person..."
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
            <option value="active">Active Vendors</option>
            <option value="inactive">Inactive Vendors</option>
          </select>
        </div>
      </div>

      {/* Table / Loading / Empty */}
      {isLoading ? (
        <LoadingState message="Fetching supplier database..." />
      ) : suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers found"
          description="There are no spice suppliers or vendors matching your filter parameters."
          actionLabel="Register Supplier"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={suppliers}
          keyExtractor={(row) => row.id}
          totalEntries={totalEntries}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Register Supplier Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Spice Supplier / Vendor" maxWidth="lg">
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <Input label="Supplier / Business Name *" name="name" required placeholder="e.g. Kerala Spice Farmers Co-op" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Person" name="contactPerson" placeholder="e.g. Mathew Varghese" />
            <Input label="Phone Number *" name="phone" required placeholder="+91 98470 11223" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Email Address" name="email" placeholder="vendor@spices.coop" />
            <Input label="GSTIN Number" name="gstin" placeholder="32AAACK1234F1Z9" />
          </div>

          <Input label="Payment Terms" name="paymentTerms" defaultValue="Net 30 days" placeholder="e.g. Net 30 days or 50% advance" />
          <Input label="Address / Spice Processing Yard" name="address" placeholder="Spices Park, Idukki, Kerala" />

          <div>
            <label className="block font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
              Vendor Notes &amp; Terms
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Enter organic certifications or spice origin notes..."
              className="w-full bg-surface-bright border border-outline-variant rounded-md p-3 text-sm font-body-md text-on-surface"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} icon="save">Register Vendor</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
