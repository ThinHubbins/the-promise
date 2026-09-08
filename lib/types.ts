export type IconType = 'rice' | 'burger' | 'shawarma' | 'soup' | 'snack' | 'drink';

export type Dish = {
  id: number;
  name: string;
  cat: string;
  desc: string;
  fullDesc: string; // longer description for the dish detail page
  price: number;
  icon: IconType;
  tone: 'yellow' | 'red';
  tag?: string;
};
export interface Review {
  id: string;
  dishId: number;
  userId: string;
  userName: string;
  rating: number; // 1–5
  comment: string;
  date: string; // ISO string
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
  created_by: string | null;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

// Fields the admin fills in when adding/editing a staff member
export type StaffInput = {
  full_name: string;
  email: string;
  phone: string;
  staff_id: string;
  job_title: string;
  department: string;
  outlet: string;
  status: StaffStatus;
};

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
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
}

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
  id: number;
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
