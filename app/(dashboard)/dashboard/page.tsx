'use client';

import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            Good Morning, Rajesh
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
            Here&apos;s what&apos;s happening with your sales and customer activity today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/leads/new">
            <Button variant="primary" icon="person_add">
              Add New Lead
            </Button>
          </Link>
          <Link href="/follow-ups">
            <Button variant="outline" icon="event_available">
              View Follow-ups
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Leads"
          value="1,248"
          change="+12% this month"
          changeType="positive"
          icon="person_search"
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          title="Active Cust."
          value="856"
          change="Total active"
          changeType="neutral"
          icon="group"
          iconBg="bg-secondary/10"
          iconColor="text-secondary"
        />
        <StatCard
          title="Pending Follow-ups"
          value="24"
          change="6 overdue"
          changeType="negative"
          icon="event_repeat"
          iconBg="bg-amber-50"
          iconColor="text-amber-800"
        />
        <StatCard
          title="Open Enquiries"
          value="42"
          change="+8 today"
          changeType="positive"
          icon="contact_support"
          iconBg="bg-tertiary-container/10"
          iconColor="text-tertiary-container"
        />
        <StatCard
          title="Monthly Sales"
          value="₹45.2L"
          change="+18% vs last mo."
          changeType="positive"
          icon="payments"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-800"
        />
        <StatCard
          title="Active Orders"
          value="89"
          change="12 processing"
          changeType="neutral"
          icon="shopping_cart"
          iconBg="bg-blue-50"
          iconColor="text-blue-800"
        />
      </div>

      {/* Main Grid: Today's Follow-ups + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Follow-ups */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Today's Priority Follow-ups"
            subtitle="Scheduled touchpoints for sales conversion"
            headerAction={
              <Link href="/follow-ups" className="text-xs font-label-md text-primary hover:underline">
                View All (24)
              </Link>
            }
          >
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-bright flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-headline-sm font-bold shrink-0">
                    A
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline-sm text-base font-semibold text-on-surface">
                        Rajesh Kumar
                      </h4>
                      <Badge variant="gold">Anjali Supermarket</Badge>
                    </div>
                    <p className="text-xs text-on-surface-variant font-body-sm mt-0.5">
                      Purpose: Discuss bulk 100g Sambar & Garam Masala quotation discount terms
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="warning" icon="schedule">11:30 AM</Badge>
                  <Button variant="primary" size="sm" icon="check_circle">
                    Complete
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-bright flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-sm font-bold shrink-0">
                    H
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline-sm text-base font-semibold text-on-surface">
                        Vikram Singh
                      </h4>
                      <Badge variant="maroon">Heritage Foods Dist.</Badge>
                    </div>
                    <p className="text-xs text-on-surface-variant font-body-sm mt-0.5">
                      Purpose: Follow up on dispatched 500kg wholesale Turmeric order delivery status
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="info" icon="schedule">02:15 PM</Badge>
                  <Button variant="primary" size="sm" icon="check_circle">
                    Complete
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-error/30 bg-error-container/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-headline-sm font-bold shrink-0">
                    M
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline-sm text-base font-semibold text-on-surface">
                        Amit Patel
                      </h4>
                      <Badge variant="error">Overdue</Badge>
                    </div>
                    <p className="text-xs text-on-surface-variant font-body-sm mt-0.5">
                      Purpose: Payment reminder for Invoice #HIPA-INV-9921 (₹2.4L)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="danger" size="sm" icon="call">
                    Call Now
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Quick Actions & Live Activity */}
        <div className="space-y-6">
          <Card title="Sales Pipeline Overview" subtitle="Current deal distribution">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-label-md mb-1">
                  <span className="text-on-surface-variant">Qualified Deals</span>
                  <span className="font-semibold text-on-surface">₹28.4L (14)</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '75%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-label-md mb-1">
                  <span className="text-on-surface-variant">Proposal Sent</span>
                  <span className="font-semibold text-on-surface">₹19.2L (8)</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary-container h-full rounded-full" style={{ width: '55%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-label-md mb-1">
                  <span className="text-on-surface-variant">Negotiation</span>
                  <span className="font-semibold text-on-surface">₹12.0L (4)</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-tertiary-container h-full rounded-full" style={{ width: '35%' }} />
                </div>
              </div>

              <div className="pt-2">
                <Link href="/pipeline">
                  <Button variant="outline" className="w-full text-xs" icon="view_kanban">
                    Open Kanban Pipeline
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card title="Recent Activity" subtitle="Live updates across sales team">
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-xs font-body-sm">
                <div className="w-2 h-2 rounded-full bg-tertiary-container mt-1.5 shrink-0" />
                <div>
                  <p className="text-on-surface font-medium">New lead converted to customer</p>
                  <p className="text-on-surface-variant text-[11px]">Suresh Mart (Retailer) • 10m ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs font-body-sm">
                <div className="w-2 h-2 rounded-full bg-secondary-container mt-1.5 shrink-0" />
                <div>
                  <p className="text-on-surface font-medium">Quotation #HIPA-QT-802 accepted</p>
                  <p className="text-on-surface-variant text-[11px]">₹1.8L • Anjali Supermarket • 45m ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs font-body-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-on-surface font-medium">Follow-up completed by Sarah</p>
                  <p className="text-on-surface-variant text-[11px]">Spice Route Traders • 2h ago</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
