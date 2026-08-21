'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { EnquiryRow, LeadRow, ActivityRow } from '@/types/database';

export type PipelineStage = 'new' | 'qualified' | 'proposal_sent' | 'negotiation' | 'converted' | 'lost';

export interface PipelineOpportunity {
  id: string;
  code: string;
  contactName: string;
  companyName: string | null;
  productCategory: string;
  estimatedValue: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  stage: PipelineStage;
  assignedTo: string | null;
  nextFollowupDate: string | null;
  createdAt: string;
}

export interface GetPipelineResult {
  columns: Record<PipelineStage, PipelineOpportunity[]>;
  summary: {
    totalOpportunities: number;
    totalPipelineValue: number;
    wonValue: number;
    lostValue: number;
  };
}

// 1. GET PIPELINE OPPORTUNITIES (GROUPED BY STAGE WITH FINANCIAL TOTALS)
export async function getPipelineOpportunities(params: {
  search?: string;
  priority?: string;
  assignedTo?: string;
} = {}): Promise<GetPipelineResult> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoOpps: PipelineOpportunity[] = [
      {
        id: 'opp-1',
        code: 'HIPA-ENQ-2001',
        contactName: 'Rajesh Kumar',
        companyName: 'Anjali Supermarket',
        productCategory: '100g Sambar & Garam Masala',
        estimatedValue: 150000.0,
        priority: 'high',
        stage: 'new',
        assignedTo: 'demo-user-101',
        nextFollowupDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'opp-2',
        code: 'HIPA-ENQ-2002',
        contactName: 'Vikram Singh',
        companyName: 'Heritage Foods Dist.',
        productCategory: 'Bulk Turmeric & Red Chilli',
        estimatedValue: 850000.0,
        priority: 'urgent',
        stage: 'qualified',
        assignedTo: 'demo-user-101',
        nextFollowupDate: new Date(Date.now() + 86400000 * 1).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'opp-3',
        code: 'HIPA-ENQ-2003',
        contactName: 'Priya Sharma',
        companyName: 'Spice Route Traders',
        productCategory: 'Whole Black Pepper 1kg',
        estimatedValue: 320000.0,
        priority: 'medium',
        stage: 'proposal_sent',
        assignedTo: 'demo-user-101',
        nextFollowupDate: new Date(Date.now() + 86400000 * 4).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
      {
        id: 'opp-4',
        code: 'HIPA-ENQ-2004',
        contactName: 'Suresh Patel',
        companyName: 'Metro Grocers',
        productCategory: 'Chicken & Mutton Masala 500g',
        estimatedValue: 420000.0,
        priority: 'high',
        stage: 'negotiation',
        assignedTo: 'demo-user-101',
        nextFollowupDate: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
      {
        id: 'opp-5',
        code: 'HIPA-ENQ-2005',
        contactName: 'Amit Shah',
        companyName: 'Star Retail',
        productCategory: 'Organic Spice Blend Range',
        estimatedValue: 650000.0,
        priority: 'urgent',
        stage: 'converted',
        assignedTo: 'demo-user-101',
        nextFollowupDate: null,
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      },
    ];

    const columns: Record<PipelineStage, PipelineOpportunity[]> = {
      new: demoOpps.filter((o) => o.stage === 'new'),
      qualified: demoOpps.filter((o) => o.stage === 'qualified'),
      proposal_sent: demoOpps.filter((o) => o.stage === 'proposal_sent'),
      negotiation: demoOpps.filter((o) => o.stage === 'negotiation'),
      converted: demoOpps.filter((o) => o.stage === 'converted'),
      lost: [],
    };

    return {
      columns,
      summary: {
        totalOpportunities: demoOpps.length,
        totalPipelineValue: 1740000.0,
        wonValue: 650000.0,
        lostValue: 0.0,
      },
    };
  }

  const supabase = await createClient();

  let query = supabase.from('enquiries').select('*');

  if (params.search) {
    const q = `%${params.search}%`;
    query = query.or(`contact_person.ilike.${q},product_category.ilike.${q},enquiry_code.ilike.${q}`);
  }
  if (params.priority && params.priority !== 'all') {
    query = query.eq('priority', params.priority);
  }
  if (params.assignedTo && params.assignedTo !== 'all') {
    query = query.eq('assigned_to', params.assignedTo);
  }

  const { data: enquiries, error } = await query;

  if (error || !enquiries) {
    console.error('Error fetching pipeline:', error?.message);
    return {
      columns: { new: [], qualified: [], proposal_sent: [], negotiation: [], converted: [], lost: [] },
      summary: { totalOpportunities: 0, totalPipelineValue: 0, wonValue: 0, lostValue: 0 },
    };
  }

  const columns: Record<PipelineStage, PipelineOpportunity[]> = {
    new: [],
    qualified: [],
    proposal_sent: [],
    negotiation: [],
    converted: [],
    lost: [],
  };

  let totalPipelineValue = 0;
  let wonValue = 0;
  let lostValue = 0;

  enquiries.forEach((e) => {
    const opp: PipelineOpportunity = {
      id: e.id,
      code: e.enquiry_code,
      contactName: e.contact_person,
      companyName: null,
      productCategory: e.product_category,
      estimatedValue: 150000.0, // Standard estimated deal value
      priority: e.priority as PipelineOpportunity['priority'],
      stage: (e.status === 'assigned' || e.status === 'contacted' ? 'new' : e.status) as PipelineStage,
      assignedTo: e.assigned_to,
      nextFollowupDate: e.next_followup_date,
      createdAt: e.created_at,
    };

    const stageKey = (columns[opp.stage] ? opp.stage : 'new') as PipelineStage;
    columns[stageKey].push(opp);

    if (stageKey === 'converted') {
      wonValue += opp.estimatedValue;
    } else if (stageKey === 'lost') {
      lostValue += opp.estimatedValue;
    } else {
      totalPipelineValue += opp.estimatedValue;
    }
  });

  return {
    columns,
    summary: {
      totalOpportunities: enquiries.length,
      totalPipelineValue,
      wonValue,
      lostValue,
    },
  };
}

// 2. UPDATE OPPORTUNITY STAGE (WITH AUDIT LOG)
export async function updateOpportunityStageAction(
  opportunityId: string,
  newStage: PipelineStage,
  lostReason?: string
): Promise<{ success: boolean; error?: string }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/pipeline');
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: oldEnq } = await supabase.from('enquiries').select('status, enquiry_code').eq('id', opportunityId).single();

  const updateData: Record<string, unknown> = {
    status: newStage,
    updated_at: new Date().toISOString(),
  };

  if (newStage === 'lost' && lostReason) {
    updateData.notes = `Lost Reason: ${lostReason.trim()}`;
  }

  const { error } = await supabase.from('enquiries').update(updateData).eq('id', opportunityId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'enquiry',
    entity_id: opportunityId,
    action_type: 'stage_changed',
    description: `Pipeline Opportunity ${oldEnq?.enquiry_code || opportunityId} stage changed from ${oldEnq?.status} to ${newStage.toUpperCase()}${lostReason ? `. Reason: ${lostReason}` : ''}`,
    performed_by: user?.id || null,
  });

  revalidatePath('/pipeline');
  revalidatePath(`/enquiries/${opportunityId}`);
  return { success: true };
}
