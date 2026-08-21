'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { InvoiceRow, InvoiceItemRow, PaymentRow, CustomerRow, OrderRow, ActivityRow, PaymentMethod } from '@/types/database';

export interface GetInvoicesParams {
  search?: string;
  status?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

export interface GetInvoicesResult {
  invoices: InvoiceRow[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  stats: {
    totalInvoiced: number;
    totalCollected: number;
    outstandingBalance: number;
  };
}

// 1. GET INVOICES (WITH SEARCH, STATUS FILTER, CUSTOMER FILTER, FINANCIAL AGGREGATION)
export async function getInvoices(params: GetInvoicesParams = {}): Promise<GetInvoicesResult> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoInvoices: InvoiceRow[] = [
      {
        id: 'inv-101',
        invoice_number: 'HIPA-INV-2026-0001',
        order_id: '70000000-0000-0000-0000-000000000001',
        customer_id: '30000000-0000-0000-0000-000000000002',
        issue_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        due_date: new Date(Date.now() + 86400000 * 25).toISOString().split('T')[0],
        subtotal: 450000.0,
        discount_amount: 15000.0,
        tax_amount: 21750.0,
        total_amount: 456750.0,
        amount_paid: 456750.0,
        balance_due: 0.0,
        status: 'paid',
        notes: 'Commercial GST invoice for bulk spice order.',
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'inv-102',
        invoice_number: 'HIPA-INV-2026-0002',
        order_id: '70000000-0000-0000-0000-000000000002',
        customer_id: '30000000-0000-0000-0000-000000000001',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        subtotal: 125000.0,
        discount_amount: 5000.0,
        tax_amount: 6000.0,
        total_amount: 126000.0,
        amount_paid: 50000.0,
        balance_due: 76000.0,
        status: 'partially_paid',
        notes: '50% advance payment received.',
        created_by: 'demo-user-101',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let filtered = [...demoInvoices];
    if (params.customerId) filtered = filtered.filter((i) => i.customer_id === params.customerId);
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((i) => i.invoice_number.toLowerCase().includes(q));
    }
    if (params.status && params.status !== 'all') filtered = filtered.filter((i) => i.status === params.status);

    const totalInvoiced = filtered.reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
    const totalCollected = filtered.reduce((sum, i) => sum + Number(i.amount_paid || 0), 0);
    const outstandingBalance = filtered.reduce((sum, i) => sum + Number(i.balance_due || 0), 0);

    return {
      invoices: filtered,
      totalEntries: filtered.length,
      totalPages: 1,
      currentPage: 1,
      stats: { totalInvoiced, totalCollected, outstandingBalance },
    };
  }

  const supabase = await createClient();
  let query = supabase.from('invoices').select('*', { count: 'exact' });

  if (params.customerId) query = query.eq('customer_id', params.customerId);
  if (params.search) {
    const q = `%${params.search}%`;
    query = query.or(`invoice_number.ilike.${q}`);
  }
  if (params.status && params.status !== 'all') query = query.eq('status', params.status);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return { invoices: [], totalEntries: 0, totalPages: 1, currentPage: 1, stats: { totalInvoiced: 0, totalCollected: 0, outstandingBalance: 0 } };
  }

  const totalInvoiced = (data || []).reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
  const totalCollected = (data || []).reduce((sum, i) => sum + Number(i.amount_paid || 0), 0);
  const outstandingBalance = (data || []).reduce((sum, i) => sum + Number(i.balance_due || 0), 0);

  return {
    invoices: (data || []) as InvoiceRow[],
    totalEntries: count || 0,
    totalPages: Math.ceil((count || 0) / limit) || 1,
    currentPage: page,
    stats: { totalInvoiced, totalCollected, outstandingBalance },
  };
}

// 2. GET SINGLE INVOICE BY ID WITH ITEMS, PAYMENTS & CUSTOMER
export async function getInvoiceById(
  id: string
): Promise<{ invoice: InvoiceRow | null; items: InvoiceItemRow[]; payments: PaymentRow[]; customer: CustomerRow | null; order: OrderRow | null; activities: ActivityRow[] }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoInvoice: InvoiceRow = {
      id,
      invoice_number: 'HIPA-INV-2026-0001',
      order_id: '70000000-0000-0000-0000-000000000001',
      customer_id: '30000000-0000-0000-0000-000000000002',
      issue_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      due_date: new Date(Date.now() + 86400000 * 25).toISOString().split('T')[0],
      subtotal: 450000.0,
      discount_amount: 15000.0,
      tax_amount: 21750.0,
      total_amount: 456750.0,
      amount_paid: 456750.0,
      balance_due: 0.0,
      status: 'paid',
      notes: 'Commercial GST invoice for bulk spice order.',
      created_by: 'demo-user-101',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const demoItems: InvoiceItemRow[] = [
      {
        id: 'ii-1',
        invoice_id: id,
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

    const demoPayments: PaymentRow[] = [
      {
        id: 'pay-1',
        invoice_id: id,
        customer_id: '30000000-0000-0000-0000-000000000002',
        payment_number: 'HIPA-PAY-2026-0001',
        payment_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        amount: 456750.0,
        payment_method: 'bank_transfer',
        reference_number: 'NEFT-9988776655',
        notes: 'Full payment via HDFC Bank NEFT',
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
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

    return { invoice: demoInvoice, items: demoItems, payments: demoPayments, customer: demoCustomer, order: null, activities: [] };
  }

  const supabase = await createClient();

  const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).single();
  if (!invoice) return { invoice: null, items: [], payments: [], customer: null, order: null, activities: [] };

  const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', id);
  const { data: payments } = await supabase.from('payments').select('*').eq('invoice_id', id).order('created_at', { ascending: false });

  let customer: CustomerRow | null = null;
  if (invoice.customer_id) {
    const { data: cust } = await supabase.from('customers').select('*').eq('id', invoice.customer_id).single();
    customer = cust as CustomerRow | null;
  }

  let order: OrderRow | null = null;
  if (invoice.order_id) {
    const { data: ord } = await supabase.from('orders').select('*').eq('id', invoice.order_id).single();
    order = ord as OrderRow | null;
  }

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('entity_type', 'invoice')
    .eq('entity_id', id)
    .order('created_at', { ascending: false });

  return {
    invoice: invoice as InvoiceRow,
    items: (items || []) as InvoiceItemRow[],
    payments: (payments || []) as PaymentRow[],
    customer,
    order,
    activities: (activities || []) as ActivityRow[],
  };
}

// 3. CREATE INVOICE FROM CONFIRMED ORDER (DUPLICATE PREVENTATIVE CHECK)
export async function createInvoiceFromOrderAction(
  orderId: string
): Promise<{ success: boolean; error?: string; invoiceId?: string }> {
  if (!orderId) return { success: false, error: 'Order ID is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/invoices');
    revalidatePath(`/orders/${orderId}`);
    return { success: true, invoiceId: 'demo-inv-new' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Duplicate Check
  const { data: existingInv } = await supabase.from('invoices').select('id, invoice_number').eq('order_id', orderId).maybeSingle();
  if (existingInv) {
    return {
      success: false,
      error: `An invoice (${existingInv.invoice_number}) has already been issued for this purchase order.`,
      invoiceId: existingInv.id,
    };
  }

  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (!order) return { success: false, error: 'Order record not found.' };

  const { data: orderItems } = await supabase.from('order_items').select('*').eq('order_id', orderId);
  if (!orderItems || orderItems.length === 0) return { success: false, error: 'Cannot create invoice for an order with no items.' };

  const invNum = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `HIPA-INV-2026-${invNum}`;
  const issueDate = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];

  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      order_id: orderId,
      customer_id: order.customer_id,
      issue_date: issueDate,
      due_date: dueDate,
      subtotal: order.subtotal,
      discount_amount: order.discount_amount,
      tax_amount: order.tax_amount,
      total_amount: order.total_amount,
      amount_paid: 0.0,
      balance_due: order.total_amount,
      status: 'issued',
      notes: `Commercial GST Tax Invoice generated from Order ${order.order_number}`,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (invError || !invoice) return { success: false, error: invError?.message || 'Failed to generate invoice.' };

  const invoiceItemsToInsert = orderItems.map((oi) => ({
    invoice_id: invoice.id,
    product_id: oi.product_id,
    variant_id: oi.variant_id,
    product_name_snapshot: oi.product_name_snapshot,
    pack_size_snapshot: oi.pack_size_snapshot,
    quantity: oi.quantity,
    unit_price: oi.unit_price,
    total_price: oi.total_price,
  }));

  await supabase.from('invoice_items').insert(invoiceItemsToInsert);

  await supabase.from('activities').insert({
    entity_type: 'invoice',
    entity_id: invoice.id,
    customer_id: order.customer_id,
    action_type: 'created',
    description: `Tax Invoice ${invoice.invoice_number} issued for Order ${order.order_number} (Grand Total: ₹${Number(order.total_amount).toLocaleString('en-IN')})`,
    performed_by: user?.id || null,
  });

  revalidatePath('/invoices');
  revalidatePath(`/orders/${orderId}`);
  return { success: true, invoiceId: invoice.id };
}

// 4. RECORD PAYMENT RECEIPT (WITH OVERPAYMENT PREVENTION & BALANCE CALCULATION)
export async function recordPaymentAction(
  invoiceId: string,
  amount: number,
  paymentMethod: PaymentMethod,
  referenceNumber?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  if (!invoiceId) return { success: false, error: 'Invoice ID is required.' };
  if (isNaN(amount) || amount <= 0) return { success: false, error: 'Payment amount must be greater than ₹0.00.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: invoice } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
  if (!invoice) return { success: false, error: 'Invoice record not found.' };

  const currentBalance = Number(invoice.balance_due || 0);

  // Overpayment Prevention Check
  if (amount > currentBalance + 0.01) {
    return {
      success: false,
      error: `Payment amount (₹${amount.toLocaleString('en-IN')}) exceeds the remaining balance due (₹${currentBalance.toLocaleString('en-IN')}). Overpayment is prohibited.`,
    };
  }

  const newAmountPaid = Number(invoice.amount_paid || 0) + amount;
  const newBalanceDue = Math.max(0, Number(invoice.total_amount || 0) - newAmountPaid);
  const newStatus = newBalanceDue <= 0 ? 'paid' : 'partially_paid';

  const payNum = Math.floor(1000 + Math.random() * 9000);
  const paymentNumber = `HIPA-PAY-2026-${payNum}`;
  const todayStr = new Date().toISOString().split('T')[0];

  // Insert payment row
  const { error: pError } = await supabase.from('payments').insert({
    invoice_id: invoiceId,
    customer_id: invoice.customer_id,
    payment_number: paymentNumber,
    payment_date: todayStr,
    amount,
    payment_method: paymentMethod,
    reference_number: referenceNumber ? referenceNumber.trim() : null,
    notes: notes ? notes.trim() : null,
    created_by: user?.id || null,
  });

  if (pError) return { success: false, error: pError.message };

  // Update invoice totals and status
  await supabase
    .from('invoices')
    .update({
      amount_paid: newAmountPaid,
      balance_due: newBalanceDue,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId);

  // Update order payment_status if applicable
  if (invoice.order_id) {
    const orderPaymentStatus = newStatus === 'paid' ? 'paid' : 'partially_paid';
    await supabase.from('orders').update({ payment_status: orderPaymentStatus }).eq('id', invoice.order_id);
  }

  await supabase.from('activities').insert({
    entity_type: 'invoice',
    entity_id: invoiceId,
    customer_id: invoice.customer_id,
    action_type: 'payment_received',
    description: `Payment ${paymentNumber} of ₹${amount.toLocaleString('en-IN')} received via ${paymentMethod.toUpperCase()} (Remaining Balance: ₹${newBalanceDue.toLocaleString('en-IN')})`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath('/invoices');
  return { success: true };
}
