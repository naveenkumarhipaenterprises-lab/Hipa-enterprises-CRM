'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { OrderRow, OrderItemRow, CustomerRow, QuotationRow, ActivityRow } from '@/types/database';

export interface GetOrdersParams {
  search?: string;
  deliveryStatus?: string;
  paymentStatus?: string;
  assignedTo?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

export interface GetOrdersResult {
  orders: OrderRow[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  stats: {
    totalValue: number;
    deliveredValue: number;
    pendingValue: number;
  };
}

// 1. GET ORDERS (WITH SEARCH, MULTI-FILTERING, FINANCIAL SUMMARY)
export async function getOrders(params: GetOrdersParams = {}): Promise<GetOrdersResult> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoOrders: OrderRow[] = [
      {
        id: '70000000-0000-0000-0000-000000000001',
        order_number: 'HIPA-ORD-2026-0001',
        quotation_id: '60000000-0000-0000-0000-000000000002',
        customer_id: '30000000-0000-0000-0000-000000000002',
        assigned_to: 'demo-user-101',
        subtotal: 450000.0,
        discount_amount: 15000.0,
        tax_amount: 21750.0,
        total_amount: 456750.0,
        payment_status: 'paid',
        delivery_status: 'delivered',
        order_date: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0],
        notes: 'Bulk spice order dispatched via Express Transport.',
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '70000000-0000-0000-0000-000000000002',
        order_number: 'HIPA-ORD-2026-0002',
        quotation_id: '60000000-0000-0000-0000-000000000001',
        customer_id: '30000000-0000-0000-0000-000000000001',
        assigned_to: 'demo-user-101',
        subtotal: 125000.0,
        discount_amount: 5000.0,
        tax_amount: 6000.0,
        total_amount: 126000.0,
        payment_status: 'pending',
        delivery_status: 'processing',
        order_date: new Date().toISOString().split('T')[0],
        notes: 'Sambar & Garam Masala packaging in progress.',
        created_by: 'demo-user-101',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let filtered = [...demoOrders];
    if (params.customerId) filtered = filtered.filter((o) => o.customer_id === params.customerId);
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((o) => o.order_number.toLowerCase().includes(q));
    }
    if (params.deliveryStatus && params.deliveryStatus !== 'all') {
      filtered = filtered.filter((o) => o.delivery_status === params.deliveryStatus);
    }
    if (params.paymentStatus && params.paymentStatus !== 'all') {
      filtered = filtered.filter((o) => o.payment_status === params.paymentStatus);
    }

    return {
      orders: filtered,
      totalEntries: filtered.length,
      totalPages: 1,
      currentPage: 1,
      stats: { totalValue: 582750.0, deliveredValue: 456750.0, pendingValue: 126000.0 },
    };
  }

  const supabase = await createClient();
  let query = supabase.from('orders').select('*', { count: 'exact' });

  if (params.customerId) query = query.eq('customer_id', params.customerId);
  if (params.search) {
    const q = `%${params.search}%`;
    query = query.or(`order_number.ilike.${q}`);
  }
  if (params.deliveryStatus && params.deliveryStatus !== 'all') query = query.eq('delivery_status', params.deliveryStatus);
  if (params.paymentStatus && params.paymentStatus !== 'all') query = query.eq('payment_status', params.paymentStatus);
  if (params.assignedTo && params.assignedTo !== 'all') query = query.eq('assigned_to', params.assignedTo);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error.message);
    return {
      orders: [],
      totalEntries: 0,
      totalPages: 1,
      currentPage: 1,
      stats: { totalValue: 0, deliveredValue: 0, pendingValue: 0 },
    };
  }

  const totalEntries = count || 0;
  const totalPages = Math.ceil(totalEntries / limit) || 1;

  const totalValue = (data || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const deliveredValue = (data || []).filter((o) => o.delivery_status === 'delivered').reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const pendingValue = (data || []).filter((o) => o.delivery_status !== 'delivered' && o.delivery_status !== 'cancelled').reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return {
    orders: (data || []) as OrderRow[],
    totalEntries,
    totalPages,
    currentPage: page,
    stats: { totalValue, deliveredValue, pendingValue },
  };
}

// 2. GET SINGLE ORDER BY ID WITH ITEMS, CUSTOMER & QUOTATION
export async function getOrderById(
  id: string
): Promise<{ order: OrderRow | null; items: OrderItemRow[]; customer: CustomerRow | null; quotation: QuotationRow | null; activities: ActivityRow[] }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoOrder: OrderRow = {
      id,
      order_number: 'HIPA-ORD-2026-0001',
      quotation_id: '60000000-0000-0000-0000-000000000002',
      customer_id: '30000000-0000-0000-0000-000000000002',
      assigned_to: 'demo-user-101',
      subtotal: 450000.0,
      discount_amount: 15000.0,
      tax_amount: 21750.0,
      total_amount: 456750.0,
      payment_status: 'paid',
      delivery_status: 'delivered',
      order_date: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0],
      notes: 'Bulk spice order dispatched via Express Transport.',
      created_by: 'demo-user-101',
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const demoItems: OrderItemRow[] = [
      {
        id: 'oi-1',
        order_id: id,
        product_id: 'p-1',
        variant_id: 'pv-1',
        product_name_snapshot: 'HIPA Pure Turmeric Powder',
        pack_size_snapshot: '500g pouch',
        quantity: 2000,
        unit_price: 120.0,
        total_price: 240000.0,
        created_at: new Date().toISOString(),
      },
    ];

    const demoCustomer: CustomerRow = {
      id: '30000000-0000-0000-0000-000000000002',
      customer_code: 'HIPA-CUST-5002',
      lead_id: null,
      name: 'Vikram Singh',
      company_name: 'Heritage Foods Dist.',
      phone: '+91 99887 76655',
      whatsapp_number: '+91 99887 76655',
      email: 'vikram@heritagefoods.in',
      location: 'Delhi Industrial Area, Delhi',
      business_type: 'distributor',
      status: 'active',
      total_revenue: 8550000.0,
      total_orders_count: 412,
      last_order_date: new Date().toISOString(),
      assigned_to: 'demo-user-101',
      notes: null,
      created_by: 'demo-user-101',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const demoActivities: ActivityRow[] = [
      {
        id: 'act-o1',
        entity_type: 'order',
        entity_id: id,
        customer_id: '30000000-0000-0000-0000-000000000002',
        lead_id: null,
        action_type: 'created',
        description: 'Order HIPA-ORD-2026-0001 created from Quotation HIPA-QTN-2026-0002',
        performed_by: 'demo-user-101',
        metadata: {},
        created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      },
    ];

    return { order: demoOrder, items: demoItems, customer: demoCustomer, quotation: null, activities: demoActivities };
  }

  const supabase = await createClient();

  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single();
  if (!order) return { order: null, items: [], customer: null, quotation: null, activities: [] };

  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', id);

  let customer: CustomerRow | null = null;
  if (order.customer_id) {
    const { data: cust } = await supabase.from('customers').select('*').eq('id', order.customer_id).single();
    customer = cust as CustomerRow | null;
  }

  let quotation: QuotationRow | null = null;
  if (order.quotation_id) {
    const { data: qtn } = await supabase.from('quotations').select('*').eq('id', order.quotation_id).single();
    quotation = qtn as QuotationRow | null;
  }

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('entity_type', 'order')
    .eq('entity_id', id)
    .order('created_at', { ascending: false });

  return {
    order: order as OrderRow,
    items: (items || []) as OrderItemRow[],
    customer,
    quotation,
    activities: (activities || []) as ActivityRow[],
  };
}

// 3. CREATE ORDER FROM ACCEPTED QUOTATION (WITH DUPLICATE ORDER PREVENTION)
export async function createOrderFromQuotationAction(
  quotationId: string
): Promise<{ success: boolean; error?: string; orderId?: string }> {
  if (!quotationId) return { success: false, error: 'Quotation ID is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/orders');
    revalidatePath(`/quotations/${quotationId}`);
    return { success: true, orderId: 'demo-ord-new' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Duplicate Check: Verify if an order already references this quotation
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('quotation_id', quotationId)
    .maybeSingle();

  if (existingOrder) {
    return {
      success: false,
      error: `An order (${existingOrder.order_number}) already exists for this accepted quotation. Duplicate order creation prevented.`,
      orderId: existingOrder.id,
    };
  }

  // Fetch target quotation and line items
  const { data: quotation } = await supabase.from('quotations').select('*').eq('id', quotationId).single();
  if (!quotation) return { success: false, error: 'Quotation record not found.' };

  const { data: quotationItems } = await supabase.from('quotation_items').select('*').eq('quotation_id', quotationId);
  if (!quotationItems || quotationItems.length === 0) {
    return { success: false, error: 'Cannot create order from a quotation with no line items.' };
  }

  const ordNum = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `HIPA-ORD-2026-${ordNum}`;
  const todayStr = new Date().toISOString().split('T')[0];

  // Insert Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      quotation_id: quotationId,
      customer_id: quotation.customer_id,
      assigned_to: quotation.assigned_to || user?.id || null,
      subtotal: quotation.subtotal,
      discount_amount: quotation.discount_amount,
      tax_amount: quotation.tax_amount,
      total_amount: quotation.total_amount,
      payment_status: 'pending',
      delivery_status: 'confirmed',
      order_date: todayStr,
      notes: `Order generated from accepted Quotation ${quotation.quotation_number}`,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (orderError || !order) {
    return { success: false, error: orderError?.message || 'Failed to create order.' };
  }

  // Copy Quotation Items into Order Items with historical price snapshots
  const orderItemsToInsert = quotationItems.map((qi) => ({
    order_id: order.id,
    product_id: qi.product_id,
    variant_id: qi.variant_id,
    product_name_snapshot: qi.product_name_snapshot,
    pack_size_snapshot: qi.pack_size_snapshot,
    quantity: qi.quantity,
    unit_price: qi.unit_price,
    total_price: qi.total_price,
  }));

  await supabase.from('order_items').insert(orderItemsToInsert);

  // Update Customer's total_revenue and total_orders_count
  const { data: customer } = await supabase.from('customers').select('total_revenue, total_orders_count').eq('id', quotation.customer_id).single();
  if (customer) {
    const newRevenue = Number(customer.total_revenue || 0) + Number(quotation.total_amount || 0);
    const newCount = Number(customer.total_orders_count || 0) + 1;

    await supabase
      .from('customers')
      .update({
        total_revenue: newRevenue,
        total_orders_count: newCount,
        last_order_date: new Date().toISOString(),
      })
      .eq('id', quotation.customer_id);
  }

  // Record Audit Activity
  await supabase.from('activities').insert({
    entity_type: 'order',
    entity_id: order.id,
    customer_id: quotation.customer_id,
    action_type: 'created',
    description: `Purchase Order ${order.order_number} confirmed from Quotation ${quotation.quotation_number} (Amount: ₹${Number(quotation.total_amount).toLocaleString('en-IN')})`,
    performed_by: user?.id || null,
  });

  revalidatePath('/orders');
  revalidatePath(`/quotations/${quotationId}`);
  revalidatePath(`/customers/${quotation.customer_id}`);

  return { success: true, orderId: order.id };
}

// 4. UPDATE ORDER STATUS (DELIVERY & PAYMENT STATUS)
export async function updateOrderStatusAction(
  orderId: string,
  deliveryStatus?: string,
  paymentStatus?: string
): Promise<{ success: boolean; error?: string }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (deliveryStatus) updateData.delivery_status = deliveryStatus;
  if (paymentStatus) updateData.payment_status = paymentStatus;

  const { data: oldOrd } = await supabase.from('orders').select('order_number, customer_id, delivery_status, payment_status').eq('id', orderId).single();

  const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'order',
    entity_id: orderId,
    customer_id: oldOrd?.customer_id,
    action_type: 'status_changed',
    description: `Order ${oldOrd?.order_number || orderId} status updated: Delivery [${deliveryStatus || oldOrd?.delivery_status}], Payment [${paymentStatus || oldOrd?.payment_status}]`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/orders');
  return { success: true };
}
