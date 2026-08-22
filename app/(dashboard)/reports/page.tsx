'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { getComprehensiveReports, CRMReportMetrics } from '@/lib/actions/report.actions';

export default function ReportsPage() {
  const [reports, setReports] = useState<CRMReportMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sales' | 'customers' | 'products' | 'finance' | 'procurement'>('sales');

  const fetchReportsData = useCallback(async () => {
    setIsLoading(true);
    const data = await getComprehensiveReports();
    setReports(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  if (isLoading || !reports) return <LoadingState message="Aggregating CRM database analytics across all 15 modules..." />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Executive Reports &amp; Analytics</h2>
          <p className="font-body-md text-on-surface-variant font-medium">Real-time database aggregated analytics across sales, accounts, products, revenue, and procurement.</p>
        </div>
        <Button variant="outline" icon="refresh" onClick={fetchReportsData}>
          Refresh Analytics
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant gap-4 text-xs md:text-sm font-label-md overflow-x-auto custom-scrollbar">
        {[
          { id: 'sales', label: 'Sales & Pipeline' },
          { id: 'customers', label: 'Customer Accounts' },
          { id: 'products', label: 'Products & Inventory' },
          { id: 'finance', label: 'Invoicing & Receivables' },
          { id: 'procurement', label: 'Procurement & Vendors' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-3 px-1 capitalize transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Sales & Pipeline */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Total Order Revenue</span>
              <div className="font-headline-lg text-3xl font-bold text-primary mt-1">
                ₹{reports.sales.totalOrderRevenue.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Open Pipeline Value</span>
              <div className="font-headline-lg text-3xl font-bold text-tertiary-container mt-1">
                ₹{reports.sales.openPipelineValue.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Lead Conversion Rate</span>
              <div className="font-headline-lg text-3xl font-bold text-secondary mt-1">
                {reports.sales.conversionRate}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Lead Acquisition &amp; Conversion">
              <div className="space-y-4 font-body-md text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/60">
                  <span className="text-on-surface-variant">Total Prospects &amp; Leads Logged</span>
                  <span className="font-bold text-on-surface">{reports.sales.totalLeads} Leads</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/60">
                  <span className="text-on-surface-variant">Converted to Paying Customers</span>
                  <span className="font-bold text-tertiary-container">{reports.sales.convertedLeads} Customers</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Pipeline Qualification Efficiency</span>
                  <Badge variant="success">{reports.sales.conversionRate}% Win Rate</Badge>
                </div>
              </div>
            </Card>

            <Card title="Commercial Proposals &amp; Quotes">
              <div className="space-y-4 font-body-md text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/60">
                  <span className="text-on-surface-variant">Total Quotation Proposals Issued</span>
                  <span className="font-bold text-primary">₹{reports.sales.totalQuotationValue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Confirmed Orders Converted</span>
                  <span className="font-bold text-on-surface">₹{reports.sales.totalOrderRevenue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Customer Accounts */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Total Customer Accounts</span>
              <div className="font-headline-lg text-3xl font-bold text-on-surface mt-1">
                {reports.customers.totalCustomers} Accounts
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Average Lifetime Revenue</span>
              <div className="font-headline-lg text-3xl font-bold text-primary mt-1">
                ₹{Math.round(reports.customers.averageCustomerRevenue).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Active Retail Outlets</span>
              <div className="font-headline-lg text-3xl font-bold text-tertiary-container mt-1">
                {reports.customers.retailersCount} Retailers
              </div>
            </div>
          </div>

          <Card title="Customer Account Segment Breakdown">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-surface rounded-xl border border-outline-variant/60">
                <span className="font-label-md text-xs text-on-surface-variant uppercase block">Retail Outlets</span>
                <p className="font-headline-lg text-2xl font-bold text-primary mt-1">{reports.customers.retailersCount}</p>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-outline-variant/60">
                <span className="font-label-md text-xs text-on-surface-variant uppercase block">Regional Distributors</span>
                <p className="font-headline-lg text-2xl font-bold text-tertiary-container mt-1">{reports.customers.distributorsCount}</p>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-outline-variant/60">
                <span className="font-label-md text-xs text-on-surface-variant uppercase block">Wholesale Stockists</span>
                <p className="font-headline-lg text-2xl font-bold text-secondary mt-1">{reports.customers.wholesalersCount}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: Products & Inventory */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Warehouse Stock Units</span>
              <div className="font-headline-lg text-3xl font-bold text-on-surface mt-1">
                {reports.products.totalStockUnits.toLocaleString('en-IN')} Units
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Low Stock Warnings</span>
              <div className="font-headline-lg text-3xl font-bold text-secondary mt-1">
                {reports.products.lowStockCount} Variants
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Out of Stock Alerts</span>
              <div className="font-headline-lg text-3xl font-bold text-error mt-1">
                {reports.products.outOfStockCount} Variants
              </div>
            </div>
          </div>

          <Card title="Product Master Category Distribution">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-surface rounded-xl border border-outline-variant/60">
                <span className="font-label-md text-xs text-on-surface-variant uppercase block">Ground Spices</span>
                <p className="font-headline-lg text-2xl font-bold text-primary mt-1">{reports.products.groundSpicesCount} SKUs</p>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-outline-variant/60">
                <span className="font-label-md text-xs text-on-surface-variant uppercase block">Spice Blends (Masalas)</span>
                <p className="font-headline-lg text-2xl font-bold text-tertiary-container mt-1">{reports.products.spiceBlendsCount} SKUs</p>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-outline-variant/60">
                <span className="font-label-md text-xs text-on-surface-variant uppercase block">Whole Spices</span>
                <p className="font-headline-lg text-2xl font-bold text-secondary mt-1">{reports.products.wholeSpicesCount} SKUs</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: Invoicing & Receivables */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Total Billed Invoices</span>
              <div className="font-headline-lg text-3xl font-bold text-on-surface mt-1">
                ₹{reports.finance.totalInvoiced.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Payments Collected</span>
              <div className="font-headline-lg text-3xl font-bold text-tertiary-container mt-1">
                ₹{reports.finance.totalCollected.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Outstanding Accounts Receivable</span>
              <div className="font-headline-lg text-3xl font-bold text-error mt-1">
                ₹{reports.finance.outstandingBalance.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Procurement & Vendors */}
      {activeTab === 'procurement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Total Procurement PO Spend</span>
              <div className="font-headline-lg text-3xl font-bold text-on-surface mt-1">
                ₹{reports.procurement.totalPOSpend.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Active Spice Vendors</span>
              <div className="font-headline-lg text-3xl font-bold text-primary mt-1">
                {reports.procurement.activeSuppliersCount} Vendors
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Pending Goods Receipts</span>
              <div className="font-headline-lg text-3xl font-bold text-secondary mt-1">
                {reports.procurement.pendingReceiptsCount} Issued POs
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
