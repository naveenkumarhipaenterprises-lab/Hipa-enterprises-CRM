'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NotificationRow } from '@/types/database';

export async function getUserNotifications(): Promise<{ notifications: NotificationRow[]; unreadCount: number }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    const demoNotifications: NotificationRow[] = [
      {
        id: 'notif-101',
        user_id: 'demo-user-101',
        title: 'Low Stock Alert: 500g Sambar Powder',
        message: 'Stock quantity is 45 units (below threshold of 100). Please issue vendor PO.',
        link: '/inventory',
        read_status: false,
        created_at: new Date(Date.now() - 86400000 * 0.1).toISOString(),
      },
      {
        id: 'notif-102',
        user_id: 'demo-user-101',
        title: 'New Commercial Order #HIPA-ORD-2026-7001',
        message: 'Order of ₹4,56,750 confirmed by Heritage Foods Dist.',
        link: '/orders',
        read_status: false,
        created_at: new Date(Date.now() - 86400000 * 0.5).toISOString(),
      },
      {
        id: 'notif-103',
        user_id: 'demo-user-101',
        title: 'Goods Received: PO #HIPA-PO-2026-0001',
        message: 'Kerala Spice Farmers Co-op shipment received (+500 units stock in).',
        link: '/purchases',
        read_status: true,
        created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      },
    ];

    const unreadCount = demoNotifications.filter((n) => !n.read_status).length;
    return { notifications: demoNotifications, unreadCount };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { notifications: [], unreadCount: 0 };

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return { notifications: [], unreadCount: 0 };
  }

  const notifications = (data || []) as NotificationRow[];
  const unreadCount = notifications.filter((n) => !n.read_status).length;

  return { notifications, unreadCount };
}

export async function createNotificationAction(
  userId: string,
  title: string,
  message: string,
  link?: string
): Promise<{ success: boolean }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/notifications');
    return { success: true };
  }

  const supabase = await createClient();

  await supabase.from('notifications').insert({
    user_id: userId,
    title: title.trim(),
    message: message.trim(),
    link: link || null,
    read_status: false,
  });

  revalidatePath('/notifications');
  return { success: true };
}

export async function markNotificationAsReadAction(id: string): Promise<{ success: boolean }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/notifications');
    return { success: true };
  }

  const supabase = await createClient();
  await supabase.from('notifications').update({ read_status: true }).eq('id', id);

  revalidatePath('/notifications');
  return { success: true };
}

export async function markAllNotificationsAsReadAction(): Promise<{ success: boolean }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/notifications');
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('notifications').update({ read_status: true }).eq('user_id', user.id);
  }

  revalidatePath('/notifications');
  return { success: true };
}
