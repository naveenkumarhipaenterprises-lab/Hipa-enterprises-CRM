'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActivityRow } from '@/types/database';

export interface WorkflowRule {
  id: string;
  name: string;
  triggerEvent: string;
  action: string;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt: string | null;
}

// 1. GET AUTOMATION WORKFLOW RULES & EXECUTION LOGS
export async function getAutomationWorkflows(): Promise<{ rules: WorkflowRule[]; logs: ActivityRow[] }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  const demoRules: WorkflowRule[] = [
    {
      id: 'wf-1',
      name: 'Lead Auto-Assignment & Initial Follow-up',
      triggerEvent: 'Lead Created',
      action: 'Assign default rep & schedule 48-hour follow-up task',
      isActive: true,
      executionCount: 42,
      lastExecutedAt: new Date(Date.now() - 86400000 * 0.2).toISOString(),
    },
    {
      id: 'wf-2',
      name: 'Low Stock Auto-Alert Trigger',
      triggerEvent: 'Inventory Balance <= 100',
      action: 'Send high-priority notification to Warehouse Manager',
      isActive: true,
      executionCount: 18,
      lastExecutedAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    },
    {
      id: 'wf-3',
      name: 'Order Confirmation Inventory Reserve',
      triggerEvent: 'Order Confirmed',
      action: 'Check warehouse stock & issue dispatch manifest',
      isActive: true,
      executionCount: 31,
      lastExecutedAt: new Date(Date.now() - 86400000 * 1.1).toISOString(),
    },
    {
      id: 'wf-4',
      name: 'Tax Invoice Payment Reminder',
      triggerEvent: 'Invoice Issued',
      action: 'Schedule 7-day payment reminder notification',
      isActive: true,
      executionCount: 27,
      lastExecutedAt: new Date(Date.now() - 86400000 * 2.0).toISOString(),
    },
  ];

  if (isPlaceholderMode) {
    return { rules: demoRules, logs: [] };
  }

  const supabase = await createClient();

  const { data: logs } = await supabase
    .from('activities')
    .select('*')
    .eq('action_type', 'automated_workflow')
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    rules: demoRules,
    logs: (logs || []) as ActivityRow[],
  };
}

// 2. IDEMPOTENT AUTOMATION WORKFLOW TRIGGER: LEAD CREATION
export async function triggerLeadAutomationWorkflow(
  leadId: string,
  leadCode: string,
  assignedTo?: string
): Promise<{ success: boolean }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) return { success: true };

  const supabase = await createClient();

  // Idempotency Check: Verify if workflow already ran for this lead
  const { data: existingLog } = await supabase
    .from('activities')
    .select('id')
    .eq('entity_type', 'lead')
    .eq('entity_id', leadId)
    .eq('action_type', 'automated_workflow')
    .maybeSingle();

  if (existingLog) return { success: true }; // Already executed safely

  const targetRep = assignedTo || 'demo-user-101';
  const dueDate = new Date(Date.now() + 86400000 * 2).toISOString();

  // 1. Create Follow-up Task automatically
  await supabase.from('followups').insert({
    lead_id: leadId,
    title: `Initial Lead Outreach: ${leadCode}`,
    purpose: 'Automated workflow: Contact new lead within 48 hours',
    followup_date: dueDate.split('T')[0],
    followup_time: '10:00',
    method: 'call',
    assigned_to: targetRep,
    priority: 'high',
    status: 'pending',
    outcome: null,
    customer_response: null,
    set_reminder: true,
  });

  // 2. Create In-App Notification
  await supabase.from('notifications').insert({
    user_id: targetRep,
    title: `New Lead Auto-Assigned: ${leadCode}`,
    message: `Lead ${leadCode} assigned. Follow-up scheduled for ${dueDate.split('T')[0]}.`,
    link: `/leads/${leadId}`,
    read_status: false,
  });

  // 3. Log Audit Activity with is_automated = true
  await supabase.from('activities').insert({
    entity_type: 'lead',
    entity_id: leadId,
    action_type: 'automated_workflow',
    description: `Automated Lead Workflow executed: Assigned to rep & 48h follow-up task scheduled`,
    performed_by: 'system_automation',
    metadata: { is_automated: true, workflow_id: 'wf-1' },
  });

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

// 3. IDEMPOTENT AUTOMATION WORKFLOW TRIGGER: LOW STOCK ALERT
export async function triggerLowStockAutomationWorkflow(
  variantId: string,
  productName: string,
  currentStock: number
): Promise<{ success: boolean }> {
  if (currentStock > 100) return { success: true };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) return { success: true };

  const supabase = await createClient();

  // Idempotency Check: Prevent spamming duplicate low stock alerts within 24h
  const yesterdayISO = new Date(Date.now() - 86400000).toISOString();
  const { data: existingLog } = await supabase
    .from('activities')
    .select('id')
    .eq('entity_type', 'inventory')
    .eq('entity_id', variantId)
    .eq('action_type', 'automated_workflow')
    .gte('created_at', yesterdayISO)
    .maybeSingle();

  if (existingLog) return { success: true };

  // Create High-Priority Notification for Admin
  await supabase.from('notifications').insert({
    user_id: 'demo-user-101',
    title: `Low Stock Alert: ${productName}`,
    message: `Stock level dropped to ${currentStock} units (Threshold: 100). Please issue Purchase Order.`,
    link: '/inventory',
    read_status: false,
  });

  await supabase.from('activities').insert({
    entity_type: 'inventory',
    entity_id: variantId,
    action_type: 'automated_workflow',
    description: `Automated Stock Workflow executed: Low stock alert issued for ${productName} (${currentStock} units)`,
    performed_by: 'system_automation',
    metadata: { is_automated: true, workflow_id: 'wf-2', current_stock: currentStock },
  });

  revalidatePath('/inventory');
  return { success: true };
}
