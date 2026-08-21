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
import { getEnquiries, createEnquiryAction } from '@/lib/actions/enquiry.actions';
import { getActiveEmployees } from '@/lib/actions/lead.actions';
import { EnquiryRow, UserProfile } from '@/types/database';
import Link from 'next/link';

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchEnquiriesData = useCallback(async () => {
    setIsLoading(true);
    const res = await getEnquiries({
      search,
      status: statusFilter,
      priority: priorityFilter,
      assignedTo: assignedFilter,
      page: currentPage,
      limit: 10,
    });
    setEnquiries(res.enquiries);
    setTotalPages(res.totalPages);
    setTotalEntries(res.totalEntries);
    setIsLoading(false);
  }, [search, statusFilter, priorityFilter, assignedFilter, currentPage]);

  useEffect(() => {
    fetchEnquiriesData();
  }, [fetchEnquiriesData]);

  useEffect(() => {
    getActiveEmployees().then(setEmployees);
  }, []);

  const handleAddEnquiry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createEnquiryAction(formData);

    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to create enquiry.');
    } else {
      setIsAddModalOpen(false);
      fetchEnquiriesData();
      if (res.enquiryId) {
        window.location.href = `/enquiries/${res.enquiryId}`;
      }
    }
  };

  const columns: Column<EnquiryRow>[] = [
    {
      header: 'Enquiry Code / Contact',
      cell: (row) => (
        <div>
          <Link href={`/enquiries/${row.id}`} className="font-semibold text-primary hover:underline">
            {row.enquiry_code}
          </Link>
          <div className="text-xs text-on-surface-variant font-body-sm">{row.contact_person}</div>
        </div>
      ),
    },
    {
      header: 'Product Requirement',
      cell: (row) => (
        <div>
          <span className="font-semibold text-on-surface text-xs">{row.product_category}</span>
          <div className="text-[11px] text-on-surface-variant font-label-md">Qty: {row.expected_quantity}</div>
        </div>
      ),
    },
    {
      header: 'Priority',
      cell: (row) => {
        const variants: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = {
          urgent: 'error',
          high: 'warning',
          medium: 'info',
          low: 'neutral',
        };
        return <Badge variant={variants[row.priority] || 'neutral'}>{row.priority.toUpperCase()}</Badge>;
      },
      align: 'center',
    },
    {
      header: 'Status',
      cell: (row) => {
        const variants: Record<string, 'gold' | 'info' | 'success' | 'maroon' | 'error' | 'neutral'> = {
          new: 'gold',
          assigned: 'info',
          contacted: 'info',
          quotation_sent: 'maroon',
          negotiation: 'gold',
          converted: 'success',
          closed: 'neutral',
          lost: 'error',
        };
        return <Badge variant={variants[row.status] || 'neutral'}>{row.status.replace('_', ' ').toUpperCase()}</Badge>;
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
          <Link href={`/enquiries/${row.id}`}>
            <button className="p-1.5 text-on-surface-variant hover:text-primary rounded transition-colors" title="View Details">
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Business Enquiries</h2>
          <p className="font-body-md text-on-surface-variant">Track product requirements and wholesale pricing requests.</p>
        </div>
        <Button variant="primary" icon="add" onClick={() => setIsAddModalOpen(true)}>
          Log Enquiry
        </Button>
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
              placeholder="Search contact person, product, code..."
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
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="contacted">Contacted</option>
            <option value="quotation_sent">Quotation Sent</option>
            <option value="negotiation">Negotiation</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Priority: All</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Table / Loading / Empty */}
      {isLoading ? (
        <LoadingState message="Fetching enquiries database..." />
      ) : enquiries.length === 0 ? (
        <EmptyState
          title="No business enquiries found"
          description="There are no active product enquiries matching your filter parameters."
          actionLabel="Log New Enquiry"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={enquiries}
          keyExtractor={(row) => row.id}
          totalEntries={totalEntries}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add Enquiry Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Log New Business Enquiry" maxWidth="lg">
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleAddEnquiry} className="space-y-4">
          <Input label="Contact Person / Client Name *" name="contactPerson" required placeholder="e.g. Rajesh Kumar" />
          <Input label="Product Category / Spices Required *" name="productCategory" required placeholder="e.g. 100g Sambar & Garam Masala" />
          <Input label="Expected Quantity *" name="expectedQuantity" required placeholder="e.g. 500 Units Monthly" />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Business Type"
              name="businessType"
              options={[
                { label: 'Retailer', value: 'retailer' },
                { label: 'Distributor', value: 'distributor' },
                { label: 'Wholesaler', value: 'wholesaler' },
                { label: 'Restaurant', value: 'restaurant' },
              ]}
              defaultValue="retailer"
            />
            <Select
              label="Priority Level"
              name="priority"
              options={[
                { label: 'Medium Priority', value: 'medium' },
                { label: 'High Priority', value: 'high' },
                { label: 'Urgent Priority', value: 'urgent' },
                { label: 'Low Priority', value: 'low' },
              ]}
              defaultValue="medium"
            />
          </div>
          <Select
            label="Assign Executive"
            name="assignedTo"
            options={[
              { label: 'Me (Current User)', value: 'me' },
              ...employees.map((e) => ({ label: `${e.fullName} (${e.role})`, value: e.id })),
            ]}
            defaultValue="me"
          />
          <div>
            <label className="block font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
              Enquiry Details &amp; Specific Terms
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Enter packaging preferences, target price points, or dispatch deadlines..."
              className="w-full bg-surface-bright border border-outline-variant rounded-md p-3 text-sm font-body-md text-on-surface"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} icon="save">Log Enquiry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
