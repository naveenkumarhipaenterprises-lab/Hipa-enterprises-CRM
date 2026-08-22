'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { DeliveryRow, OrderRow, OrderItemRow, CustomerRow, ActivityRow, FulfilmentStatus } from '@/types/database';
import { fulfillOrderStockAction } from '@/lib/actions/inventory.actions';

export interface GetDeliveriesParams {
  search?: string;
  status?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

export interface GetDeliveriesResult {
  deliveries: DeliveryRow[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  stats: {
    totalShipments: number;
    activeDispatches: number;
    completedDeliveries: number;
  };
}

// 1. GET DELIVERIES DIRECTORY (WITH SEARCH, STATUS FILTER, PAGINATION)
export async function getDeliveries(params: GetDeliveriesParams = {}): Promise<GetDeliveriesResult> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoDeliveries: DeliveryRow[] = [
      {
        id: 'del-101',
        delivery_number: 'HIPA-DEL-2026-0001',
        order_id: '70000000-0000-0000-0000-000000000001',
        customer_id: '30000000-0000-0000-0000-000000000002',
        assigned_driver: 'Ramesh Logistics / MH-04-AB-1234',
        vehicle_number: 'MH-04-AB-1234',
        shipping_address: 'Delhi Industrial Area, Warehouse #4',
        tracking_ref: 'TRK-99887766',
        dispatch_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        delivered_date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
        status: 'delivered',
        notes: 'Signed POD received by client warehouse manager.',
        created_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'del-102',
        delivery_number: 'HIPA-DEL-2026-0002',
        order_id: '70000000-0000-0000-0000-000000000002',
        customer_id: '30000000-0000-0000-0000-000000000001',
        assigned_driver: 'Express Spice Cargo',
        vehicle_number: 'MH-02-CD-5678',
        shipping_address: 'Andheri West Market, Mumbai',
        tracking_ref: 'TRK-55443322',
        dispatch_date: new Date().toISOString().split('T')[0],
        delivered_date: null,
        status: 'out_for_delivery',
        notes: 'In-transit for same-day delivery.',
        created_by: 'demo-user-101',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let filtered = [...demoDeliveries];
    if (params.customerId) filtered = filtered.filter((d) => d.customer_id === params.customerId);
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (d) => d.delivery_number.toLowerCase().includes(q) || (d.tracking_ref && d.tracking_ref.toLowerCase().includes(q))
      );
    }
    if (params.status && params.status !== 'all') filtered = filtered.filter((d) => d.status === params.status);

    const activeDispatches = filtered.filter((d) => d.status === 'dispatched' || d.status === 'out_for_delivery' || d.status === 'ready_for_dispatch').length;
    const completedDeliveries = filtered.filter((d) => d.status === 'delivered').length;

    return {
      deliveries: filtered,
      totalEntries: filtered.length,
      totalPages: 1,
      currentPage: 1,
      stats: { totalShipments: filtered.length, activeDispatches, completedDeliveries },
    };
  }

  const supabase = await createClient();
  let query = supabase.from('deliveries').select('*', { count: 'exact' });

  if (params.customerId) query = query.eq('customer_id', params.customerId);
  if (params.search) {
    const q = `%${params.search}%`;
    query = query.or(`delivery_number.ilike.${q},tracking_ref.ilike.${q}`);
  }
  if (params.status && params.status !== 'all') query = query.eq('status', params.status);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return { deliveries: [], totalEntries: 0, totalPages: 1, currentPage: 1, stats: { totalShipments: 0, activeDispatches: 0, completedDeliveries: 0 } };
  }

  const activeDispatches = (data || []).filter((d) => d.status === 'dispatched' || d.status === 'out_for_delivery' || d.status === 'ready_for_dispatch').length;
  const completedDeliveries = (data || []).filter((d) => d.status === 'delivered').length;

  return {
    deliveries: (data || []) as DeliveryRow[],
    totalEntries: count || 0,
    totalPages: Math.ceil((count || 0) / limit) || 1,
    currentPage: page,
    stats: { totalShipments: count || 0, activeDispatches, completedDeliveries },
  };
}

// 2. GET SINGLE DELIVERY MANIFEST BY ID
export async function getDeliveryById(
  id: string
): Promise<{ delivery: DeliveryRow | null; order: OrderRow | null; items: OrderItemRow[]; customer: CustomerRow | null; activities: ActivityRow[] }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoDelivery: DeliveryRow = {
      id,
      delivery_number: 'HIPA-DEL-2026-0001',
      order_id: '70000000-0000-0000-0000-000000000001',
      customer_id: '30000000-0000-0000-0000-000000000002',
      assigned_driver: 'Ramesh Logistics / MH-04-AB-1234',
      vehicle_number: 'MH-04-AB-1234',
      shipping_address: 'Delhi Industrial Area, Warehouse #4',
      tracking_ref: 'TRK-99887766',
      dispatch_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      delivered_date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
      status: 'delivered',
      notes: 'Signed POD received by client warehouse manager.',
      created_by: 'demo-user-101',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      updated_at: new Date().toISOString(),
    };

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

    return { delivery: demoDelivery, order: null, items: [], customer: demoCustomer, activities: [] };
  }

  const supabase = await createClient();

  const { data: delivery } = await supabase.from('deliveries').select('*').eq('id', id).single();
  if (!delivery) return { delivery: null, order: null, items: [], customer: null, activities: [] };

  let order: OrderRow | null = null;
  let items: OrderItemRow[] = [];
  if (delivery.order_id) {
    const { data: ord } = await supabase.from('orders').select('*').eq('id', delivery.order_id).single();
    order = ord as OrderRow | null;

    const { data: ordItems } = await supabase.from('order_items').select('*').eq('order_id', delivery.order_id);
    items = (ordItems || []) as OrderItemRow[];
  }

  let customer: CustomerRow | null = null;
  if (delivery.customer_id) {
    const { data: cust } = await supabase.from('customers').select('*').eq('id', delivery.customer_id).single();
    customer = cust as CustomerRow | null;
  }

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('entity_type', 'delivery')
    .eq('entity_id', id)
    .order('created_at', { ascending: false });

  return {
    delivery: delivery as DeliveryRow,
    order,
    items,
    customer,
    activities: (activities || []) as ActivityRow[],
  };
}

// 3. CREATE DELIVERY MANIFEST FROM ORDER
export async function createDeliveryManifestAction(
  orderId: string,
  assignedDriver?: string,
  vehicleNumber?: string,
  shippingAddress?: string,
  trackingRef?: string,
  notes?: string
): Promise<{ success: boolean; error?: string; deliveryId?: string }> {
  if (!orderId) return { success: false, error: 'Order ID is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/deliveries');
    revalidatePath(`/orders/${orderId}`);
    return { success: true, deliveryId: 'demo-del-new' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Duplicate Check
  const { data: existingDel } = await supabase.from('deliveries').select('id, delivery_number').eq('order_id', orderId).maybeSingle();
  if (existingDel) {
    return {
      success: false,
      error: `A delivery manifest (${existingDel.delivery_number}) already exists for this order.`,
      deliveryId: existingDel.id,
    };
  }

  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (!order) return { success: false, error: 'Order record not found.' };

  const delNum = Math.floor(1000 + Math.random() * 9000);
  const deliveryNumber = `HIPA-DEL-2026-${delNum}`;

  const { data: delivery, error: delError } = await supabase
    .from('deliveries')
    .insert({
      delivery_number: deliveryNumber,
      order_id: orderId,
      customer_id: order.customer_id,
      assigned_driver: assignedDriver ? assignedDriver.trim() : null,
      vehicle_number: vehicleNumber ? vehicleNumber.trim() : null,
      shipping_address: shippingAddress ? shippingAddress.trim() : null,
      tracking_ref: trackingRef ? trackingRef.trim() : null,
      dispatch_date: null,
      delivered_date: null,
      status: 'ready_for_dispatch',
      notes: notes ? notes.trim() : null,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (delError || !delivery) return { success: false, error: delError?.message || 'Failed to create delivery manifest.' };

  await supabase.from('orders').update({ delivery_status: 'processing' }).eq('id', orderId);

  await supabase.from('activities').insert({
    entity_type: 'delivery',
    entity_id: delivery.id,
    customer_id: order.customer_id,
    action_type: 'created',
    description: `Delivery Manifest ${delivery.delivery_number} created for Order ${order.order_number}`,
    performed_by: user?.id || null,
  });

  revalidatePath('/deliveries');
  revalidatePath(`/orders/${orderId}`);
  return { success: true, deliveryId: delivery.id };
}

// 4. UPDATE DELIVERY STATUS (WITH AUTOMATIC INVENTORY DEDUCTION ON DISPATCH)
export async function updateDeliveryStatusAction(
  deliveryId: string,
  newStatus: FulfilmentStatus
): Promise<{ success: boolean; error?: string }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/deliveries/${deliveryId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: delivery } = await supabase.from('deliveries').select('*').eq('id', deliveryId).single();
  if (!delivery) return { success: false, error: 'Delivery record not found.' };

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  const todayStr = new Date().toISOString().split('T')[0];

  if (newStatus === 'dispatched' || newStatus === 'out_for_delivery') {
    if (!delivery.dispatch_date) updateData.dispatch_date = todayStr;
    // Deduct stock if not already deducted
    await fulfillOrderStockAction(delivery.order_id);
  } else if (newStatus === 'delivered') {
    updateData.delivered_date = todayStr;
    await supabase.from('orders').update({ delivery_status: 'delivered' }).eq('id', delivery.order_id);
  }

  const { error } = await supabase.from('deliveries').update(updateData).eq('id', deliveryId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'delivery',
    entity_id: deliveryId,
    customer_id: delivery.customer_id,
    action_type: 'status_changed',
    description: `Delivery Manifest ${delivery.delivery_number} status updated to ${newStatus.replace('_', ' ').toUpperCase()}`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/deliveries/${deliveryId}`);
  revalidatePath('/deliveries');
  return { success: true };
}
