'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { EnquiryRow, ActivityRow, CustomerRow, LeadRow } from '@/types/database';

export interface GetEnquiriesParams {
  search?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  customerId?: string;
  leadId?: string;
  page?: number;
  limit?: number;
}

export interface GetEnquiriesResult {
  enquiries: EnquiryRow[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
}

// 1. GET ENQUIRIES (WITH SEARCH, MULTI-FILTERING, PAGINATION)
export async function getEnquiries(params: GetEnquiriesParams = {}): Promise<GetEnquiriesResult> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoEnquiries: EnquiryRow[] = [
      {
        id: '40000000-0000-0000-0000-000000000001',
        enquiry_code: 'HIPA-ENQ-2001',
        customer_id: '30000000-0000-0000-0000-000000000001',
        lead_id: null,
        contact_person: 'Rajesh Kumar',
        product_category: '100g Sambar & Garam Masala',
        expected_quantity: '500 Units Monthly',
        assigned_to: 'demo-user-101',
        priority: 'high',
        status: 'new',
        notes: 'Client requested wholesale price quote for 100g Sambar Powder pouches.',
        target_price: 60000.0,
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000002',
        enquiry_code: 'HIPA-ENQ-2002',
        customer_id: '30000000-0000-0000-0000-000000000002',
        lead_id: null,
        contact_person: 'Vikram Singh',
        product_category: 'Bulk Turmeric & Red Chilli Powder',
        expected_quantity: '2 Metric Tons',
        target_price: 150000.0,
        assigned_to: 'demo-user-101',
        priority: 'urgent',
        status: 'under_review',
        notes: 'North India wholesale tender quotation inquiry.',
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000003',
        enquiry_code: 'HIPA-ENQ-2003',
        customer_id: '30000000-0000-0000-0000-000000000003',
        lead_id: null,
        contact_person: 'Priya Sharma',
        product_category: 'Whole Black Pepper 1kg',
        expected_quantity: '100 Packs',
        target_price: 25000.0,
        assigned_to: 'demo-user-101',
        priority: 'medium',
        status: 'quotation_created',
        notes: 'Quotation #HIPA-QTN-3001 sent to client.',
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let filtered = [...demoEnquiries];
    if (params.customerId) {
      filtered = filtered.filter((e) => e.customer_id === params.customerId);
    }
    if (params.leadId) {
      filtered = filtered.filter((e) => e.lead_id === params.leadId);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.contact_person.toLowerCase().includes(q) ||
          e.product_category.toLowerCase().includes(q) ||
          e.enquiry_code.toLowerCase().includes(q)
      );
    }
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((e) => e.status === params.status);
    }
    if (params.priority && params.priority !== 'all') {
      filtered = filtered.filter((e) => e.priority === params.priority);
    }

    return {
      enquiries: filtered,
      totalEntries: filtered.length,
      totalPages: 1,
      currentPage: 1,
    };
  }

  const supabase = await createClient();
  let query = supabase.from('enquiries').select('*', { count: 'exact' });

  if (params.customerId) {
    query = query.eq('customer_id', params.customerId);
  }
  if (params.leadId) {
    query = query.eq('lead_id', params.leadId);
  }
  if (params.search) {
    const q = `%${params.search}%`;
    query = query.or(`contact_person.ilike.${q},product_category.ilike.${q},enquiry_code.ilike.${q}`);
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.priority && params.priority !== 'all') {
    query = query.eq('priority', params.priority);
  }
  if (params.assignedTo && params.assignedTo !== 'all') {
    query = query.eq('assigned_to', params.assignedTo);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching enquiries:', error.message);
    return { enquiries: [], totalEntries: 0, totalPages: 1, currentPage: 1 };
  }

  const totalEntries = count || 0;
  const totalPages = Math.ceil(totalEntries / limit) || 1;

  return {
    enquiries: (data || []) as EnquiryRow[],
    totalEntries,
    totalPages,
    currentPage: page,
  };
}

// 2. GET SINGLE ENQUIRY BY ID WITH LINKED CUSTOMER/LEAD & ACTIVITIES
export async function getEnquiryById(
  id: string
): Promise<{ enquiry: EnquiryRow | null; customer: CustomerRow | null; lead: LeadRow | null; activities: ActivityRow[] }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoEnquiry: EnquiryRow = {
      id,
      enquiry_code: 'HIPA-ENQ-2001',
      customer_id: '30000000-0000-0000-0000-000000000001',
      lead_id: null,
      contact_person: 'Rajesh Kumar',
      product_category: '100g Sambar & Garam Masala',
      expected_quantity: '500 Units Monthly',
      target_price: 60000.0,
      assigned_to: 'demo-user-101',
      priority: 'high',
      status: 'new',
      notes: 'Client requested wholesale price quote for 100g Sambar Powder pouches.',
      created_by: 'demo-user-101',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const demoCustomer: CustomerRow = {
      id: '30000000-0000-0000-0000-000000000001',
      customer_code: 'HIPA-CUST-5001',
      lead_id: '20000000-0000-0000-0000-000000000001',
      name: 'Rajesh Kumar',
      company_name: 'Anjali Supermarket',
      phone: '+91 98765 43210',
      whatsapp_number: '+91 98765 43210',
      email: 'rajesh@anjalimart.com',
      location: 'Mumbai, MH',
      business_type: 'retailer',
      status: 'active',
      total_revenue: 1420000.0,
      total_orders_count: 124,
      last_order_date: new Date().toISOString(),
      assigned_to: 'demo-user-101',
      notes: null,
      created_by: 'demo-user-101',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const demoActivities: ActivityRow[] = [
      {
        id: 'act-e1',
        entity_type: 'enquiry',
        entity_id: id,
        customer_id: '30000000-0000-0000-0000-000000000001',
        lead_id: null,
        action_type: 'created',
        description: 'Enquiry HIPA-ENQ-2001 created for Anjali Supermarket',
        performed_by: 'demo-user-101',
        metadata: {},
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];

    return { enquiry: demoEnquiry, customer: demoCustomer, lead: null, activities: demoActivities };
  }

  const supabase = await createClient();

  const { data: enquiry } = await supabase.from('enquiries').select('*').eq('id', id).single();
  if (!enquiry) return { enquiry: null, customer: null, lead: null, activities: [] };

  let customer: CustomerRow | null = null;
  if (enquiry.customer_id) {
    const { data: cust } = await supabase.from('customers').select('*').eq('id', enquiry.customer_id).single();
    customer = cust as CustomerRow | null;
  }

  let lead: LeadRow | null = null;
  if (enquiry.lead_id) {
    const { data: ld } = await supabase.from('leads').select('*').eq('id', enquiry.lead_id).single();
    lead = ld as LeadRow | null;
  }

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('entity_type', 'enquiry')
    .eq('entity_id', id)
    .order('created_at', { ascending: false });

  return {
    enquiry: enquiry as EnquiryRow,
    customer,
    lead,
    activities: (activities || []) as ActivityRow[],
  };
}

// 3. CREATE ENQUIRY ACTION (CONTEXTUAL TO LEAD OR CUSTOMER)
export async function createEnquiryAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; enquiryId?: string }> {
  const customerId = formData.get('customerId') as string;
  const leadId = formData.get('leadId') as string;
  const contactPerson = formData.get('contactPerson') as string;
  const businessType = formData.get('businessType') as string;
  const productCategory = formData.get('productCategory') as string;
  const expectedQuantity = formData.get('expectedQuantity') as string;
  const source = formData.get('source') as string || 'inbound';
  const priority = formData.get('priority') as string || 'medium';
  const assignedTo = formData.get('assignedTo') as string;
  const notes = formData.get('notes') as string;

  if (!contactPerson || !contactPerson.trim()) return { success: false, error: 'Contact Person is required.' };
  if (!productCategory || !productCategory.trim()) return { success: false, error: 'Product Category is required.' };
  if (!expectedQuantity || !expectedQuantity.trim()) return { success: false, error: 'Expected Quantity is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/enquiries');
    if (customerId) revalidatePath(`/customers/${customerId}`);
    if (leadId) revalidatePath(`/leads/${leadId}`);
    return { success: true, enquiryId: 'demo-enq-new' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const enqNum = Math.floor(2000 + Math.random() * 8000);
  const enquiryCode = `HIPA-ENQ-${enqNum}`;

  const { data: enquiry, error } = await supabase
    .from('enquiries')
    .insert({
      enquiry_code: enquiryCode,
      customer_id: customerId || null,
      lead_id: leadId || null,
      contact_person: contactPerson.trim(),
      business_type: businessType || 'retailer',
      product_category: productCategory.trim(),
      expected_quantity: expectedQuantity.trim(),
      source: source || 'inbound',
      priority: priority || 'medium',
      status: 'new',
      assigned_to: assignedTo && assignedTo !== 'me' ? assignedTo : user?.id || null,
      notes: notes ? notes.trim() : null,
    })
    .select()
    .single();

  if (error || !enquiry) {
    return { success: false, error: error?.message || 'Failed to create enquiry.' };
  }

  // Audit activity log
  await supabase.from('activities').insert({
    entity_type: 'enquiry',
    entity_id: enquiry.id,
    customer_id: customerId || null,
    lead_id: leadId || null,
    action_type: 'created',
    description: `Enquiry ${enquiry.enquiry_code} created for ${contactPerson}`,
    performed_by: user?.id || null,
  });

  revalidatePath('/enquiries');
  if (customerId) revalidatePath(`/customers/${customerId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);

  return { success: true, enquiryId: enquiry.id };
}

// 4. UPDATE ENQUIRY STATUS
export async function updateEnquiryStatusAction(
  enquiryId: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/enquiries/${enquiryId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: oldEnq } = await supabase.from('enquiries').select('status, enquiry_code').eq('id', enquiryId).single();

  const { error } = await supabase
    .from('enquiries')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', enquiryId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'enquiry',
    entity_id: enquiryId,
    action_type: 'status_changed',
    description: `Enquiry ${oldEnq?.enquiry_code || enquiryId} status updated from ${oldEnq?.status} to ${newStatus}`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/enquiries/${enquiryId}`);
  revalidatePath('/enquiries');
  return { success: true };
}

// 5. UPDATE ENQUIRY PRIORITY
export async function updateEnquiryPriorityAction(
  enquiryId: string,
  newPriority: string
): Promise<{ success: boolean; error?: string }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/enquiries/${enquiryId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('enquiries')
    .update({ priority: newPriority, updated_at: new Date().toISOString() })
    .eq('id', enquiryId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'enquiry',
    entity_id: enquiryId,
    action_type: 'priority_changed',
    description: `Enquiry priority updated to ${newPriority.toUpperCase()}`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/enquiries/${enquiryId}`);
  revalidatePath('/enquiries');
  return { success: true };
}
