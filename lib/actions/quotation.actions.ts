'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { QuotationRow, QuotationItemRow, CustomerRow, ProductRow, ProductVariantRow, ActivityRow } from '@/types/database';

export interface CreateQuotationItemInput {
  productId: string;
  variantId?: string;
  productName: string;
  packSize: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
}

export interface GetQuotationsParams {
  search?: string;
  status?: string;
  assignedTo?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

export interface GetQuotationsResult {
  quotations: QuotationRow[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  stats: {
    totalValue: number;
    sentValue: number;
    acceptedValue: number;
  };
}

// 1. GET QUOTATIONS (WITH SEARCH, MULTI-FILTERING, FINANCIAL SUMMARY)
export async function getQuotations(params: GetQuotationsParams = {}): Promise<GetQuotationsResult> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoQuotations: QuotationRow[] = [
      {
        id: '60000000-0000-0000-0000-000000000001',
        quotation_number: 'HIPA-QTN-2026-0001',
        customer_id: '30000000-0000-0000-0000-000000000001',
        enquiry_id: '40000000-0000-0000-0000-000000000001',
        valid_until: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
        assigned_to: 'demo-user-101',
        subtotal: 125000.0,
        discount_amount: 5000.0,
        tax_amount: 6000.0,
        total_amount: 126000.0,
        status: 'sent',
        terms: 'Payment 50% advance, 50% on delivery. Prices inclusive of 5% GST.',
        notes: 'Bulk 100g Sambar Powder quotation.',
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '60000000-0000-0000-0000-000000000002',
        quotation_number: 'HIPA-QTN-2026-0002',
        customer_id: '30000000-0000-0000-0000-000000000002',
        enquiry_id: null,
        valid_until: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        assigned_to: 'demo-user-101',
        subtotal: 450000.0,
        discount_amount: 15000.0,
        tax_amount: 21750.0,
        total_amount: 456750.0,
        status: 'accepted',
        terms: 'Net 30 days distributor payment terms.',
        notes: 'North India regional spice distribution proposal.',
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let filtered = [...demoQuotations];
    if (params.customerId) {
      filtered = filtered.filter((q) => q.customer_id === params.customerId);
    }
    if (params.search) {
      const query = params.search.toLowerCase();
      filtered = filtered.filter((q) => q.quotation_number.toLowerCase().includes(query));
    }
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((q) => q.status === params.status);
    }

    return {
      quotations: filtered,
      totalEntries: filtered.length,
      totalPages: 1,
      currentPage: 1,
      stats: { totalValue: 582750.0, sentValue: 126000.0, acceptedValue: 456750.0 },
    };
  }

  const supabase = await createClient();
  let query = supabase.from('quotations').select('*', { count: 'exact' });

  if (params.customerId) query = query.eq('customer_id', params.customerId);
  if (params.search) {
    const q = `%${params.search}%`;
    query = query.or(`quotation_number.ilike.${q}`);
  }
  if (params.status && params.status !== 'all') query = query.eq('status', params.status);
  if (params.assignedTo && params.assignedTo !== 'all') query = query.eq('assigned_to', params.assignedTo);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching quotations:', error.message);
    return {
      quotations: [],
      totalEntries: 0,
      totalPages: 1,
      currentPage: 1,
      stats: { totalValue: 0, sentValue: 0, acceptedValue: 0 },
    };
  }

  const totalEntries = count || 0;
  const totalPages = Math.ceil(totalEntries / limit) || 1;

  const totalValue = (data || []).reduce((sum, q) => sum + Number(q.total_amount || 0), 0);
  const sentValue = (data || []).filter((q) => q.status === 'sent').reduce((sum, q) => sum + Number(q.total_amount || 0), 0);
  const acceptedValue = (data || []).filter((q) => q.status === 'accepted').reduce((sum, q) => sum + Number(q.total_amount || 0), 0);

  return {
    quotations: (data || []) as QuotationRow[],
    totalEntries,
    totalPages,
    currentPage: page,
    stats: { totalValue, sentValue, acceptedValue },
  };
}

// 2. GET SINGLE QUOTATION BY ID WITH ITEMS & CUSTOMER DETAILS
export async function getQuotationById(
  id: string
): Promise<{ quotation: QuotationRow | null; items: QuotationItemRow[]; customer: CustomerRow | null; activities: ActivityRow[] }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoQuotation: QuotationRow = {
      id,
      quotation_number: 'HIPA-QTN-2026-0001',
      customer_id: '30000000-0000-0000-0000-000000000001',
      enquiry_id: '40000000-0000-0000-0000-000000000001',
      valid_until: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
      assigned_to: 'demo-user-101',
      subtotal: 125000.0,
      discount_amount: 5000.0,
      tax_amount: 6000.0,
      total_amount: 126000.0,
      status: 'sent',
      terms: 'Payment 50% advance, 50% on delivery. Prices inclusive of 5% GST.',
      notes: 'Bulk 100g Sambar Powder quotation.',
      created_by: 'demo-user-101',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const demoItems: QuotationItemRow[] = [
      {
        id: 'qi-1',
        quotation_id: id,
        product_id: 'p-1',
        variant_id: 'pv-1',
        product_name_snapshot: 'HIPA Pure Turmeric Powder',
        pack_size_snapshot: '500g pouch',
        quantity: 500,
        unit_price: 120.0,
        discount_percent: 5.0,
        tax_percent: 5.0,
        total_price: 59850.0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'qi-2',
        quotation_id: id,
        product_id: 'p-2',
        variant_id: 'pv-2',
        product_name_snapshot: 'HIPA Special Garam Masala',
        pack_size_snapshot: '100g pack',
        quantity: 1000,
        unit_price: 65.0,
        discount_percent: 0.0,
        tax_percent: 5.0,
        total_price: 68250.0,
        created_at: new Date().toISOString(),
      },
    ];

    const demoCustomer: CustomerRow = {
      id: '30000000-0000-0000-0000-000000000001',
      customer_code: 'HIPA-CUST-5001',
      lead_id: null,
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
      last_order_date: new Date().toISOString(),
      assigned_to: 'demo-user-101',
      notes: null,
      created_by: 'demo-user-101',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const demoActivities: ActivityRow[] = [
      {
        id: 'act-q1',
        entity_type: 'quotation',
        entity_id: id,
        customer_id: '30000000-0000-0000-0000-000000000001',
        lead_id: null,
        action_type: 'created',
        description: 'Quotation HIPA-QTN-2026-0001 issued to Anjali Supermarket',
        performed_by: 'demo-user-101',
        metadata: {},
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];

    return { quotation: demoQuotation, items: demoItems, customer: demoCustomer, activities: demoActivities };
  }

  const supabase = await createClient();

  const { data: quotation } = await supabase.from('quotations').select('*').eq('id', id).single();
  if (!quotation) return { quotation: null, items: [], customer: null, activities: [] };

  const { data: items } = await supabase.from('quotation_items').select('*').eq('quotation_id', id);

  let customer: CustomerRow | null = null;
  if (quotation.customer_id) {
    const { data: cust } = await supabase.from('customers').select('*').eq('id', quotation.customer_id).single();
    customer = cust as CustomerRow | null;
  }

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('entity_type', 'quotation')
    .eq('entity_id', id)
    .order('created_at', { ascending: false });

  return {
    quotation: quotation as QuotationRow,
    items: (items || []) as QuotationItemRow[],
    customer,
    activities: (activities || []) as ActivityRow[],
  };
}

// 3. CREATE QUOTATION (WITH SERVER-SIDE AUTHORITATIVE MATH & PRICE SNAPSHOTS)
export async function createQuotationAction(
  customerId: string,
  validUntil: string,
  itemsInput: CreateQuotationItemInput[],
  terms?: string,
  notes?: string,
  enquiryId?: string
): Promise<{ success: boolean; error?: string; quotationId?: string }> {
  if (!customerId) return { success: false, error: 'Customer selection is required.' };
  if (!itemsInput || itemsInput.length === 0) return { success: false, error: 'At least one quotation item is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/quotations');
    revalidatePath(`/customers/${customerId}`);
    return { success: true, quotationId: 'demo-qtn-new' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Server-authoritative financial calculation
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  const processedItems = itemsInput.map((item) => {
    const lineSubtotal = item.quantity * item.unitPrice;
    const lineDiscount = (lineSubtotal * item.discountPercent) / 100;
    const taxableAmount = lineSubtotal - lineDiscount;
    const lineTax = (taxableAmount * item.taxPercent) / 100;
    const lineTotal = taxableAmount + lineTax;

    subtotal += lineSubtotal;
    totalDiscount += lineDiscount;
    totalTax += lineTax;

    return {
      product_id: item.productId || null,
      variant_id: item.variantId || null,
      product_name_snapshot: item.productName,
      pack_size_snapshot: item.packSize,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount_percent: item.discountPercent,
      tax_percent: item.taxPercent,
      total_price: lineTotal,
    };
  });

  const grandTotal = subtotal - totalDiscount + totalTax;

  const qtnNum = Math.floor(1000 + Math.random() * 9000);
  const quotationNumber = `HIPA-QTN-2026-${qtnNum}`;

  const { data: quotation, error: qError } = await supabase
    .from('quotations')
    .insert({
      quotation_number: quotationNumber,
      customer_id: customerId,
      enquiry_id: enquiryId || null,
      valid_until: validUntil || new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
      assigned_to: user?.id || null,
      subtotal,
      discount_amount: totalDiscount,
      tax_amount: totalTax,
      total_amount: grandTotal,
      status: 'draft',
      terms: terms || 'Payment 50% advance, 50% on delivery. Prices inclusive of GST.',
      notes: notes ? notes.trim() : null,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (qError || !quotation) {
    return { success: false, error: qError?.message || 'Failed to create quotation.' };
  }

  // Insert quotation items with price snapshots
  const itemsToInsert = processedItems.map((pi) => ({
    ...pi,
    quotation_id: quotation.id,
  }));

  const { error: itemsError } = await supabase.from('quotation_items').insert(itemsToInsert);

  if (itemsError) {
    console.error('Error inserting quotation items:', itemsError.message);
  }

  // Audit activity log
  await supabase.from('activities').insert({
    entity_type: 'quotation',
    entity_id: quotation.id,
    customer_id: customerId,
    action_type: 'created',
    description: `Quotation ${quotation.quotation_number} created (Total: ₹${grandTotal.toLocaleString('en-IN')})`,
    performed_by: user?.id || null,
  });

  revalidatePath('/quotations');
  revalidatePath(`/customers/${customerId}`);

  return { success: true, quotationId: quotation.id };
}

// 4. UPDATE QUOTATION STATUS
export async function updateQuotationStatusAction(
  quotationId: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/quotations/${quotationId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: oldQtn } = await supabase.from('quotations').select('status, quotation_number, customer_id').eq('id', quotationId).single();

  const { error } = await supabase
    .from('quotations')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', quotationId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'quotation',
    entity_id: quotationId,
    customer_id: oldQtn?.customer_id,
    action_type: 'status_changed',
    description: `Quotation ${oldQtn?.quotation_number || quotationId} status updated from ${oldQtn?.status} to ${newStatus.toUpperCase()}`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/quotations/${quotationId}`);
  revalidatePath('/quotations');
  return { success: true };
}

// 5. FETCH PRODUCTS AND VARIANTS FOR QUOTATION ITEM SELECTOR
export async function getProductsForQuotation(): Promise<{ products: ProductRow[]; variants: ProductVariantRow[] }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoProducts: ProductRow[] = [
      { id: 'p-1', name: 'HIPA Pure Turmeric Powder', sku: 'HIPA-TRM-01', category: 'Ground Spices', description: 'High-curcumin turmeric', image_url: null, is_active: true, created_at: '', updated_at: '' },
      { id: 'p-2', name: 'HIPA Special Garam Masala', sku: 'HIPA-GRM-01', category: 'Blends', description: 'Aromatic spice mix', image_url: null, is_active: true, created_at: '', updated_at: '' },
      { id: 'p-3', name: 'HIPA Premium Sambar Powder', sku: 'HIPA-SMB-01', category: 'Blends', description: 'Traditional South Indian blend', image_url: null, is_active: true, created_at: '', updated_at: '' },
    ];
    const demoVariants: ProductVariantRow[] = [
      { id: 'pv-1', product_id: 'p-1', pack_size: '500g pouch', pack_unit: 'g', sku_variant: 'HIPA-TRM-500G', unit_price: 120.0, stock_quantity: 500, is_active: true, created_at: '', updated_at: '' },
      { id: 'pv-2', product_id: 'p-2', pack_size: '100g pack', pack_unit: 'g', sku_variant: 'HIPA-GRM-100G', unit_price: 65.0, stock_quantity: 1000, is_active: true, created_at: '', updated_at: '' },
      { id: 'pv-3', product_id: 'p-3', pack_size: '1kg bulk', pack_unit: 'kg', sku_variant: 'HIPA-SMB-1KG', unit_price: 240.0, stock_quantity: 300, is_active: true, created_at: '', updated_at: '' },
    ];
    return { products: demoProducts, variants: demoVariants };
  }

  const supabase = await createClient();
  const { data: products } = await supabase.from('products').select('*').eq('is_active', true);
  const { data: variants } = await supabase.from('product_variants').select('*').eq('is_active', true);

  return { products: (products || []) as ProductRow[], variants: (variants || []) as ProductVariantRow[] };
}
