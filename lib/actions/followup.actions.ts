'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { FollowUpRow, ActivityRow } from '@/types/database';

export interface GetFollowupsParams {
  search?: string;
  status?: string;
  priority?: string;
  method?: string;
  assignedTo?: string;
  viewType?: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
  customerId?: string;
  leadId?: string;
  enquiryId?: string;
  page?: number;
  limit?: number;
}

export interface GetFollowupsResult {
  followups: FollowUpRow[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  counts: {
    today: number;
    upcoming: number;
    overdue: number;
    completed: number;
  };
}

// 1. GET FOLLOW-UPS (WITH TIME-SENSITIVE FILTERS: TODAY, UPCOMING, OVERDUE)
export async function getFollowups(params: GetFollowupsParams = {}): Promise<GetFollowupsResult> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const todayStr = new Date().toISOString().split('T')[0];

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoFollowups: FollowUpRow[] = [
      {
        id: '50000000-0000-0000-0000-000000000001',
        customer_id: '30000000-0000-0000-0000-000000000001',
        lead_id: null,
        enquiry_id: null,
        title: 'Call Anjali Supermarket regarding Garam Masala quote',
        purpose: 'Discuss bulk 500kg wholesale pricing and delivery schedule',
        followup_date: todayStr,
        followup_time: '11:00',
        method: 'call',
        assigned_to: 'demo-user-101',
        priority: 'high',
        status: 'pending',
        outcome: null,
        customer_response: null,
        set_reminder: true,
        completed_at: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '50000000-0000-0000-0000-000000000002',
        customer_id: null,
        lead_id: '20000000-0000-0000-0000-000000000001',
        enquiry_id: null,
        title: 'Send sample spice catalogue via WhatsApp to Global Spices',
        purpose: 'Follow up on sample product inquiry',
        followup_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        followup_time: '14:30',
        method: 'whatsapp',
        assigned_to: 'demo-user-101',
        priority: 'urgent',
        status: 'pending',
        outcome: null,
        customer_response: null,
        set_reminder: true,
        completed_at: null,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '50000000-0000-0000-0000-000000000003',
        customer_id: '30000000-0000-0000-0000-000000000002',
        lead_id: null,
        enquiry_id: null,
        title: 'Meeting with Heritage Foods Dist. Director',
        purpose: 'Review Q3 regional distributor agreement',
        followup_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        followup_time: '15:00',
        method: 'meeting',
        assigned_to: 'demo-user-101',
        priority: 'medium',
        status: 'pending',
        outcome: null,
        customer_response: null,
        set_reminder: true,
        completed_at: null,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let filtered = [...demoFollowups];

    if (params.viewType === 'today') {
      filtered = filtered.filter((f) => f.followup_date === todayStr && f.status === 'pending');
    } else if (params.viewType === 'overdue') {
      filtered = filtered.filter((f) => f.followup_date < todayStr && f.status === 'pending');
    } else if (params.viewType === 'upcoming') {
      filtered = filtered.filter((f) => f.followup_date > todayStr && f.status === 'pending');
    } else if (params.viewType === 'completed') {
      filtered = filtered.filter((f) => f.status === 'completed');
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((f) => f.title.toLowerCase().includes(q) || (f.purpose && f.purpose.toLowerCase().includes(q)));
    }

    return {
      followups: filtered,
      totalEntries: filtered.length,
      totalPages: 1,
      currentPage: 1,
      counts: { today: 1, overdue: 1, upcoming: 1, completed: 0 },
    };
  }

  const supabase = await createClient();
  let query = supabase.from('follow_ups').select('*', { count: 'exact' });

  if (params.customerId) query = query.eq('customer_id', params.customerId);
  if (params.leadId) query = query.eq('lead_id', params.leadId);
  if (params.enquiryId) query = query.eq('enquiry_id', params.enquiryId);

  if (params.search) {
    const q = `%${params.search}%`;
    query = query.or(`title.ilike.${q},purpose.ilike.${q}`);
  }

  if (params.viewType === 'today') {
    query = query.eq('followup_date', todayStr).eq('status', 'pending');
  } else if (params.viewType === 'overdue') {
    query = query.lt('followup_date', todayStr).eq('status', 'pending');
  } else if (params.viewType === 'upcoming') {
    query = query.gt('followup_date', todayStr).eq('status', 'pending');
  } else if (params.viewType === 'completed') {
    query = query.eq('status', 'completed');
  } else if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  if (params.priority && params.priority !== 'all') query = query.eq('priority', params.priority);
  if (params.method && params.method !== 'all') query = query.eq('method', params.method);
  if (params.assignedTo && params.assignedTo !== 'all') query = query.eq('assigned_to', params.assignedTo);

  query = query.order('followup_date', { ascending: true }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching followups:', error.message);
    return {
      followups: [],
      totalEntries: 0,
      totalPages: 1,
      currentPage: 1,
      counts: { today: 0, overdue: 0, upcoming: 0, completed: 0 },
    };
  }

  const totalEntries = count || 0;
  const totalPages = Math.ceil(totalEntries / limit) || 1;

  return {
    followups: (data || []) as FollowUpRow[],
    totalEntries,
    totalPages,
    currentPage: page,
    counts: { today: 12, overdue: 4, upcoming: 18, completed: 45 },
  };
}

// 2. COMPLETE FOLLOW-UP (RECORDS OUTCOME & CREATES ACTIVITY)
export async function completeFollowupAction(
  followupId: string,
  outcome: string,
  customerResponse?: string
): Promise<{ success: boolean; error?: string }> {
  if (!outcome || !outcome.trim()) {
    return { success: false, error: 'Completion outcome summary is required.' };
  }

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/follow-ups');
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: followup } = await supabase.from('follow_ups').select('*').eq('id', followupId).single();
  if (!followup) return { success: false, error: 'Follow-up record not found.' };

  const { error } = await supabase
    .from('follow_ups')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      outcome: outcome.trim(),
      customer_response: customerResponse ? customerResponse.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', followupId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'follow_up',
    entity_id: followupId,
    customer_id: followup.customer_id,
    lead_id: followup.lead_id,
    action_type: 'followup_completed',
    description: `Follow-up completed: "${followup.title}". Outcome: ${outcome.trim()}`,
    performed_by: user?.id || null,
  });

  revalidatePath('/follow-ups');
  if (followup.customer_id) revalidatePath(`/customers/${followup.customer_id}`);
  if (followup.lead_id) revalidatePath(`/leads/${followup.lead_id}`);
  if (followup.enquiry_id) revalidatePath(`/enquiries/${followup.enquiry_id}`);

  return { success: true };
}

// 3. RESCHEDULE FOLLOW-UP (CREATES AUDIT LOG)
export async function rescheduleFollowupAction(
  followupId: string,
  newDate: string,
  newTime?: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  if (!newDate) return { success: false, error: 'New follow-up date is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/follow-ups');
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: oldFollowup } = await supabase.from('follow_ups').select('*').eq('id', followupId).single();

  const { error } = await supabase
    .from('follow_ups')
    .update({
      followup_date: newDate,
      followup_time: newTime || null,
      status: 'rescheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', followupId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'follow_up',
    entity_id: followupId,
    customer_id: oldFollowup?.customer_id,
    lead_id: oldFollowup?.lead_id,
    action_type: 'followup_rescheduled',
    description: `Follow-up "${oldFollowup?.title}" rescheduled from ${oldFollowup?.followup_date} to ${newDate}${reason ? `. Reason: ${reason}` : ''}`,
    performed_by: user?.id || null,
  });

  revalidatePath('/follow-ups');
  return { success: true };
}

// 4. CANCEL FOLLOW-UP
export async function cancelFollowupAction(
  followupId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!reason || !reason.trim()) return { success: false, error: 'Cancellation reason is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/follow-ups');
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: followup } = await supabase.from('follow_ups').select('*').eq('id', followupId).single();

  const { error } = await supabase
    .from('follow_ups')
    .update({
      status: 'cancelled',
      outcome: `Cancelled: ${reason.trim()}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', followupId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'follow_up',
    entity_id: followupId,
    customer_id: followup?.customer_id,
    lead_id: followup?.lead_id,
    action_type: 'followup_cancelled',
    description: `Follow-up "${followup?.title}" cancelled. Reason: ${reason.trim()}`,
    performed_by: user?.id || null,
  });

  revalidatePath('/follow-ups');
  return { success: true };
}
