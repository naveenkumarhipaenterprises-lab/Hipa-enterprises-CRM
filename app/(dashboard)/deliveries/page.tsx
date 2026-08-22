'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { getDeliveries, createDeliveryManifestAction, updateDeliveryStatusAction } from '@/lib/actions/delivery.actions';
import { getOrders } from '@/lib/actions/order.actions';
import { DeliveryRow, OrderRow, FulfilmentStatus } from '@/types/database';
import Link from 'next/link';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [stats, setStats] = useState({ totalShipments: 0, activeDispatches: 0, completedDeliveries: 0 });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [driver, setDriver] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [address, setAddress] = useState('');
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDeliveriesData = useCallback(async () => {
    setIsLoading(true);
    const res = await getDeliveries({
      search,
      status: statusFilter,
      page: currentPage,
      limit: 10,
    });
    setDeliveries(res.deliveries);
    setTotalPages(res.totalPages);
    setTotalEntries(res.totalEntries);
    setStats(res.stats);
    setIsLoading(false);
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    fetchDeliveriesData();
  }, [fetchDeliveriesData]);

  useEffect(() => {
    getOrders().then((res) => setOrders(res.orders));
  }, []);

  const handleCreateManifest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setFormError('Please select a purchase order.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    const res = await createDeliveryManifestAction(selectedOrderId, driver, vehicle, address, tracking, notes);
    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to create delivery manifest.');
    } else {
      setIsAddModalOpen(false);
      fetchDeliveriesData();
    }
  };

  const handleStatusChange = async (deliveryId: string, newStatus: FulfilmentStatus) => {
    setIsSubmitting(true);
    const res = await updateDeliveryStatusAction(deliveryId, newStatus);
    setIsSubmitting(false);
    if (res.success) fetchDeliveriesData();
  };

  const columns: Column<DeliveryRow>[] = [
    {
      header: 'Manifest No.',
      cell: (row) => (
        <div>
          <span className="font-semibold text-primary block">{row.delivery_number}</span>
          <span className="text-[11px] text-on-surface-variant font-label-md">
            Tracking: {row.tracking_ref || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      header: 'Logistics / Driver',
      cell: (row) => (
        <div className="flex flex-col text-xs font-body-sm text-on-surface">
          <span className="font-semibold">{row.assigned_driver || 'Unassigned'}</span>
          <span className="text-on-surface-variant">{row.vehicle_number || 'Vehicle N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Dispatch & Delivery Dates',
      cell: (row) => (
        <div className="flex flex-col text-xs font-label-md text-on-surface-variant">
          <span>Dispatch: {row.dispatch_date ? new Date(row.dispatch_date).toLocaleDateString('en-IN') : 'Pending'}</span>
          <span>Delivered: {row.delivered_date ? new Date(row.delivered_date).toLocaleDateString('en-IN') : 'Pending'}</span>
        </div>
      ),
    },
    {
      header: 'Fulfilment Status',
      cell: (row) => {
        const variants: Record<string, 'gold' | 'info' | 'success' | 'maroon' | 'error' | 'neutral'> = {
          ready_for_dispatch: 'neutral',
          dispatched: 'info',
          out_for_delivery: 'gold',
          delivered: 'success',
          failed: 'error',
          cancelled: 'maroon',
        };
        return <Badge variant={variants[row.status] || 'neutral'}>{row.status.replace('_', ' ').toUpperCase()}</Badge>;
      },
      align: 'center',
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status === 'ready_for_dispatch' && (
            <Button
              variant="outline"
              size="sm"
              icon="local_shipping"
              onClick={() => handleStatusChange(row.id, 'dispatched')}
            >
              Dispatch
            </Button>
          )}
          {row.status === 'dispatched' && (
            <Button
              variant="outline"
              size="sm"
              icon="near_me"
              onClick={() => handleStatusChange(row.id, 'out_for_delivery')}
            >
              Out for Delivery
            </Button>
          )}
          {row.status === 'out_for_delivery' && (
            <Button
              variant="primary"
              size="sm"
              icon="check_circle"
              onClick={() => handleStatusChange(row.id, 'delivered')}
            >
              Mark Delivered
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
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Delivery &amp; Order Fulfilment</h2>
          <p className="font-body-md text-on-surface-variant font-medium">Manage dispatch manifests, logistics partners, vehicle tracking numbers, and delivery confirmation.</p>
        </div>
        <Button variant="primary" icon="local_shipping" onClick={() => setIsAddModalOpen(true)}>
          Create Delivery Manifest
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Total Manifests</span>
          <div className="font-headline-lg text-2xl font-bold text-on-surface mt-1">{stats.totalShipments} Manifests</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">In-Transit / Active Dispatches</span>
          <div className="font-headline-lg text-2xl font-bold text-primary mt-1">{stats.activeDispatches} Shipments</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-medium">Delivered Orders</span>
          <div className="font-headline-lg text-2xl font-bold text-tertiary-container mt-1">{stats.completedDeliveries} Delivered</div>
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
              placeholder="Search manifest number, tracking ref..."
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
            <option value="ready_for_dispatch">Ready for Dispatch</option>
            <option value="dispatched">Dispatched</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Table / Loading / Empty */}
      {isLoading ? (
        <LoadingState message="Fetching delivery manifests database..." />
      ) : deliveries.length === 0 ? (
        <EmptyState
          title="No delivery manifests found"
          description="There are no shipping manifests matching your filter parameters."
          actionLabel="Create Delivery Manifest"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={deliveries}
          keyExtractor={(row) => row.id}
          totalEntries={totalEntries}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Create Delivery Manifest Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Issue Shipping / Delivery Manifest" maxWidth="lg">
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleCreateManifest} className="space-y-4">
          <div>
            <label className="block text-xs font-label-md uppercase mb-1">Select Purchase Order *</label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              required
              className="w-full bg-surface border border-outline-variant p-2 rounded text-sm font-body-md"
            >
              <option value="">Choose Order...</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_number} - ₹{Number(o.total_amount).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Assigned Driver / Logistics Partner" value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="e.g. Ramesh Express Logistics" />
            <Input label="Vehicle Number" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="e.g. MH-04-AB-1234" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Tracking Reference Number" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. TRK-99887766" />
            <Input label="Shipping Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Warehouse #4, Delhi" />
          </div>

          <div>
            <label className="block font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
              Delivery Notes &amp; Dispatch Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Enter special handling or delivery window notes..."
              className="w-full bg-surface-bright border border-outline-variant rounded-md p-3 text-sm font-body-md text-on-surface"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} icon="local_shipping">Issue Manifest</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
