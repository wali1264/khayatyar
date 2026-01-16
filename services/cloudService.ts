
import { supabase } from './supabase';
import { StorageService } from './storage';

export const CloudService = {
  async uploadBackup(userId: string) {
    try {
      const data = {
        customers: await StorageService.getCustomers(),
        orders: await StorageService.getOrders(),
        transactions: await StorageService.getTransactions(),
        timestamp: new Date().toISOString()
      };

      // اعتبارسنجی اولیه برای اطمینان از صحت داده‌ها
      if (!data.customers || !Array.isArray(data.customers)) {
        throw new Error('ساختار داده‌های مشتریان نامعتبر است.');
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
      
      // جایگزینی در حافظه دائمی
      await StorageService.saveCustomers(backup.customers || []);
      await StorageService.saveOrders(backup.orders || []);
      await StorageService.saveTransactions(backup.transactions || []);
      
      return { success: true };
    } catch (error) {
      console.error('Cloud Restore Error:', error);
      return { success: false, error };
    }
  }
};
