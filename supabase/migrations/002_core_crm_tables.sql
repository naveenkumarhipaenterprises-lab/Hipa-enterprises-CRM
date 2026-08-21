-- Migration 002: Core CRM Tables (Leads, Customers, Enquiries, Follow-ups, Activities, Tasks, Notifications, Settings)

-- Enums
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'converted', 'lost');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.customer_status AS ENUM ('active', 'inactive', 'potential');
CREATE TYPE public.business_type_enum AS ENUM ('retailer', 'distributor', 'wholesaler', 'manufacturer', 'restaurant', 'other');
CREATE TYPE public.followup_method AS ENUM ('call', 'email', 'whatsapp', 'meeting');
CREATE TYPE public.followup_status AS ENUM ('pending', 'completed', 'rescheduled', 'cancelled');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'completed');

-- 1. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT NOT NULL,
    whatsapp_number TEXT,
    email TEXT,
    location TEXT,
    business_type public.business_type_enum NOT NULL DEFAULT 'retailer',
    lead_source TEXT NOT NULL DEFAULT 'website',
    product_interests TEXT[] DEFAULT '{}',
    estimated_value NUMERIC(12,2) DEFAULT 0.00,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status public.lead_status NOT NULL DEFAULT 'new',
    priority public.priority_level NOT NULL DEFAULT 'medium',
    notes TEXT,
    next_followup_date TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code TEXT NOT NULL UNIQUE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT NOT NULL,
    whatsapp_number TEXT,
    email TEXT,
    location TEXT,
    business_type public.business_type_enum NOT NULL DEFAULT 'retailer',
    status public.customer_status NOT NULL DEFAULT 'active',
    total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_orders_count INTEGER NOT NULL DEFAULT 0,
    last_order_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_converted_lead UNIQUE (lead_id)
);

-- 3. ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_code TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    contact_person TEXT NOT NULL,
    business_type public.business_type_enum NOT NULL DEFAULT 'retailer',
    product_category TEXT NOT NULL,
    expected_quantity TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'inbound',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    priority public.priority_level NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'new',
    notes TEXT,
    next_followup_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. FOLLOW_UPS TABLE
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    purpose TEXT,
    followup_date DATE NOT NULL,
    followup_time TIME,
    method public.followup_method NOT NULL DEFAULT 'call',
    assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    priority public.priority_level NOT NULL DEFAULT 'medium',
    status public.followup_status NOT NULL DEFAULT 'pending',
    outcome TEXT,
    customer_response TEXT,
    set_reminder BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ACTIVITIES TABLE (Central Audit Log)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'lead', 'customer', 'enquiry', 'quotation', 'order', 'follow_up'
    entity_id UUID NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'created', 'updated', 'converted', 'status_changed', 'followup_completed'
    description TEXT NOT NULL,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ NOT NULL,
    priority public.priority_level NOT NULL DEFAULT 'medium',
    status public.task_status NOT NULL DEFAULT 'todo',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read_status BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'HIPA Masala Enterprise',
    support_email TEXT NOT NULL DEFAULT 'support@hipamasala.com',
    tax_gstin TEXT NOT NULL DEFAULT '33AAAAA0000A1Z5',
    default_quotation_terms TEXT DEFAULT 'Payment terms: 30 days net. Delivery within 5 business days.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR FAST CRM SEARCHES & FILTERS
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customers_assigned ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_customer ON public.enquiries(customer_id);
CREATE INDEX IF NOT EXISTS idx_followups_assigned_date ON public.follow_ups(assigned_to, followup_date);
CREATE INDEX IF NOT EXISTS idx_followups_status ON public.follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON public.activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read_status);
