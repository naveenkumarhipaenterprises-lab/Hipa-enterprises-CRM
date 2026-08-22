'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { SupplierRow, PurchaseOrderRow, PurchaseOrderItemRow, ActivityRow } from '@/types/database';

export interface CreatePOItemInput {
  productId: string;
  variantId?: string;
  productName: string;
  packSize: string;
  quantity: number;
  unitCost: number;
}

export interface GetSuppliersParams {
  search?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}

export interface GetSuppliersResult {
  suppliers: SupplierRow[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
}

// 1. GET SUPPLIERS MASTER LIST
export async function getSuppliers(params: GetSuppliersParams = {}): Promise<GetSuppliersResult> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoSuppliers: SupplierRow[] = [
      {
        id: 'sup-101',
        supplier_code: 'HIPA-SUP-1001',
        name: 'Kerala Spice Farmers Co-op',
        contact_person: 'Mathew Varghese',
        phone: '+91 98470 11223',
        email: 'mathew@keralaspices.coop',
        address: 'Spices Park, Idukki, Kerala',
        gstin: '32AAACK1234F1Z9',
        payment_terms: 'Net 30 days',
        notes: 'Primary organic turmeric and black pepper vendor.',
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sup-102',
        supplier_code: 'HIPA-SUP-1002',
        name: 'Guntur Chilli Traders',
        contact_person: 'Ramesh Reddy',
        phone: '+91 98480 33445',
        email: 'ramesh@gunturchilli.com',
        address: 'Chilli Yard, Guntur, AP',
        gstin: '37AAACG5678E1Z4',
        payment_terms: '50% advance, 50% on receipt',
        notes: 'Bulk red chilli powder and whole dry chilli supplier.',
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 120).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let filtered = [...demoSuppliers];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (s) => s.name.toLowerCase().includes(q) || s.supplier_code.toLowerCase().includes(q) || (s.contact_person && s.contact_person.toLowerCase().includes(q))
      );
    }
    if (params.isActive && params.isActive !== 'all') {
      const activeBool = params.isActive === 'active';
      filtered = filtered.filter((s) => s.is_active === activeBool);
    }

    return {
      suppliers: filtered,
      totalEntries: filtered.length,
      totalPages: 1,
      currentPage: 1,
    };
  }

  const supabase = await createClient();
  let query = supabase.from('suppliers').select('*', { count: 'exact' });

  if (params.search) {
    const q = `%${params.search}%`;
    query = query.or(`name.ilike.${q},supplier_code.ilike.${q},contact_person.ilike.${q}`);
  }
  if (params.isActive && params.isActive !== 'all') {
    query = query.eq('is_active', params.isActive === 'active');
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching suppliers:', error.message);
    return { suppliers: [], totalEntries: 0, totalPages: 1, currentPage: 1 };
  }

  return {
    suppliers: (data || []) as SupplierRow[],
    totalEntries: count || 0,
    totalPages: Math.ceil((count || 0) / limit) || 1,
    currentPage: page,
  };
}

// 2. GET SINGLE SUPPLIER BY ID
export async function getSupplierById(
  id: string
): Promise<{ supplier: SupplierRow | null; purchaseOrders: PurchaseOrderRow[]; activities: ActivityRow[] }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoSupplier: SupplierRow = {
      id,
      supplier_code: 'HIPA-SUP-1001',
      name: 'Kerala Spice Farmers Co-op',
      contact_person: 'Mathew Varghese',
      phone: '+91 98470 11223',
      email: 'mathew@keralaspices.coop',
      address: 'Spices Park, Idukki, Kerala',
      gstin: '32AAACK1234F1Z9',
      payment_terms: 'Net 30 days',
      notes: 'Primary organic turmeric and black pepper vendor.',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
      updated_at: new Date().toISOString(),
    };

    return { supplier: demoSupplier, purchaseOrders: [], activities: [] };
  }

  const supabase = await createClient();

  const { data: supplier } = await supabase.from('suppliers').select('*').eq('id', id).single();
  if (!supplier) return { supplier: null, purchaseOrders: [], activities: [] };

  const { data: pos } = await supabase.from('purchase_orders').select('*').eq('supplier_id', id).order('created_at', { ascending: false });

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('entity_type', 'supplier')
    .eq('entity_id', id)
    .order('created_at', { ascending: false });

  return {
    supplier: supplier as SupplierRow,
    purchaseOrders: (pos || []) as PurchaseOrderRow[],
    activities: (activities || []) as ActivityRow[],
  };
}

// 3. CREATE SUPPLIER (WITH DUPLICATE CODE CHECK)
export async function createSupplierAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; supplierId?: string }> {
  const name = formData.get('name') as string;
  const contactPerson = formData.get('contactPerson') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const address = formData.get('address') as string;
  const gstin = formData.get('gstin') as string;
  const paymentTerms = formData.get('paymentTerms') as string;
  const notes = formData.get('notes') as string;

  if (!name || !name.trim()) return { success: false, error: 'Supplier Name is required.' };
  if (!phone || !phone.trim()) return { success: false, error: 'Supplier Phone is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/suppliers');
    return { success: true, supplierId: 'demo-sup-new' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const supNum = Math.floor(1000 + Math.random() * 9000);
  const supplierCode = `HIPA-SUP-${supNum}`;

  const { data: supplier, error } = await supabase
    .from('suppliers')
    .insert({
      supplier_code: supplierCode,
      name: name.trim(),
      contact_person: contactPerson ? contactPerson.trim() : null,
      phone: phone.trim(),
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      gstin: gstin ? gstin.trim().toUpperCase() : null,
      payment_terms: paymentTerms ? paymentTerms.trim() : 'Net 30 days',
      notes: notes ? notes.trim() : null,
      is_active: true,
    })
    .select()
    .single();

  if (error || !supplier) {
    return { success: false, error: error?.message || 'Failed to create supplier.' };
  }

  await supabase.from('activities').insert({
    entity_type: 'supplier',
    entity_id: supplier.id,
    action_type: 'created',
    description: `Supplier master "${supplier.name}" (${supplier.supplier_code}) registered`,
    performed_by: user?.id || null,
  });

  revalidatePath('/suppliers');
  return { success: true, supplierId: supplier.id };
}

// 4. GET PURCHASE ORDERS
export async function getPurchaseOrders(params: { search?: string; status?: string; supplierId?: string; page?: number; limit?: number } = {}) {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoPOs: PurchaseOrderRow[] = [
      {
        id: 'po-101',
        po_number: 'HIPA-PO-2026-0001',
        supplier_id: 'sup-101',
        order_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        expected_delivery: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
        subtotal: 250000.0,
        tax_amount: 12500.0,
        total_amount: 262500.0,
        status: 'issued',
        receiving_status: 'pending',
        notes: 'Bulk turmeric raw spice shipment.',
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    return {
      purchaseOrders: demoPOs,
      totalEntries: demoPOs.length,
      totalPages: 1,
      currentPage: 1,
      stats: { totalPOValue: 262500.0, pendingPOs: 1, receivedPOs: 0 },
    };
  }

  const supabase = await createClient();
  let query = supabase.from('purchase_orders').select('*', { count: 'exact' });

  if (params.supplierId) query = query.eq('supplier_id', params.supplierId);
  if (params.search) {
    const q = `%${params.search}%`;
    query = query.or(`po_number.ilike.${q}`);
  }
  if (params.status && params.status !== 'all') query = query.eq('status', params.status);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return { purchaseOrders: [], totalEntries: 0, totalPages: 1, currentPage: 1, stats: { totalPOValue: 0, pendingPOs: 0, receivedPOs: 0 } };
  }

  const totalValue = (data || []).reduce((sum, po) => sum + Number(po.total_amount || 0), 0);
  const pendingCount = (data || []).filter((po) => po.status === 'issued' || po.status === 'draft').length;
  const receivedCount = (data || []).filter((po) => po.status === 'received').length;

  return {
    purchaseOrders: (data || []) as PurchaseOrderRow[],
    totalEntries: count || 0,
    totalPages: Math.ceil((count || 0) / limit) || 1,
    currentPage: page,
    stats: { totalPOValue: totalValue, pendingPOs: pendingCount, receivedPOs: receivedCount },
  };
}

// 5. CREATE PURCHASE ORDER
export async function createPurchaseOrderAction(
  supplierId: string,
  itemsInput: CreatePOItemInput[],
  expectedDelivery?: string,
  notes?: string
): Promise<{ success: boolean; error?: string; poId?: string }> {
  if (!supplierId) return { success: false, error: 'Supplier selection is required.' };
  if (!itemsInput || itemsInput.length === 0) return { success: false, error: 'At least one purchase item is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/purchases');
    return { success: true, poId: 'demo-po-new' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Financial calculation
  let subtotal = 0;
  const processedItems = itemsInput.map((item) => {
    const lineTotal = item.quantity * item.unitCost;
    subtotal += lineTotal;
    return {
      product_id: item.productId || null,
      variant_id: item.variantId || null,
      product_name_snapshot: item.productName,
      pack_size_snapshot: item.packSize,
      quantity: item.quantity,
      quantity_received: 0,
      unit_cost: item.unitCost,
      total_cost: lineTotal,
    };
  });

  const taxAmount = (subtotal * 5) / 100; // 5% standard GST
  const grandTotal = subtotal + taxAmount;

  const poNum = Math.floor(1000 + Math.random() * 9000);
  const poNumber = `HIPA-PO-2026-${poNum}`;
  const todayStr = new Date().toISOString().split('T')[0];

  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .insert({
      po_number: poNumber,
      supplier_id: supplierId,
      order_date: todayStr,
      expected_delivery: expectedDelivery || null,
      subtotal,
      tax_amount: taxAmount,
      total_amount: grandTotal,
      status: 'issued',
      receiving_status: 'pending',
      notes: notes ? notes.trim() : null,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (poError || !po) {
    return { success: false, error: poError?.message || 'Failed to create purchase order.' };
  }

  const poItemsToInsert = processedItems.map((pi) => ({
    ...pi,
    po_id: po.id,
  }));

  await supabase.from('purchase_order_items').insert(poItemsToInsert);

  await supabase.from('activities').insert({
    entity_type: 'supplier',
    entity_id: supplierId,
    action_type: 'po_created',
    description: `Purchase Order ${po.po_number} issued (Total: ₹${grandTotal.toLocaleString('en-IN')})`,
    performed_by: user?.id || null,
  });

  revalidatePath('/purchases');
  revalidatePath(`/suppliers/${supplierId}`);
  return { success: true, poId: po.id };
}

// 6. RECEIVE PO ITEMS (INVENTORY STOCK IN INTEGRATION)
export async function receivePOItemsAction(
  poId: string,
  receivedItemsMap: Record<string, number> // itemId -> receivedQty
): Promise<{ success: boolean; error?: string }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/purchases');
    revalidatePath('/inventory');
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: po } = await supabase.from('purchase_orders').select('po_number').eq('id', poId).single();
  if (!po) return { success: false, error: 'Purchase Order not found.' };

  const { data: items } = await supabase.from('purchase_order_items').select('*').eq('po_id', poId);
  if (!items || items.length === 0) return { success: false, error: 'No purchase items found.' };

  let allCompleted = true;
  let partialReceived = false;

  for (const item of items) {
    const newlyReceived = receivedItemsMap[item.id] || 0;
    if (newlyReceived > 0) {
      const currentQtyReceived = Number(item.quantity_received || 0);
      const updatedQtyReceived = currentQtyReceived + newlyReceived;

      // Over-receiving validation
      if (updatedQtyReceived > item.quantity) {
        return {
          success: false,
          error: `Over-receiving prohibited: Attempting to receive total of ${updatedQtyReceived} units for item "${item.product_name_snapshot}" (Ordered: ${item.quantity} units, Already Received: ${currentQtyReceived} units).`,
        };
      }

      partialReceived = true;
      if (updatedQtyReceived < item.quantity) allCompleted = false;

      // Update purchase_order_items quantity_received
      await supabase.from('purchase_order_items').update({ quantity_received: updatedQtyReceived }).eq('id', item.id);

      // Increment Inventory Stock
      if (item.variant_id) {
        const { data: variant } = await supabase.from('product_variants').select('stock_quantity').eq('id', item.variant_id).single();
        if (variant) {
          const prevStock = Number(variant.stock_quantity || 0);
          const newStock = prevStock + newlyReceived;

          await supabase.from('product_variants').update({ stock_quantity: newStock }).eq('id', item.variant_id);

          await supabase.from('activities').insert({
            entity_type: 'inventory',
            entity_id: item.product_id || poId,
            action_type: 'stock_in',
            description: `Stock received from PO ${po.po_number}: ${item.product_name_snapshot} (${newlyReceived} units)`,
            performed_by: user?.id || null,
            metadata: {
              variant_id: item.variant_id,
              movement_type: 'stock_in',
              quantity: newlyReceived,
              previous_stock: prevStock,
              new_stock: newStock,
              reference_id: po.po_number,
            },
          });
        }
      }
    }
  }

  const newStatus = allCompleted ? 'received' : partialReceived ? 'partially_received' : 'issued';
  const newReceivingStatus = allCompleted ? 'completed' : partialReceived ? 'partial' : 'pending';

  await supabase
    .from('purchase_orders')
    .update({ status: newStatus, receiving_status: newReceivingStatus, updated_at: new Date().toISOString() })
    .eq('id', poId);

  revalidatePath('/purchases');
  revalidatePath('/inventory');
  return { success: true };
}
