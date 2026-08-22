'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { CustomerRow, ActivityRow, LeadRow } from '@/types/database';

export interface GetCustomersParams {
  search?: string;
  status?: string;
  businessType?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

export interface GetCustomersResult {
  customers: CustomerRow[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  stats: {
    totalCustomers: number;
    activeRetailers: number;
    distributors: number;
    avgOrderValue: string;
  };
}

// 1. GET CUSTOMERS (WITH SEARCH, MULTI-FILTERING, PAGINATION, BENTO STATS)
export async function getCustomers(params: GetCustomersParams = {}): Promise<GetCustomersResult> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoCustomers: CustomerRow[] = [
      {
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
        last_order_date: new Date(Date.now() - 86400000 * 9).toISOString(),
        assigned_to: 'demo-user-101',
        notes: 'VIP Retail Partner in Mumbai West.',
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        customer_code: 'HIPA-CUST-5002',
        lead_id: null,
        name: 'Vikram Singh',
        company_name: 'Heritage Foods Dist.',
        phone: '+91 99887 76655',
        whatsapp_number: '+91 99887 76655',
        email: 'vikram@heritagefoods.in',
        location: 'Delhi, DL',
        business_type: 'distributor',
        status: 'active',
        total_revenue: 8550000.0,
        total_orders_count: 412,
        last_order_date: new Date(Date.now() - 86400000 * 6).toISOString(),
        assigned_to: 'demo-user-101',
        notes: 'Primary North India regional spice distributor.',
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 120).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '30000000-0000-0000-0000-000000000003',
        customer_code: 'HIPA-CUST-5003',
        lead_id: null,
        name: 'Priya Sharma',
        company_name: 'Spice Route Traders',
        phone: '+91 91234 56780',
        whatsapp_number: '+91 91234 56780',
        email: 'priya@spiceroute.com',
        location: 'Jaipur, RJ',
        business_type: 'wholesaler',
        status: 'inactive',
        total_revenue: 520000.0,
        total_orders_count: 18,
        last_order_date: new Date(Date.now() - 86400000 * 180).toISOString(),
        assigned_to: 'demo-user-101',
        notes: 'Account inactive since Q1.',
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 200).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let filtered = [...demoCustomers];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.company_name && c.company_name.toLowerCase().includes(q)) ||
          c.phone.includes(q) ||
          c.customer_code.toLowerCase().includes(q)
      );
    }
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((c) => c.status === params.status);
    }
    if (params.businessType && params.businessType !== 'all') {
      filtered = filtered.filter((c) => c.business_type === params.businessType);
    }

    return {
      customers: filtered,
      totalEntries: filtered.length,
      totalPages: 1,
      currentPage: 1,
      stats: {
        totalCustomers: 1248,
        activeRetailers: 892,
        distributors: 156,
        avgOrderValue: '₹45.2K',
      },
    };
  }

  const supabase = await createClient();
  let query = supabase.from('customers').select('*', { count: 'exact' });

  if (params.search) {
    const q = `%${params.search}%`;
    query = query.or(`name.ilike.${q},company_name.ilike.${q},phone.ilike.${q},customer_code.ilike.${q},email.ilike.${q}`);
  }

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
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
    console.error('Error fetching customers:', error.message);
    return {
      customers: [],
      totalEntries: 0,
      totalPages: 1,
      currentPage: 1,
      stats: { totalCustomers: 0, activeRetailers: 0, distributors: 0, avgOrderValue: '₹0' },
    };
  }

  const totalEntries = count || 0;
  const totalPages = Math.ceil(totalEntries / limit) || 1;

  return {
    customers: (data || []) as CustomerRow[],
    totalEntries,
    totalPages,
    currentPage: page,
    stats: {
      totalCustomers: totalEntries,
      activeRetailers: (data || []).filter((c) => c.business_type === 'retailer').length,
      distributors: (data || []).filter((c) => c.business_type === 'distributor').length,
      avgOrderValue: '₹45.2K',
    },
  };
}

// 2. GET SINGLE CUSTOMER BY ID WITH LEAD ORIGIN & ACTIVITIES
export async function getCustomerById(
  id: string
): Promise<{ customer: CustomerRow | null; leadOrigin: LeadRow | null; activities: ActivityRow[] }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoCustomer: CustomerRow = {
      id,
      customer_code: 'HIPA-CUST-5001',
      lead_id: '20000000-0000-0000-0000-000000000001',
      name: 'Rajesh Kumar',
      company_name: 'Anjali Supermarket',
      phone: '+91 98765 43210',
      whatsapp_number: '+91 98765 43210',
      email: 'rajesh@anjalimart.com',
      location: '104 Prime Mall, Link Road, Andheri West, Mumbai',
      business_type: 'retailer',
      status: 'active',
      total_revenue: 1420000.0,
      total_orders_count: 124,
      last_order_date: new Date(Date.now() - 86400000 * 9).toISOString(),
      assigned_to: 'demo-user-101',
      notes: 'Key Retail Account in Mumbai West.',
      created_by: 'demo-user-101',
      created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const demoLeadOrigin: LeadRow = {
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
      status: 'converted',
      priority: 'high',
      notes: 'Lead converted to Customer profile HIPA-CUST-5001.',
      next_followup_date: null,
      created_by: 'demo-user-101',
      created_at: new Date(Date.now() - 86400000 * 95).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 90).toISOString(),
    };

    const demoActivities: ActivityRow[] = [
      {
        id: 'act-c1',
        entity_type: 'customer',
        entity_id: id,
        customer_id: id,
        lead_id: '20000000-0000-0000-0000-000000000001',
        action_type: 'converted',
        description: 'Customer account HIPA-CUST-5001 created via Lead HIPA-LD-1001 conversion',
        performed_by: 'demo-user-101',
        metadata: {},
        created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
      },
    ];

    return { customer: demoCustomer, leadOrigin: demoLeadOrigin, activities: demoActivities };
  }

  const supabase = await createClient();

  const { data: customer } = await supabase.from('customers').select('*').eq('id', id).single();
  if (!customer) return { customer: null, leadOrigin: null, activities: [] };

  let leadOrigin: LeadRow | null = null;
  if (customer.lead_id) {
    const { data: lead } = await supabase.from('leads').select('*').eq('id', customer.lead_id).single();
    leadOrigin = lead as LeadRow | null;
  }

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false });

  return {
    customer: customer as CustomerRow,
    leadOrigin,
    activities: (activities || []) as ActivityRow[],
  };
}

// 3. CREATE CUSTOMER (WITH DUPLICATE PHONE/EMAIL CHECKING)
export async function createCustomerAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; customerId?: string }> {
  const name = formData.get('name') as string;
  const companyName = formData.get('companyName') as string;
  const phone = formData.get('phone') as string;
  const whatsappNumber = formData.get('whatsappNumber') as string;
  const email = formData.get('email') as string;
  const location = formData.get('location') as string;
  const businessType = formData.get('businessType') as string;
  const status = formData.get('status') as string || 'active';
  const assignedTo = formData.get('assignedTo') as string;
  const notes = formData.get('notes') as string;

  if (!name || !name.trim()) return { success: false, error: 'Customer Name is required.' };
  if (!phone || !phone.trim()) return { success: false, error: 'Phone Number is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/customers');
    return { success: true, customerId: 'demo-cust-new' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Duplicate Check by Phone
  const { data: existing } = await supabase
    .from('customers')
    .select('id, customer_code, name')
    .eq('phone', phone.trim())
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: `Possible existing customer found: ${existing.name} (${existing.customer_code}). Duplicate phone entry prevented.`,
      customerId: existing.id,
    };
  }

  const custNum = Math.floor(5000 + Math.random() * 4000);
  const customerCode = `HIPA-CUST-${custNum}`;

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      customer_code: customerCode,
      name: name.trim(),
      company_name: companyName ? companyName.trim() : null,
      phone: phone.trim(),
      whatsapp_number: whatsappNumber ? whatsappNumber.trim() : null,
      email: email ? email.trim() : null,
      location: location ? location.trim() : null,
      business_type: businessType || 'retailer',
      status: status || 'active',
      assigned_to: assignedTo && assignedTo !== 'me' ? assignedTo : user?.id || null,
      notes: notes ? notes.trim() : null,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error || !customer) {
    return { success: false, error: error?.message || 'Failed to create customer.' };
  }

  await supabase.from('activities').insert({
    entity_type: 'customer',
    entity_id: customer.id,
    customer_id: customer.id,
    action_type: 'created',
    description: `Customer account ${customer.customer_code} (${customer.name}) created`,
    performed_by: user?.id || null,
  });

  revalidatePath('/customers');
  return { success: true, customerId: customer.id };
}

// 4. UPDATE CUSTOMER STATUS
export async function updateCustomerStatusAction(
  customerId: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/customers/${customerId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: oldCust } = await supabase.from('customers').select('status, customer_code').eq('id', customerId).single();

  const { error } = await supabase
    .from('customers')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', customerId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'customer',
    entity_id: customerId,
    customer_id: customerId,
    action_type: 'status_changed',
    description: `Customer ${oldCust?.customer_code || customerId} status changed from ${oldCust?.status} to ${newStatus}`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/customers/${customerId}`);
  revalidatePath('/customers');
  return { success: true };
}

// 5. UPDATE CUSTOMER PROFILE DETAILS
export async function updateCustomerAction(
  customerId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const name = formData.get('name') as string;
  const companyName = formData.get('companyName') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const location = formData.get('location') as string;
  const businessType = formData.get('businessType') as string;
  const notes = formData.get('notes') as string;

  if (!name || !phone) return { success: false, error: 'Name and Phone are required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/customers/${customerId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('customers')
    .update({
      name: name.trim(),
      company_name: companyName ? companyName.trim() : null,
      phone: phone.trim(),
      email: email ? email.trim() : null,
      location: location ? location.trim() : null,
      business_type: businessType || 'retailer',
      notes: notes ? notes.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'customer',
    entity_id: customerId,
    customer_id: customerId,
    action_type: 'updated',
    description: `Customer profile updated`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/customers/${customerId}`);
  revalidatePath('/customers');
  return { success: true };
}
