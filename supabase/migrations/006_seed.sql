-- Migration 006: Realistic HIPA Masala Development Seed Data

-- 1. SEED SYSTEM SETTINGS
INSERT INTO public.settings (company_name, support_email, tax_gstin, default_quotation_terms)
VALUES (
    'HIPA Masala Enterprise Ltd.',
    'sales@hipamasala.com',
    '33AAAAA0000A1Z5',
    '1. Prices inclusive of 18% GST. 2. Payment terms: 30 days net from invoice date. 3. Dispatch within 3 business days of order confirmation.'
) ON CONFLICT DO NOTHING;

-- 2. SEED PRODUCTS
INSERT INTO public.products (id, name, sku, category, description)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'Sambar Powder', 'HPM-SMB', 'Blends', 'Traditional South Indian aromatic sambar spice mix made with roasted coriander, red chilli, and lentils.'),
    ('10000000-0000-0000-0000-000000000002', 'Rasam Powder', 'HPM-RSM', 'Blends', 'Tangy and peppery rasam powder crafted with seeragam, pepper, and thoor dhal.'),
    ('10000000-0000-0000-0000-000000000003', 'Turmeric Powder', 'HPM-TUR', 'Ground Spices', 'High curcumin organic turmeric powder ground from select Erode turmeric fingers.'),
    ('10000000-0000-0000-0000-000000000004', 'Red Chilli Powder', 'HPM-CHL', 'Ground Spices', 'Vibrant red Guntur chilli powder providing natural color and balanced heat.'),
    ('10000000-0000-0000-0000-000000000005', 'Garam Masala', 'HPM-GRM', 'Blends', 'Rich aromatic garamasala blend containing cardamom, cinnamon, cloves, and star anise.')
ON CONFLICT (sku) DO NOTHING;

-- 3. SEED PRODUCT VARIANTS
INSERT INTO public.product_variants (product_id, pack_size, pack_unit, sku_variant, unit_price, stock_quantity)
VALUES
    ('10000000-0000-0000-0000-000000000001', '100g', 'grams', 'HPM-SMB-100G', 75.00, 1500),
    ('10000000-0000-0000-0000-000000000001', '500g', 'grams', 'HPM-SMB-500G', 340.00, 600),
    ('10000000-0000-0000-0000-000000000002', '100g', 'grams', 'HPM-RSM-100G', 65.00, 1200),
    ('10000000-0000-0000-0000-000000000003', '500g', 'grams', 'HPM-TUR-500G', 140.00, 2000),
    ('10000000-0000-0000-0000-000000000004', '500g', 'grams', 'HPM-CHL-500G', 190.00, 1800),
    ('10000000-0000-0000-0000-000000000005', '100g', 'grams', 'HPM-GRM-100G', 95.00, 800)
ON CONFLICT (sku_variant) DO NOTHING;

-- 4. SEED LEADS
INSERT INTO public.leads (id, lead_code, full_name, company_name, phone, email, location, business_type, lead_source, product_interests, estimated_value, status, priority)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'HIPA-LD-1001', 'John Doe', 'Global Spices Ltd', '+91 98765 11111', 'john@globalspices.com', 'Mumbai, MH', 'distributor', 'website', ARRAY['whole_spices', 'blends'], 550000.00, 'new', 'high'),
    ('20000000-0000-0000-0000-000000000002', 'HIPA-LD-1002', 'Anita Desai', 'Desai Supermarket', '+91 98765 22222', 'anita@desaimart.in', 'Pune, MH', 'retailer', 'trade_show', ARRAY['blends'], 210000.00, 'contacted', 'medium'),
    ('20000000-0000-0000-0000-000000000003', 'HIPA-LD-1003', 'Vikram Mehta', 'Mehta Wholesalers', '+91 98765 33333', 'vikram@mehtawholesale.com', 'Surat, GJ', 'wholesaler', 'referral', ARRAY['bulk', 'ground_spices'], 1200000.00, 'qualified', 'urgent')
ON CONFLICT (lead_code) DO NOTHING;

-- 5. SEED CUSTOMERS
INSERT INTO public.customers (id, customer_code, name, company_name, phone, email, location, business_type, status, total_revenue, total_orders_count, last_order_date)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'HIPA-CUST-5001', 'Rajesh Kumar', 'Anjali Supermarket', '+91 98765 43210', 'rajesh@anjalimart.com', 'Mumbai, MH', 'retailer', 'active', 1420000.00, 124, NOW() - INTERVAL '9 days'),
    ('30000000-0000-0000-0000-000000000002', 'HIPA-CUST-5002', 'Vikram Singh', 'Heritage Foods Dist.', '+91 99887 76655', 'vikram@heritagefoods.in', 'Delhi, DL', 'distributor', 'active', 8550000.00, 412, NOW() - INTERVAL '6 days'),
    ('30000000-0000-0000-0000-000000000003', 'HIPA-CUST-5003', 'Priya Sharma', 'Spice Route Traders', '+91 91234 56780', 'priya@spiceroute.com', 'Jaipur, RJ', 'wholesaler', 'inactive', 520000.00, 18, NOW() - INTERVAL '180 days')
ON CONFLICT (customer_code) DO NOTHING;
