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
import { getCustomers, createCustomerAction } from '@/lib/actions/customer.actions';
import { getActiveEmployees } from '@/lib/actions/lead.actions';
import { CustomerRow, UserProfile } from '@/types/database';
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessFilter, setBusinessFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [stats, setStats] = useState({
    totalCustomers: 1248,
    activeRetailers: 892,
    distributors: 156,
    avgOrderValue: '₹45.2K',
  });

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCustomersData = useCallback(async () => {
    setIsLoading(true);
    const res = await getCustomers({
      search,
      status: statusFilter,
      businessType: businessFilter,
      assignedTo: assignedFilter,
      page: currentPage,
      limit: 10,
    });
    setCustomers(res.customers);
    setTotalPages(res.totalPages);
    setTotalEntries(res.totalEntries);
    setStats(res.stats);
    setIsLoading(false);
  }, [search, statusFilter, businessFilter, assignedFilter, currentPage]);

  useEffect(() => {
    fetchCustomersData();
  }, [fetchCustomersData]);

  useEffect(() => {
    getActiveEmployees().then(setEmployees);
  }, []);

  const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createCustomerAction(formData);

    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to create customer profile.');
    } else {
      setIsAddModalOpen(false);
      fetchCustomersData();
      if (res.customerId) {
        window.location.href = `/customers/${res.customerId}`;
      }
    }
  };

  const columns: Column<CustomerRow>[] = [
    {
      header: 'Customer / Company',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-headline-sm font-bold shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <Link href={`/customers/${row.id}`} className="font-headline-sm text-base font-semibold text-on-surface hover:text-primary transition-colors">
              {row.name}
            </Link>
            <div className="text-xs text-on-surface-variant font-body-sm">
              {row.company_name || 'Individual Partner'} • {row.customer_code}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Type & Location',
      cell: (row) => (
        <div className="flex flex-col">
          <Badge variant={row.business_type === 'distributor' ? 'maroon' : 'neutral'} className="w-fit mb-1">
            {row.business_type.toUpperCase()}
          </Badge>
          <div className="flex items-center gap-1 text-on-surface-variant text-xs font-body-sm">
            <span className="material-symbols-outlined text-[14px]">location_on</span> {row.location || 'Not specified'}
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Details',
      cell: (row) => (
        <div className="flex flex-col text-xs font-body-sm">
          <span className="text-on-surface font-label-md">{row.phone}</span>
          <span className="text-on-surface-variant">{row.email || 'No Email'}</span>
        </div>
      ),
    },
    {
      header: 'Metrics',
      cell: (row) => (
        <div className="flex flex-col text-right">
          <span className="font-bold text-on-surface">
            ₹{Number(row.total_revenue || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-on-surface-variant">{row.total_orders_count || 0} Orders</span>
        </div>
      ),
      align: 'right',
    },
    {
      header: 'Last Order',
      cell: (row) => (
        <span className="text-xs font-label-md text-on-surface">
          {row.last_order_date ? new Date(row.last_order_date).toLocaleDateString('en-IN') : 'No Orders Yet'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : row.status === 'inactive' ? 'neutral' : 'warning'}>
          {row.status.toUpperCase()}
        </Badge>
      ),
      align: 'center',
    },
    {
      header: 'Actions',
      cell: (row) => {
        const cleanPhone = row.phone.replace(/[^0-9+]/g, '');
        const cleanWhatsapp = (row.whatsapp_number || row.phone).replace(/[^0-9]/g, '');
        return (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/customers/${row.id}`}>
              <button className="p-1.5 text-on-surface-variant hover:text-primary rounded transition-colors" title="View Profile">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
              </button>
            </Link>
            <a href={`tel:${cleanPhone}`}>
              <button className="p-1.5 text-on-surface-variant hover:text-primary rounded transition-colors" title="Call Customer">
                <span className="material-symbols-outlined text-[18px]">call</span>
              </button>
            </a>
            <a href={`https://wa.me/${cleanWhatsapp}`} target="_blank" rel="noopener noreferrer">
              <button className="p-1.5 text-on-surface-variant hover:text-primary rounded transition-colors" title="WhatsApp">
                <span className="material-symbols-outlined text-[18px]">chat</span>
              </button>
            </a>
          </div>
        );
      },
      align: 'right',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface font-bold">Customers</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
            Manage wholesale buyers, distributors, and retail partners.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" icon="group_add" onClick={() => setIsAddModalOpen(true)}>
            Add Customer
          </Button>
        </div>
      </div>

      {/* Bento Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 md:p-6 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Total Customers</span>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
          </div>
          <div className="font-headline-lg text-3xl font-bold text-on-surface">{stats.totalCustomers}</div>
          <p className="text-xs text-tertiary-container font-label-md mt-1">+12% this month</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 md:p-6 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Active Retailers</span>
            <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
            </div>
          </div>
          <div className="font-headline-lg text-3xl font-bold text-on-surface">{stats.activeRetailers}</div>
          <p className="text-xs text-tertiary-container font-label-md mt-1">+5% this month</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 md:p-6 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Distributors</span>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            </div>
          </div>
          <div className="font-headline-lg text-3xl font-bold text-on-surface">{stats.distributors}</div>
          <p className="text-xs text-on-surface-variant font-label-md mt-1">Stable</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 md:p-6 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Avg Order Value</span>
            <div className="p-2 bg-tertiary-container/10 rounded-lg text-tertiary-container">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
          <div className="font-headline-lg text-3xl font-bold text-on-surface">{stats.avgOrderValue}</div>
          <p className="text-xs text-tertiary-container font-label-md mt-1">+8% this year</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search customer, company, phone..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="potential">Potential</option>
          </select>

          <select
            value={businessFilter}
            onChange={(e) => {
              setBusinessFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Type: All</option>
            <option value="retailer">Retailer</option>
            <option value="distributor">Distributor</option>
            <option value="wholesaler">Wholesaler</option>
            <option value="restaurant">Restaurant</option>
          </select>

          <select
            value={assignedFilter}
            onChange={(e) => {
              setAssignedFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Assigned: All</option>
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
        <LoadingState message="Loading customers database..." />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="No customer records match your filter parameters. Add a new customer or convert an existing lead."
          actionLabel="Add Customer"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          keyExtractor={(row) => row.id}
          totalEntries={totalEntries}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Customer Profile" maxWidth="xl">
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Customer Full Name *" name="name" required placeholder="e.g. Rajesh Kumar" />
            <Input label="Company Name" name="companyName" placeholder="e.g. Anjali Supermarket" />
            <Input label="Phone Number *" name="phone" required placeholder="+91 98765 43210" />
            <Input label="WhatsApp Number" name="whatsappNumber" placeholder="Same as phone" />
            <Input label="Email Address" name="email" type="email" placeholder="rajesh@anjalimart.com" />
            <Input label="Location / City" name="location" placeholder="e.g. Mumbai, MH" />
            <Select
              label="Business Type"
              name="businessType"
              options={[
                { label: 'Retailer', value: 'retailer' },
                { label: 'Distributor', value: 'distributor' },
                { label: 'Wholesaler', value: 'wholesaler' },
                { label: 'Food Manufacturer', value: 'manufacturer' },
                { label: 'Restaurant', value: 'restaurant' },
              ]}
              defaultValue="retailer"
            />
            <Select
              label="Account Status"
              name="status"
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Potential', value: 'potential' },
                { label: 'Inactive', value: 'inactive' },
              ]}
              defaultValue="active"
            />
            <div className="col-span-1 md:col-span-2">
              <Select
                label="Assign Executive"
                name="assignedTo"
                options={[
                  { label: 'Me (Current User)', value: 'me' },
                  ...employees.map((e) => ({ label: `${e.fullName} (${e.role})`, value: e.id })),
                ]}
                defaultValue="me"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
                Account Notes
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Enter client background or packaging preferences..."
                className="w-full bg-surface-bright border border-outline-variant rounded-md p-3 text-sm font-body-md text-on-surface"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} icon="save">Register Customer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
