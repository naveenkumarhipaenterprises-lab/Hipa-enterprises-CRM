'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import {
  getInventory,
  getStockMovements,
  adjustStockAction,
  InventoryItemDisplay,
} from '@/lib/actions/inventory.actions';
import { StockMovementRow, StockMovementType } from '@/types/database';
import Link from 'next/link';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'balances' | 'movements'>('balances');
  const [inventoryItems, setInventoryItems] = useState<InventoryItemDisplay[]>([]);
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [stats, setStats] = useState({ totalVariants: 0, totalStockUnits: 0, lowStockCount: 0, outOfStockCount: 0 });

  // Modal States
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [movementType, setMovementType] = useState<StockMovementType>('stock_in');
  const [quantity, setQuantity] = useState(100);
  const [reason, setReason] = useState('Production batch stock receipt');
  const [referenceId, setReferenceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchInventoryData = useCallback(async () => {
    setIsLoading(true);
    const res = await getInventory({
      search,
      category: categoryFilter,
      status: statusFilter,
      page: currentPage,
      limit: 10,
    });
    setInventoryItems(res.items);
    setTotalPages(res.totalPages);
    setTotalEntries(res.totalEntries);
    setStats(res.stats);

    const movRes = await getStockMovements(20);
    setMovements(movRes);
    setIsLoading(false);
  }, [search, categoryFilter, statusFilter, currentPage]);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId) {
      setFormError('Please select a target product variant.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    const res = await adjustStockAction(selectedVariantId, movementType, quantity, reason, referenceId);
    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to adjust stock balance.');
    } else {
      setIsAdjustModalOpen(false);
      fetchInventoryData();
    }
  };

  const columns: Column<InventoryItemDisplay>[] = [
    {
      header: 'Product & Variant SKU',
      cell: (row) => (
        <div>
          <Link href={`/products/${row.productId}`} className="font-headline-sm text-base font-bold text-on-surface hover:text-primary transition-colors">
            {row.productName}
          </Link>
          <div className="text-xs text-on-surface-variant font-label-md">
            Variant: {row.packSize} • SKU: <span className="font-semibold text-primary">{row.variantSku}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (row) => <Badge variant="gold">{row.category.toUpperCase()}</Badge>,
    },
    {
      header: 'Current Stock Qty',
      cell: (row) => (
        <span className={`font-bold text-sm ${row.status === 'out_of_stock' ? 'text-error' : row.status === 'low_stock' ? 'text-secondary font-extrabold' : 'text-on-surface'}`}>
          {row.stockQuantity.toLocaleString('en-IN')} Units
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Reorder Threshold',
      cell: (row) => <span className="text-xs font-label-md text-on-surface-variant">{row.reorderLevel} Units</span>,
      align: 'right',
    },
    {
      header: 'Stock Status',
      cell: (row) => {
        const variants: Record<string, 'success' | 'gold' | 'error'> = {
          in_stock: 'success',
          low_stock: 'gold',
          out_of_stock: 'error',
        };
        return <Badge variant={variants[row.status]}>{row.status.replace('_', ' ').toUpperCase()}</Badge>;
      },
      align: 'center',
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            icon="tune"
            onClick={() => {
              setSelectedVariantId(row.variantId);
              setIsAdjustModalOpen(true);
            }}
          >
            Adjust Stock
          </Button>
        </div>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Inventory &amp; Warehouse Stock</h2>
          <p className="font-body-md text-on-surface-variant font-medium">Real-time stock balance tracking, low-stock reorder thresholds, and movement audit logs.</p>
        </div>
        <Button variant="primary" icon="add" onClick={() => setIsAdjustModalOpen(true)}>
          New Stock Entry / Adjustment
        </Button>
      </div>

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Total Stock Units</span>
          <div className="font-headline-lg text-2xl font-bold text-on-surface mt-1">
            {stats.totalStockUnits.toLocaleString('en-IN')} Units
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Tracked Variants</span>
          <div className="font-headline-lg text-2xl font-bold text-primary mt-1">
            {stats.totalVariants} Pack Sizes
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Low Stock Alerts</span>
          <div className="font-headline-lg text-2xl font-bold text-secondary mt-1">
            {stats.lowStockCount} Items
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Out of Stock</span>
          <div className="font-headline-lg text-2xl font-bold text-error mt-1">
            {stats.outOfStockCount} Items
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant gap-4 text-xs md:text-sm font-label-md">
        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-3 px-1 transition-colors border-b-2 font-semibold ${
            activeTab === 'balances' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Warehouse Stock Balances ({stats.totalVariants})
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 px-1 transition-colors border-b-2 font-semibold ${
            activeTab === 'movements' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Stock Movement Audit History ({movements.length})
        </button>
      </div>

      {activeTab === 'balances' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search product name, variant SKU..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-md text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="all">Category: All</option>
                <option value="Ground Spices">Ground Spices</option>
                <option value="Blends">Spice Blends (Masalas)</option>
                <option value="Whole Spices">Whole Spices</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="all">Status: All</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock Warning</option>
                <option value="out_of_stock">Out of Stock Alert</option>
              </select>
            </div>
          </div>

          {/* Table / Loading / Empty */}
          {isLoading ? (
            <LoadingState message="Fetching warehouse inventory database..." />
          ) : inventoryItems.length === 0 ? (
            <EmptyState
              title="No inventory records found"
              description="There are no spice product variants matching your filter criteria."
              actionLabel="Adjust Stock"
              onAction={() => setIsAdjustModalOpen(true)}
            />
          ) : (
            <DataTable
              columns={columns}
              data={inventoryItems}
              keyExtractor={(row) => row.variantId}
              totalEntries={totalEntries}
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {activeTab === 'movements' && (
        <Card title="Stock Movement Audit Trail" subtitle="Read-only ledger of stock in, stock out, and order fulfillments">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-bright font-label-md uppercase text-on-surface-variant">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Movement Type</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Balance Shift</th>
                  <th className="p-3">Reference / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 font-body-sm">
                {movements.map((mov) => (
                  <tr key={mov.id}>
                    <td className="p-3 text-on-surface-variant">{new Date(mov.created_at).toLocaleString('en-IN')}</td>
                    <td className="p-3 font-semibold">
                      <Badge variant={mov.movement_type.includes('in') || mov.movement_type.includes('increase') || mov.movement_type === 'opening_stock' ? 'success' : 'maroon'}>
                        {mov.movement_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-bold text-on-surface">{mov.quantity} Units</td>
                    <td className="p-3 text-right font-label-md text-on-surface-variant">
                      {mov.previous_stock} ➔ <strong className="text-primary">{mov.new_stock}</strong>
                    </td>
                    <td className="p-3 font-medium text-on-surface">{mov.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Stock Adjustment Modal */}
      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Warehouse Stock Adjustment / Movement" maxWidth="md">
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Target Product Variant *</label>
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              required
              className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm font-body-md"
            >
              <option value="">Select Variant...</option>
              {inventoryItems.map((item) => (
                <option key={item.variantId} value={item.variantId}>
                  {item.productName} ({item.packSize}) - Stock: {item.stockQuantity} Units
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-label-md uppercase mb-1">Movement Type *</label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as StockMovementType)}
                className="w-full bg-surface border border-outline-variant p-2 rounded text-sm font-body-md"
              >
                <option value="stock_in">Stock In (Production Batch)</option>
                <option value="adjustment_increase">Adjustment Increase (+)</option>
                <option value="stock_out">Stock Out (Transfer/Damage)</option>
                <option value="adjustment_decrease">Adjustment Decrease (-)</option>
                <option value="opening_stock">Opening Stock Baseline</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-label-md uppercase mb-1">Quantity *</label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                className="w-full border p-2 rounded text-sm bg-surface-bright"
              />
            </div>
          </div>

          <Input
            label="Reference ID (Optional)"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            placeholder="e.g. GRN-2026-004 or Batch #401"
          />

          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Adjustment Reason / Notes *</label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border p-2 rounded text-xs bg-surface-bright"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} icon="check">
              Apply Stock Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
