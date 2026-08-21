'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  getPipelineOpportunities,
  updateOpportunityStageAction,
  PipelineOpportunity,
  PipelineStage,
} from '@/lib/actions/pipeline.actions';
import { getActiveEmployees } from '@/lib/actions/lead.actions';
import { UserProfile } from '@/types/database';
import Link from 'next/link';

const STAGE_CONFIG: { id: PipelineStage; label: string; badgeVariant: 'gold' | 'info' | 'maroon' | 'warning' | 'success' | 'error' }[] = [
  { id: 'new', label: 'New Lead / Enquiry', badgeVariant: 'gold' },
  { id: 'qualified', label: 'Qualified Deal', badgeVariant: 'info' },
  { id: 'proposal_sent', label: 'Proposal Sent', badgeVariant: 'maroon' },
  { id: 'negotiation', label: 'Negotiation', badgeVariant: 'warning' },
  { id: 'converted', label: 'Won / Converted', badgeVariant: 'success' },
  { id: 'lost', label: 'Lost Deal', badgeVariant: 'error' },
];

export default function PipelinePage() {
  const [columns, setColumns] = useState<Record<PipelineStage, PipelineOpportunity[]>>({
    new: [],
    qualified: [],
    proposal_sent: [],
    negotiation: [],
    converted: [],
    lost: [],
  });
  const [summary, setSummary] = useState({
    totalOpportunities: 0,
    totalPipelineValue: 0,
    wonValue: 0,
    lostValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [employees, setEmployees] = useState<UserProfile[]>([]);

  // Modals
  const [selectedOpp, setSelectedOpp] = useState<PipelineOpportunity | null>(null);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchPipelineData = useCallback(async () => {
    setIsLoading(true);
    const res = await getPipelineOpportunities({
      search,
      priority: priorityFilter,
      assignedTo: assignedFilter,
    });
    setColumns(res.columns);
    setSummary(res.summary);
    setIsLoading(false);
  }, [search, priorityFilter, assignedFilter]);

  useEffect(() => {
    fetchPipelineData();
  }, [fetchPipelineData]);

  useEffect(() => {
    getActiveEmployees().then(setEmployees);
  }, []);

  const handleStageMove = async (opp: PipelineOpportunity, targetStage: PipelineStage) => {
    if (targetStage === 'lost') {
      setSelectedOpp(opp);
      setIsLostModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    const res = await updateOpportunityStageAction(opp.id, targetStage);
    setIsSubmitting(false);

    if (!res.success) {
      setActionError(res.error || 'Failed to move deal stage.');
    } else {
      fetchPipelineData();
    }
  };

  const handleLostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpp) return;

    setIsSubmitting(true);
    setActionError(null);
    const res = await updateOpportunityStageAction(selectedOpp.id, 'lost', lostReason);
    setIsSubmitting(false);

    if (!res.success) {
      setActionError(res.error || 'Failed to mark deal lost.');
    } else {
      setIsLostModalOpen(false);
      setSelectedOpp(null);
      setLostReason('');
      fetchPipelineData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Sales Pipeline</h2>
          <p className="font-body-md text-on-surface-variant">Visual Kanban board tracking commercial deals from initial contact to closing.</p>
        </div>
        <Link href="/enquiries">
          <Button variant="primary" icon="add">
            New Sales Opportunity
          </Button>
        </Link>
      </div>

      {/* Pipeline Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase">Total Active Deals</span>
          <div className="font-headline-lg text-2xl font-bold text-on-surface mt-1">{summary.totalOpportunities} Deals</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase">Open Pipeline Value</span>
          <div className="font-headline-lg text-2xl font-bold text-primary mt-1">
            ₹{summary.totalPipelineValue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase">Won Value</span>
          <div className="font-headline-lg text-2xl font-bold text-tertiary-container mt-1">
            ₹{summary.wonValue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase">Lost Value</span>
          <div className="font-headline-lg text-2xl font-bold text-error mt-1">
            ₹{summary.lostValue.toLocaleString('en-IN')}
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
              placeholder="Search deal code, contact, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-md text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Priority: All</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
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

      {actionError && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-sm flex items-center gap-2 font-body-md">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{actionError}</span>
        </div>
      )}

      {/* Kanban Columns */}
      {isLoading ? (
        <LoadingState message="Building visual sales pipeline..." />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar items-start">
          {STAGE_CONFIG.map((stage) => {
            const stageOpps = columns[stage.id] || [];
            const colTotal = stageOpps.reduce((sum, o) => sum + o.estimatedValue, 0);

            return (
              <div key={stage.id} className="w-80 shrink-0 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm space-y-4">
                {/* Column Header */}
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
                  <div>
                    <span className="font-headline-sm text-sm font-bold text-on-surface block">{stage.label}</span>
                    <span className="text-[11px] font-label-md text-on-surface-variant">
                      {stageOpps.length} Deals • ₹{colTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Badge variant={stage.badgeVariant}>{stageOpps.length}</Badge>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 min-h-[300px]">
                  {stageOpps.length === 0 ? (
                    <div className="h-32 flex items-center justify-center border border-dashed border-outline-variant/60 rounded-lg text-xs text-on-surface-variant">
                      No deals in stage
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <div
                        key={opp.id}
                        className="bg-surface p-4 rounded-xl border border-outline-variant hover:border-primary shadow-sm space-y-3 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <Link href={`/enquiries/${opp.id}`} className="font-bold text-xs text-primary hover:underline block">
                              {opp.code}
                            </Link>
                            <span className="font-semibold text-xs text-on-surface block mt-0.5">{opp.contactName}</span>
                          </div>
                          <Badge variant={opp.priority === 'urgent' ? 'error' : opp.priority === 'high' ? 'warning' : 'info'}>
                            {opp.priority.toUpperCase()}
                          </Badge>
                        </div>

                        <p className="text-[11px] text-on-surface-variant font-body-sm line-clamp-2">{opp.productCategory}</p>

                        <div className="flex justify-between items-end pt-2 border-t border-outline-variant/40">
                          <div>
                            <span className="text-[10px] text-on-surface-variant font-label-md uppercase block">Est. Deal Value</span>
                            <span className="font-bold text-xs text-on-surface">₹{opp.estimatedValue.toLocaleString('en-IN')}</span>
                          </div>

                          {/* Stage Transition Control Dropdown */}
                          <select
                            value={opp.stage}
                            onChange={(e) => handleStageMove(opp, e.target.value as PipelineStage)}
                            disabled={isSubmitting}
                            className="bg-surface-container-lowest border border-outline-variant text-[11px] rounded px-2 py-1 font-label-md text-primary font-semibold focus:outline-none"
                          >
                            <option value="new">NEW</option>
                            <option value="qualified">QUALIFIED</option>
                            <option value="proposal_sent">PROPOSAL</option>
                            <option value="negotiation">NEGOTIATION</option>
                            <option value="converted">WON</option>
                            <option value="lost">LOST</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mark Lost Reason Modal */}
      <Modal isOpen={isLostModalOpen} onClose={() => setIsLostModalOpen(false)} title="Specify Lost Opportunity Reason">
        <form onSubmit={handleLostSubmit} className="space-y-4">
          <p className="text-xs text-on-surface-variant">
            Please specify why deal <strong>{selectedOpp?.code}</strong> ({selectedOpp?.contactName}) was lost. This reason will be recorded for historical performance analytics.
          </p>
          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Lost Reason *</label>
            <textarea
              required
              rows={3}
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="e.g. Competitor offered lower bulk pricing, client delayed project indefinitely..."
              className="w-full border p-3 rounded text-sm bg-surface-bright"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsLostModalOpen(false)}>Cancel</Button>
            <Button variant="danger" type="submit" isLoading={isSubmitting}>Mark Deal Lost</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
