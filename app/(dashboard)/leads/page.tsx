'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { getLeads, getActiveEmployees } from '@/lib/actions/lead.actions';
import { LeadRow, UserProfile } from '@/types/database';
import Link from 'next/link';

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [businessFilter, setBusinessFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  const fetchLeadsData = useCallback(async () => {
    setIsLoading(true);
    const res = await getLeads({
      search,
      status: statusFilter,
      priority: priorityFilter,
      source: sourceFilter,
      businessType: businessFilter,
      assignedTo: assignedFilter,
      page: currentPage,
      limit: 10,
    });
    setLeads(res.leads);
    setTotalPages(res.totalPages);
    setTotalEntries(res.totalEntries);
    setIsLoading(false);
  }, [search, statusFilter, priorityFilter, sourceFilter, businessFilter, assignedFilter, currentPage]);

  useEffect(() => {
    fetchLeadsData();
  }, [fetchLeadsData]);

  useEffect(() => {
    getActiveEmployees().then(setEmployees);
  }, []);

  const columns: Column<LeadRow>[] = [
    {
      header: 'Lead Code / Name',
      cell: (row) => (
        <div>
          <Link href={`/leads/${row.id}`} className="font-semibold text-primary hover:underline">
            {row.full_name}
          </Link>
          <div className="text-xs text-on-surface-variant font-label-md">
            {row.lead_code} • {row.company_name || 'Individual'}
          </div>
        </div>
      ),
    },
    {
      header: 'Business & Source',
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <Badge variant="neutral" className="w-fit">
            {row.business_type?.toUpperCase() || 'RETAILER'}
          </Badge>
          <span className="text-xs text-on-surface-variant capitalize">{row.lead_source?.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      header: 'Phone / Email',
      cell: (row) => (
        <div className="flex flex-col text-xs font-body-sm">
          <span className="font-label-md text-on-surface">{row.phone}</span>
          <span className="text-on-surface-variant">{row.email || 'No Email'}</span>
        </div>
      ),
    },
    {
      header: 'Est. Value',
      cell: (row) => (
        <span className="font-bold text-on-surface">
          ₹{Number(row.estimated_value || 0).toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
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
          contacted: 'info',
          qualified: 'success',
          proposal_sent: 'maroon',
          negotiation: 'gold',
          converted: 'success',
          lost: 'error',
        };
        return <Badge variant={variants[row.status] || 'neutral'}>{row.status.replace('_', ' ').toUpperCase()}</Badge>;
      },
      align: 'center',
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/leads/${row.id}`}>
            <button className="p-1.5 text-on-surface-variant hover:text-primary rounded transition-colors" title="View Lead Profile">
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Leads Directory</h2>
          <p className="font-body-md text-on-surface-variant">Track prospective clients and sales inquiries.</p>
        </div>
        <Link href="/leads/new">
          <Button variant="primary" icon="add">
            Add New Lead
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search name, company, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-md text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Status Filter */}
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
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal_sent">Proposal Sent</option>
            <option value="negotiation">Negotiation</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>

          {/* Priority Filter */}
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

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Source: All</option>
            <option value="website">Website</option>
            <option value="trade_show">Trade Show</option>
            <option value="referral">Referral</option>
            <option value="cold_call">Cold Call</option>
            <option value="social_media">Social Media</option>
          </select>

          {/* Assigned Employee Filter */}
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

      {/* Table / Empty State */}
      {isLoading ? (
        <LoadingState message="Fetching leads database..." />
      ) : leads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="There are no lead records matching your filter criteria. Create a new lead to start tracking prospects."
          actionLabel="Add New Lead"
          onAction={() => (window.location.href = '/leads/new')}
        />
      ) : (
        <DataTable
          columns={columns}
          data={leads}
          keyExtractor={(row) => row.id}
          totalEntries={totalEntries}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
