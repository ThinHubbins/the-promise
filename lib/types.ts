export type IconType = 'rice' | 'burger' | 'shawarma' | 'soup' | 'snack' | 'drink';

export interface Review {
  id: string;
  dishId: string; // was number
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Feedback {
  id: string;
  userId: string | null;
  customerName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO string
}


// --- Append the following to your existing lib/types.ts ---

export type StaffStatus = 'active' | 'inactive';

// Fields the admin fills in when adding/editing a staff member


interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export type Order = {
  dbId: string;
  id: string;
  items: { name: string; qty: number; price: number }[];
  amount: number;
  date: string;
  stepIndex: number;
  trackingId: string;
  courier: string;
  location: string;
  eta: string;
  paymentStatus: 'pending' | 'paid' | 'payment_failed';  // add
};

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export type Notification = {
  id: string;
  orderId: string;
  message: string;
  date: string; // ISO string
  read: boolean;
};

export interface Category {
  key: string;
  label: string;
  icon: IconType;
  desc: string;
}

// lib/types.ts
   export type CartLine = {
     id: string; // was number
     name: string;
     price: number;
     qty: number;
   };

export interface User {
  email: string;
  name: string;
  phone: string;
}

export type AttendanceRecord = {
  id: string;
  staff_id: string;
  outlet_id: string;
  clock_in: string; // ISO string
  clock_out: string | null;
};

export type OpenAttendanceWithStaff = AttendanceRecord & { staff: Staff };


export interface Staff {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  staff_id: string;
  job_title: string | null;
  department: string | null;
  outlet: string | null;
  status: StaffStatus;
  salary: number | null;
  hire_date: string; // ISO date, e.g. "2025-01-15"
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type StaffInput = {
  full_name: string;
  email: string;
  phone: string;
  staff_id: string;
  job_title: string;
  department: string;
  outlet: string;
  status: StaffStatus;
  salary: string;      // raw form input, parsed to number on submit
  hire_date: string;
};
export type PayrollStatus = 'in_progress' | 'almost_due' | 'ready';

export interface PayrollPayment {
  id: string;
  staff_id: string;
  period_start: string;
  period_end: string;
  amount: number;
  paid_at: string;
  paid_by: string | null;
  created_at: string;
}

export interface StaffPayrollInfo {
  staff: Staff;
  cycleStart: string;
  daysIntoCycle: number;
  status: PayrollStatus;
  nextDueDate: string;
  lastPayment: PayrollPayment | null;
  bankAccount?: BankAccount | null; // NEW — optional so it's non-breaking
}

export type LeaveType =
  | 'annual'
  | 'sick'
  | 'casual'
  | 'maternity_paternity'
  | 'emergency'
  | 'other';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_code: string;   // staff.staff_id (business ID, e.g. EMP-001)
  staff_email: string;
  department: string | null;
  outlet: string | null;
  leave_type: LeaveType;
  start_date: string; // ISO date
  end_date: string;   // ISO date
  days: number;
  reason: string;
  document_url: string | null;
  status: LeaveStatus;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export type LeaveRequestInput = {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  document?: File | null;
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  maternity_paternity: 'Maternity/Paternity Leave',
  emergency: 'Emergency Leave',
  other: 'Other',
};

export interface BankAccount {
  id: string;
  staff_id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  submitted_at: string;
  updated_at: string;
}

export type BankAccountInput = {
  bank_name: string;
  account_number: string;
  account_name: string;
};

export type FundRequestType = 'petty_cash' | 'business_expense' | 'transport' | 'supplies' | 'other';
export type FundRequestStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export const FUND_REQUEST_TYPE_LABELS: Record<FundRequestType, string> = {
  petty_cash: 'Petty Cash',
  business_expense: 'Business Expense',
  transport: 'Transport',
  supplies: 'Supplies',
  other: 'Other',
};

export interface FundRequest {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_code: string;
  outlet: string | null;
  request_type: FundRequestType;
  amount: number;
  reason: string;
  document_url: string | null;
  status: FundRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
}

export type FundRequestInput = {
  request_type: FundRequestType;
  amount: string; // raw form input, parsed on submit
  reason: string;
  document?: File | null;
};

export type Dish = {
  id: string; // was number — now a uuid from the DB
  name: string;
  cat: string;
  desc: string;
  fullDesc: string;
  price: number;
  icon: IconType;
  tone: 'yellow' | 'red';
  tag?: string;
  images: string[]; // public URLs, up to 3
};

export type DishInput = {
  name: string;
  cat: string;
  desc: string;
  fullDesc: string;
  price: string; // raw form input
  icon: IconType;
  tone: 'yellow' | 'red';
  tag: string;
};