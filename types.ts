
export enum OrderStatus {
  PENDING = 'در انتظار دوخت',
  PROCESSING = 'در حال دوخت',
  SEWN = 'دوخته شده',
  READY = 'آماده تحویل',
  COMPLETED = 'تحویل داده شده'
}

export interface Measurements {
  height?: number;
  weight?: number;
  neck?: number;
  shoulder?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  sleeveLength?: number;
  armhole?: number;
  wrist?: number;
  backWidth?: number;
  frontLength?: number;
  backLength?: number;
  inseam?: number;
  outseam?: number;
  thigh?: number;
  ankle?: number;
  [key: string]: number | undefined;
}

export interface Transaction {
  id: string;
  customerId: string;
  orderId?: string; // لینک کردن تراکنش به سفارش (مخصوص حالت ساده)
  amount: number; // Positive for debt, negative for payment
  date: string;
  description: string;
}

export interface Order {
  id: string;
  customerId: string;
  description: string;
  status: OrderStatus;
  dateCreated: string;
  dueDate?: string;
  totalPrice?: number;
  clothPrice?: number; // قیمت پارچه
  sewingFee?: number; // اجرت دوخت
  deposit?: number;
  photo?: string; // base64
  styleDetails?: Record<string, string>; // جزئیات مدل (یقه، آستین و غیره)
  notes?: string; // جزئیات و یادداشت‌های بیشتر
}

export interface ShopInfo {
  name: string;
  phone: string;
  address: string;
  tailorName: string;
  extraNotes?: string;
}

export interface Customer {
  id: string;
  code?: number; // کد اشتراک عددی (ترتیبی)
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  measurements: Measurements;
  balance: number; // Sum of transactions
  photo?: string; // base64
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type AppView = 'DASHBOARD' | 'CUSTOMERS' | 'ACCOUNTING' | 'AI_ASSISTANT' | 'CUSTOMER_DETAIL';
