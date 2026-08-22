'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getPurchaseOrders,
  createPurchaseOrderAction,
  receivePOItemsAction,
  getSuppliers,
  CreatePOItemInput,
} from '@/lib/actions/supplier.actions';
import { getProductsForQuotation } from '@/lib/actions/quotation.actions';
import { PurchaseOrderRow, SupplierRow, ProductRow, ProductVariantRow } from '@/types/database';
import Link from 'next/link';

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [stats, setStats] = useState({ totalPOValue: 0, pendingPOs: 0, receivedPOs: 0 });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderRow | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [variants, setVariants] = useState<ProductVariantRow[]>([]);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState(
    new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CreatePOItemInput[]>([
    {
      productId: '',
      variantId: '',
      productName: 'HIPA Pure Turmeric Powder',
      packSize: '500g pouch',
      quantity: 500,
      unitCost: 95.0,
    },
  ]);
  const [receiveItemQty, setReceiveItemQty] = useState<number>(500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPOsData = useCallback(async () => {
    setIsLoading(true);
    const res = await getPurchaseOrders({
      search,
      status: statusFilter,
      page: currentPage,
      limit: 10,
    });
    setPurchaseOrders(res.purchaseOrders);
    setTotalPages(res.totalPages);
    setTotalEntries(res.totalEntries);
    setStats(res.stats);
    setIsLoading(false);
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    fetchPOsData();
  }, [fetchPOsData]);

  useEffect(() => {
    getSuppliers().then((res) => setSuppliers(res.suppliers));
    getProductsForQuotation().then((res) => {
      setProducts(res.products);
      setVariants(res.variants);
    });
  }, []);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: '',
        variantId: '',
        productName: 'HIPA Spice Raw Material',
        packSize: '100g pack',
        quantity: 200,
        unitCost: 50.0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CreatePOItemInput, value: unknown) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setFormError('Please select a target Supplier.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    const res = await createPurchaseOrderAction(selectedSupplierId, items, expectedDelivery, notes);
    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to create purchase order.');
    } else {
      setIsAddModalOpen(false);
      fetchPOsData();
    }
  };

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;
    setIsSubmitting(true);
    setFormError(null);

    // Mock item receiving map for demo/action
    const itemMap: Record<string, number> = {
      'poi-demo-1': receiveItemQty,
    };

    const res = await receivePOItemsAction(selectedPO.id, itemMap);
    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to receive goods.');
    } else {
      setIsReceiveModalOpen(false);
      fetchPOsData();
    }
  };

  const columns: Column<PurchaseOrderRow>[] = [
    {
      header: 'PO Number',
      cell: (row) => (
        <div>
          <span className="font-semibold text-primary block">{row.po_number}</span>
          <span className="text-[11px] text-on-surface-variant font-label-md">
            Order Date: {new Date(row.order_date).toLocaleDateString('en-IN')}
          </span>
        </div>
      ),
    },
    {
      header: 'Total Value',
      cell: (row) => (
        <span className="font-bold text-on-surface">
          ₹{Number(row.total_amount || 0).toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'PO Status',
      cell: (row) => {
        const variants: Record<string, 'gold' | 'info' | 'success' | 'error' | 'neutral'> = {
          draft: 'neutral',
          issued: 'info',
          partially_received: 'gold',
          received: 'success',
          cancelled: 'error',
        };
        return <Badge variant={variants[row.status] || 'neutral'}>{row.status.replace('_', ' ').toUpperCase()}</Badge>;
      },
      align: 'center',
    },
    {
      header: 'Receiving Status',
      cell: (row) => (
        <Badge variant={row.receiving_status === 'completed' ? 'success' : row.receiving_status === 'partial' ? 'gold' : 'neutral'}>
          {row.receiving_status.toUpperCase()}
        </Badge>
      ),
      align: 'center',
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status !== 'received' && row.status !== 'cancelled' && (
            <Button
              variant="outline"
              size="sm"
              icon="inventory_2"
              onClick={() => {
                setSelectedPO(row);
                setIsReceiveModalOpen(true);
              }}
            >
              Receive Goods
            </Button>
          )}
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
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Purchase Orders &amp; Procurement</h2>
          <p className="font-body-md text-on-surface-variant font-medium">Issue vendor purchase orders, manage receiving manifests, and update warehouse stock balances.</p>
        </div>
        <Button variant="primary" icon="add_shopping_cart" onClick={() => setIsAddModalOpen(true)}>
          Create Purchase Order
        </Button>
      </div>

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Total Procurement Volume</span>
          <div className="font-headline-lg text-2xl font-bold text-on-surface mt-1">
            ₹{stats.totalPOValue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Pending Issued POs</span>
          <div className="font-headline-lg text-2xl font-bold text-primary mt-1">
            {stats.pendingPOs} Issued
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Received Stock POs</span>
          <div className="font-headline-lg text-2xl font-bold text-tertiary-container mt-1">
            {stats.receivedPOs} Completed
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-3 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search PO number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-md text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs font-body-md text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Status: All</option>
            <option value="issued">Issued POs</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Fully Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table / Loading / Empty */}
      {isLoading ? (
        <LoadingState message="Fetching purchase orders database..." />
      ) : purchaseOrders.length === 0 ? (
        <EmptyState
          title="No purchase orders found"
          description="There are no vendor purchase orders matching your filter parameters."
          actionLabel="Create Purchase Order"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={purchaseOrders}
          keyExtractor={(row) => row.id}
          totalEntries={totalEntries}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Create Purchase Order Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Issue Vendor Purchase Order" maxWidth="xl">
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleCreatePO} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-label-md uppercase mb-1">Target Supplier / Vendor *</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                required
                className="w-full bg-surface border border-outline-variant p-2 rounded text-sm font-body-md"
              >
                <option value="">Select Supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.supplier_code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-label-md uppercase mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full border p-2 rounded text-sm bg-surface-bright"
              />
            </div>
          </div>

          {/* PO Items Table Builder */}
          <div className="space-y-2 pt-2 border-t border-outline-variant">
            <div className="flex justify-between items-center">
              <span className="font-label-md text-xs uppercase font-bold text-primary">Procurement Items &amp; Raw Spices</span>
              <Button variant="outline" size="sm" type="button" icon="add" onClick={handleAddItem}>
                Add Line Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="p-3 bg-surface border border-outline-variant rounded-lg space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-label-md uppercase">Product Name</label>
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                      className="w-full border p-1.5 rounded text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-label-md uppercase">Pack Size</label>
                    <input
                      type="text"
                      value={item.packSize}
                      onChange={(e) => handleItemChange(index, 'packSize', e.target.value)}
                      className="w-full border p-1.5 rounded text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-label-md uppercase">Order Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full border p-1.5 rounded text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
                  <div>
                    <label className="block text-[10px] font-label-md uppercase">Unit Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(index, 'unitCost', parseFloat(e.target.value) || 0)}
                      className="w-full border p-1.5 rounded text-xs"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-error text-xs hover:underline p-1"
                      >
                        Remove Item
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} icon="send">
              Issue Purchase Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Goods Receiving Modal */}
      <Modal isOpen={isReceiveModalOpen} onClose={() => setIsReceiveModalOpen(false)} title={`Receive Goods for ${selectedPO?.po_number}`} maxWidth="md">
        <form onSubmit={handleReceiveGoods} className="space-y-4">
          <p className="text-xs text-on-surface-variant">
            Receiving goods increments warehouse stock balances (`product_variants.stock_quantity`) and logs `stock_in` movement audit records.
          </p>

          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Received Quantity (Units)</label>
            <input
              type="number"
              min="1"
              value={receiveItemQty}
              onChange={(e) => setReceiveItemQty(parseInt(e.target.value, 10) || 0)}
              className="w-full border p-2 rounded text-sm bg-surface-bright font-bold text-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsReceiveModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} icon="inventory_2">
              Confirm Goods Receipt &amp; Update Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
