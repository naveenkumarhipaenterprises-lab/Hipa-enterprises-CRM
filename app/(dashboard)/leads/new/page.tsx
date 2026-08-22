'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createLeadAction, getActiveEmployees } from '@/lib/actions/lead.actions';
import { UserProfile } from '@/types/database';
import Link from 'next/link';

export default function AddLeadPage() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['whole_spices']);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getActiveEmployees().then(setEmployees);
  }, []);

  const toggleProduct = (val: string) => {
    setSelectedProducts((prev) =>
      prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.append('productInterests', selectedProducts.join(','));

    const res = await createLeadAction(formData);

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to create lead. Please check your inputs.');
      setIsLoading(false);
    } else {
      window.location.href = `/leads/${res.leadId}`;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-4 md:p-6 border border-outline-variant rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/leads">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          </Link>
          <div>
            <h1 className="font-headline-md text-headline-md text-primary font-bold">Add New Lead</h1>
            <p className="font-body-sm text-xs text-on-surface-variant">Enter details to create a new prospective client profile.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/leads">
            <Button variant="outline" size="sm">Cancel</Button>
          </Link>
          <Button variant="primary" size="sm" icon="save" isLoading={isLoading} form="add-lead-form" type="submit">
            Save Lead
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-sm flex items-center gap-2 font-body-md">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form id="add-lead-form" onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Basic Information */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-headline-sm text-primary font-bold border-b border-outline-variant pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">person</span>
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="First &amp; Last Name *" name="fullName" required placeholder="e.g. John Doe" />
            <Input label="Company Name" name="companyName" placeholder="e.g. Global Spices Ltd." />
            <Input label="Phone Number *" name="phone" required placeholder="+91 98765 00000" />
            <Input label="WhatsApp Number" name="whatsappNumber" placeholder="Same as phone if left blank" />
            <Input label="Email Address" name="email" type="email" placeholder="john@example.com" />
            <div className="col-span-1 md:col-span-2">
              <Input label="Location / Address" name="location" icon="location_on" placeholder="City, Region, or Full Address" />
            </div>
          </div>
        </section>

        {/* 2. Business Information */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-headline-sm text-primary font-bold border-b border-outline-variant pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">store</span>
            Business Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Business Type"
              name="businessType"
              options={[
                { label: 'Retailer', value: 'retailer' },
                { label: 'Distributor', value: 'distributor' },
                { label: 'Wholesaler', value: 'wholesaler' },
                { label: 'Food Manufacturer', value: 'manufacturer' },
                { label: 'Restaurant / Hospitality', value: 'restaurant' },
                { label: 'Other', value: 'other' },
              ]}
              defaultValue="retailer"
            />
            <Select
              label="Lead Source"
              name="leadSource"
              options={[
                { label: 'Website Form', value: 'website' },
                { label: 'Trade Show', value: 'trade_show' },
                { label: 'Referral', value: 'referral' },
                { label: 'Cold Call', value: 'cold_call' },
                { label: 'Social Media', value: 'social_media' },
              ]}
              defaultValue="website"
            />
          </div>
        </section>

        {/* 3. Lead Details */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4">
          <h2 className="font-headline-sm text-headline-sm text-primary font-bold border-b border-outline-variant pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">assignment_ind</span>
            Lead Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Initial Status"
              name="status"
              options={[
                { label: 'New Lead', value: 'new' },
                { label: 'Contacted', value: 'contacted' },
                { label: 'Qualified', value: 'qualified' },
              ]}
              defaultValue="new"
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

            {/* Chips for product interest */}
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase text-[10px] tracking-wider">
                Product Interest (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'whole_spices', label: 'Whole Spices' },
                  { id: 'ground_spices', label: 'Ground Spices' },
                  { id: 'blends', label: 'Spice Blends (Masalas)' },
                  { id: 'organic', label: 'Organic Range' },
                  { id: 'bulk', label: 'Bulk Packaging' },
                ].map((chip) => {
                  const isSelected = selectedProducts.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => toggleProduct(chip.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-label-md transition-all ${
                        isSelected
                          ? 'bg-primary-container text-on-primary border border-primary-container'
                          : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input label="Estimated Deal Value (₹)" name="estimatedValue" type="number" placeholder="0.00" />
            
            <Select
              label="Assign To Employee"
              name="assignedTo"
              options={[
                { label: 'Me (Current User)', value: 'me' },
                ...employees.map((e) => ({ label: `${e.fullName} (${e.role})`, value: e.id })),
              ]}
              defaultValue="me"
            />

            <div className="col-span-1 md:col-span-2">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase text-[10px] tracking-wider mb-1">
                Internal Notes
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Add any preliminary context about this lead..."
                className="w-full bg-surface-bright border border-outline-variant rounded-md font-body-md text-on-surface p-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
