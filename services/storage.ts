
import { Customer, Order, Transaction, ShopInfo } from '../types';

const DB_NAME = 'KhayatiyarDB';
const DB_VERSION = 2; 
const STORE_NAME = 'KhayatiyarStore';

const STORAGE_KEYS = {
  CUSTOMERS: 'tailor_customers',
  ORDERS: 'tailor_orders',
  TRANSACTIONS: 'tailor_transactions',
  // کلیدهای بخش ساده (ایزوله)
  SIMPLE_CUSTOMERS: 'simple_customers',
  SIMPLE_ORDERS: 'simple_orders',
  SIMPLE_TRANSACTIONS: 'simple_transactions',
  
  APPROVAL_CACHE: 'approval_status_cache',
  MIGRATION_DONE: 'migration_v1_done',
  VISIBLE_MEASUREMENTS: 'visible_measurements_config',

  // کلیدهای جدید شخصی‌سازی
  SHOP_INFO: 'shop_info_config',
  SIMPLE_LABELS: 'simple_measurement_labels_config',
  CUSTOM_MESSAGES: 'tailor_custom_messages_config'
};

interface ApprovalCache {
  status: boolean;
  timestamp: number;
}

class TailorDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const db = new TailorDB();

export const StorageService = {
  init: async () => {
    if (navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist();
    }

    const migrationDone = await db.get<boolean>(STORAGE_KEYS.MIGRATION_DONE);
    if (!migrationDone) {
      const oldCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      const oldOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const oldTxs = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);

      if (oldCustomers) await db.set(STORAGE_KEYS.CUSTOMERS, JSON.parse(oldCustomers));
      if (oldOrders) await db.set(STORAGE_KEYS.ORDERS, JSON.parse(oldOrders));
      if (oldTxs) await db.set(STORAGE_KEYS.TRANSACTIONS, JSON.parse(oldTxs));

      await db.set(STORAGE_KEYS.MIGRATION_DONE, true);
    }
  },

  // متدهای بخش حرفه‌ای
  getCustomers: async (): Promise<Customer[]> => {
    return (await db.get<Customer[]>(STORAGE_KEYS.CUSTOMERS)) || [];
  },
  saveCustomers: async (customers: Customer[]) => {
    await db.set(STORAGE_KEYS.CUSTOMERS, customers);
  },
  getOrders: async (): Promise<Order[]> => {
    return (await db.get<Order[]>(STORAGE_KEYS.ORDERS)) || [];
  },
  saveOrders: async (orders: Order[]) => {
    await db.set(STORAGE_KEYS.ORDERS, orders);
  },
  getTransactions: async (): Promise<Transaction[]> => {
    return (await db.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS)) || [];
  },
  saveTransactions: async (transactions: Transaction[]) => {
    await db.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  },

  // متدهای بخش ساده (ایزوله)
  getSimpleCustomers: async (): Promise<Customer[]> => {
    return (await db.get<Customer[]>(STORAGE_KEYS.SIMPLE_CUSTOMERS)) || [];
  },
  saveSimpleCustomers: async (customers: Customer[]) => {
    await db.set(STORAGE_KEYS.SIMPLE_CUSTOMERS, customers);
  },
  getSimpleOrders: async (): Promise<Order[]> => {
    return (await db.get<Order[]>(STORAGE_KEYS.SIMPLE_ORDERS)) || [];
  },
  saveSimpleOrders: async (orders: Order[]) => {
    await db.set(STORAGE_KEYS.SIMPLE_ORDERS, orders);
  },
  getSimpleTransactions: async (): Promise<Transaction[]> => {
    return (await db.get<Transaction[]>(STORAGE_KEYS.SIMPLE_TRANSACTIONS)) || [];
  },
  saveSimpleTransactions: async (transactions: Transaction[]) => {
    await db.set(STORAGE_KEYS.SIMPLE_TRANSACTIONS, transactions);
  },

  // اطلاعات فروشگاه
  getShopInfo: async (): Promise<ShopInfo | null> => {
    return await db.get<ShopInfo>(STORAGE_KEYS.SHOP_INFO);
  },
  saveShopInfo: async (info: ShopInfo) => {
    await db.set(STORAGE_KEYS.SHOP_INFO, info);
  },

  // برچسب‌های شخصی‌سازی شده برای حالت ساده
  getSimpleLabels: async (defaultLabels: Record<string, string>): Promise<Record<string, string>> => {
    const saved = await db.get<Record<string, string>>(STORAGE_KEYS.SIMPLE_LABELS);
    return saved || defaultLabels;
  },
  saveSimpleLabels: async (labels: Record<string, string>) => {
    await db.set(STORAGE_KEYS.SIMPLE_LABELS, labels);
  },

  // پیام‌های آماده شخصی‌سازی شده
  getCustomMessages: async (defaultMessages: Record<string, string>): Promise<Record<string, string>> => {
    const saved = await db.get<Record<string, string>>(STORAGE_KEYS.CUSTOM_MESSAGES);
    return saved || defaultMessages;
  },
  saveCustomMessages: async (messages: Record<string, string>) => {
    await db.set(STORAGE_KEYS.CUSTOM_MESSAGES, messages);
  },

  getApprovalCache: async (): Promise<ApprovalCache | null> => {
    return await db.get<ApprovalCache>(STORAGE_KEYS.APPROVAL_CACHE);
  },
  saveApprovalCache: async (status: boolean) => {
    await db.set(STORAGE_KEYS.APPROVAL_CACHE, {
      status,
      timestamp: Date.now()
    });
  },

  getVisibleMeasurements: async (allKeys: string[]): Promise<string[]> => {
    const saved = await db.get<string[]>(STORAGE_KEYS.VISIBLE_MEASUREMENTS);
    return saved || allKeys;
  },
  saveVisibleMeasurements: async (keys: string[]) => {
    await db.set(STORAGE_KEYS.VISIBLE_MEASUREMENTS, keys);
  },

  isPersistenceEnabled: async (): Promise<boolean> => {
    if (navigator.storage && navigator.storage.persisted) {
      return await navigator.storage.persisted();
    }
    return false;
  }
};
