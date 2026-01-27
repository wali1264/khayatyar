
import React from 'react';
import { 
  Users, 
  CreditCard, 
  LayoutDashboard, 
  Scissors
} from 'lucide-react';

export const MEASUREMENT_LABELS: Record<string, string> = {
  height: 'قد',
  weight: 'وزن',
  neck: 'دور گردن',
  shoulder: 'سرشانه',
  chest: 'دور سینه',
  waist: 'دور کمر',
  hip: 'دور باسن',
  sleeveLength: 'قد آستین',
  armhole: 'حلقه آستین',
  wrist: 'دور مچ',
  backWidth: 'کارور پشت',
  frontLength: 'بالاتنه جلو',
  backLength: 'بالاتنه پشت',
  inseam: 'قد داخل پا',
  outseam: 'قد شلوار (از کمر)',
  thigh: 'دور ران',
  ankle: 'دور دمپا',
};

// فیلدهای طلایی برای حالت ساده (خیاطی سنتی/افغانی)
export const SIMPLE_MEASUREMENT_LABELS: Record<string, string> = {
  height: 'قد',
  sleeveLength: 'آستین',
  shoulder: 'شانه',
  neck: 'یقه',
  waist: 'کمر',
  outseam: 'قد شلوار',
  ankle: 'پاچه',
};

export const NAVIGATION_ITEMS = [
  { id: 'DASHBOARD', label: 'داشبورد', icon: <LayoutDashboard size={20} /> },
  { id: 'CUSTOMERS', label: 'مشتریان', icon: <Users size={20} /> },
  { id: 'ACCOUNTING', label: 'حسابداری', icon: <CreditCard size={20} /> },
];

export const STATUS_COLORS: Record<string, string> = {
  'در انتظار دوخت': 'bg-gray-100 text-gray-700',
  'در حال دوخت': 'bg-blue-100 text-blue-700',
  'دوخته شده': 'bg-indigo-100 text-indigo-700',
  'آماده تحویل': 'bg-amber-100 text-amber-700 border-amber-200',
  'تحویل داده شده': 'bg-emerald-100 text-emerald-700',
};
