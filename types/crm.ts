export type UserRole = 'admin' | 'sales_manager' | 'sales_executive' | 'marketing' | 'viewer';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiation' | 'converted' | 'lost';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Lead {
  id: string;
  leadCode: string;
  fullName: string;
  companyName: string;
  phone: string;
  whatsappNumber?: string;
  email: string;
  location: string;
  businessType: string;
  leadSource: string;
  productInterests: string[];
  estimatedValue: number;
  assignedTo: string;
  status: LeadStatus;
  priority: PriorityLevel;
  notes?: string;
  nextFollowupDate?: string;
  createdAt: string;
}

export type CustomerStatus = 'active' | 'inactive' | 'potential';

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  companyName: string;
  phone: string;
  whatsappNumber?: string;
  email: string;
  location: string;
  businessType: 'Retailer' | 'Distributor' | 'Wholesale' | 'Manufacturer' | 'Restaurant';
  status: CustomerStatus;
  totalRevenue: number;
  totalOrdersCount: number;
  lastOrderDate: string;
  assignedTo: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
}
