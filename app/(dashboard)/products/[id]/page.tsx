'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getProductById,
  updateProductAction,
  createProductVariantAction,
  toggleProductStatusAction,
} from '@/lib/actions/product.actions';
import { ProductRow, ProductVariantRow, QuotationItemRow, OrderItemRow, ActivityRow } from '@/types/database';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [variants, setVariants] = useState<ProductVariantRow[]>([]);
  const [quotationItems, setQuotationItems] = useState<QuotationItemRow[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddVariantModalOpen, setIsAddVariantModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await getProductById(params.id);
    setProduct(res.product);
    setVariants(res.variants);
    setQuotationItems(res.quotationItems);
    setOrderItems(res.orderItems);
    setActivities(res.activities);
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) return <LoadingState message="Loading product master details & catalog variants..." />;
  if (!product) return <ErrorState title="Product Not Found" message="The requested product master record could not be found." />;

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateProductAction(product.id, formData);

    setIsSubmitting(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to update product master.');
    } else {
      setIsEditModalOpen(false);
      loadData();
    }
  };

  const handleAddVariantSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createProductVariantAction(product.id, formData);

    setIsSubmitting(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to create variant.');
    } else {
      setIsAddVariantModalOpen(false);
      loadData();
    }
  };

  const handleToggleArchive = async () => {
    setIsSubmitting(true);
    setActionError(null);
    const res = await toggleProductStatusAction(product.id, !product.is_active);
    setIsSubmitting(false);

    if (!res.success) {
      setActionError(res.error || 'Failed to toggle product status.');
    } else {
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 border border-outline-variant rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold">{product.name}</h1>
              <Badge variant={product.is_active ? 'success' : 'neutral'}>
                {product.is_active ? 'ACTIVE CATALOG' : 'ARCHIVED'}
              </Badge>
              <Badge variant="gold">{product.category.toUpperCase()}</Badge>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              Master SKU: {product.sku} • Variants: {variants.length} Pack Sizes
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" icon="archive" isLoading={isSubmitting} onClick={handleToggleArchive}>
            {product.is_active ? 'Archive Product' : 'Reactivate Product'}
          </Button>
          <Button variant="secondary" size="sm" icon="edit" onClick={() => setIsEditModalOpen(true)}>Edit Master</Button>
          <Button variant="primary" size="sm" icon="add" onClick={() => setIsAddVariantModalOpen(true)}>
            Add Pack Variant
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-sm flex items-center gap-2 font-body-md">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Grid: Details + Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Master Details */}
          <Card title="Product Master Details">
            <div className="space-y-4 font-body-md text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">Master SKU</span>
                  <p className="font-bold text-primary">{product.sku}</p>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant font-label-md uppercase">Category</span>
                  <p className="font-semibold text-on-surface">{product.category}</p>
                </div>
              </div>

              <div>
                <span className="text-xs text-on-surface-variant font-label-md uppercase block mb-1">Specification &amp; Description</span>
                <p className="text-xs text-on-surface whitespace-pre-wrap bg-surface p-3 rounded-lg border border-outline-variant/60">
                  {product.description || 'No detailed specification provided.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Pack Size Variants Table */}
          <Card
            title={`Pack Size Variants (${variants.length})`}
            headerAction={
              <Button variant="primary" size="sm" icon="add" onClick={() => setIsAddVariantModalOpen(true)}>
                Add Variant
              </Button>
            }
          >
            {variants.length === 0 ? (
              <EmptyState
                title="No variants configured"
                description="No pack size variants exist for this product master."
                actionLabel="Add Variant"
                onAction={() => setIsAddVariantModalOpen(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-bright font-label-md uppercase text-on-surface-variant">
                      <th className="p-3">Variant SKU</th>
                      <th className="p-3">Pack Size</th>
                      <th className="p-3 text-right">Catalog Price (₹)</th>
                      <th className="p-3 text-right">Stock Qty</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40 font-body-sm">
                    {variants.map((v) => (
                      <tr key={v.id}>
                        <td className="p-3 font-bold text-primary">{v.sku_variant}</td>
                        <td className="p-3 font-semibold text-on-surface">{v.pack_size}</td>
                        <td className="p-3 text-right font-bold text-on-surface">
                          ₹{Number(v.unit_price).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-medium">{v.stock_quantity}</td>
                        <td className="p-3 text-center">
                          <Badge variant={v.is_active ? 'success' : 'neutral'}>{v.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Commercial History Integration */}
          <Card title="Historical Sales Activity" subtitle="Quotations & Orders that referenced this product">
            <div className="grid grid-cols-2 gap-4 text-xs font-body-md">
              <div className="p-4 bg-surface rounded-xl border border-outline-variant/60">
                <span className="font-label-md text-[10px] uppercase text-on-surface-variant block">Quotation Inclusions</span>
                <p className="text-2xl font-bold text-primary mt-1">{quotationItems.length} Quotes</p>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-outline-variant/60">
                <span className="font-label-md text-[10px] uppercase text-on-surface-variant block">Order Dispatches</span>
                <p className="text-2xl font-bold text-tertiary-container mt-1">{orderItems.length} Orders</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Audit Activity Log */}
        <div>
          <Card title="Product Activity Audit Log" subtitle="Master edits & variant updates">
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-4">No product activities logged.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs font-body-sm pb-3 border-b border-outline-variant/40 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="text-on-surface font-medium">{act.description}</p>
                      <p className="text-on-surface-variant text-[10px] mt-0.5">{new Date(act.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Product Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Product Master">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input label="Product Name *" name="name" defaultValue={product.name} required />
          <Select
            label="Category"
            name="category"
            defaultValue={product.category}
            options={[
              { label: 'Ground Spices', value: 'Ground Spices' },
              { label: 'Spice Blends (Masalas)', value: 'Blends' },
              { label: 'Whole Spices', value: 'Whole Spices' },
            ]}
          />
          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Description</label>
            <textarea name="description" defaultValue={product.description || ''} rows={3} className="w-full border p-2 rounded text-sm bg-surface-bright" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Save Master</Button>
          </div>
        </form>
      </Modal>

      {/* Add Variant Modal */}
      <Modal isOpen={isAddVariantModalOpen} onClose={() => setIsAddVariantModalOpen(false)} title="Add Pack Size Variant">
        <form onSubmit={handleAddVariantSubmit} className="space-y-4">
          <Input label="Pack Size *" name="packSize" required placeholder="e.g. 1kg bulk bag" />
          <Input label="Variant SKU *" name="skuVariant" required placeholder={`e.g. ${product.sku}-1KG`} />
          <Input label="Catalog Price (₹) *" name="unitPrice" type="number" step="0.01" required placeholder="240.00" />
          <Input label="Stock Quantity" name="stockQuantity" type="number" defaultValue="300" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddVariantModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Add Variant</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
