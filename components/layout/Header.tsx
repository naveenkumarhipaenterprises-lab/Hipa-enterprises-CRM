'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { QuickAddModal } from './QuickAddModal';
import { getCurrentProfile } from '@/lib/actions/auth.actions';
import { getUserNotifications, markNotificationAsReadAction, markAllNotificationsAsReadAction } from '@/lib/actions/notification.actions';
import { UserProfile } from '@/types/crm';
import { NotificationRow } from '@/types/database';
import Link from 'next/link';

export interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentProfile().then(setProfile);
    getUserNotifications().then((res) => {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsReadAction(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_status: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
    setUnreadCount(0);
  };

  return (
    <>
      <header className="bg-surface/95 text-primary border-b border-outline-variant shadow-sm flex justify-between items-center h-16 px-4 md:px-6 w-full sticky top-0 z-30 backdrop-blur-sm">
        {/* Left Side: Mobile Menu Button + Search Bar */}
        <div className="flex items-center gap-3 w-full md:w-1/3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
            aria-label="Open sidebar"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search leads, orders, customers..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body-sm text-on-surface placeholder:text-on-surface-variant/70 text-sm"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Quick Add Button */}
          <Button
            variant="primary"
            size="sm"
            icon="add"
            onClick={() => setIsQuickAddOpen(true)}
            className="hidden sm:flex"
          >
            Quick Add
          </Button>

          {/* Notifications Bell Dropdown Container */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-colors relative"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden font-body-md">
                <div className="p-3 bg-surface border-b border-outline-variant flex justify-between items-center">
                  <span className="font-bold text-sm text-on-surface">CRM Activity Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/40">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-xs text-on-surface-variant text-center">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.read_status && handleMarkAsRead(n.id)}
                        className={`p-3 text-xs transition-colors cursor-pointer ${
                          n.read_status ? 'bg-surface-container-lowest text-on-surface-variant' : 'bg-surface text-on-surface font-semibold'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-primary">{n.title}</span>
                          <span className="text-[10px] text-on-surface-variant shrink-0">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1 font-body-sm">{n.message}</p>
                        {n.link && (
                          <Link href={n.link} className="text-primary hover:underline font-semibold block mt-1">
                            View Details →
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-outline-variant">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-sm">
              {profile?.fullName ? profile.fullName.charAt(0) : 'A'}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <p className="font-bold text-on-surface leading-tight">{profile?.fullName || 'Demo Admin'}</p>
              <p className="text-on-surface-variant text-[10px] uppercase font-label-md tracking-wider">
                {profile?.role || 'Admin'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
    </>
  );
};
