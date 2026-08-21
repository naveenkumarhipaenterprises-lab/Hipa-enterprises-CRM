'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Tasks &amp; Action Items</h2>
          <p className="font-body-md text-on-surface-variant">Daily employee to-do items and client deliverables.</p>
        </div>
        <Button variant="primary" icon="add">Add Task</Button>
      </div>

      <Card title="Today's Active Tasks">
        <div className="space-y-3">
          {[
            { title: 'Send revised bulk quotation to Anjali Supermarket', due: 'Today, 4:00 PM', priority: 'high' },
            { title: 'Verify warehouse stock for Heritage Foods 2-ton dispatch', due: 'Tomorrow, 10:00 AM', priority: 'medium' },
          ].map((t, idx) => (
            <div key={idx} className="p-3 border border-outline-variant rounded-lg flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-on-surface text-sm">{t.title}</h4>
                <span className="text-xs text-on-surface-variant font-label-md">Due: {t.due}</span>
              </div>
              <Badge variant={t.priority === 'high' ? 'error' : 'warning'}>{t.priority.toUpperCase()}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
