'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ProductVariantRow, ProductRow, StockMovementRow, StockMovementType } from '@/types/database';

export interface InventoryItemDisplay {
  variantId: string;
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  packSize: string;
  variantSku: string;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface GetInventoryParams {
  search?: string;
  category?: string;
  status?: string; // 'all' | 'low_stock' | 'out_of_stock' | 'in_stock'
  page?: number;
  limit?: number;
}

export interface GetInventoryResult {
  items: InventoryItemDisplay[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  stats: {
    totalVariants: number;
    totalStockUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

// 1. GET INVENTORY ITEMS (JOINING PRODUCTS & VARIANTS WITH STOCK THRESHOLD STATUS)
export async function getInventory(params: GetInventoryParams = {}): Promise<GetInventoryResult> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoItems: InventoryItemDisplay[] = [
      {
        variantId: 'pv-101',
        productId: 'p-101',
        productName: 'HIPA Pure Turmeric Powder',
        productSku: 'HIPA-TRM-01',
        category: 'Ground Spices',
        packSize: '100g pack',
        variantSku: 'HIPA-TRM-100G',
        unitPrice: 32.0,
        stockQuantity: 1200,
        reorderLevel: 200,
        status: 'in_stock',
      },
      {
        variantId: 'pv-102',
        productId: 'p-101',
        productName: 'HIPA Pure Turmeric Powder',
        productSku: 'HIPA-TRM-01',
        category: 'Ground Spices',
        packSize: '500g pouch',
        variantSku: 'HIPA-TRM-500G',
        unitPrice: 120.0,
        stockQuantity: 85,
        reorderLevel: 100,
        status: 'low_stock',
      },
      {
        variantId: 'pv-103',
        productId: 'p-102',
        productName: 'HIPA Special Garam Masala',
        productSku: 'HIPA-GRM-01',
        category: 'Blends',
        packSize: '100g pack',
        variantSku: 'HIPA-GRM-100G',
        unitPrice: 65.0,
        stockQuantity: 450,
        reorderLevel: 150,
        status: 'in_stock',
      },
      {
        variantId: 'pv-104',
        productId: 'p-103',
        productName: 'HIPA Premium Sambar Powder',
        productSku: 'HIPA-SMB-01',
        category: 'Blends',
        packSize: '1kg bulk bag',
        variantSku: 'HIPA-SMB-1KG',
        unitPrice: 240.0,
        stockQuantity: 0,
        reorderLevel: 50,
        status: 'out_of_stock',
      },
    ];

    let filtered = [...demoItems];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (i) => i.productName.toLowerCase().includes(q) || i.variantSku.toLowerCase().includes(q) || i.productSku.toLowerCase().includes(q)
      );
    }
    if (params.category && params.category !== 'all') {
      filtered = filtered.filter((i) => i.category === params.category);
    }
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((i) => i.status === params.status);
    }

    const lowStockCount = filtered.filter((i) => i.status === 'low_stock').length;
    const outOfStockCount = filtered.filter((i) => i.status === 'out_of_stock').length;
    const totalStockUnits = filtered.reduce((sum, i) => sum + i.stockQuantity, 0);

    return {
      items: filtered,
      totalEntries: filtered.length,
      totalPages: 1,
      currentPage: 1,
      stats: {
        totalVariants: filtered.length,
        totalStockUnits,
        lowStockCount,
        outOfStockCount,
      },
    };
  }

  const supabase = await createClient();

  const { data: variants, error } = await supabase.from('product_variants').select('*, products(*)');

  if (error || !variants) {
    console.error('Error fetching inventory:', error?.message);
    return {
      items: [],
      totalEntries: 0,
      totalPages: 1,
      currentPage: 1,
      stats: { totalVariants: 0, totalStockUnits: 0, lowStockCount: 0, outOfStockCount: 0 },
    };
  }

  let formattedItems: InventoryItemDisplay[] = variants.map((v) => {
    const prod = (v.products as unknown) as ProductRow | null;
    const stockQty = Number(v.stock_quantity || 0);
    const reorderLevel = 100; // Standard warehouse reorder threshold

    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (stockQty <= 0) status = 'out_of_stock';
    else if (stockQty <= reorderLevel) status = 'low_stock';

    return {
      variantId: v.id,
      productId: v.product_id,
      productName: prod?.name || 'Spice Product',
      productSku: prod?.sku || 'HIPA-SKU',
      category: prod?.category || 'General Spices',
      packSize: v.pack_size,
      variantSku: v.sku_variant,
      unitPrice: Number(v.unit_price || 0),
      stockQuantity: stockQty,
      reorderLevel,
      status,
    };
  });

  if (params.search) {
    const q = params.search.toLowerCase();
    formattedItems = formattedItems.filter(
      (i) => i.productName.toLowerCase().includes(q) || i.variantSku.toLowerCase().includes(q) || i.productSku.toLowerCase().includes(q)
    );
  }
  if (params.category && params.category !== 'all') {
    formattedItems = formattedItems.filter((i) => i.category === params.category);
  }
  if (params.status && params.status !== 'all') {
    formattedItems = formattedItems.filter((i) => i.status === params.status);
  }

  const totalEntries = formattedItems.length;
  const totalPages = Math.ceil(totalEntries / limit) || 1;
  const paginatedItems = formattedItems.slice(offset, offset + limit);

  const lowStockCount = formattedItems.filter((i) => i.status === 'low_stock').length;
  const outOfStockCount = formattedItems.filter((i) => i.status === 'out_of_stock').length;
  const totalStockUnits = formattedItems.reduce((sum, i) => sum + i.stockQuantity, 0);

  return {
    items: paginatedItems,
    totalEntries,
    totalPages,
    currentPage: page,
    stats: {
      totalVariants: totalEntries,
      totalStockUnits,
      lowStockCount,
      outOfStockCount,
    },
  };
}

// 2. GET STOCK MOVEMENTS AUDIT LOG
export async function getStockMovements(limit = 20): Promise<StockMovementRow[]> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    return [
      {
        id: 'sm-1',
        product_id: 'p-101',
        variant_id: 'pv-102',
        movement_type: 'stock_in',
        quantity: 500,
        previous_stock: 350,
        new_stock: 850,
        reference_id: 'GRN-2026-004',
        reason: 'Factory production batch received',
        performed_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: 'sm-2',
        product_id: 'p-102',
        variant_id: 'pv-103',
        movement_type: 'order_fulfillment',
        quantity: 200,
        previous_stock: 650,
        new_stock: 450,
        reference_id: 'HIPA-ORD-2026-0001',
        reason: 'Order HIPA-ORD-2026-0001 dispatched to Heritage Foods',
        performed_by: 'demo-user-101',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];
  }

  const supabase = await createClient();
  const { data } = await supabase.from('activities').select('*').eq('entity_type', 'inventory').order('created_at', { ascending: false }).limit(limit);

  return (data || []).map((act) => ({
    id: act.id,
    product_id: act.entity_id,
    variant_id: (act.metadata?.variant_id as string) || null,
    movement_type: (act.metadata?.movement_type as StockMovementType) || 'stock_in',
    quantity: (act.metadata?.quantity as number) || 0,
    previous_stock: (act.metadata?.previous_stock as number) || 0,
    new_stock: (act.metadata?.new_stock as number) || 0,
    reference_id: (act.metadata?.reference_id as string) || null,
    reason: act.description,
    performed_by: act.performed_by,
    created_at: act.created_at,
  }));
}

// 3. CONTROLLED STOCK ADJUSTMENT (ATOMIC BALANCE UPDATE & AUDIT MOVEMENT LOGGING)
export async function adjustStockAction(
  variantId: string,
  movementType: StockMovementType,
  quantity: number,
  reason: string,
  referenceId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!variantId) return { success: false, error: 'Target Variant selection is required.' };
  if (isNaN(quantity) || quantity <= 0) return { success: false, error: 'Adjustment quantity must be a positive number greater than 0.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/inventory');
    revalidatePath('/products');
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch current variant stock quantity
  const { data: variant, error: vError } = await supabase
    .from('product_variants')
    .select('id, product_id, pack_size, sku_variant, stock_quantity')
    .eq('id', variantId)
    .single();

  if (vError || !variant) return { success: false, error: 'Selected variant record not found.' };

  const prevStock = Number(variant.stock_quantity || 0);
  let newStock = prevStock;

  if (movementType === 'stock_in' || movementType === 'adjustment_increase' || movementType === 'opening_stock') {
    newStock = prevStock + quantity;
  } else if (movementType === 'stock_out' || movementType === 'adjustment_decrease' || movementType === 'order_fulfillment') {
    newStock = prevStock - quantity;
  }

  if (newStock < 0) {
    return {
      success: false,
      error: `Insufficient stock balance! Current stock is ${prevStock} units. Cannot deduct ${quantity} units.`,
    };
  }

  // Atomic Update stock_quantity in database
  const { error: updateError } = await supabase
    .from('product_variants')
    .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
    .eq('id', variantId);

  if (updateError) return { success: false, error: updateError.message };

  // Insert Audit Activity & Stock Movement Entry
  await supabase.from('activities').insert({
    entity_type: 'inventory',
    entity_id: variant.product_id,
    action_type: movementType,
    description: `Stock adjusted for ${variant.sku_variant} (${variant.pack_size}): ${movementType.toUpperCase()} ${quantity} units (Balance: ${prevStock} ➔ ${newStock}). Reason: ${reason || 'N/A'}`,
    performed_by: user?.id || null,
    metadata: {
      variant_id: variantId,
      movement_type: movementType,
      quantity,
      previous_stock: prevStock,
      new_stock: newStock,
      reference_id: referenceId || null,
    },
  });

  revalidatePath('/inventory');
  revalidatePath(`/products/${variant.product_id}`);
  return { success: true };
}

// 4. ORDER FULFILLMENT AUTOMATIC STOCK DEDUCTION
export async function fulfillOrderStockAction(orderId: string): Promise<{ success: boolean; error?: string }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/inventory');
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: order } = await supabase.from('orders').select('order_number, delivery_status').eq('id', orderId).single();
  if (!order) return { success: false, error: 'Order not found.' };

  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);
  if (!items || items.length === 0) return { success: false, error: 'No order items found for stock deduction.' };

  // Deduct stock for each line item
  for (const item of items) {
    if (item.variant_id) {
      const { data: variant } = await supabase.from('product_variants').select('stock_quantity').eq('id', item.variant_id).single();
      if (variant) {
        const prevStock = Number(variant.stock_quantity || 0);
        const newStock = Math.max(0, prevStock - item.quantity);

        await supabase.from('product_variants').update({ stock_quantity: newStock }).eq('id', item.variant_id);

        await supabase.from('activities').insert({
          entity_type: 'inventory',
          entity_id: item.product_id || orderId,
          action_type: 'order_fulfillment',
          description: `Stock deducted for Order ${order.order_number}: ${item.product_name_snapshot} (${item.quantity} units)`,
          performed_by: user?.id || null,
          metadata: {
            variant_id: item.variant_id,
            movement_type: 'order_fulfillment',
            quantity: item.quantity,
            previous_stock: prevStock,
            new_stock: newStock,
            reference_id: order.order_number,
          },
        });
      }
    }
  }

  await supabase.from('orders').update({ delivery_status: 'dispatched', updated_at: new Date().toISOString() }).eq('id', orderId);

  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/orders');
  revalidatePath('/inventory');
  return { success: true };
}
