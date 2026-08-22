-- Migration 005: Row Level Security (RLS) Policies across all CRM Tables

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- PROFILES POLICIES
-- -------------------------------------------------------------
CREATE POLICY "Profiles read access for authenticated users"
    ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles update by user or admin"
    ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id OR public.get_current_user_role() = 'admin');

-- -------------------------------------------------------------
-- LEADS POLICIES
-- -------------------------------------------------------------
CREATE POLICY "Leads SELECT policy"
    ON public.leads FOR SELECT TO authenticated
    USING (
        public.get_current_user_role() IN ('admin', 'sales_manager', 'marketing', 'viewer')
        OR assigned_to = auth.uid()
        OR created_by = auth.uid()
    );

CREATE POLICY "Leads INSERT policy"
    ON public.leads FOR INSERT TO authenticated
    WITH CHECK (
        public.get_current_user_role() IN ('admin', 'sales_manager', 'sales_executive', 'marketing')
    );

CREATE POLICY "Leads UPDATE policy"
    ON public.leads FOR UPDATE TO authenticated
    USING (
        public.get_current_user_role() IN ('admin', 'sales_manager')
        OR assigned_to = auth.uid()
        OR created_by = auth.uid()
    );

CREATE POLICY "Leads DELETE policy"
    ON public.leads FOR DELETE TO authenticated
    USING (public.get_current_user_role() = 'admin');

-- -------------------------------------------------------------
-- CUSTOMERS POLICIES
-- -------------------------------------------------------------
CREATE POLICY "Customers SELECT policy"
    ON public.customers FOR SELECT TO authenticated
    USING (
        public.get_current_user_role() IN ('admin', 'sales_manager', 'marketing', 'viewer')
        OR assigned_to = auth.uid()
        OR created_by = auth.uid()
    );

CREATE POLICY "Customers INSERT policy"
    ON public.customers FOR INSERT TO authenticated
    WITH CHECK (
        public.get_current_user_role() IN ('admin', 'sales_manager', 'sales_executive')
    );

CREATE POLICY "Customers UPDATE policy"
    ON public.customers FOR UPDATE TO authenticated
    USING (
        public.get_current_user_role() IN ('admin', 'sales_manager')
        OR assigned_to = auth.uid()
    );

-- -------------------------------------------------------------
-- FOLLOW_UPS POLICIES
-- -------------------------------------------------------------
CREATE POLICY "Follow-ups SELECT policy"
    ON public.follow_ups FOR SELECT TO authenticated
    USING (
        public.get_current_user_role() IN ('admin', 'sales_manager', 'viewer')
        OR assigned_to = auth.uid()
    );

CREATE POLICY "Follow-ups ALL policy for assigned executive or manager"
    ON public.follow_ups FOR ALL TO authenticated
    USING (
        public.get_current_user_role() IN ('admin', 'sales_manager')
        OR assigned_to = auth.uid()
    );

-- -------------------------------------------------------------
-- PRODUCTS & VARIANTS POLICIES (Catalog is readable by all authenticated users)
-- -------------------------------------------------------------
CREATE POLICY "Products SELECT policy" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Product Variants SELECT policy" ON public.product_variants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Products WRITE policy" ON public.products FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "Product Variants WRITE policy" ON public.product_variants FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('admin', 'sales_manager'));

-- -------------------------------------------------------------
-- QUOTATIONS & ORDERS POLICIES
-- -------------------------------------------------------------
CREATE POLICY "Quotations SELECT policy" ON public.quotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Quotation Items SELECT policy" ON public.quotation_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Orders SELECT policy" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Order Items SELECT policy" ON public.order_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Quotations WRITE policy" ON public.quotations FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('admin', 'sales_manager', 'sales_executive'));
CREATE POLICY "Orders WRITE policy" ON public.orders FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('admin', 'sales_manager', 'sales_executive'));

-- -------------------------------------------------------------
-- NOTIFICATIONS POLICIES (Strictly User Isolated)
-- -------------------------------------------------------------
CREATE POLICY "User notifications isolation"
    ON public.notifications FOR ALL TO authenticated
    USING (user_id = auth.uid());
