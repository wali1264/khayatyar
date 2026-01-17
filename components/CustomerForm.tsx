
import React, { useState } from 'react';
import { Customer, Measurements } from '../types';
import { MEASUREMENT_LABELS } from '../constants';
import { X, Save, UserPlus } from 'lucide-react';

interface CustomerFormProps {
  onSave: (customer: Partial<Customer>) => void;
  onClose: () => void;
  initialData?: Customer;
  visibleFields?: string[];
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onSave, onClose, initialData, visibleFields }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [measurements, setMeasurements] = useState<Measurements>(initialData?.measurements || {});

  const handleMeasureChange = (key: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setMeasurements(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('نام و شماره تماس الزامی است.');
      return;
    }
    onSave({
      name,
      phone,
      measurements
    });
  };

  // فیلتر کردن فیلدها بر اساس تنظیمات (اگر تنظیماتی نبود همه را نشان بده)
  const fieldsToRender = Object.entries(MEASUREMENT_LABELS).filter(([key]) => 
    !visibleFields || visibleFields.includes(key)
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-white rounded-t-[2.5rem] md:rounded-3xl w-full max-w-2xl max-h-[92vh] md:max-h-[85vh] overflow-hidden flex flex-col mobile-bottom-sheet shadow-2xl">
        <div className="md:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1" />
        
        <div className="px-6 py-3 border-b flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="text-emerald-500" size={18} />
            {initialData ? 'ویرایش اطلاعات' : 'ثبت مشتری جدید'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 mr-2 uppercase">نام مشتری</label>
              <input 
                required
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="neon-input w-full px-4 py-2.5 bg-slate-50 rounded-xl focus:outline-none text-sm font-bold text-slate-700 transition-all"
                placeholder="مثلاً: علی رضایی"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 mr-2 uppercase">شماره تماس</label>
              <input 
                required
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="neon-input w-full px-4 py-2.5 bg-slate-50 rounded-xl focus:outline-none text-left text-sm font-bold text-slate-700 transition-all"
                dir="ltr"
                placeholder="0912..."
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-1.5">
              <span className="text-xs font-bold text-slate-800">اندازه‌گیری‌ها</span>
              <span className="text-[10px] text-slate-400 font-medium">(سانتی‌متر)</span>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {fieldsToRender.map(([key, label]) => (
                <div key={key} className="space-y-0.5">
                  <label className="block text-[10px] font-bold text-slate-500 mr-1 truncate">{label}</label>
                  <input 
                    type="number" 
                    step="0.1"
                    inputMode="decimal"
                    value={measurements[key] || ''} 
                    onChange={(e) => handleMeasureChange(key, e.target.value)}
                    className="neon-input w-full px-2 py-2 bg-slate-50 rounded-lg focus:outline-none text-center font-bold text-slate-700 text-sm"
                  />
                </div>
              ))}
            </div>
            
            {fieldsToRender.length === 0 && (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-[10px] font-bold text-slate-400">هیچ فیلدی فعال نیست. از بخش تنظیمات فیلدهای مورد نظر را فعال کنید.</p>
              </div>
            )}
          </div>
          
          <div className="h-20 md:hidden"></div>
        </form>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/60 backdrop-blur-md border-t border-white/20 flex justify-center gap-2 pb-safe">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-slate-500 font-bold text-sm hover:bg-white/40 transition-all border border-slate-100"
          >
            انصراف
          </button>
          <button 
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 font-bold text-sm"
          >
            <Save size={16} />
            ذخیره اطلاعات
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
