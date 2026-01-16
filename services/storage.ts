
import { Customer, Order, Transaction } from '../types';

const DB_NAME = 'TailorMasterDB';
const DB_VERSION = 1;
const STORE_NAME = 'TailorStore';

const STORAGE_KEYS = {
  CUSTOMERS: 'tailor_customers',
  ORDERS: 'tailor_orders',
  TRANSACTIONS: 'tailor_transactions',
  MIGRATION_DONE: 'migration_v1_done'
};

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
    // درخواست حافظه دائمی از مرورگر
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      console.log(`Storage Persistence: ${isPersisted ? 'Permanent' : 'Temporary'}`);
    }

    // منطق انتقال داده‌ها از LocalStorage قدیمی به IndexedDB جدید
    const migrationDone = await db.get<boolean>(STORAGE_KEYS.MIGRATION_DONE);
    if (!migrationDone) {
      console.log('شروع انتقال داده‌ها به حافظه دائمی...');
      
      const oldCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      const oldOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const oldTxs = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);

      if (oldCustomers) await db.set(STORAGE_KEYS.CUSTOMERS, JSON.parse(oldCustomers));
      if (oldOrders) await db.set(STORAGE_KEYS.ORDERS, JSON.parse(oldOrders));
      if (oldTxs) await db.set(STORAGE_KEYS.TRANSACTIONS, JSON.parse(oldTxs));

      await db.set(STORAGE_KEYS.MIGRATION_DONE, true);
      console.log('انتقال داده‌ها با موفقیت انجام شد.');
    }
  },

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

  isPersistenceEnabled: async (): Promise<boolean> => {
    if (navigator.storage && navigator.storage.persisted) {
      return await navigator.storage.persisted();
    }
    return false;
  }
};
