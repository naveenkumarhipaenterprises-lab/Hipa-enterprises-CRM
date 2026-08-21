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
import { EmptyState } from '@/components/ui/EmptyState';
import { getCustomerById, updateCustomerStatusAction, updateCustomerAction } from '@/lib/actions/customer.actions';
import { getEnquiries, createEnquiryAction } from '@/lib/actions/enquiry.actions';
import { getQuotations } from '@/lib/actions/quotation.actions';
import { getOrders } from '@/lib/actions/order.actions';
import { CustomerRow, ActivityRow, LeadRow, EnquiryRow, QuotationRow, OrderRow } from '@/types/database';
import Link from 'next/link';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [leadOrigin, setLeadOrigin] = useState<LeadRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [quotations, setQuotations] = useState<QuotationRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'enquiries' | 'followups' | 'quotations' | 'orders' | 'activities'>('overview');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddEnquiryModalOpen, setIsAddEnquiryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadCustomerData = useCallback(async () => {
    setIsLoading(true);
    const res = await getCustomerById(params.id);
    setCustomer(res.customer);
    setLeadOrigin(res.leadOrigin);
    setActivities(res.activities);

    if (res.customer) {
      const enqRes = await getEnquiries({ customerId: res.customer.id });
      setEnquiries(enqRes.enquiries);

      const qtnRes = await getQuotations({ customerId: res.customer.id });
      setQuotations(qtnRes.quotations);

      const ordRes = await getOrders({ customerId: res.customer.id });
      setOrders(ordRes.orders);
    }
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  if (isLoading) return <LoadingState message="Fetching customer profile & account history..." />;
  if (!customer) return <ErrorState title="Customer Profile Not Found" message="The requested customer record could not be found." />;

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setIsSubmitting(true);
    const res = await updateCustomerStatusAction(customer.id, newStatus);
    setIsSubmitting(false);
    if (!res.success) setActionError(res.error || 'Failed to update status.');
    else loadCustomerData();
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateCustomerAction(customer.id, formData);

    setIsSubmitting(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to update customer profile.');
    } else {
      setIsEditModalOpen(false);
      loadCustomerData();
    }
  };

  const handleAddEnquirySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('customerId', customer.id);
    formData.append('contactPerson', customer.name);

    const res = await createEnquiryAction(formData);

    setIsSubmitting(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to create enquiry.');
    } else {
      setIsAddEnquiryModalOpen(false);
      loadCustomerData();
    }
  };

  const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
  const cleanWhatsapp = (customer.whatsapp_number || customer.phone).replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 border border-outline-variant rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          </Link>
          <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-headline-md font-bold text-xl">
            {customer.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold">{customer.name}</h1>
              <Badge variant={customer.status === 'active' ? 'success' : customer.status === 'inactive' ? 'neutral' : 'warning'}>
                {customer.status.toUpperCase()}
              </Badge>
              <Badge variant="gold">{customer.business_type.toUpperCase()}</Badge>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              {customer.company_name ? `${customer.company_name} • ` : ''}Code: {customer.customer_code} • Location: {customer.location || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={`tel:${cleanPhone}`}>
            <Button variant="outline" size="sm" icon="call">Call</Button>
          </a>
          <a href={`https://wa.me/${cleanWhatsapp}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" icon="chat">WhatsApp</Button>
          </a>
          <Button variant="secondary" size="sm" icon="edit" onClick={() => setIsEditModalOpen(true)}>Edit Profile</Button>
          <Link href="/orders">
            <Button variant="primary" size="sm" icon="add_shopping_cart">Create Order</Button>
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-sm flex items-center gap-2 font-body-md">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-outline-variant gap-4 text-xs md:text-sm font-label-md overflow-x-auto custom-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'enquiries', label: `Enquiries (${enquiries.length})` },
          { id: 'followups', label: 'Follow-ups' },
          { id: 'quotations', label: `Quotations (${quotations.length})` },
          { id: 'orders', label: `Orders (${orders.length})` },
          { id: 'activities', label: 'Activity Timeline' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-3 px-1 capitalize transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Account Profile &amp; Contact Details">
              <div className="space-y-6">
                <div className="p-4 bg-surface-bright rounded-xl border border-outline-variant/60 flex items-center justify-between">
                  <div>
                    <span className="font-label-md text-xs text-on-surface-variant uppercase">Account Status</span>
                    <p className="text-xs text-on-surface-variant mt-0.5">Controls ordering eligibility</p>
                  </div>
                  <select
                    value={customer.status}
                    onChange={handleStatusChange}
                    disabled={isSubmitting}
                    className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-1 text-xs font-label-md font-semibold text-primary"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="potential">POTENTIAL</option>
                    <option value="inactive">INACTIVE</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm font-body-md">
                  <div>
                    <span className="text-xs text-on-surface-variant font-label-md uppercase">Contact Phone</span>
                    <p className="font-semibold text-on-surface">{customer.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant font-label-md uppercase">WhatsApp</span>
                    <p className="font-semibold text-on-surface">{customer.whatsapp_number || customer.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant font-label-md uppercase">Email Address</span>
                    <p className="font-semibold text-on-surface">{customer.email || 'None'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant font-label-md uppercase">Full Address</span>
                    <p className="font-semibold text-on-surface">{customer.location || 'Not specified'}</p>
                  </div>
                </div>

                {customer.notes && (
                  <div className="p-4 bg-surface rounded-lg border border-outline-variant/60">
                    <span className="text-xs text-on-surface-variant font-label-md uppercase block mb-1">Account Notes</span>
                    <p className="text-xs text-on-surface whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                )}
              </div>
            </Card>

            {leadOrigin && (
              <Card title="Lead Acquisition Origin" subtitle="Original converted prospect data">
                <div className="p-4 bg-surface-bright border border-outline-variant/60 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-primary">Original Lead: {leadOrigin.lead_code}</span>
                    <Badge variant="success">CONVERTED</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-body-sm text-on-surface-variant">
                    <div>Source Channel: <strong className="text-on-surface capitalize">{leadOrigin.lead_source}</strong></div>
                    <div>Created Date: <strong className="text-on-surface">{new Date(leadOrigin.created_at).toLocaleDateString()}</strong></div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card title="Financial Snapshot">
              <div className="space-y-4 font-body-md">
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">Lifetime Revenue</span>
                  <p className="text-3xl font-bold text-primary">
                    ₹{Number(customer.total_revenue || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">Orders Completed</span>
                  <p className="text-lg font-semibold text-on-surface">{customer.total_orders_count || 0} Orders</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Enquiries */}
      {activeTab === 'enquiries' && (
        <Card
          title="Customer Product Enquiries"
          headerAction={
            <Button variant="primary" size="sm" icon="add" onClick={() => setIsAddEnquiryModalOpen(true)}>
              Add Enquiry
            </Button>
          }
        >
          {enquiries.length === 0 ? (
            <EmptyState
              title="No enquiries yet"
              description="No product enquiries have been logged for this customer profile yet."
              actionLabel="Add Enquiry"
              onAction={() => setIsAddEnquiryModalOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {enquiries.map((enq) => (
                <div key={enq.id} className="p-4 rounded-xl border border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/enquiries/${enq.id}`} className="font-bold text-primary hover:underline">
                        {enq.enquiry_code}
                      </Link>
                      <Badge variant="gold">{enq.status.replace('_', ' ').toUpperCase()}</Badge>
                      <Badge variant="maroon">{enq.priority.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-on-surface mt-1">{enq.product_category}</p>
                    <p className="text-xs text-on-surface-variant font-label-md mt-0.5">Expected Qty: {enq.expected_quantity}</p>
                  </div>
                  <Link href={`/enquiries/${enq.id}`}>
                    <Button variant="outline" size="sm" icon="visibility">View Details</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Quotations */}
      {activeTab === 'quotations' && (
        <Card
          title="Price Quotations"
          headerAction={
            <Link href="/quotations">
              <Button variant="primary" size="sm" icon="request_quote">Create Quotation</Button>
            </Link>
          }
        >
          {quotations.length === 0 ? (
            <EmptyState
              title="No quotations yet"
              description="No commercial price proposals have been generated for this account yet."
              actionLabel="Create Quotation"
              onAction={() => (window.location.href = '/quotations')}
            />
          ) : (
            <div className="space-y-3">
              {quotations.map((qtn) => (
                <div key={qtn.id} className="p-4 rounded-xl border border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/quotations/${qtn.id}`} className="font-bold text-primary hover:underline">
                        {qtn.quotation_number}
                      </Link>
                      <Badge variant={qtn.status === 'accepted' ? 'success' : qtn.status === 'rejected' ? 'error' : 'info'}>
                        {qtn.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold text-on-surface mt-1">₹{Number(qtn.total_amount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-on-surface-variant font-label-md mt-0.5">Valid until: {new Date(qtn.valid_until).toLocaleDateString('en-IN')}</p>
                  </div>
                  <Link href={`/quotations/${qtn.id}`}>
                    <Button variant="outline" size="sm" icon="visibility">View Document</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Orders */}
      {activeTab === 'orders' && (
        <Card
          title="Confirmed Purchase Orders"
          headerAction={
            <Link href="/orders">
              <Button variant="primary" size="sm" icon="add_shopping_cart">Create Order</Button>
            </Link>
          }
        >
          {orders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="No confirmed purchase orders have been processed for this customer yet."
              actionLabel="Create Order"
              onAction={() => (window.location.href = '/orders')}
            />
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord.id} className="p-4 rounded-xl border border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/orders/${ord.id}`} className="font-bold text-primary hover:underline">
                        {ord.order_number}
                      </Link>
                      <Badge variant={ord.delivery_status === 'delivered' ? 'success' : 'gold'}>
                        {ord.delivery_status.toUpperCase()}
                      </Badge>
                      <Badge variant={ord.payment_status === 'paid' ? 'success' : 'neutral'}>
                        {ord.payment_status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold text-on-surface mt-1">₹{Number(ord.total_amount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-on-surface-variant font-label-md mt-0.5">Order Date: {new Date(ord.order_date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <Link href={`/orders/${ord.id}`}>
                    <Button variant="outline" size="sm" icon="visibility">View Invoice</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Prepared Empty States */}
      {activeTab === 'followups' && (
        <EmptyState
          title="No follow-ups scheduled"
          description="There are no active touchpoints scheduled for this customer profile."
          actionLabel="Schedule Follow-up"
          onAction={() => (window.location.href = '/follow-ups')}
        />
      )}

      {activeTab === 'activities' && (
        <Card title="Customer Activity Audit Log">
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
      )}

      {/* Edit Customer Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer Profile">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input label="Customer Name *" name="name" defaultValue={customer.name} required />
          <Input label="Company Name" name="companyName" defaultValue={customer.company_name || ''} />
          <Input label="Phone Number *" name="phone" defaultValue={customer.phone} required />
          <Input label="Email Address" name="email" defaultValue={customer.email || ''} />
          <Input label="Location" name="location" defaultValue={customer.location || ''} />
          <Select
            label="Business Type"
            name="businessType"
            defaultValue={customer.business_type}
            options={[
              { label: 'Retailer', value: 'retailer' },
              { label: 'Distributor', value: 'distributor' },
              { label: 'Wholesaler', value: 'wholesaler' },
              { label: 'Manufacturer', value: 'manufacturer' },
              { label: 'Restaurant', value: 'restaurant' },
            ]}
          />
          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Account Notes</label>
            <textarea name="notes" defaultValue={customer.notes || ''} rows={3} className="w-full border p-2 rounded text-sm bg-surface-bright" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Contextual Add Enquiry Modal */}
      <Modal isOpen={isAddEnquiryModalOpen} onClose={() => setIsAddEnquiryModalOpen(false)} title={`Log Enquiry for ${customer.name}`}>
        <form onSubmit={handleAddEnquirySubmit} className="space-y-4">
          <Input label="Product Category / Spices Required *" name="productCategory" required placeholder="e.g. 100g Sambar & Garam Masala" />
          <Input label="Expected Quantity *" name="expectedQuantity" required placeholder="e.g. 500 Units Monthly" />
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
            <textarea name="notes" rows={3} placeholder="Enter specific packaging or price targets..." className="w-full border p-2 rounded text-sm bg-surface-bright" />
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
