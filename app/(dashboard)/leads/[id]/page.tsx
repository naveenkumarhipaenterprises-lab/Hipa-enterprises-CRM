'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  getLeadById,
  updateLeadStatusAction,
  markLeadLostAction,
  convertLeadToCustomerAction,
  createLeadFollowupAction,
} from '@/lib/actions/lead.actions';
import { getEnquiries, createEnquiryAction } from '@/lib/actions/enquiry.actions';
import { LeadRow, ActivityRow, EnquiryRow } from '@/types/database';
import Link from 'next/link';

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, setLead] = useState<LeadRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal States
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isAddEnquiryModalOpen, setIsAddEnquiryModalOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await getLeadById(params.id);
    setLead(res.lead);
    setActivities(res.activities);

    if (res.lead) {
      const enqRes = await getEnquiries({ leadId: res.lead.id });
      setEnquiries(enqRes.enquiries);
    }
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) return <LoadingState message="Loading lead details and audit timeline..." />;
  if (!lead) return <ErrorState title="Lead Not Found" message="The requested lead profile could not be located." />;

  // Handlers
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setIsSubmitting(true);
    const res = await updateLeadStatusAction(lead.id, newStatus);
    setIsSubmitting(false);
    if (!res.success) setActionError(res.error || 'Failed to update status.');
    else loadData();
  };

  const handleMarkLost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);
    const res = await markLeadLostAction(lead.id, lostReason);
    setIsSubmitting(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to mark lead lost.');
    } else {
      setIsLostModalOpen(false);
      loadData();
    }
  };

  const handleConvert = async () => {
    setIsSubmitting(true);
    setActionError(null);
    const res = await convertLeadToCustomerAction(lead.id);
    setIsSubmitting(false);
    if (!res.success) {
      setActionError(res.error || 'Conversion failed.');
    } else {
      setIsConvertModalOpen(false);
      window.location.href = `/customers/${res.customerId}`;
    }
  };

  const handleCreateFollowup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('leadId', lead.id);

    const res = await createLeadFollowupAction(formData);
    setIsSubmitting(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to schedule follow-up.');
    } else {
      setIsFollowupModalOpen(false);
      loadData();
    }
  };

  const handleAddEnquirySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('leadId', lead.id);
    formData.append('contactPerson', lead.full_name);

    const res = await createEnquiryAction(formData);

    setIsSubmitting(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to create enquiry.');
    } else {
      setIsAddEnquiryModalOpen(false);
      loadData();
    }
  };

  const cleanPhone = lead.phone.replace(/[^0-9+]/g, '');
  const cleanWhatsapp = (lead.whatsapp_number || lead.phone).replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 border border-outline-variant rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/leads">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold">{lead.full_name}</h1>
              <Badge variant={lead.status === 'converted' ? 'success' : lead.status === 'lost' ? 'error' : 'gold'}>
                {lead.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge variant="neutral">{lead.business_type.toUpperCase()}</Badge>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              {lead.company_name ? `${lead.company_name} • ` : ''}Code: {lead.lead_code} • Source: {lead.lead_source}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a href={`tel:${cleanPhone}`}>
            <Button variant="outline" size="sm" icon="call">Call</Button>
          </a>
          <a href={`https://wa.me/${cleanWhatsapp}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" icon="chat">WhatsApp</Button>
          </a>
          <Button variant="outline" size="sm" icon="contact_support" onClick={() => setIsAddEnquiryModalOpen(true)}>
            Add Enquiry
          </Button>
          <Button variant="secondary" size="sm" icon="event_repeat" onClick={() => setIsFollowupModalOpen(true)}>
            Add Follow-up
          </Button>

          {lead.status !== 'converted' && lead.status !== 'lost' && (
            <>
              <Button variant="primary" size="sm" icon="person_check" onClick={() => setIsConvertModalOpen(true)}>
                Convert to Customer
              </Button>
              <Button variant="danger" size="sm" icon="cancel" onClick={() => setIsLostModalOpen(true)}>
                Mark Lost
              </Button>
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-sm flex items-center gap-2 font-body-md">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Grid: Details + Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Lead Details &amp; Control">
            <div className="space-y-6">
              {/* Quick Status Dropdown */}
              <div className="p-4 bg-surface-bright rounded-xl border border-outline-variant/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="font-label-md text-xs text-on-surface-variant uppercase">Current Lifecycle Stage</span>
                  <p className="text-xs text-on-surface-variant mt-0.5">Update stage to trigger CRM activity logs</p>
                </div>
                <select
                  value={lead.status}
                  onChange={handleStatusChange}
                  disabled={isSubmitting || lead.status === 'converted'}
                  className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-1.5 text-xs font-label-md font-semibold text-primary focus:outline-none"
                >
                  <option value="new">NEW</option>
                  <option value="contacted">CONTACTED</option>
                  <option value="qualified">QUALIFIED</option>
                  <option value="proposal_sent">PROPOSAL SENT</option>
                  <option value="negotiation">NEGOTIATION</option>
                  <option value="converted" disabled>CONVERTED (Use Conversion Action)</option>
                  <option value="lost">LOST</option>
                </select>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm font-body-md">
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">Phone</span>
                  <p className="font-semibold text-on-surface">{lead.phone}</p>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">WhatsApp</span>
                  <p className="font-semibold text-on-surface">{lead.whatsapp_number || lead.phone}</p>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">Email</span>
                  <p className="font-semibold text-on-surface">{lead.email || 'None'}</p>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">Location</span>
                  <p className="font-semibold text-on-surface">{lead.location || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">Estimated Value</span>
                  <p className="font-bold text-primary text-base">₹{Number(lead.estimated_value || 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">Priority Level</span>
                  <div className="mt-0.5">
                    <Badge variant={lead.priority === 'urgent' ? 'error' : 'warning'}>{lead.priority.toUpperCase()}</Badge>
                  </div>
                </div>
              </div>

              {/* Product Interests Chips */}
              <div>
                <span className="text-xs text-on-surface-variant font-label-md uppercase block mb-2">Product Interest</span>
                <div className="flex flex-wrap gap-2">
                  {lead.product_interests && lead.product_interests.length > 0 ? (
                    lead.product_interests.map((p) => (
                      <Badge key={p} variant="gold">
                        {p.replace('_', ' ').toUpperCase()}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-on-surface-variant">No product interest recorded</span>
                  )}
                </div>
              </div>

              {/* Internal Notes */}
              {lead.notes && (
                <div className="p-4 bg-surface rounded-lg border border-outline-variant/60">
                  <span className="text-xs text-on-surface-variant font-label-md uppercase block mb-1">Internal Notes</span>
                  <p className="text-xs text-on-surface whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Linked Enquiries Section */}
          <Card
            title={`Associated Business Enquiries (${enquiries.length})`}
            headerAction={
              <Button variant="outline" size="sm" icon="add" onClick={() => setIsAddEnquiryModalOpen(true)}>
                Add Enquiry
              </Button>
            }
          >
            {enquiries.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">No enquiries logged for this lead yet.</p>
            ) : (
              <div className="space-y-3">
                {enquiries.map((enq) => (
                  <div key={enq.id} className="p-3 rounded-lg border border-outline-variant flex justify-between items-center text-xs">
                    <div>
                      <Link href={`/enquiries/${enq.id}`} className="font-bold text-primary hover:underline">
                        {enq.enquiry_code}
                      </Link>
                      <p className="text-on-surface font-medium mt-0.5">{enq.product_category}</p>
                    </div>
                    <Badge variant="gold">{enq.status.replace('_', ' ').toUpperCase()}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Audit Activity Timeline */}
        <div>
          <Card title="Activity Audit Log" subtitle="History of lead actions & updates">
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-4">No activities logged yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs font-body-sm pb-3 border-b border-outline-variant/40 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="text-on-surface font-medium">{act.description}</p>
                      <p className="text-on-surface-variant text-[10px] mt-0.5">
                        {new Date(act.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Schedule Follow-up Modal */}
      <Modal isOpen={isFollowupModalOpen} onClose={() => setIsFollowupModalOpen(false)} title="Schedule Follow-up for Lead">
        <form onSubmit={handleCreateFollowup} className="space-y-4">
          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Title *</label>
            <input name="title" required placeholder="e.g. Call to discuss spice sample feedback" className="w-full border p-2 rounded text-sm bg-surface-bright" />
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

      {/* Mark Lost Modal */}
      <Modal isOpen={isLostModalOpen} onClose={() => setIsLostModalOpen(false)} title="Mark Lead as Lost">
        <form onSubmit={handleMarkLost} className="space-y-4">
          <p className="text-xs text-on-surface-variant">
            Please specify the reason why this lead is being marked lost. This will be preserved in historical analytics.
          </p>
          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Lost Reason *</label>
            <textarea
              required
              rows={3}
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="e.g. Client opted for cheaper competitor pricing..."
              className="w-full border p-3 rounded text-sm bg-surface-bright"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsLostModalOpen(false)}>Cancel</Button>
            <Button variant="danger" type="submit" isLoading={isSubmitting}>Mark Lost</Button>
          </div>
        </form>
      </Modal>

      {/* Convert Lead to Customer Modal */}
      <Modal isOpen={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} title="Convert Lead to Customer Profile">
        <div className="space-y-4">
          <p className="text-sm text-on-surface">
            Are you sure you want to convert <strong className="text-primary">{lead.full_name}</strong> ({lead.company_name || 'Individual'}) into an active Customer account?
          </p>
          <div className="p-3 bg-surface-bright rounded-lg border text-xs text-on-surface-variant space-y-1">
            <p>• A new active Customer profile will be generated (`HIPA-CUST-xxxx`).</p>
            <p>• The lead history (`{lead.lead_code}`) will remain preserved.</p>
            <p>• You will be redirected to the new Customer management profile.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsConvertModalOpen(false)}>Cancel</Button>
            <Button variant="primary" icon="person_check" onClick={handleConvert} isLoading={isSubmitting}>
              Confirm Conversion
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contextual Add Enquiry Modal */}
      <Modal isOpen={isAddEnquiryModalOpen} onClose={() => setIsAddEnquiryModalOpen(false)} title={`Log Enquiry for Prospect ${lead.full_name}`}>
        <form onSubmit={handleAddEnquirySubmit} className="space-y-4">
          <Input label="Product Category / Spices Required *" name="productCategory" required placeholder="e.g. 500kg Wholesale Turmeric & Red Chilli" />
          <Input label="Expected Quantity *" name="expectedQuantity" required placeholder="e.g. 2 Metric Tons" />
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
          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Requirement Notes</label>
            <textarea name="notes" rows={3} placeholder="Enter pricing request or target delivery schedule..." className="w-full border p-2 rounded text-sm bg-surface-bright" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddEnquiryModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Log Enquiry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
