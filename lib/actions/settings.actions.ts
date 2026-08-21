'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { SettingsRow, ProfileRow, UserRole } from '@/types/database';

export async function getCRMSettings(): Promise<SettingsRow> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  const defaultSettings: SettingsRow = {
    id: 'set-101',
    company_name: 'HIPA Masala Enterprise',
    support_email: 'support@hipamasala.com',
    tax_gstin: '27AAAAA0000A1Z5',
    default_quotation_terms: '1. Prices are valid for 30 days.\n2. Payment terms: 50% advance, balance against delivery.\n3. Goods once dispatched cannot be returned unless damaged in transit.',
    updated_at: new Date().toISOString(),
  };

  if (isPlaceholderMode) return defaultSettings;

  const supabase = await createClient();
  const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle();

  if (error || !data) return defaultSettings;

  return data as SettingsRow;
}

export async function updateCompanySettingsAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const companyName = formData.get('companyName') as string;
  const supportEmail = formData.get('supportEmail') as string;
  const taxGstin = formData.get('taxGstin') as string;
  const defaultTerms = formData.get('defaultTerms') as string;

  if (!companyName || !companyName.trim()) return { success: false, error: 'Company Name is required.' };

  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/settings');
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Verify Admin Authorization
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile && profile.role !== 'admin' && profile.role !== 'sales_manager') {
      return { success: false, error: 'Unauthorized: Only Administrators and Managers can update system settings.' };
    }
  }

  const { data: existing } = await supabase.from('settings').select('id').limit(1).maybeSingle();

  if (existing) {
    await supabase.from('settings').update({
      company_name: companyName.trim(),
      support_email: supportEmail ? supportEmail.trim() : 'support@hipamasala.com',
      tax_gstin: taxGstin ? taxGstin.trim().toUpperCase() : '27AAAAA0000A1Z5',
      default_quotation_terms: defaultTerms ? defaultTerms.trim() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id);
  } else {
    await supabase.from('settings').insert({
      company_name: companyName.trim(),
      support_email: supportEmail ? supportEmail.trim() : 'support@hipamasala.com',
      tax_gstin: taxGstin ? taxGstin.trim().toUpperCase() : '27AAAAA0000A1Z5',
      default_quotation_terms: defaultTerms ? defaultTerms.trim() : null,
    });
  }

  await supabase.from('activities').insert({
    entity_type: 'settings',
    entity_id: 'global_settings',
    action_type: 'updated',
    description: `System Administration settings updated by ${user?.email || 'admin'}`,
    performed_by: user?.id || null,
  });

  revalidatePath('/settings');
  return { success: true };
}

export async function getTeamProfiles(): Promise<ProfileRow[]> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  if (isPlaceholderMode) {
    return [
      {
        id: 'demo-user-101',
        full_name: 'Rajesh Sharma',
        email: 'admin@hipamasala.com',
        phone: '+91 98200 11223',
        role: 'admin',
        avatar_url: null,
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 180).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-user-102',
        full_name: 'Ananya Verma',
        email: 'ananya@hipamasala.com',
        phone: '+91 98200 44556',
        role: 'sales_manager',
        avatar_url: null,
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-user-103',
        full_name: 'Vikram Patel',
        email: 'vikram@hipamasala.com',
        phone: '+91 98200 77889',
        role: 'sales_executive',
        avatar_url: null,
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });

  if (error) return [];
  return (data || []) as ProfileRow[];
}

export async function updateUserRoleAction(
  targetUserId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    revalidatePath('/settings');
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Strict Privilege Escalation Protection
  if (!user) return { success: false, error: 'Authentication required.' };

  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!currentProfile || currentProfile.role !== 'admin') {
    return { success: false, error: 'Security Violation: Only System Administrators can alter user roles.' };
  }

  if (user.id === targetUserId && newRole !== 'admin') {
    return { success: false, error: 'Self-Demotion Guard: You cannot revoke your own Administrator privileges.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', targetUserId);

  if (error) return { success: false, error: error.message };

  await supabase.from('activities').insert({
    entity_type: 'user_role',
    entity_id: targetUserId,
    action_type: 'role_updated',
    description: `User role for user ${targetUserId} updated to ${newRole.toUpperCase()}`,
    performed_by: user.id,
  });

  revalidatePath('/settings');
  return { success: true };
}
