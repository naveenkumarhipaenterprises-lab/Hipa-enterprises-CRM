-- Migration 001: Profiles & Roles Foundation
-- Description: Creates user_role enum, profiles table, and automatic trigger from auth.users

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'sales_manager',
    'sales_executive',
    'marketing',
    'viewer'
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role public.user_role NOT NULL DEFAULT 'sales_executive',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Helper Security Function: Get current authenticated user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role AS $$
DECLARE
    user_role_val public.user_role;
BEGIN
    SELECT role INTO user_role_val
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role_val, 'viewer'::public.user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Automatic Profile Creation Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'sales_executive'::public.user_role),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
