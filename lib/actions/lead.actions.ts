'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { LeadRow, CustomerRow, ActivityRow, UserProfile } from '@/types/database';

export interface GetLeadsParams {
  search?: string;
  status?: string;
  priority?: string;
  source?: string;
  businessType?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

export interface GetLeadsResult {
  leads: LeadRow[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
}

// 1. GET LEADS (WITH SEARCH, FILTERING, PAGINATION)
export async function getLeads(params: GetLeadsParams = {}): Promise<GetLeadsResult> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    // Return sample lead records for presentation UI
    const demoLeads: LeadRow[] = [
      {
        id: '20000000-0000-0000-0000-000000000001',
        lead_code: 'HIPA-LD-1001',
        full_name: 'John Doe',
        company_name: 'Global Spices Ltd',
        phone: '+91 98765 11111',
        whatsapp_number: '+91 98765 11111',
        email: 'john@globalspices.com',
        location: 'Mumbai, MH',
        business_type: 'distributor',
        lead_source: 'website',
        product_interests: ['whole_spices', 'blends'],
        estimated_value: 550000.0,
        assigned_to: 'demo-user-101',
        status: 'new',
        priority: 'high',
        notes: 'Interested in bulk Sambar and Garam Masala packaging.',
        next_followup_date: new Date().toISOString(),
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        lead_code: 'HIPA-LD-1002',
        full_name: 'Anita Desai',
        company_name: 'Desai Supermarket',
        phone: '+91 98765 22222',
        whatsapp_number: '+91 98765 22222',
        email: 'anita@desaimart.in',
        location: 'Pune, MH',
        business_type: 'retailer',
        lead_source: 'trade_show',
        product_interests: ['ground_spices'],
        estimated_value: 210000.0,
        assigned_to: 'demo-user-101',
        status: 'contacted',
        priority: 'medium',
        notes: 'Requested sample 100g Turmeric & Red Chilli packs.',
        next_followup_date: new Date(Date.now() + 86400000 * 3).toISOString(),
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let filtered = [...demoLeads];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.full_name.toLowerCase().includes(q) ||
          (l.company_name && l.company_name.toLowerCase().includes(q)) ||
          l.phone.includes(q) ||
          l.lead_code.toLowerCase().includes(q)
      );
    }
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((l) => l.status === params.status);
    }
    if (params.priority && params.priority !== 'all') {
      filtered = filtered.filter((l) => l.priority === params.priority);
    }

    return {
      leads: filtered,
      totalEntries: filtered.length,
      totalPages: 1,
      currentPage: 1,
    };
  }

  const supabase = await createClient();

  let query = supabase.from('leads').select('*', { count: 'exact' });

  if (params.search) {
    const q = `%${params.search}%`;
    query = query.or(`full_name.ilike.${q},company_name.ilike.${q},phone.ilike.${q},lead_code.ilike.${q}`);
  }

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.priority && params.priority !== 'all') {
    query = query.eq('priority', params.priority);
  }
  if (params.source && params.source !== 'all') {
    query = query.eq('lead_source', params.source);
  }
  if (params.businessType && params.businessType !== 'all') {
    query = query.eq('business_type', params.businessType);
  }
  if (params.assignedTo && params.assignedTo !== 'all') {
    query = query.eq('assigned_to', params.assignedTo);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching leads:', error.message);
    return { leads: [], totalEntries: 0, totalPages: 1, currentPage: 1 };
  }

  const totalEntries = count || 0;
  const totalPages = Math.ceil(totalEntries / limit) || 1;

  return {
    leads: data as LeadRow[],
    totalEntries,
    totalPages,
    currentPage: page,
  };
}

// 2. GET SINGLE LEAD BY ID WITH ACTIVITIES
export async function getLeadById(id: string): Promise<{ lead: LeadRow | null; activities: ActivityRow[] }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoLead: LeadRow = {
      id,
      lead_code: 'HIPA-LD-1001',
      full_name: 'John Doe',
      company_name: 'Global Spices Ltd',
      phone: '+91 98765 11111',
      whatsapp_number: '+91 98765 11111',
      email: 'john@globalspices.com',
      location: '104 Trade Centre, Andheri East, Mumbai, MH',
      business_type: 'distributor',
      lead_source: 'website',
      product_interests: ['whole_spices', 'blends'],
      estimated_value: 550000.0,
      assigned_to: 'demo-user-101',
      status: 'new',
      priority: 'high',
      notes: 'Interested in regional distribution rights for Sambar & Garam Masala.',
      next_followup_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      created_by: 'demo-user-101',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const demoActivities: ActivityRow[] = [
      {
        id: 'act-1',
        entity_type: 'lead',
        entity_id: id,
        customer_id: null,
        lead_id: id,
        action_type: 'created',
        description: 'Lead HIPA-LD-1001 created via Website Form',
        performed_by: 'demo-user-101',
        metadata: {},
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];

    return { lead: demoLead, activities: demoActivities };
  }

  const supabase = await createClient();

  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single();

  if (!lead) return { lead: null, activities: [] };

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false });

  return { lead: lead as LeadRow, activities: (activities || []) as ActivityRow[] };
}

// 3. CREATE LEAD (WITH AUTOMATIC CODE & AUDIT ACTIVITY)
export async function createLeadAction(formData: FormData): Promise<{ success: boolean; error?: string; leadId?: string }> {
  const fullName = formData.get('fullName') as string;
  const companyName = formData.get('companyName') as string;
  const phone = formData.get('phone') as string;
  const whatsappNumber = formData.get('whatsappNumber') as string;
  const email = formData.get('email') as string;
  const location = formData.get('location') as string;
  const businessType = formData.get('businessType') as string;
  const leadSource = formData.get('leadSource') as string;
  const estimatedValue = parseFloat((formData.get('estimatedValue') as string) || '0');
  const assignedTo = formData.get('assignedTo') as string;
  const status = formData.get('status') as string || 'new';
  const priority = formData.get('priority') as string || 'medium';
  const notes = formData.get('notes') as string;
  const productInterestsStr = formData.get('productInterests') as string;

  // Server-side Validation
  if (!fullName || !fullName.trim()) return { success: false, error: 'Full Name is required.' };
  if (!phone || !phone.trim()) return { success: false, error: 'Phone Number is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/leads');
    return { success: true, leadId: 'demo-lead-new' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Generate unique lead code (e.g. HIPA-LD-1042)
  const codeNum = Math.floor(1000 + Math.random() * 9000);
  const leadCode = `HIPA-LD-${codeNum}`;

  const productInterests = productInterestsStr ? productInterestsStr.split(',') : [];

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      lead_code: leadCode,
      full_name: fullName.trim(),
      company_name: companyName ? companyName.trim() : null,
      phone: phone.trim(),
      whatsapp_number: whatsappNumber ? whatsappNumber.trim() : null,
      email: email ? email.trim() : null,
      location: location ? location.trim() : null,
      business_type: businessType || 'retailer',
      lead_source: leadSource || 'website',
      product_interests: productInterests,
      estimated_value: isNaN(estimatedValue) ? 0 : estimatedValue,
      assigned_to: assignedTo && assignedTo !== 'me' ? assignedTo : user?.id || null,
      status: status || 'new',
      priority: priority || 'medium',
      notes: notes ? notes.trim() : null,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error || !lead) {
    return { success: false, error: error?.message || 'Failed to create lead.' };
  }

  // Create Audit Activity
  await supabase.from('activities').insert({
    entity_type: 'lead',
    entity_id: lead.id,
    lead_id: lead.id,
    action_type: 'created',
    description: `Lead ${lead.lead_code} (${lead.full_name}) created`,
    performed_by: user?.id || null,
  });

  revalidatePath('/leads');
  return { success: true, leadId: lead.id };
}

// 4. UPDATE LEAD STATUS (WITH AUDIT TIMELINE)
export async function updateLeadStatusAction(leadId: string, newStatus: string): Promise<{ success: boolean; error?: string }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/leads/${leadId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: oldLead } = await supabase.from('leads').select('status, lead_code').eq('id', leadId).single();

  const { error } = await supabase
    .from('leads')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', leadId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'lead',
    entity_id: leadId,
    lead_id: leadId,
    action_type: 'status_changed',
    description: `Lead ${oldLead?.lead_code || leadId} status changed from ${oldLead?.status} to ${newStatus}`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  return { success: true };
}

// 5. MARK LEAD AS LOST (REQUIRES REASON)
export async function markLeadLostAction(leadId: string, lostReason: string): Promise<{ success: boolean; error?: string }> {
  if (!lostReason || !lostReason.trim()) {
    return { success: false, error: 'A lost reason is required.' };
  }

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/leads/${leadId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('leads')
    .update({
      status: 'lost',
      notes: `Lost Reason: ${lostReason.trim()}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'lead',
    entity_id: leadId,
    lead_id: leadId,
    action_type: 'marked_lost',
    description: `Lead marked lost. Reason: ${lostReason.trim()}`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  return { success: true };
}

// 6. ATOMIC LEAD-TO-CUSTOMER CONVERSION (PREVENTS DUPLICATION)
export async function convertLeadToCustomerAction(leadId: string): Promise<{ success: boolean; error?: string; customerId?: string }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/leads/${leadId}`);
    return { success: true, customerId: 'demo-cust-converted' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch target lead details
  const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
  if (!lead) return { success: false, error: 'Lead record not found.' };

  // Check if lead was already converted to prevent duplication
  const { data: existingCust } = await supabase.from('customers').select('id, customer_code').eq('lead_id', leadId).single();
  if (existingCust) {
    return {
      success: false,
      error: `This lead was already converted to customer ${existingCust.customer_code}.`,
      customerId: existingCust.id,
    };
  }

  // Generate Customer Code
  const custNum = Math.floor(5000 + Math.random() * 4000);
  const customerCode = `HIPA-CUST-${custNum}`;

  // Insert Customer Record
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .insert({
      customer_code: customerCode,
      lead_id: leadId,
      name: lead.full_name,
      company_name: lead.company_name,
      phone: lead.phone,
      whatsapp_number: lead.whatsapp_number,
      email: lead.email,
      location: lead.location,
      business_type: lead.business_type,
      status: 'active',
      assigned_to: lead.assigned_to,
      notes: lead.notes,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (custError || !customer) {
    return { success: false, error: custError?.message || 'Failed to create customer profile.' };
  }

  // Update original Lead status to 'converted'
  await supabase
    .from('leads')
    .update({ status: 'converted', updated_at: new Date().toISOString() })
    .eq('id', leadId);

  // Record Audit Activity
  await supabase.from('activities').insert({
    entity_type: 'lead',
    entity_id: leadId,
    lead_id: leadId,
    customer_id: customer.id,
    action_type: 'converted',
    description: `Lead ${lead.lead_code} converted to Customer ${customer.customer_code} (${customer.name})`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  revalidatePath('/customers');

  return { success: true, customerId: customer.id };
}

// 7. SCHEDULE FOLLOW-UP FOR LEAD
export async function createLeadFollowupAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const leadId = formData.get('leadId') as string;
  const title = formData.get('title') as string;
  const followupDate = formData.get('followupDate') as string;
  const followupTime = formData.get('followupTime') as string;
  const method = formData.get('method') as string || 'call';
  const priority = formData.get('priority') as string || 'medium';
  const purpose = formData.get('purpose') as string;

  if (!leadId || !title || !followupDate) {
    return { success: false, error: 'Title and Follow-up Date are required.' };
  }

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/leads/${leadId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('follow_ups').insert({
    lead_id: leadId,
    title: title.trim(),
    purpose: purpose ? purpose.trim() : null,
    followup_date: followupDate,
    followup_time: followupTime || null,
    method: method || 'call',
    priority: priority || 'medium',
    assigned_to: user?.id || null,
    status: 'pending',
  });

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'lead',
    entity_id: leadId,
    lead_id: leadId,
    action_type: 'followup_scheduled',
    description: `Follow-up "${title}" scheduled for ${followupDate}`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

// 8. FETCH ACTIVE EMPLOYEES FOR ASSIGNMENT DROPDOWN
export async function getActiveEmployees(): Promise<UserProfile[]> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    return [
      { id: 'demo-user-101', fullName: 'Rajesh Kumar (Sales Mgr)', email: 'rajesh@hipamasala.com', role: 'sales_manager' },
      { id: 'demo-user-102', fullName: 'Sarah Jenkins (Sales Rep)', email: 'sarah@hipamasala.com', role: 'sales_executive' },
      { id: 'demo-user-103', fullName: 'Michael Chen (Sales Rep)', email: 'michael@hipamasala.com', role: 'sales_executive' },
    ];
  }

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url')
    .eq('is_active', true)
    .order('full_name');

  return (profiles || []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    email: p.email,
    role: p.role,
    avatarUrl: p.avatar_url,
  }));
}
