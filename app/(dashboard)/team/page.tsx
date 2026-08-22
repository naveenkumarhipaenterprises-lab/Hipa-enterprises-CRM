'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const team = [
  { name: 'Rajesh Kumar', role: 'Sales Manager', email: 'rajesh@hipamasala.com', access: 'admin' },
  { name: 'Sarah Jenkins', role: 'Sales Executive', email: 'sarah@hipamasala.com', access: 'sales_executive' },
  { name: 'Michael Chen', role: 'Sales Executive', email: 'michael@hipamasala.com', access: 'sales_executive' },
  { name: 'Priya Verma', role: 'Marketing Lead', email: 'priya@hipamasala.com', access: 'marketing' },
];

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Team Members</h2>
          <p className="font-body-md text-on-surface-variant">User accounts, sales reps, and role-based permissions.</p>
        </div>
        <Button variant="primary" icon="person_add">Invite Member</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {team.map((member) => (
          <Card key={member.email} title={member.name} subtitle={member.role}>
            <div className="space-y-3 pt-2">
              <p className="text-xs text-on-surface-variant font-label-md">{member.email}</p>
              <Badge variant="maroon">{member.access.replace('_', ' ').toUpperCase()}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
