'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ProductRow, ProductVariantRow, QuotationItemRow, OrderItemRow, ActivityRow } from '@/types/database';

export interface GetProductsParams {
  search?: string;
  category?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}

export interface GetProductsResult {
  products: ProductRow[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  stats: {
    totalProducts: number;
    activeProducts: number;
    totalCategories: number;
  };
}

// 1. GET PRODUCTS CATALOG (WITH SEARCH, CATEGORY FILTER, STATUS FILTER, PAGINATION)
export async function getProducts(params: GetProductsParams = {}): Promise<GetProductsResult> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoProducts: ProductRow[] = [
      {
        id: 'p-101',
        name: 'HIPA Pure Turmeric Powder',
        sku: 'HIPA-TRM-01',
        category: 'Ground Spices',
        description: 'High-curcumin farm-fresh turmeric powder with vibrant color and aroma.',
        image_url: null,
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'p-102',
        name: 'HIPA Special Garam Masala',
        sku: 'HIPA-GRM-01',
        category: 'Blends',
        description: 'Aromatic authentic blend of 13 whole spices for royal dishes.',
        image_url: null,
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'p-103',
        name: 'HIPA Premium Sambar Powder',
        sku: 'HIPA-SMB-01',
        category: 'Blends',
        description: 'Traditional South Indian sambar spice mix made with roasted lentils.',
        image_url: null,
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 120).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'p-104',
        name: 'HIPA Whole Malabar Black Pepper',
        sku: 'HIPA-PPR-01',
        category: 'Whole Spices',
        description: 'Grade-A Malabar black peppercorns with intense heat and essential oils.',
        image_url: null,
        is_active: false,
        created_at: new Date(Date.now() - 86400000 * 150).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let filtered = [...demoProducts];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (params.category && params.category !== 'all') {
      filtered = filtered.filter((p) => p.category === params.category);
    }
    if (params.isActive && params.isActive !== 'all') {
      const activeBool = params.isActive === 'active';
      filtered = filtered.filter((p) => p.is_active === activeBool);
    }

    return {
      products: filtered,
      totalEntries: filtered.length,
      totalPages: 1,
      currentPage: 1,
      stats: { totalProducts: 4, activeProducts: 3, totalCategories: 3 },
    };
  }

  const supabase = await createClient();
  let query = supabase.from('products').select('*', { count: 'exact' });

  if (params.search) {
    const q = `%${params.search}%`;
    query = query.or(`name.ilike.${q},sku.ilike.${q},category.ilike.${q}`);
  }
  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category);
  }
  if (params.isActive && params.isActive !== 'all') {
    query = query.eq('is_active', params.isActive === 'active');
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching products:', error.message);
    return {
      products: [],
      totalEntries: 0,
      totalPages: 1,
      currentPage: 1,
      stats: { totalProducts: 0, activeProducts: 0, totalCategories: 0 },
    };
  }

  const totalEntries = count || 0;
  const totalPages = Math.ceil(totalEntries / limit) || 1;

  const activeCount = (data || []).filter((p) => p.is_active).length;
  const categoriesSet = new Set((data || []).map((p) => p.category));

  return {
    products: (data || []) as ProductRow[],
    totalEntries,
    totalPages,
    currentPage: page,
    stats: { totalProducts: totalEntries, activeProducts: activeCount, totalCategories: categoriesSet.size },
  };
}

// 2. GET SINGLE PRODUCT BY ID WITH VARIANTS, QUOTATION ITEMS & ORDER ITEMS
export async function getProductById(
  id: string
): Promise<{ product: ProductRow | null; variants: ProductVariantRow[]; quotationItems: QuotationItemRow[]; orderItems: OrderItemRow[]; activities: ActivityRow[] }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoProduct: ProductRow = {
      id,
      name: 'HIPA Pure Turmeric Powder',
      sku: 'HIPA-TRM-01',
      category: 'Ground Spices',
      description: 'High-curcumin farm-fresh turmeric powder with vibrant color and aroma.',
      image_url: null,
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const demoVariants: ProductVariantRow[] = [
      { id: 'pv-101', product_id: id, pack_size: '100g pack', pack_unit: 'g', sku_variant: 'HIPA-TRM-100G', unit_price: 32.0, stock_quantity: 1200, is_active: true, created_at: '', updated_at: '' },
      { id: 'pv-102', product_id: id, pack_size: '500g pouch', pack_unit: 'g', sku_variant: 'HIPA-TRM-500G', unit_price: 120.0, stock_quantity: 450, is_active: true, created_at: '', updated_at: '' },
      { id: 'pv-103', product_id: id, pack_size: '1kg bulk bag', pack_unit: 'kg', sku_variant: 'HIPA-TRM-1KG', unit_price: 220.0, stock_quantity: 150, is_active: true, created_at: '', updated_at: '' },
    ];

    const demoActivities: ActivityRow[] = [
      {
        id: 'act-p1',
        entity_type: 'product',
        entity_id: id,
        customer_id: null,
        lead_id: null,
        action_type: 'created',
        description: 'Product master HIPA-TRM-01 (HIPA Pure Turmeric Powder) created',
        performed_by: 'demo-user-101',
        metadata: {},
        created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      },
    ];

    return { product: demoProduct, variants: demoVariants, quotationItems: [], orderItems: [], activities: demoActivities };
  }

  const supabase = await createClient();

  const { data: product } = await supabase.from('products').select('*').eq('id', id).single();
  if (!product) return { product: null, variants: [], quotationItems: [], orderItems: [], activities: [] };

  const { data: variants } = await supabase.from('product_variants').select('*').eq('product_id', id);
  const { data: quotationItems } = await supabase.from('quotation_items').select('*').eq('product_id', id);
  const { data: orderItems } = await supabase.from('order_items').select('*').eq('product_id', id);

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('entity_type', 'product')
    .eq('entity_id', id)
    .order('created_at', { ascending: false });

  return {
    product: product as ProductRow,
    variants: (variants || []) as ProductVariantRow[],
    quotationItems: (quotationItems || []) as QuotationItemRow[],
    orderItems: (orderItems || []) as OrderItemRow[],
    activities: (activities || []) as ActivityRow[],
  };
}

// 3. CREATE PRODUCT (WITH DUPLICATE SKU PREVENTATIVE CHECK & INITIAL VARIANT)
export async function createProductAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; productId?: string }> {
  const name = formData.get('name') as string;
  const sku = formData.get('sku') as string;
  const category = formData.get('category') as string || 'Ground Spices';
  const description = formData.get('description') as string;
  const packSize = formData.get('packSize') as string || '500g pouch';
  const unitPrice = parseFloat((formData.get('unitPrice') as string) || '0');
  const stockQuantity = parseInt((formData.get('stockQuantity') as string) || '0', 10);

  if (!name || !name.trim()) return { success: false, error: 'Product Name is required.' };
  if (!sku || !sku.trim()) return { success: false, error: 'Product SKU is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/products');
    return { success: true, productId: 'demo-prod-new' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check duplicate SKU
  const { data: existing } = await supabase.from('products').select('id, name').eq('sku', sku.trim()).maybeSingle();
  if (existing) {
    return { success: false, error: `Product SKU "${sku.trim()}" is already registered for product "${existing.name}".` };
  }

  const { data: product, error: pError } = await supabase
    .from('products')
    .insert({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category: category.trim(),
      description: description ? description.trim() : null,
      is_active: true,
    })
    .select()
    .single();

  if (pError || !product) {
    return { success: false, error: pError?.message || 'Failed to create product.' };
  }

  // Create initial variant
  const variantSku = `${sku.trim().toUpperCase()}-DEF`;
  await supabase.from('product_variants').insert({
    product_id: product.id,
    pack_size: packSize,
    pack_unit: packSize.toLowerCase().includes('kg') ? 'kg' : 'g',
    sku_variant: variantSku,
    unit_price: isNaN(unitPrice) ? 0 : unitPrice,
    stock_quantity: isNaN(stockQuantity) ? 0 : stockQuantity,
    is_active: true,
  });

  // Audit activity log
  await supabase.from('activities').insert({
    entity_type: 'product',
    entity_id: product.id,
    action_type: 'created',
    description: `Product master "${product.name}" (${product.sku}) created in catalog`,
    performed_by: user?.id || null,
  });

  revalidatePath('/products');
  return { success: true, productId: product.id };
}

// 4. CREATE PRODUCT VARIANT
export async function createProductVariantAction(
  productId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const packSize = formData.get('packSize') as string;
  const skuVariant = formData.get('skuVariant') as string;
  const unitPrice = parseFloat((formData.get('unitPrice') as string) || '0');
  const stockQuantity = parseInt((formData.get('stockQuantity') as string) || '0', 10);

  if (!packSize || !skuVariant) return { success: false, error: 'Pack Size and Variant SKU are required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/products/${productId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('product_variants').insert({
    product_id: productId,
    pack_size: packSize.trim(),
    pack_unit: packSize.toLowerCase().includes('kg') ? 'kg' : 'g',
    sku_variant: skuVariant.trim().toUpperCase(),
    unit_price: isNaN(unitPrice) ? 0 : unitPrice,
    stock_quantity: isNaN(stockQuantity) ? 0 : stockQuantity,
    is_active: true,
  });

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'product',
    entity_id: productId,
    action_type: 'variant_added',
    description: `New variant "${packSize.trim()}" (${skuVariant.trim().toUpperCase()}) added to product`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/products/${productId}`);
  return { success: true };
}

// 5. UPDATE PRODUCT MASTER
export async function updateProductAction(
  productId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const description = formData.get('description') as string;
  const isActive = formData.get('isActive') === 'true';

  if (!name) return { success: false, error: 'Product Name is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/products/${productId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('products')
    .update({
      name: name.trim(),
      category: category.trim(),
      description: description ? description.trim() : null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'product',
    entity_id: productId,
    action_type: 'updated',
    description: `Product master details updated`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/products/${productId}`);
  revalidatePath('/products');
  return { success: true };
}

// 6. TOGGLE SAFE ARCHIVING STATUS (ACTIVE / INACTIVE)
export async function toggleProductStatusAction(
  productId: string,
  newActiveState: boolean
): Promise<{ success: boolean; error?: string }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath(`/products/${productId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('products')
    .update({ is_active: newActiveState, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'product',
    entity_id: productId,
    action_type: 'status_toggled',
    description: `Product status changed to ${newActiveState ? 'ACTIVE' : 'ARCHIVED (INACTIVE)'}`,
    performed_by: user?.id || null,
  });

  revalidatePath(`/products/${productId}`);
  revalidatePath('/products');
  return { success: true };
}
