'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { getEnquiryById, updateEnquiryStatusAction, updateEnquiryPriorityAction } from '@/lib/actions/enquiry.actions';
import { createLeadFollowupAction } from '@/lib/actions/lead.actions';
import { EnquiryRow, CustomerRow, LeadRow, ActivityRow } from '@/types/database';
import Link from 'next/link';

export default function EnquiryDetailPage({ params }: { params: { id: string } }) {
  const [enquiry, setEnquiry] = useState<EnquiryRow | null>(null);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [lead, setLead] = useState<LeadRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await getEnquiryById(params.id);
    setEnquiry(res.enquiry);
    setCustomer(res.customer);
    setLead(res.lead);
    setActivities(res.activities);
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) return <LoadingState message="Loading enquiry details & linked profile..." />;
  if (!enquiry) return <ErrorState title="Enquiry Not Found" message="The requested business enquiry record could not be found." />;

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setIsSubmitting(true);
    const res = await updateEnquiryStatusAction(enquiry.id, newStatus);
    setIsSubmitting(false);
    if (!res.success) setActionError(res.error || 'Failed to update status.');
    else loadData();
  };

  const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPriority = e.target.value;
    setIsSubmitting(true);
    const res = await updateEnquiryPriorityAction(enquiry.id, newPriority);
    setIsSubmitting(false);
    if (!res.success) setActionError(res.error || 'Failed to update priority.');
    else loadData();
  };

  const handleCreateFollowup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    const formData = new FormData(e.currentTarget);
    if (lead) formData.append('leadId', lead.id);

    const res = await createLeadFollowupAction(formData);
    setIsSubmitting(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to schedule follow-up.');
    } else {
      setIsFollowupModalOpen(false);
      loadData();
    }
  };

  const contactPhone = customer?.phone || lead?.phone || '';
  const cleanPhone = contactPhone.replace(/[^0-9+]/g, '');

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 border border-outline-variant rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/enquiries">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold">{enquiry.enquiry_code}</h1>
              <Badge variant={enquiry.status === 'closed' ? 'success' : enquiry.status === 'quotation_created' ? 'info' : 'gold'}>
                {enquiry.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge variant="maroon">{enquiry.priority.toUpperCase()}</Badge>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              Contact: {enquiry.contact_person} • Product: {enquiry.product_category} • Quantity: {enquiry.expected_quantity}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cleanPhone && (
            <a href={`tel:${cleanPhone}`}>
              <Button variant="outline" size="sm" icon="call">Call</Button>
            </a>
          )}
          <Button variant="secondary" size="sm" icon="event_repeat" onClick={() => setIsFollowupModalOpen(true)}>
            Schedule Follow-up
          </Button>
          <Link href="/quotations">
            <Button variant="primary" size="sm" icon="request_quote">Create Quotation</Button>
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-sm flex items-center gap-2 font-body-md">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{actionError}</span>
        </div>
      )}

      {/* Grid: Details + Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Enquiry Requirement &amp; Controls">
            <div className="space-y-6">
              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-bright rounded-xl border border-outline-variant/60">
                <div>
                  <label className="block text-xs font-label-md text-on-surface-variant uppercase mb-1">Status Stage</label>
                  <select
                    value={enquiry.status}
                    onChange={handleStatusChange}
                    disabled={isSubmitting}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-1.5 text-xs font-label-md font-semibold text-primary"
                  >
                    <option value="new">NEW</option>
                    <option value="assigned">ASSIGNED</option>
                    <option value="contacted">CONTACTED</option>
                    <option value="quotation_sent">QUOTATION SENT</option>
                    <option value="negotiation">NEGOTIATION</option>
                    <option value="converted">CONVERTED (WON)</option>
                    <option value="closed">CLOSED</option>
                    <option value="lost">LOST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-label-md text-on-surface-variant uppercase mb-1">Priority Level</label>
                  <select
                    value={enquiry.priority}
                    onChange={handlePriorityChange}
                    disabled={isSubmitting}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-1.5 text-xs font-label-md font-semibold text-primary"
                  >
                    <option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option>
                    <option value="urgent">URGENT</option>
                    <option value="low">LOW</option>
                  </select>
                </div>
              </div>

              {/* Requirement Details */}
              <div className="grid grid-cols-2 gap-4 text-sm font-body-md">
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">Contact Person</span>
                  <p className="font-semibold text-on-surface">{enquiry.contact_person}</p>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">Business Category</span>
                  <p className="font-semibold text-on-surface capitalize">{customer?.business_type || 'General'}</p>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">Product Interest</span>
                  <p className="font-semibold text-primary">{enquiry.product_category}</p>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">Expected Quantity</span>
                  <p className="font-bold text-on-surface">{enquiry.expected_quantity}</p>
                </div>
              </div>

              {enquiry.notes && (
                <div className="p-4 bg-surface rounded-lg border border-outline-variant/60">
                  <span className="text-xs text-on-surface-variant font-label-md uppercase block mb-1">Enquiry Notes &amp; Specifics</span>
                  <p className="text-xs text-on-surface whitespace-pre-wrap">{enquiry.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Linked Customer / Lead Profile Card */}
          {customer && (
            <Card title="Linked Customer Profile" subtitle="Account partner details">
              <div className="p-4 bg-surface-bright rounded-xl border border-outline-variant/60 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-primary">{customer.name} ({customer.customer_code})</span>
                  <Badge variant="success">ACTIVE CUSTOMER</Badge>
                </div>
                <p className="text-xs text-on-surface-variant">{customer.company_name || 'Individual'} • Phone: {customer.phone} • Email: {customer.email || 'N/A'}</p>
                <div className="pt-2">
                  <Link href={`/customers/${customer.id}`} className="text-xs font-label-md text-primary hover:underline flex items-center gap-1">
                    View Full Customer Profile <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {lead && !customer && (
            <Card title="Linked Lead Prospect" subtitle="Prospect information">
              <div className="p-4 bg-surface-bright rounded-xl border border-outline-variant/60 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-primary">{lead.full_name} ({lead.lead_code})</span>
                  <Badge variant="gold">LEAD PROSPECT</Badge>
                </div>
                <p className="text-xs text-on-surface-variant">{lead.company_name || 'Individual'} • Phone: {lead.phone}</p>
                <div className="pt-2">
                  <Link href={`/leads/${lead.id}`} className="text-xs font-label-md text-primary hover:underline flex items-center gap-1">
                    View Converted Lead Details <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Audit Activity Log */}
        <div>
          <Card title="Audit Activity Timeline" subtitle="Enquiry updates & touchpoint history">
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-4">No audit activities logged.</p>
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

      {/* Schedule Follow-up Modal */}
      <Modal isOpen={isFollowupModalOpen} onClose={() => setIsFollowupModalOpen(false)} title="Schedule Follow-up for Enquiry">
        <form onSubmit={handleCreateFollowup} className="space-y-4">
          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Title *</label>
            <input name="title" required defaultValue={`Follow-up on Enquiry ${enquiry.enquiry_code}`} className="w-full border p-2 rounded text-sm bg-surface-bright" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-label-md uppercase mb-1">Date *</label>
              <input name="followupDate" type="date" required className="w-full border p-2 rounded text-sm bg-surface-bright" />
            </div>
            <div>
              <label className="block text-xs font-label-md uppercase mb-1">Time</label>
              <input name="followupTime" type="time" className="w-full border p-2 rounded text-sm bg-surface-bright" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsFollowupModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Schedule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
