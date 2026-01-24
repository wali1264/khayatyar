
import { supabase } from './supabase';
import { StorageService } from './storage';

export const CloudService = {
  /**
   * بررسی سلامت داده‌ها قبل از پشتیبان‌گیری
   */
  validateBackupData(data: any): boolean {
    try {
      if (!data || data.version !== '2.0') return false;
      
      const parts = ['professional', 'simple'];
      for (const part of parts) {
        if (!data[part]) return false;
        // بررسی وجود آرایه‌های اصلی (حتی اگر خالی باشند)
        if (!Array.isArray(data[part].customers) || 
            !Array.isArray(data[part].orders) || 
            !Array.isArray(data[part].transactions)) {
          return false;
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  async uploadBackup(userId: string) {
    try {
      // ۱. جمع‌آوری داده‌ها از هر دو بخش
      const rawData = {
        professional: {
          customers: await StorageService.getCustomers(),
          orders: await StorageService.getOrders(),
          transactions: await StorageService.getTransactions(),
        },
        simple: {
          customers: await StorageService.getSimpleCustomers(),
          orders: await StorageService.getSimpleOrders(),
          transactions: await StorageService.getSimpleTransactions(),
        },
        timestamp: new Date().toISOString(),
        version: '2.0'
      };

      // ۲. اعتبارسنجی سلامت داده‌ها
      if (!this.validateBackupData(rawData)) {
        throw new Error('داده‌های استخراج شده ناقص یا نامعتبر هستند. عملیات متوقف شد.');
      }

      // ۳. اطمینان از سریال‌سازی صحیح (Deep Copy for serialization safety)
      const cleanData = JSON.parse(JSON.stringify(rawData));

      // ۴. ارسال به ابر (جایگزینی کامل نسخه قبلی با استفاده از upsert بر روی user_id)
      const { error } = await supabase
        .from('backups')
        .upsert({ 
          user_id: userId, 
          data: cleanData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Cloud Backup Fatal Error:', error);
      return { success: false, error };
    }
  },

  async downloadBackup(userId: string) {
    try {
      // ۱. دریافت آخرین نسخه از ابر
      const { data, error } = await supabase
        .from('backups')
        .select('data')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!data || !data.data) throw new Error('هیچ نسخه پشتیبانی در حساب ابری شما یافت نشد.');

      const backup = data.data;
      
      // ۲. بازیابی هوشمند و جایگزینی کامل
      // اگر ساختار جدید (2.0) باشد، هر دو بخش را بازیابی می‌کنیم
      if (backup.version === '2.0' && backup.professional && backup.simple) {
        // الف) بازیابی بخش حرفه‌ای
        await StorageService.saveCustomers(backup.professional.customers || []);
        await StorageService.saveOrders(backup.professional.orders || []);
        await StorageService.saveTransactions(backup.professional.transactions || []);
        
        // ب) بازیابی بخش ساده (حل مشکل گزارش شده)
        await StorageService.saveSimpleCustomers(backup.simple.customers || []);
        await StorageService.saveSimpleOrders(backup.simple.orders || []);
        await StorageService.saveSimpleTransactions(backup.simple.transactions || []);
      } 
      // پشتیبانی از بکاپ‌های قدیمی که شاید فقط بخش حرفه‌ای داشتند
      else if (backup.customers || backup.professional) {
        const pro = backup.professional || backup;
        await StorageService.saveCustomers(pro.customers || []);
        await StorageService.saveOrders(pro.orders || []);
        await StorageService.saveTransactions(pro.transactions || []);
        // در این حالت بخش ساده دست نخورده می‌ماند یا خالی می‌شود (بسته به سیاست شما)
      } else {
        throw new Error('فرمت فایل پشتیبان ابری شناسایی نشد.');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Cloud Restore Fatal Error:', error);
      return { success: false, error };
    }
  }
};
