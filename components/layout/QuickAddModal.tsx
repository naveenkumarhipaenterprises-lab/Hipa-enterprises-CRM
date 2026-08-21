'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import Link from 'next/link';

export interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickActions = [
  {
    title: 'Add New Lead',
    description: 'Capture prospective client profile and business interest',
    icon: 'person_add',
    href: '/leads/new',
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Add New Customer',
    description: 'Register wholesale, distributor, or retail partner profile',
    icon: 'group_add',
    href: '/customers',
    color: 'bg-secondary-container/20 text-on-secondary-container',
  },
  {
    title: 'Create Business Enquiry',
    description: 'Log inbound product enquiry or pricing request',
    icon: 'contact_support',
    href: '/enquiries',
    color: 'bg-tertiary-container/10 text-tertiary-container',
  },
  {
    title: 'Schedule Follow-up',
    description: 'Set a call, email, or meeting reminder',
    icon: 'event_repeat',
    href: '/follow-ups',
    color: 'bg-blue-50 text-blue-800',
  },
  {
    title: 'Generate Quotation',
    description: 'Create itemized price quotation for approval',
    icon: 'request_quote',
    href: '/quotations',
    color: 'bg-purple-50 text-purple-800',
  },
  {
    title: 'Create New Order',
    description: 'Directly record confirmed client dispatch order',
    icon: 'add_shopping_cart',
    href: '/orders',
    color: 'bg-amber-50 text-amber-800',
  },
];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Add Action"
      subtitle="Select what record you would like to create across HIPA Masala CRM"
      maxWidth="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            onClick={onClose}
            className="flex items-start gap-4 p-4 rounded-xl border border-outline-variant hover:border-primary hover:bg-surface-container-low transition-all group"
          >
            <div className={`p-3 rounded-lg ${action.color} group-hover:scale-105 transition-transform`}>
              <span className="material-symbols-outlined text-[24px]">{action.icon}</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                {action.title}
              </h4>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </Modal>
  );
};
