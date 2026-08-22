'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserProfile } from '@/types/crm';

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export async function loginAction(formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const supabase = await createClient();

  // If using placeholder environment, simulate successful login for UI demonstration
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
  if (isPlaceholderMode) {
    if (password.length < 4) {
      return { success: false, error: 'Invalid email or password.' };
    }
    redirect('/dashboard');
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message.includes('Invalid login credentials')
        ? 'Invalid email or password. Please check your credentials.'
        : 'Unable to sign in right now. Please try again.',
    };
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        id: 'demo-user-101',
        fullName: 'Rajesh Kumar',
        email: 'rajesh@hipamasala.com',
        role: 'sales_manager',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAYPy2tgMVV0eeDc42kiNWK7aKC84f0bYYNaLvYlfS43SKwtHDGFWLmMzXo1aNTnkgxVoW1BVLglE7i_Q40HjRYSZ-hsvuNF35jEEMpDdAc-rsUMHSBBv-vFUsVJaIfcOutsp7H0N6CYGCSlH2hZBhR2lbD_GWd2dggRnd_zbHktJbBKS1q5MDX-RECZqJMfNr7kYkjDMPHDKSfMSs8AnaWN84F8yqpHUxltfWK7kzLkflb7Q2Szq74',
      };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      return {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        role: profile.role,
        avatarUrl: profile.avatar_url,
      };
    }

    return {
      id: user.id,
      fullName: user.email?.split('@')[0] || 'User',
      email: user.email || '',
      role: 'sales_executive',
    };
  } catch {
    return {
      id: 'demo-user-101',
      fullName: 'Rajesh Kumar',
      email: 'rajesh@hipamasala.com',
      role: 'sales_manager',
    };
  }
}
