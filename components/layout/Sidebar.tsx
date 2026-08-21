'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction, getCurrentProfile } from '@/lib/actions/auth.actions';
import { UserProfile } from '@/types/crm';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Leads', href: '/leads', icon: 'person_search' },
  { label: 'Customers', href: '/customers', icon: 'group' },
  { label: 'Enquiries', href: '/enquiries', icon: 'contact_support' },
  { label: 'Follow-ups', href: '/follow-ups', icon: 'event_repeat' },
  { label: 'Sales Pipeline', href: '/pipeline', icon: 'view_kanban' },
  { label: 'Quotations', href: '/quotations', icon: 'request_quote' },
  { label: 'Orders', href: '/orders', icon: 'shopping_cart' },
  { label: 'Products', href: '/products', icon: 'inventory_2' },
  { label: 'Tasks', href: '/tasks', icon: 'assignment' },
  { label: 'Reports', href: '/reports', icon: 'assessment' },
  { label: 'Team', href: '/team', icon: 'groups' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getCurrentProfile().then(setProfile);
  }, []);

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-[260px] bg-primary text-on-primary shadow-md flex flex-col z-50 overflow-y-auto custom-scrollbar transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div className="p-4 border-b border-primary-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-headline-sm font-bold shadow-sm">
              H
            </div>
            <div>
              <h1 className="font-headline-sm text-headline-sm font-bold text-white tracking-tight leading-tight">
                HIPA Masala
              </h1>
              <p className="font-body-sm text-[11px] text-white/70">Premium CRM</p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1 text-white/70 hover:text-white rounded"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-md font-label-md text-label-md transition-all ${
                  isActive
                    ? 'text-secondary-container border-l-4 border-secondary-container bg-white/10 font-semibold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'icon-fill' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer Profile */}
        <div className="p-4 border-t border-white/10 bg-primary-container/40 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-surface-container-highest border border-outline-variant overflow-hidden shrink-0">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary-container text-on-secondary-container font-bold text-xs">
                {profile?.fullName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-label-md text-xs font-semibold text-white truncate">
              {profile?.fullName || 'Authenticated User'}
            </p>
            <p className="font-body-sm text-[10px] text-white/70 truncate capitalize">
              {profile?.role?.replace('_', ' ') || 'Sales Rep'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/60 hover:text-white p-1 rounded transition-colors"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
