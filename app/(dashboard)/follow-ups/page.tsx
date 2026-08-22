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
  getFollowups,
  completeFollowupAction,
  rescheduleFollowupAction,
  cancelFollowupAction,
} from '@/lib/actions/followup.actions';
import { createLeadFollowupAction, getActiveEmployees } from '@/lib/actions/lead.actions';
import { FollowUpRow, UserProfile } from '@/types/database';
import Link from 'next/link';

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<FollowUpRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [viewType, setViewType] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [counts, setCounts] = useState({ today: 0, upcoming: 0, overdue: 0, completed: 0 });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState<FollowUpRow | null>(null);

  // Form states
  const [outcomeText, setOutcomeText] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchFollowupsData = useCallback(async () => {
    setIsLoading(true);
    const res = await getFollowups({
      search,
      priority: priorityFilter,
      method: methodFilter,
      viewType,
      page: currentPage,
      limit: 10,
    });
    setFollowups(res.followups);
    setTotalPages(res.totalPages);
    setTotalEntries(res.totalEntries);
    setCounts(res.counts);
    setIsLoading(false);
  }, [search, priorityFilter, methodFilter, viewType, currentPage]);

  useEffect(() => {
    fetchFollowupsData();
  }, [fetchFollowupsData]);

  useEffect(() => {
    getActiveEmployees().then(setEmployees);
  }, []);

  const handleAddFollowup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createLeadFollowupAction(formData);

    setIsSubmitting(false);
    if (!res.success) {
      setFormError(res.error || 'Failed to schedule follow-up.');
    } else {
      setIsAddModalOpen(false);
      fetchFollowupsData();
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowup) return;
    setIsSubmitting(true);
    setFormError(null);

    const res = await completeFollowupAction(selectedFollowup.id, outcomeText);
    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to mark complete.');
    } else {
      setIsCompleteModalOpen(false);
      setSelectedFollowup(null);
      setOutcomeText('');
      fetchFollowupsData();
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowup) return;
    setIsSubmitting(true);
    setFormError(null);

    const res = await rescheduleFollowupAction(selectedFollowup.id, rescheduleDate);
    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to reschedule.');
    } else {
      setIsRescheduleModalOpen(false);
      setSelectedFollowup(null);
      setRescheduleDate('');
      fetchFollowupsData();
    }
  };

  const columns: Column<FollowUpRow>[] = [
    {
      header: 'Follow-up Purpose / Title',
      cell: (row) => (
        <div>
          <span className="font-semibold text-on-surface text-xs block">{row.title}</span>
          <div className="text-[11px] text-on-surface-variant font-body-sm">{row.purpose || 'No additional notes'}</div>
        </div>
      ),
    },
    {
      header: 'Method',
      cell: (row) => (
        <Badge variant="neutral" className="w-fit capitalize">
          {row.method}
        </Badge>
      ),
    },
    {
      header: 'Scheduled Date & Time',
      cell: (row) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const isOverdue = row.followup_date < todayStr && row.status === 'pending';
        return (
          <div className="flex flex-col text-xs font-label-md">
            <span className={isOverdue ? 'text-error font-bold' : 'text-on-surface'}>
              {new Date(row.followup_date).toLocaleDateString('en-IN')}
            </span>
            <span className="text-on-surface-variant">{row.followup_time || 'All Day'}</span>
          </div>
        );
      },
    },
    {
      header: 'Priority',
      cell: (row) => (
        <Badge variant={row.priority === 'urgent' ? 'error' : row.priority === 'high' ? 'warning' : 'info'}>
          {row.priority.toUpperCase()}
        </Badge>
      ),
      align: 'center',
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'completed' ? 'success' : row.status === 'rescheduled' ? 'gold' : 'neutral'}>
          {row.status.toUpperCase()}
        </Badge>
      ),
      align: 'center',
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => {
                  setSelectedFollowup(row);
                  setIsCompleteModalOpen(true);
                }}
                className="p-1.5 text-tertiary-container hover:bg-tertiary-container/10 rounded transition-colors"
                title="Mark Completed"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </button>
              <button
                onClick={() => {
                  setSelectedFollowup(row);
                  setIsRescheduleModalOpen(true);
                }}
                className="p-1.5 text-on-surface-variant hover:text-primary rounded transition-colors"
                title="Reschedule"
              >
                <span className="material-symbols-outlined text-[18px]">update</span>
              </button>
            </>
          )}
        </div>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Follow-ups &amp; Action Items</h2>
          <p className="font-body-md text-on-surface-variant">Manage calls, meetings, and client touchpoints.</p>
        </div>
        <Button variant="primary" icon="add" onClick={() => setIsAddModalOpen(true)}>
          Schedule Follow-up
        </Button>
      </div>

      {/* Time Tabs */}
      <div className="flex border-b border-outline-variant gap-4 text-xs md:text-sm font-label-md overflow-x-auto custom-scrollbar">
        {[
          { id: 'today', label: `Today (${counts.today})` },
          { id: 'overdue', label: `Overdue (${counts.overdue})` },
          { id: 'upcoming', label: `Upcoming (${counts.upcoming})` },
          { id: 'completed', label: `Completed (${counts.completed})` },
          { id: 'all', label: 'All Tasks' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setViewType(tab.id as typeof viewType);
              setCurrentPage(1);
            }}
            className={`pb-3 px-1 capitalize transition-colors border-b-2 whitespace-nowrap ${
              viewType === tab.id
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search title, purpose..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-md text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

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

          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Method: All</option>
            <option value="call">Phone Call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="meeting">In-Person Meeting</option>
          </select>
        </div>
      </div>

      {/* Table / Loading / Empty */}
      {isLoading ? (
        <LoadingState message="Fetching follow-ups..." />
      ) : followups.length === 0 ? (
        <EmptyState
          title={`No ${viewType} follow-ups`}
          description="There are no follow-ups scheduled in this time frame."
          actionLabel="Schedule Follow-up"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={followups}
          keyExtractor={(row) => row.id}
          totalEntries={totalEntries}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Schedule Follow-up Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Schedule New Follow-up Task">
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleAddFollowup} className="space-y-4">
          <Input label="Title / Purpose *" name="title" required placeholder="e.g. Call client regarding sample quote" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-label-md uppercase mb-1">Scheduled Date *</label>
              <input name="followupDate" type="date" required className="w-full border p-2 rounded text-sm bg-surface-bright" />
            </div>
            <div>
              <label className="block text-xs font-label-md uppercase mb-1">Scheduled Time</label>
              <input name="followupTime" type="time" className="w-full border p-2 rounded text-sm bg-surface-bright" />
            </div>
          </div>
          <Select
            label="Channel Method"
            name="method"
            options={[
              { label: 'Phone Call', value: 'call' },
              { label: 'WhatsApp', value: 'whatsapp' },
              { label: 'Email', value: 'email' },
              { label: 'In-person Meeting', value: 'meeting' },
            ]}
            defaultValue="call"
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Schedule</Button>
          </div>
        </form>
      </Modal>

      {/* Complete Follow-up Modal */}
      <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Mark Follow-up as Completed">
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <p className="text-xs text-on-surface-variant">
            Summarize the discussion outcome. This will log an immutable entry in the Activity Audit Log.
          </p>
          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Outcome Summary *</label>
            <textarea
              required
              rows={3}
              value={outcomeText}
              onChange={(e) => setOutcomeText(e.target.value)}
              placeholder="e.g. Client agreed to sample quote. Requested formal proforma invoice..."
              className="w-full border p-3 rounded text-sm bg-surface-bright"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsCompleteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Confirm Completion</Button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={isRescheduleModalOpen} onClose={() => setIsRescheduleModalOpen(false)} title="Reschedule Follow-up">
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-label-md uppercase mb-1">New Date *</label>
            <input
              type="date"
              required
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full border p-2 rounded text-sm bg-surface-bright"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsRescheduleModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Reschedule Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
