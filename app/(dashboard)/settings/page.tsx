'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { getCRMSettings, updateCompanySettingsAction, getTeamProfiles, updateUserRoleAction } from '@/lib/actions/settings.actions';
import { SettingsRow, ProfileRow, UserRole } from '@/types/database';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsRow | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'company' | 'roles' | 'defaults'>('company');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const setRes = await getCRMSettings();
    const profRes = await getTeamProfiles();
    setSettings(setRes);
    setProfiles(profRes);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading || !settings) return <LoadingState message="Loading CRM administration controls..." />;

  const handleSaveCompanySettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateCompanySettingsAction(formData);

    setIsSubmitting(false);

    if (!res.success) {
      setFeedbackMessage({ type: 'error', message: res.error || 'Failed to update company settings.' });
    } else {
      setFeedbackMessage({ type: 'success', message: 'Company settings updated successfully.' });
      loadData();
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const res = await updateUserRoleAction(userId, newRole);

    setIsSubmitting(false);

    if (!res.success) {
      setFeedbackMessage({ type: 'error', message: res.error || 'Failed to update user role.' });
    } else {
      setFeedbackMessage({ type: 'success', message: 'User authorization role updated successfully.' });
      loadData();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">System Settings &amp; Administration</h2>
          <p className="font-body-md text-on-surface-variant font-medium">Manage company tax profile, team access roles, privilege escalation safety, and commercial terms defaults.</p>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 font-body-md ${
            feedbackMessage.type === 'error'
              ? 'bg-error-container/40 border border-error/30 text-on-error-container'
              : 'bg-tertiary-container/30 border border-tertiary/30 text-tertiary-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {feedbackMessage.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{feedbackMessage.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-outline-variant gap-4 text-xs md:text-sm font-label-md">
        {[
          { id: 'company', label: 'Company Profile & GST' },
          { id: 'roles', label: 'Team Roles & Permissions' },
          { id: 'defaults', label: 'Commercial Master Defaults' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-3 px-1 capitalize transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Company Profile */}
      {activeTab === 'company' && (
        <Card title="Company Profile &amp; Legal Tax Identity">
          <form onSubmit={handleSaveCompanySettings} className="space-y-4">
            <Input label="Company Name *" name="companyName" defaultValue={settings.company_name} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Support Email Address" name="supportEmail" defaultValue={settings.support_email} />
              <Input label="GSTIN Tax Identification Number" name="taxGstin" defaultValue={settings.tax_gstin} />
            </div>

            <div>
              <label className="block font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
                Default Commercial Quotation Terms
              </label>
              <textarea
                name="defaultTerms"
                rows={4}
                defaultValue={settings.default_quotation_terms || ''}
                className="w-full bg-surface-bright border border-outline-variant rounded-md p-3 text-sm font-body-md text-on-surface"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-outline-variant">
              <Button variant="primary" type="submit" isLoading={isSubmitting} icon="save">
                Save Company Preferences
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: User Access Roles */}
      {activeTab === 'roles' && (
        <Card title="Team Member Roles &amp; Security Privileges" subtitle="Privilege escalation protection enforced">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-bright font-label-md uppercase text-on-surface-variant">
                  <th className="p-3">Team Member</th>
                  <th className="p-3">Contact Email</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 font-body-sm">
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-bold text-on-surface">{p.full_name}</td>
                    <td className="p-3 text-on-surface-variant">{p.email}</td>
                    <td className="p-3">
                      <select
                        value={p.role}
                        onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                        disabled={isSubmitting}
                        className="bg-surface border border-outline-variant rounded px-2 py-1 text-xs font-semibold text-primary"
                      >
                        <option value="admin">Administrator</option>
                        <option value="sales_manager">Sales Manager</option>
                        <option value="sales_executive">Sales Executive</option>
                        <option value="marketing">Marketing</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={p.is_active ? 'success' : 'neutral'}>{p.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: Master Defaults */}
      {activeTab === 'defaults' && (
        <Card title="Commercial Master Defaults">
          <div className="space-y-4 text-xs font-body-md text-on-surface">
            <div className="p-3 bg-surface rounded-xl border border-outline-variant/60 flex justify-between items-center">
              <div>
                <strong className="block text-sm">Standard GST Tax Rate</strong>
                <span className="text-on-surface-variant">Applied to Quotations, Purchase Orders, and Tax Invoices</span>
              </div>
              <Badge variant="gold">5% Standard GST</Badge>
            </div>

            <div className="p-3 bg-surface rounded-xl border border-outline-variant/60 flex justify-between items-center">
              <div>
                <strong className="block text-sm">Low Stock Alert Reorder Threshold</strong>
                <span className="text-on-surface-variant">Triggers automated warehouse low stock notifications</span>
              </div>
              <Badge variant="maroon">&le; 100 Units</Badge>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
