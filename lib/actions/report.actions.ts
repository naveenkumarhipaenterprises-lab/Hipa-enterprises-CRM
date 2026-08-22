'use server';

import { createClient } from '@/lib/supabase/server';

export interface CRMReportMetrics {
  sales: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    openPipelineValue: number;
    totalQuotationValue: number;
    totalOrderRevenue: number;
  };
  customers: {
    totalCustomers: number;
    retailersCount: number;
    distributorsCount: number;
    wholesalersCount: number;
    averageCustomerRevenue: number;
  };
  products: {
    totalProducts: number;
    groundSpicesCount: number;
    spiceBlendsCount: number;
    wholeSpicesCount: number;
    totalStockUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  finance: {
    totalInvoiced: number;
    totalCollected: number;
    outstandingBalance: number;
    paidInvoicesCount: number;
    partiallyPaidInvoicesCount: number;
  };
  procurement: {
    totalPOSpend: number;
    activeSuppliersCount: number;
    pendingReceiptsCount: number;
  };
}

export async function getComprehensiveReports(): Promise<CRMReportMetrics> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    return {
      sales: {
        totalLeads: 24,
        convertedLeads: 8,
        conversionRate: 33.3,
        openPipelineValue: 1850000.0,
        totalQuotationValue: 582750.0,
        totalOrderRevenue: 582750.0,
      },
      customers: {
        totalCustomers: 12,
        retailersCount: 6,
        distributorsCount: 4,
        wholesalersCount: 2,
        averageCustomerRevenue: 48562.5,
      },
      products: {
        totalProducts: 4,
        groundSpicesCount: 1,
        spiceBlendsCount: 2,
        wholeSpicesCount: 1,
        totalStockUnits: 1735,
        lowStockCount: 1,
        outOfStockCount: 1,
      },
      finance: {
        totalInvoiced: 582750.0,
        totalCollected: 506750.0,
        outstandingBalance: 76000.0,
        paidInvoicesCount: 1,
        partiallyPaidInvoicesCount: 1,
      },
      procurement: {
        totalPOSpend: 262500.0,
        activeSuppliersCount: 2,
        pendingReceiptsCount: 1,
      },
    };
  }

  const supabase = await createClient();

  // 1. Fetch Sales & Leads metrics
  const { data: leads } = await supabase.from('leads').select('status, estimated_value');
  const { data: opps } = await supabase.from('opportunities').select('expected_revenue, stage');
  const { data: quotes } = await supabase.from('quotations').select('total_amount');
  const { data: orders } = await supabase.from('orders').select('total_amount');

  const totalLeads = (leads || []).length;
  const convertedLeads = (leads || []).filter((l) => l.status === 'converted').length;
  const conversionRate = totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;
  const openPipelineValue = (opps || [])
    .filter((o) => o.stage !== 'won' && o.stage !== 'lost')
    .reduce((sum, o) => sum + Number(o.expected_revenue || 0), 0);
  const totalQuotationValue = (quotes || []).reduce((sum, q) => sum + Number(q.total_amount || 0), 0);
  const totalOrderRevenue = (orders || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  // 2. Fetch Customers metrics
  const { data: customers } = await supabase.from('customers').select('business_type, total_revenue');
  const totalCust = (customers || []).length;
  const retailersCount = (customers || []).filter((c) => c.business_type === 'retailer').length;
  const distributorsCount = (customers || []).filter((c) => c.business_type === 'distributor').length;
  const wholesalersCount = (customers || []).filter((c) => c.business_type === 'wholesaler').length;
  const totalCustRev = (customers || []).reduce((sum, c) => sum + Number(c.total_revenue || 0), 0);
  const averageCustomerRevenue = totalCust > 0 ? totalCustRev / totalCust : 0;

  // 3. Fetch Product & Inventory metrics
  const { data: products } = await supabase.from('products').select('category');
  const { data: variants } = await supabase.from('product_variants').select('stock_quantity');
  const totalProducts = (products || []).length;
  const groundSpicesCount = (products || []).filter((p) => p.category === 'Ground Spices').length;
  const spiceBlendsCount = (products || []).filter((p) => p.category === 'Blends').length;
  const wholeSpicesCount = (products || []).filter((p) => p.category === 'Whole Spices').length;
  const totalStockUnits = (variants || []).reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0);
  const lowStockCount = (variants || []).filter((v) => Number(v.stock_quantity || 0) > 0 && Number(v.stock_quantity || 0) <= 100).length;
  const outOfStockCount = (variants || []).filter((v) => Number(v.stock_quantity || 0) <= 0).length;

  // 4. Fetch Financial & Invoicing metrics
  const { data: invoices } = await supabase.from('invoices').select('total_amount, amount_paid, balance_due, status');
  const totalInvoiced = (invoices || []).reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
  const totalCollected = (invoices || []).reduce((sum, i) => sum + Number(i.amount_paid || 0), 0);
  const outstandingBalance = (invoices || []).reduce((sum, i) => sum + Number(i.balance_due || 0), 0);
  const paidInvoicesCount = (invoices || []).filter((i) => i.status === 'paid').length;
  const partiallyPaidInvoicesCount = (invoices || []).filter((i) => i.status === 'partially_paid').length;

  // 5. Fetch Procurement & Supplier metrics
  const { data: suppliers } = await supabase.from('suppliers').select('is_active');
  const { data: pos } = await supabase.from('purchase_orders').select('total_amount, status');
  const totalPOSpend = (pos || []).reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
  const activeSuppliersCount = (suppliers || []).filter((s) => s.is_active).length;
  const pendingReceiptsCount = (pos || []).filter((p) => p.status === 'issued' || p.status === 'partially_received').length;

  return {
    sales: {
      totalLeads,
      convertedLeads,
      conversionRate,
      openPipelineValue,
      totalQuotationValue,
      totalOrderRevenue,
    },
    customers: {
      totalCustomers: totalCust,
      retailersCount,
      distributorsCount,
      wholesalersCount,
      averageCustomerRevenue,
    },
    products: {
      totalProducts,
      groundSpicesCount,
      spiceBlendsCount,
      wholeSpicesCount,
      totalStockUnits,
      lowStockCount,
      outOfStockCount,
    },
    finance: {
      totalInvoiced,
      totalCollected,
      outstandingBalance,
      paidInvoicesCount,
      partiallyPaidInvoicesCount,
    },
    procurement: {
      totalPOSpend,
      activeSuppliersCount,
      pendingReceiptsCount,
    },
  };
}
