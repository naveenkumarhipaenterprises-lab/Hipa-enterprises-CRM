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
import { getProducts, createProductAction } from '@/lib/actions/product.actions';
import { ProductRow } from '@/types/database';
import Link from 'next/link';

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [stats, setStats] = useState({ totalProducts: 0, activeProducts: 0, totalCategories: 0 });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProductsData = useCallback(async () => {
    setIsLoading(true);
    const res = await getProducts({
      search,
      category: categoryFilter,
      isActive: statusFilter,
      page: currentPage,
      limit: 10,
    });
    setProducts(res.products);
    setTotalPages(res.totalPages);
    setTotalEntries(res.totalEntries);
    setStats(res.stats);
    setIsLoading(false);
  }, [search, categoryFilter, statusFilter, currentPage]);

  useEffect(() => {
    fetchProductsData();
  }, [fetchProductsData]);

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createProductAction(formData);

    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to create product.');
    } else {
      setIsAddModalOpen(false);
      fetchProductsData();
      if (res.productId) {
        window.location.href = `/products/${res.productId}`;
      }
    }
  };

  const columns: Column<ProductRow>[] = [
    {
      header: 'Product Name / SKU',
      cell: (row) => (
        <div>
          <Link href={`/products/${row.id}`} className="font-headline-sm text-base font-semibold text-on-surface hover:text-primary transition-colors">
            {row.name}
          </Link>
          <div className="text-xs text-on-surface-variant font-label-md">
            SKU: {row.sku}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (row) => (
        <Badge variant={row.category === 'Ground Spices' ? 'gold' : row.category === 'Blends' ? 'maroon' : 'info'}>
          {row.category.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Description',
      cell: (row) => (
        <p className="text-xs text-on-surface-variant line-clamp-2 max-w-xs font-body-sm">
          {row.description || 'No description available'}
        </p>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.is_active ? 'success' : 'neutral'}>
          {row.is_active ? 'ACTIVE' : 'ARCHIVED'}
        </Badge>
      ),
      align: 'center',
    },
    {
      header: 'Created Date',
      cell: (row) => <span className="text-xs font-label-md text-on-surface">{new Date(row.created_at).toLocaleDateString('en-IN')}</span>,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/products/${row.id}`}>
            <button className="p-1.5 text-on-surface-variant hover:text-primary rounded transition-colors" title="View Catalog Master">
              <span className="material-symbols-outlined text-[18px]">visibility</span>
            </button>
          </Link>
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
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Product Catalog Master</h2>
          <p className="font-body-md text-on-surface-variant font-medium">Manage wholesale spice products, SKU codes, categories, and pack size variants.</p>
        </div>
        <Button variant="primary" icon="add" onClick={() => setIsAddModalOpen(true)}>
          Add New Product
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Total Products</span>
          <div className="font-headline-lg text-2xl font-bold text-on-surface mt-1">{stats.totalProducts} Master SKUs</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Active Catalog Items</span>
          <div className="font-headline-lg text-2xl font-bold text-tertiary-container mt-1">{stats.activeProducts} Items</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Product Categories</span>
          <div className="font-headline-lg text-2xl font-bold text-primary mt-1">{stats.totalCategories} Categories</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search product name, SKU..."
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
            <option value="active">Active Catalog</option>
            <option value="inactive">Archived Catalog</option>
          </select>
        </div>
      </div>

      {/* Table / Loading / Empty */}
      {isLoading ? (
        <LoadingState message="Fetching product catalog database..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="There are no spice products matching your filter parameters."
          actionLabel="Add Product"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={products}
          keyExtractor={(row) => row.id}
          totalEntries={totalEntries}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add Product Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Product Master SKU" maxWidth="lg">
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleAddProduct} className="space-y-4">
          <Input label="Product Name *" name="name" required placeholder="e.g. HIPA Pure Turmeric Powder" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Master SKU Code *" name="sku" required placeholder="e.g. HIPA-TRM-01" />
            <Select
              label="Product Category"
              name="category"
              options={[
                { label: 'Ground Spices', value: 'Ground Spices' },
                { label: 'Spice Blends (Masalas)', value: 'Blends' },
                { label: 'Whole Spices', value: 'Whole Spices' },
              ]}
              defaultValue="Ground Spices"
            />
          </div>

          <div className="p-3 bg-surface rounded-lg border border-outline-variant/60 space-y-3">
            <span className="font-label-md text-xs uppercase font-bold text-primary">Initial Variant Configuration</span>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Pack Size" name="packSize" defaultValue="500g pouch" placeholder="e.g. 500g pouch" />
              <Input label="Catalog Price (₹)" name="unitPrice" type="number" step="0.01" defaultValue="120.00" />
              <Input label="Stock Qty" name="stockQuantity" type="number" defaultValue="500" />
            </div>
          </div>

          <div>
            <label className="block font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
              Product Specification &amp; Description
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Enter spice origin, curcumin percentage, or packaging notes..."
              className="w-full bg-surface-bright border border-outline-variant rounded-md p-3 text-sm font-body-md text-on-surface"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} icon="save">Register Product</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
