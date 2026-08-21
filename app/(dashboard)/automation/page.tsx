'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { getAutomationWorkflows, WorkflowRule } from '@/lib/actions/automation.actions';
import { ActivityRow } from '@/types/database';

export default function AutomationPage() {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [logs, setLogs] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await getAutomationWorkflows();
    setRules(res.rules);
    setLogs(res.logs);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) return <LoadingState message="Loading CRM automation rules engine..." />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">CRM Automation &amp; Workflows</h2>
          <p className="font-body-md text-on-surface-variant font-medium">Deterministic business rules, automated task scheduling, low stock alerts, and idempotent event triggers.</p>
        </div>
        <Button variant="outline" icon="refresh" onClick={loadData}>
          Refresh Engine
        </Button>
      </div>

      {/* Idempotency & Security Banner */}
      <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-start gap-3 text-xs font-body-sm text-on-surface">
        <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">verified_user</span>
        <div className="space-y-1">
          <p className="font-bold text-on-surface text-sm">Deterministic &amp; Idempotent Business Workflows</p>
          <p className="text-on-surface-variant">
            All CRM automation workflows run via server-authoritative logic. They enforce strict idempotency checks to prevent duplicate task scheduling, duplicate stock deductions, or duplicate customer notifications. Automated actions are logged in the audit ledger under <code className="bg-surface px-1.5 py-0.5 rounded text-primary">performed_by = &apos;system_automation&apos;</code>.
          </p>
        </div>
      </div>

      {/* Active Rules Grid */}
      <Card title="Active Business Workflow Rules" subtitle="Server-side automated triggers">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-bright font-label-md uppercase text-on-surface-variant">
                <th className="p-3">Workflow Rule Name</th>
                <th className="p-3">Trigger Event</th>
                <th className="p-3">Automated System Action</th>
                <th className="p-3 text-center">Executions</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 font-body-sm">
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="p-3 font-bold text-primary">{r.name}</td>
                  <td className="p-3 font-semibold text-on-surface">{r.triggerEvent}</td>
                  <td className="p-3 text-on-surface-variant">{r.action}</td>
                  <td className="p-3 text-center font-bold text-tertiary-container">{r.executionCount} runs</td>
                  <td className="p-3 text-center">
                    <Badge variant={r.isActive ? 'success' : 'neutral'}>{r.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Automation Execution Logs */}
      <Card title="Recent Automated Executions Log" subtitle="System-generated activity audit trail">
        {logs.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-4">No recent automated workflow executions logged.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-surface rounded-xl border border-outline-variant/60 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">smart_toy</span>
                  <span className="font-medium text-on-surface">{log.description}</span>
                </div>
                <span className="text-[10px] text-on-surface-variant font-label-md">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
