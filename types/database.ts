export type UserRole = 'admin' | 'sales_manager' | 'sales_executive' | 'marketing' | 'viewer';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiation' | 'converted' | 'lost';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type CustomerStatus = 'active' | 'inactive' | 'potential';
export type BusinessType = 'retailer' | 'distributor' | 'wholesaler' | 'manufacturer' | 'restaurant' | 'other';
export type FollowupMethod = 'call' | 'email' | 'whatsapp' | 'meeting';
export type FollowupStatus = 'pending' | 'completed' | 'rescheduled' | 'cancelled';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type QuotationStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
export type PaymentStatus = 'pending' | 'partially_paid' | 'paid';
export type DeliveryStatus = 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
export type StockMovementType = 'opening_stock' | 'stock_in' | 'stock_out' | 'adjustment_increase' | 'adjustment_decrease' | 'order_fulfillment';
export type POStatus = 'draft' | 'issued' | 'partially_received' | 'received' | 'cancelled';
export type POReceivingStatus = 'pending' | 'partial' | 'completed';
export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'upi' | 'cheque' | 'cash' | 'card';
export type FulfilmentStatus = 'pending' | 'processing' | 'packed' | 'ready_for_dispatch' | 'dispatched' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadRow {
  id: string;
  lead_code: string;
  full_name: string;
  company_name: string | null;
  phone: string;
  whatsapp_number: string | null;
  email: string | null;
  location: string | null;
  business_type: BusinessType;
  lead_source: string;
  product_interests: string[];
  estimated_value: number;
  assigned_to: string | null;
  status: LeadStatus;
  priority: PriorityLevel;
  notes: string | null;
  next_followup_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerRow {
  id: string;
  customer_code: string;
  lead_id: string | null;
  name: string;
  company_name: string | null;
  phone: string;
  whatsapp_number: string | null;
  email: string | null;
  location: string | null;
  business_type: BusinessType;
  status: CustomerStatus;
  total_revenue: number;
  total_orders_count: number;
  last_order_date: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnquiryRow {
  id: string;
  enquiry_code: string;
  lead_id: string | null;
  customer_id: string | null;
  contact_person: string;
  product_category: string;
  expected_quantity: string;
  target_price: number | null;
  status: 'new' | 'under_review' | 'quotation_created' | 'closed';
  priority: PriorityLevel;
  notes: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowupRow {
  id: string;
  lead_id: string | null;
  customer_id: string | null;
  enquiry_id: string | null;
  scheduled_at: string;
  due_date: string;
  followup_method: FollowupMethod;
  status: FollowupStatus;
  notes: string | null;
  outcome_notes: string | null;
  completed_at: string | null;
  assigned_to: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FollowUpRow {
  id: string;
  customer_id: string | null;
  lead_id: string | null;
  enquiry_id: string | null;
  title: string;
  purpose: string | null;
  followup_date: string;
  followup_time: string | null;
  method: string;
  assigned_to: string;
  priority: string;
  status: string;
  outcome: string | null;
  customer_response: string | null;
  set_reminder: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpportunityRow {
  id: string;
  title: string;
  customer_id: string;
  enquiry_id: string | null;
  expected_revenue: number;
  stage: 'new' | 'qualified' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';
  probability: number;
  close_date: string | null;
  assigned_to: string;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityRow {
  id: string;
  entity_type: string;
  entity_id: string;
  customer_id: string | null;
  lead_id: string | null;
  action_type: string;
  description: string;
  performed_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  pack_size: string;
  pack_unit: string;
  sku_variant: string;
  unit_price: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuotationRow {
  id: string;
  quotation_number: string;
  customer_id: string;
  enquiry_id: string | null;
  valid_until: string;
  assigned_to: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: QuotationStatus;
  terms: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuotationItemRow {
  id: string;
  quotation_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  pack_size_snapshot: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  total_price: number;
  created_at: string;
}

export interface OrderRow {
  id: string;
  order_number: string;
  quotation_id: string;
  customer_id: string;
  assigned_to: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  order_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  pack_size_snapshot: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface StockMovementRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  movement_type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_id: string | null;
  reason: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface SupplierRow {
  id: string;
  supplier_code: string;
  name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  gstin: string | null;
  payment_terms: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderRow {
  id: string;
  po_number: string;
  supplier_id: string;
  order_date: string;
  expected_delivery: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: POStatus;
  receiving_status: POReceivingStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItemRow {
  id: string;
  po_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  pack_size_snapshot: string;
  quantity: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

export interface InvoiceRow {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: InvoiceStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  pack_size_snapshot: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface PaymentRow {
  id: string;
  invoice_id: string;
  customer_id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DeliveryRow {
  id: string;
  delivery_number: string;
  order_id: string;
  customer_id: string;
  assigned_driver: string | null;
  vehicle_number: string | null;
  shipping_address: string | null;
  tracking_ref: string | null;
  dispatch_date: string | null;
  delivered_date: string | null;
  status: FulfilmentStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  customer_id: string | null;
  lead_id: string | null;
  due_date: string;
  priority: PriorityLevel;
  status: TaskStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link: string | null;
  read_status: boolean;
  created_at: string;
}

export interface SettingsRow {
  id: string;
  company_name: string;
  support_email: string;
  tax_gstin: string;
  default_quotation_terms: string | null;
  updated_at: string;
}
