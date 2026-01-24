
import { supabase } from './supabase';
import { StorageService } from './storage';

export const CloudService = {
  async uploadBackup(userId: string) {
    try {
      const data = {
        // داده‌های بخش حرفه‌ای
        professional: {
          customers: await StorageService.getCustomers(),
          orders: await StorageService.getOrders(),
          transactions: await StorageService.getTransactions(),
        },
        // داده‌های بخش ساده
        simple: {
          customers: await StorageService.getSimpleCustomers(),
          orders: await StorageService.getSimpleOrders(),
          transactions: await StorageService.getSimpleTransactions(),
        },
        timestamp: new Date().toISOString(),
        version: '2.0' // ورژن جدید ساختار پشتیبان‌گیری
      };

      // اعتبارسنجی اولیه
      if (!data.professional.customers || !Array.isArray(data.professional.customers)) {
        throw new Error('ساختار داده‌های مشتریان حرفه‌ای نامعتبر است.');
      }

      const { error } = await supabase
        .from('backups')
        .upsert({ 
          user_id: userId, 
          data: data,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Cloud Backup Error:', error);
      return { success: false, error };
    }
  },

  async downloadBackup(userId: string) {
    try {
      const { data, error } = await supabase
        .from('backups')
        .select('data')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!data || !data.data) throw new Error('نسخه پشتیبانی یافت نشد.');

      const backup = data.data;
      
      // بازیابی هوشمند با بررسی ورژن یا ساختار
      if (backup.version === '2.0' && backup.professional && backup.simple) {
        // بازیابی داده‌های حرفه‌ای
        await StorageService.saveCustomers(backup.professional.customers || []);
        await StorageService.saveOrders(backup.professional.orders || []);
        await StorageService.saveTransactions(backup.professional.transactions || []);
        
        // بازیابی داده‌های ساده
        await StorageService.saveSimpleCustomers(backup.simple.customers || []);
        await StorageService.saveSimpleOrders(backup.simple.orders || []);
        await StorageService.saveSimpleTransactions(backup.simple.transactions || []);
      } else {
        // پشتیبانی از نسخه‌های قدیمی (Backward Compatibility)
        await StorageService.saveCustomers(backup.customers || []);
        await StorageService.saveOrders(backup.orders || []);
        await StorageService.saveTransactions(backup.transactions || []);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Cloud Restore Error:', error);
      return { success: false, error };
    }
  }
};
