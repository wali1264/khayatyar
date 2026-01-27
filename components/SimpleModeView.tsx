
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Order, Transaction, OrderStatus, ShopInfo } from '../types';
import { SIMPLE_MEASUREMENT_LABELS as DEFAULT_LABELS, STATUS_COLORS } from '../constants';
import { StorageService } from '../services/storage';
import { 
  Search, 
  Plus, 
  UserPlus, 
  X, 
  Save, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Edit3, 
  ShoppingBag,
  History,
  TrendingUp,
  LogOut,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Info,
  Layers,
  Settings,
  Store,
  Ruler,
  Check,
  PlusCircle,
  Type,
  Printer,
  Bell,
  Clock,
  Scissors as ScissorsIcon,
  CheckCircle,
  Gift,
  Handshake,
  Database,
  BarChart3,
  PieChart,
  Users,
  Wallet,
  ArrowUpRight,
  Phone,
  MessageSquare,
  CalendarDays
} from 'lucide-react';

interface SimpleModeViewProps {
  onOpenBackup?: () => void;
}

const PROTECTED_KEYS = ['height', 'sleeveLength', 'shoulder', 'neck', 'waist', 'outseam', 'ankle'];

const SimpleModeView: React.FC<SimpleModeViewProps> = ({ onOpenBackup }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyViewId, setHistoryViewId] = useState<string | null>(null);
  const [expandedOrderDetailId, setExpandedOrderDetailId] = useState<string | null>(null);

  // Settings & Customizable Labels
  const [shopInfo, setShopInfo] = useState<ShopInfo>({ name: '', phone: '', address: '', tailorName: '' });
  const [measurementLabels, setMeasurementLabels] = useState<Record<string, string>>(DEFAULT_LABELS);
  
  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState<Customer | boolean>(false);
  const [showOrderModal, setShowOrderModal] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<{ orderId: string, custId: string } | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<Order | null>(null);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [reminderThreshold, setReminderThreshold] = useState(Number(localStorage.getItem('reminder_threshold') || 10));

  const [activeSettingsTab, setActiveSettingsTab] = useState<'SHOP' | 'FIELDS'>('SHOP');
  const [activeFieldsSubTab, setActiveFieldsSubTab] = useState<'RENAME' | 'CREATE'>('RENAME');
  const [newFieldName, setNewFieldName] = useState('');
  
  // Printing State
  const [printingOrder, setPrintingOrder] = useState<{order: Order, customer: Customer} | null>(null);

  // Quick Order Local State
  const [quickOrderPrices, setQuickOrderPrices] = useState({ cloth: 0, sewing: 0, received: 0 });
  const [styleDetails, setStyleDetails] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      let custData = await StorageService.getSimpleCustomers();
      
      // Migration logic: Only assign codes if they are missing
      // We calculate max existing code to avoid duplicates
      let maxCode = custData.reduce((max, c) => (c.code !== undefined && c.code > max ? c.code : max), 0);
      let needsMigration = false;

      const migratedData = custData.map(c => {
        if (c.code === undefined) {
          needsMigration = true;
          maxCode++;
          return { ...c, code: maxCode };
        }
        return c;
      });

      if (needsMigration) {
        custData = migratedData;
        await StorageService.saveSimpleCustomers(custData);
      }
      
      setCustomers(custData);
      setOrders(await StorageService.getSimpleOrders());
      setTransactions(await StorageService.getSimpleTransactions());
      
      const savedInfo = await StorageService.getShopInfo();
      if (savedInfo) setShopInfo(savedInfo);
      
      const savedLabels = await StorageService.getSimpleLabels(DEFAULT_LABELS);
      setMeasurementLabels(savedLabels);
    };
    loadData();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers.slice(-10).reverse();
    const term = searchTerm.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.phone.includes(term) ||
      (c.code !== undefined && c.code.toString() === term)
    ).reverse();
  }, [customers, searchTerm]);

  // --- Reminders Calculation ---
  const reminders = useMemo(() => {
    const now = Date.now();
    const thresholdMs = reminderThreshold * 24 * 60 * 60 * 1000;

    // 1. Uncollected Clothes (Ready/Sewn and stayed longer than threshold)
    const pickupReminders = orders.filter(o => {
      const isPendingPickup = o.status === OrderStatus.READY || o.status === OrderStatus.SEWN;
      if (!isPendingPickup) return false;
      
      const createdAt = parseInt(o.id) || 0;
      return (now - createdAt) > thresholdMs;
    }).map(o => ({
      order: o,
      customer: customers.find(c => c.id === o.customerId),
      daysPassed: Math.floor((now - (parseInt(o.id) || now)) / (24 * 60 * 60 * 1000))
    }));

    // 2. Financial Debt Reminders
    const debtReminders = customers.filter(c => c.balance > 0.1).map(c => {
      const lastOrder = orders.filter(o => o.customerId === c.id).slice(-1)[0];
      return {
        customer: c,
        balance: c.balance,
        lastOrderDate: lastOrder?.dateCreated || 'نامشخص'
      };
    });

    return { pickup: pickupReminders, debt: debtReminders };
  }, [orders, customers, reminderThreshold]);

  // --- Statistics Calculations ---
  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString('fa-IR');
    const todayIncome = transactions
      .filter(t => t.date === today && t.amount < 0)
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const totalDebt = customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
    const statusCounts = {
      [OrderStatus.PENDING]: orders.filter(o => o.status === OrderStatus.PENDING).length,
      [OrderStatus.PROCESSING]: orders.filter(o => o.status === OrderStatus.PROCESSING).length,
      [OrderStatus.SEWN]: orders.filter(o => o.status === OrderStatus.SEWN).length,
      [OrderStatus.READY]: orders.filter(o => o.status === OrderStatus.READY).length,
      [OrderStatus.COMPLETED]: orders.filter(o => o.status === OrderStatus.COMPLETED).length,
    };
    const activeOrders = orders.filter(o => o.status !== OrderStatus.COMPLETED).length;
    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED).length;
    const projectedRevenue = orders
      .filter(o => o.status !== OrderStatus.COMPLETED)
      .reduce((acc, o) => acc + (o.totalPrice || 0), 0);

    return {
      totalCustomers: customers.length,
      totalOrders: orders.length,
      activeOrders,
      completedOrders,
      todayIncome,
      totalDebt,
      statusCounts,
      projectedRevenue
    };
  }, [customers, orders, transactions]);

  const saveCustomer = async (data: Partial<Customer>) => {
    let updated;
    if (typeof showCustomerModal === 'object') {
      updated = customers.map(c => c.id === showCustomerModal.id ? { ...c, ...data } : c);
    } else {
      // Find the absolute maximum code to ensure next one is unique
      const maxCode = customers.reduce((max, c) => (c.code !== undefined && c.code > max ? c.code : max), 0);
      
      const newCustomer: Customer = {
        id: Date.now().toString(),
        code: maxCode + 1,
        name: data.name!,
        phone: data.phone!,
        measurements: data.measurements || {},
        balance: 0,
      };
      updated = [...customers, newCustomer];
    }
    setCustomers(updated);
    await StorageService.saveSimpleCustomers(updated);
    setShowCustomerModal(false);
  };

  const deleteCustomer = async (id: string) => {
    const cust = customers.find(c => c.id === id);
    const custOrders = orders.filter(o => o.customerId === id);
    if (custOrders.length > 0 || (cust && Math.abs(cust.balance) > 0.1)) {
      alert('حذف مشتری با سوابق یا تراز مالی ممکن نیست.');
      return;
    }
    if (!confirm('آیا از حذف این مشتری مطمئن هستید؟ کدهای سایر مشتریان تغییری نخواهد کرد.')) return;
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    await StorageService.saveSimpleCustomers(updated);
  };

  const deleteOrder = async (orderId: string, custId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const debt = getOrderDebt(orderId);
    if (Math.abs(debt) > 0.1) {
      alert('تنها سفارشات تسویه شده قابل حذف هستند.');
      return;
    }
    if (!confirm('حذف سفارش از تاریخچه؟')) return;
    const updatedOrders = orders.filter(o => o.id !== orderId);
    const updatedTxs = transactions.filter(t => t.orderId !== orderId);
    setOrders(updatedOrders);
    setTransactions(updatedTxs);
    await StorageService.saveSimpleOrders(updatedOrders);
    await StorageService.saveSimpleTransactions(updatedTxs);
  };

  const createQuickOrder = async (custId: string, title: string) => {
    const { cloth, sewing, received } = quickOrderPrices;
    const total = cloth + sewing;
    if (received > total) {
      alert('مبلغ دریافتی نامعتبر است.');
      return;
    }
    const remaining = total - received;

    const newOrder: Order = {
      id: Date.now().toString(),
      customerId: custId,
      description: title || 'بدون عنوان',
      status: OrderStatus.PENDING,
      dateCreated: new Date().toLocaleDateString('fa-IR'),
      totalPrice: total,
      clothPrice: cloth,
      sewingFee: sewing,
      deposit: received,
      styleDetails: { ...styleDetails }
    };

    const newTx: Transaction = {
      id: Date.now().toString() + '-tx',
      customerId: custId,
      orderId: newOrder.id,
      amount: remaining,
      date: new Date().toLocaleDateString('fa-IR'),
      description: `الباقی سفارش ${newOrder.description}`
    };

    const updatedOrders = [...orders, newOrder];
    const updatedTxs = [...transactions, newTx];
    const updatedCustomers = customers.map(c => 
      c.id === custId ? { ...c, balance: c.balance + remaining } : c
    );

    setOrders(updatedOrders);
    setTransactions(updatedTxs);
    setCustomers(updatedCustomers);

    await StorageService.saveSimpleOrders(updatedOrders);
    await StorageService.saveSimpleTransactions(updatedTxs);
    await StorageService.saveSimpleCustomers(updatedCustomers);
    
    setShowOrderModal(null);
    setShowStylePanel(false);
    setQuickOrderPrices({ cloth: 0, sewing: 0, received: 0 });
    setStyleDetails({});
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updatedOrders);
    await StorageService.saveSimpleOrders(updatedOrders);

    if (newStatus === OrderStatus.READY) {
      sendPickupSMS(orderId);
    }
    setShowStatusModal(null);
  };

  const sendPickupSMS = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    const customer = customers.find(c => c.id === order?.customerId);
    if (order && customer) {
      const message = `مشتری گرامی ${customer.name}، سفارش شما (${order.description}) آماده تحویل است. منتظر حضور شما در ${shopInfo.name || 'خیاطی'} هستیم.`;
      const smsUrl = `sms:${customer.phone}${navigator.userAgent.match(/iPhone/i) ? '&' : '?'}body=${encodeURIComponent(message)}`;
      window.location.href = smsUrl;
    }
  };

  const sendDebtSMS = (custId: string, amount: number) => {
    const customer = customers.find(c => c.id === custId);
    if (customer) {
      const message = `مشتری گرامی ${customer.name}، با احترام یادآوری می‌شود مبلغ ${amount.toLocaleString()} افغانی بابت مانده حساب شما در ${shopInfo.name || 'خیاطی'} معوق مانده است. لطفاً جهت تسویه اقدام فرمایید.`;
      const smsUrl = `sms:${customer.phone}${navigator.userAgent.match(/iPhone/i) ? '&' : '?'}body=${encodeURIComponent(message)}`;
      window.location.href = smsUrl;
    }
  };

  const addOrderPayment = async (orderId: string, custId: string, amount: number) => {
    if (amount <= 0) return;
    const newTx: Transaction = {
      id: Date.now().toString() + '-pmt',
      customerId: custId,
      orderId: orderId,
      amount: -amount,
      date: new Date().toLocaleDateString('fa-IR'),
      description: `دریافتی بابت سفارش`
    };
    const updatedTxs = [...transactions, newTx];
    const updatedCustomers = customers.map(c => 
      c.id === custId ? { ...c, balance: c.balance - amount } : c
    );
    setTransactions(updatedTxs);
    setCustomers(updatedCustomers);
    await StorageService.saveSimpleTransactions(updatedTxs);
    await StorageService.saveSimpleCustomers(updatedCustomers);
    setShowPaymentModal(null);
  };

  const getOrderDebt = (orderId: string) => {
    const orderTxs = transactions.filter(t => t.orderId === orderId);
    return orderTxs.reduce((acc, t) => acc + t.amount, 0);
  };

  const handleSaveShopInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    await StorageService.saveShopInfo(shopInfo);
    setShowSettingsModal(false);
  };

  const handleCreateNewField = () => {
    if (!newFieldName.trim()) return;
    const newKey = `custom_${Date.now()}`;
    const newLabels = { ...measurementLabels, [newKey]: newFieldName.trim() };
    setMeasurementLabels(newLabels);
    StorageService.saveSimpleLabels(newLabels);
    setNewFieldName('');
    setActiveFieldsSubTab('RENAME');
  };

  const handleDeleteField = (key: string) => {
    if (PROTECTED_KEYS.includes(key)) return;
    const newLabels = { ...measurementLabels };
    delete newLabels[key];
    setMeasurementLabels(newLabels);
    StorageService.saveSimpleLabels(newLabels);
  };

  const handleRenameField = (key: string, newLabel: string) => {
    const newLabels = { ...measurementLabels, [key]: newLabel };
    setMeasurementLabels(newLabels);
    StorageService.saveSimpleLabels(newLabels);
  };

  const handlePrint = (order: Order, customer: Customer) => {
    setPrintingOrder({ order, customer });
    setTimeout(() => {
      window.print();
      setPrintingOrder(null);
    }, 250);
  };

  const isQuickOrderInvalid = quickOrderPrices.received > (quickOrderPrices.cloth + quickOrderPrices.sewing);
  const totalReminderCount = reminders.pickup.length + reminders.debt.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Vazirmatn'] select-none">
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, .no-print, button, input, .fixed, .absolute:not(.print-section), [role="dialog"], aside {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          #root, main {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-section {
            display: block !important;
            visibility: visible !important;
            width: 80mm !important;
            min-width: 80mm !important;
            margin: 0 auto !important;
            padding: 8mm !important;
            background: white !important;
            box-sizing: border-box !important;
            direction: rtl !important;
            font-family: 'Vazirmatn', sans-serif !important;
            color: black !important;
            position: relative !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>

      {/* Hidden Print Content */}
      {printingOrder && (
        <div className="print-section hidden print:block" dir="rtl">
          <div className="text-center border-b-2 border-slate-950 pb-4 mb-4">
            <h1 className="text-[18pt] font-black mb-1">{shopInfo.name || 'خیاطیار'}</h1>
            {shopInfo.tailorName && <p className="text-[10pt] font-bold">استاد: {shopInfo.tailorName}</p>}
            {shopInfo.phone && <p className="text-[10pt] font-bold" dir="ltr">{shopInfo.phone}</p>}
            {shopInfo.address && <p className="text-[8pt] text-slate-700 mt-1">{shopInfo.address}</p>}
          </div>

          <div className="mb-5 space-y-2">
            <div className="flex justify-between text-[11pt]">
              <span className="font-bold">مشتری:</span>
              <span className="font-black">{printingOrder.customer.name}</span>
            </div>
            <div className="flex justify-between text-[10pt] text-slate-800">
              <span>تاریخ سفارش:</span>
              <span className="font-bold">{printingOrder.order.dateCreated}</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-[11pt] font-black border-b border-slate-200 pb-2 mb-3">شرح: {printingOrder.order.description}</div>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(printingOrder.order.styleDetails || {}).map(([key, value]) => value && (
                <div key={key} className="flex justify-between text-[9pt] border-b border-dotted border-slate-100 pb-1">
                  <span className="text-slate-600">{measurementLabels[key] || key}:</span>
                  <span className="font-black">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-slate-950 pt-4 space-y-2">
            <div className="flex justify-between text-[10pt]">
              <span>قیمت پارچه:</span>
              <span>{(printingOrder.order.clothPrice || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10pt]">
              <span>اجرت دوخت:</span>
              <span>{(printingOrder.order.sewingFee || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[13pt] font-black pt-2 border-t border-slate-300">
              <span>جمع کل:</span>
              <span>{(printingOrder.order.totalPrice || 0).toLocaleString()} <span className="text-[9pt]">افغانی</span></span>
            </div>
            
            {(() => {
              const debt = getOrderDebt(printingOrder.order.id);
              return debt > 0.1 ? (
                <div className="flex justify-between text-[12pt] font-black text-rose-700 pt-1">
                  <span>باقیمانده (بدهی):</span>
                  <span>{debt.toLocaleString()}</span>
                </div>
              ) : (
                <div className="text-center font-black text-emerald-700 py-2 bg-slate-50 rounded-xl mt-3 text-[11pt] border border-emerald-100">تصفیه کامل</div>
              );
            })()}
          </div>

          <div className="text-center text-[8pt] font-bold text-slate-400 mt-10 border-t border-slate-100 pt-4">
            از اعتماد شما سپاسگزاریم
          </div>
        </div>
      )}

      <header className="bg-white px-6 py-5 flex justify-between items-center shadow-sm sticky top-0 z-50 no-print">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
            <ScissorsIcon size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 leading-none">{shopInfo.name || 'خیاطیار'}</h1>
            {shopInfo.phone && <div className="text-[9px] text-slate-400 font-bold mt-1.5" dir="ltr">{shopInfo.phone}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowRemindersModal(true)}
            className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all active:scale-90 relative"
            title="مرکز یادآوری‌ها"
          >
            <Bell size={20} />
            {totalReminderCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                {totalReminderCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setShowReportsModal(true)}
            className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all active:scale-90"
            title="گزارشات و آمار"
          >
            <BarChart3 size={20} />
          </button>
          <button 
            onClick={onOpenBackup}
            className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all active:scale-90"
            title="مدیریت داده‌ها و پشتیبانی"
          >
            <Database size={20} />
          </button>
          <button 
            onClick={() => {
              setActiveSettingsTab('SHOP');
              setShowSettingsModal(true);
            }}
            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all active:scale-90"
            title="تنظیمات خیاطی"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 pb-32 max-w-2xl mx-auto w-full no-print">
        <div className="relative group">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="جستجوی نام، تلفن یا کد اشتراک..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-14 pl-6 py-5 bg-white border-2 border-transparent rounded-[2rem] shadow-xl shadow-slate-200/50 focus:border-indigo-400 outline-none text-base font-bold transition-all"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest px-2">
            {searchTerm ? 'نتایج جستجو' : 'آخرین مراجعات'}
          </h3>

          {filteredCustomers.length > 0 ? filteredCustomers.map(customer => {
            const isExpanded = expandedId === customer.id;
            const isHistoryOpen = historyViewId === customer.id;
            const customerOrders = orders.filter(o => o.customerId === customer.id);
            const canDeleteCust = customerOrders.length === 0 && Math.abs(customer.balance) < 0.1;

            return (
              <div key={customer.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden transition-all">
                <div className="p-6 flex justify-between items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-black text-slate-800 break-words leading-tight truncate">
                      {customer.name}
                    </div>
                    <div className="text-sm text-slate-500 font-bold mt-1" dir="ltr">
                      {customer.phone}
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-xl">
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">کد اشتراک:</span>
                       <span className="text-xs font-black text-indigo-600">{customer.code}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      onClick={() => {
                        setQuickOrderPrices({ cloth: 0, sewing: 0, received: 0 });
                        setStyleDetails({});
                        setShowStylePanel(false);
                        setShowOrderModal(customer.id);
                      }}
                      className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all active:scale-90"
                      title="ثبت سفارش جدید"
                    >
                      <Plus size={22} />
                    </button>
                    <button 
                      onClick={() => setHistoryViewId(isHistoryOpen ? null : customer.id)}
                      className={`p-3 rounded-2xl transition-all active:scale-90 ${isHistoryOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400'}`}
                      title="سوابق و حسابداری"
                    >
                      <History size={22} />
                    </button>
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all active:scale-90"
                    >
                      {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 space-y-5 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-slate-50 rounded-3xl p-4 grid grid-cols-4 gap-2">
                      {Object.entries(measurementLabels).map(([key, label]) => (
                        <div key={key} className="text-center">
                          <div className="text-[9px] font-black text-slate-700 mb-1 truncate px-1">{label}</div>
                          <div className="text-sm font-black text-slate-900">{customer.measurements[key] || '-'}</div>
                        </div>
                      ))}
                    </div>

                    <div className={`p-5 rounded-3xl flex justify-between items-center border ${customer.balance > 0 ? 'bg-rose-50 border-rose-100' : customer.balance < 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'}`}>
                      <div>
                        <div className="text-[10px] font-black uppercase text-slate-700 mb-1">تراز مالی کل</div>
                        <div className={`text-lg font-black ${customer.balance > 0 ? 'text-rose-600' : customer.balance < 0 ? 'text-indigo-600' : 'text-emerald-600'}`}>
                          {Math.abs(customer.balance).toLocaleString()} افغانی
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black ${customer.balance > 0 ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : customer.balance < 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'}`}>
                        {customer.balance > 0 ? 'قرضدار' : customer.balance < 0 ? 'بستانکار' : 'تسویه'}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowCustomerModal(customer)}
                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-slate-200"
                      >
                        <Edit3 size={18} />
                        ویرایش اندازه‌ها
                      </button>
                      <button 
                        disabled={!canDeleteCust}
                        onClick={() => deleteCustomer(customer.id)}
                        className={`w-14 py-4 rounded-2xl flex items-center justify-center transition-all ${canDeleteCust ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-90' : 'bg-slate-50 text-slate-200 cursor-not-allowed'}`}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                )}

                {isHistoryOpen && (
                  <div className="px-6 pb-8 space-y-4 bg-slate-50/50 border-t border-slate-50 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between pt-6 px-1">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        <History size={14} /> تاریخچه (۵ مورد اخیر)
                      </div>
                    </div>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                      {customerOrders.length > 0 ? customerOrders.slice().reverse().map(order => {
                        const debt = getOrderDebt(order.id);
                        const isSettled = Math.abs(debt) < 0.1;
                        const isCreditor = debt < -0.1;
                        const isStyleExpanded = expandedOrderDetailId === order.id;

                        return (
                          <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 transition-all hover:shadow-md">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 overflow-hidden">
                                <div className="text-sm font-black text-slate-800 break-words line-clamp-2">
                                  {order.description}
                                </div>
                                <div className="text-[11px] text-slate-500 font-bold mt-1.5" dir="ltr">{order.dateCreated}</div>
                              </div>
                              <div className="text-left flex items-center gap-3">
                                <div className="text-left">
                                  <div className="text-[10px] font-black text-slate-700 mb-0.5">قیمت کل</div>
                                  <div className="text-sm font-black text-slate-800">{order.totalPrice?.toLocaleString()}</div>
                                </div>
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => setShowStatusModal(order)}
                                    className={`p-2 rounded-xl transition-all active:scale-90 shadow-sm border ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-400'}`}
                                    title="تغییر وضعیت"
                                  >
                                    <Bell size={16} className={STATUS_COLORS[order.status]?.split(' ')[1]} />
                                  </button>
                                  <button 
                                    onClick={() => handlePrint(order, customer)}
                                    className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all active:scale-90 shadow-sm border border-slate-200"
                                    title="چاپ فاکتور"
                                  >
                                    <Printer size={16} />
                                  </button>
                                  <button 
                                    disabled={!isSettled}
                                    onClick={() => deleteOrder(order.id, customer.id)}
                                    className={`p-2 rounded-xl transition-all ${isSettled ? 'text-rose-400 hover:bg-rose-50' : 'text-slate-100 cursor-not-allowed'}`}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center py-3 border-y border-slate-50">
                              <div className="flex items-center gap-2">
                                {isSettled ? (
                                  <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-black">
                                    <CheckCircle2 size={16} />
                                    تصفیه کامل
                                  </div>
                                ) : (
                                  <div className={`flex items-center gap-1.5 text-[11px] font-black ${isCreditor ? 'text-indigo-600' : 'text-rose-600'}`}>
                                    <AlertCircle size={16} />
                                    {isCreditor ? `طلب مشتری: ${Math.abs(debt).toLocaleString()}` : `بدهکار: ${debt.toLocaleString()}`}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setExpandedOrderDetailId(isStyleExpanded ? null : order.id)}
                                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black active:scale-95 transition-all flex items-center gap-2"
                                >
                                  <Layers size={14} />
                                  جزئیات مدل
                                </button>
                                {!isSettled && (
                                  <button 
                                    onClick={() => setShowPaymentModal({ orderId: order.id, custId: customer.id })}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black shadow-lg shadow-emerald-200 active:scale-95 transition-all"
                                  >
                                    ثبت پول
                                  </button>
                                )}
                              </div>
                            </div>

                            {isStyleExpanded && (
                              <div className="bg-slate-50 rounded-2xl p-4 animate-in slide-in-from-top-2">
                                 <div className="grid grid-cols-2 gap-3 mb-4 border-b border-slate-200 pb-3">
                                   <div><span className="text-[10px] text-slate-400 block">قیمت پارچه:</span><span className="text-xs font-bold text-slate-800">{order.clothPrice?.toLocaleString() || 0}</span></div>
                                   <div><span className="text-[10px] text-slate-400 block">اجرت دوخت:</span><span className="text-xs font-bold text-slate-800">{order.sewingFee?.toLocaleString() || 0}</span></div>
                                 </div>
                                 <div className="space-y-2">
                                   <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">مدل و طرح سفارش:</div>
                                   <div className="grid grid-cols-2 gap-2">
                                      {Object.entries(order.styleDetails || {}).map(([key, value]) => value && (
                                        <div key={key} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                                           <span className="text-[9px] font-black text-slate-500">{measurementLabels[key] || key}</span>
                                           <span className="text-[10px] font-black text-slate-800">{value}</span>
                                        </div>
                                      ))}
                                      {(!order.styleDetails || Object.values(order.styleDetails).every(v => !v)) && (
                                        <div className="col-span-2 text-center text-[9px] text-slate-400 py-2">جزئیات مدل ثبت نشده است.</div>
                                      )}
                                   </div>
                                 </div>
                              </div>
                            )}
                          </div>
                        );
                      }) : (
                        <div className="py-10 text-center opacity-40">
                          <ShoppingBag size={32} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-[10px] font-bold text-slate-500">هنوز سفارشی ثبت نشده است.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="py-20 text-center space-y-4 opacity-40">
              <Search size={48} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-500">مشتری یافت نشد.</p>
            </div>
          )}
        </div>
      </main>

      <button 
        onClick={() => setShowCustomerModal(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-[1.8rem] shadow-2xl shadow-indigo-600/40 flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white no-print"
      >
        <UserPlus size={28} />
      </button>

      {/* Reminders Modal */}
      {showRemindersModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-end sm:items-center justify-center no-print">
          <div className="absolute inset-0" onClick={() => setShowRemindersModal(false)} />
          <div className="relative bg-white w-full max-w-4xl rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-8 animate-in slide-in-from-bottom-10 max-h-[92vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <Bell className="text-amber-500" />
                مرکز یادآوری و پیگیری هوشمند
              </h2>
              <button onClick={() => setShowRemindersModal(false)} className="p-2 bg-slate-100 rounded-full active:scale-90 transition-all"><X size={20}/></button>
            </div>

            <div className="bg-slate-50 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-100">
              <div className="flex items-center gap-3">
                 <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600"><CalendarDays size={20} /></div>
                 <div>
                    <div className="text-xs font-black text-slate-700">حساسیت پیگیری سیستم</div>
                    <div className="text-[10px] text-slate-400">نمایش موارد قدیمی‌تر از {reminderThreshold} روز</div>
                 </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200">
                 <button onClick={() => {
                   const newVal = Math.max(1, reminderThreshold - 1);
                   setReminderThreshold(newVal);
                   localStorage.setItem('reminder_threshold', newVal.toString());
                 }} className="p-1 hover:bg-slate-50 rounded-lg text-indigo-600"><ChevronDown size={20}/></button>
                 <span className="font-black text-lg w-8 text-center">{reminderThreshold}</span>
                 <button onClick={() => {
                   const newVal = reminderThreshold + 1;
                   setReminderThreshold(newVal);
                   localStorage.setItem('reminder_threshold', newVal.toString());
                 }} className="p-1 hover:bg-slate-50 rounded-lg text-indigo-600"><ChevronUp size={20}/></button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Debt Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Wallet size={18} className="text-rose-500" /> مطالبات مالی ({reminders.debt.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {reminders.debt.length > 0 ? reminders.debt.map((item, idx) => (
                    <div key={idx} className="bg-white border border-rose-100 p-5 rounded-[2rem] shadow-sm flex items-center justify-between gap-3 group hover:border-rose-300 transition-all">
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">کد: {item.customer.code}</span>
                            <div className="text-sm font-bold text-slate-800 truncate">{item.customer.name}</div>
                         </div>
                         <div className="text-[10px] text-rose-500 font-black mt-1">بدهی: {item.balance.toLocaleString()} افغانی</div>
                         <div className="text-[9px] text-slate-400 mt-1">آخرین سفارش: {item.lastOrderDate}</div>
                      </div>
                      <div className="flex gap-2">
                         <a href={`tel:${item.customer.phone}`} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all"><Phone size={16}/></a>
                         <button onClick={() => sendDebtSMS(item.customer.id, item.balance)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"><MessageSquare size={16}/></button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 opacity-30 bg-slate-50 rounded-[2rem]">
                      <CheckCircle2 size={32} className="mx-auto mb-2" />
                      <div className="text-xs font-bold">بدهی معوقه‌ای یافت نشد.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pickup Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-amber-500" /> امانات تحویل نشده ({reminders.pickup.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {reminders.pickup.length > 0 ? reminders.pickup.map((item, idx) => (
                    <div key={idx} className="bg-white border border-amber-100 p-5 rounded-[2rem] shadow-sm flex items-center justify-between gap-3 group hover:border-amber-300 transition-all">
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">کد: {item.customer?.code}</span>
                            <div className="text-sm font-bold text-slate-800 truncate">{item.customer?.name || 'مشتری نامشخص'}</div>
                         </div>
                         <div className="text-[10px] text-amber-600 font-black mt-1">سفارش: {item.order.description}</div>
                         <div className="text-[9px] text-rose-500 font-black mt-1 bg-rose-50 px-2 py-0.5 rounded-full inline-block">{item.daysPassed} روز در مغازه مانده</div>
                      </div>
                      <div className="flex gap-2">
                         <a href={`tel:${item.customer?.phone}`} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all"><Phone size={16}/></a>
                         <button onClick={() => sendPickupSMS(item.order.id)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"><MessageSquare size={16}/></button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 opacity-30 bg-slate-50 rounded-[2rem]">
                      <Gift size={32} className="mx-auto mb-2" />
                      <div className="text-xs font-bold">قفسه لباس‌های آماده خالی است.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-center text-[10px] font-bold text-slate-400">سیستم یادآور به صورت خودکار موارد مشکوک به تاخیر را شناسایی و لیست می‌کند.</p>
          </div>
        </div>
      )}

      {/* Reports Dashboard Modal */}
      {showReportsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-end sm:items-center justify-center no-print">
          <div className="absolute inset-0" onClick={() => setShowReportsModal(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-8 animate-in slide-in-from-bottom-10 max-h-[92vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <BarChart3 className="text-indigo-600" />
                داشبورد گزارشات و عملکرد
              </h2>
              <button onClick={() => setShowReportsModal(false)} className="p-2 bg-slate-100 rounded-full active:scale-90 transition-all"><X size={20}/></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
                <Users className="text-indigo-600 mb-3" size={24} />
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">تعداد کل مشتریان</div>
                <div className="text-3xl font-black text-indigo-900 mt-1">{stats.totalCustomers} <span className="text-sm font-bold opacity-50">نفر</span></div>
              </div>
              <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                <Wallet className="text-emerald-600 mb-3" size={24} />
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">درآمد خالص امروز</div>
                <div className="text-3xl font-black text-emerald-900 mt-1">{stats.todayIncome.toLocaleString()} <span className="text-sm font-bold opacity-50">اف</span></div>
              </div>
              <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
                <AlertCircle className="text-rose-600 mb-3" size={24} />
                <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">مجموع طلب (باقیمانده)</div>
                <div className="text-3xl font-black text-rose-900 mt-1">{stats.totalDebt.toLocaleString()} <span className="text-sm font-bold opacity-50">اف</span></div>
              </div>
              <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                <ArrowUpRight className="text-amber-600 mb-3" size={24} />
                <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">ارزش کارهای در جریان</div>
                <div className="text-3xl font-black text-amber-900 mt-1">{stats.projectedRevenue.toLocaleString()} <span className="text-sm font-bold opacity-50">اف</span></div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <PieChart size={18} className="text-indigo-500" /> توزیع وضعیت سفارشات
                  </h3>
                  <div className="text-[10px] font-black text-slate-400">کل فاکتورها: {stats.totalOrders}</div>
               </div>

               <div className="space-y-4">
                  {[
                    { label: 'در انتظار دوخت', status: OrderStatus.PENDING, color: 'bg-slate-400' },
                    { label: 'در حال دوخت', status: OrderStatus.PROCESSING, color: 'bg-blue-500' },
                    { label: 'دوخته شده', status: OrderStatus.SEWN, color: 'bg-indigo-500' },
                    { label: 'آماده تحویل', status: OrderStatus.READY, color: 'bg-amber-500' },
                    { label: 'تحویل داده شده', status: OrderStatus.COMPLETED, color: 'bg-emerald-500' },
                  ].map(item => {
                    const count = stats.statusCounts[item.status as OrderStatus] || 0;
                    const percent = stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0;
                    return (
                      <div key={item.status} className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-black">
                           <span className="text-slate-600">{item.label}</span>
                           <span className="text-slate-900">{count} مورد ({Math.round(percent)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black text-indigo-300 uppercase">نرخ بهره‌وری کل</div>
                <div className="text-xl font-black">
                  {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}% موفقیت در تحویل
                </div>
              </div>
              <TrendingUp className="text-emerald-400" size={32} />
            </div>

            <p className="text-center text-[10px] font-bold text-slate-400">این گزارش بر اساس اطلاعات ثبت شده در سیستم تولید شده است.</p>
          </div>
        </div>
      )}

      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center no-print">
          <div className="absolute inset-0" onClick={() => setShowCustomerModal(false)} />
          <div className="relative bg-white w-full max-lg rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <UserPlus className="text-indigo-600" />
                {typeof showCustomerModal === 'object' ? `ویرایش مشتری کد ${(showCustomerModal as Customer).code}` : 'تشکیل پرونده جدید'}
              </h2>
              <button onClick={() => setShowCustomerModal(false)} className="p-2 bg-slate-100 text-slate-400 rounded-full active:scale-90 transition-all"><X size={20}/></button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const m: any = {};
              Object.keys(measurementLabels).forEach(k => m[k] = parseFloat(formData.get(k) as string) || 0);
              saveCustomer({
                name: formData.get('name') as string,
                phone: formData.get('phone') as string,
                measurements: m
              });
            }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-black text-slate-800 mr-2 uppercase">نام مشتری</label>
                  <input name="name" required defaultValue={typeof showCustomerModal === 'object' ? (showCustomerModal as Customer).name : ''} className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 ring-indigo-400 outline-none font-bold" placeholder="مثلاً: علی"/>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-black text-slate-800 mr-2 uppercase">تلفن</label>
                  <input name="phone" required defaultValue={typeof showCustomerModal === 'object' ? (showCustomerModal as Customer).phone : ''} className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 ring-indigo-400 outline-none font-bold text-left" dir="ltr" placeholder="07..."/>
                </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[12px] font-black text-slate-700 mr-2 uppercase">اندازه‌های مشتری (سانتی‌متر)</label>
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                   {Object.entries(measurementLabels).map(([key, label]) => (
                     <div key={key} className="space-y-1">
                        <label className="text-[11px] font-black text-slate-700 text-center block truncate px-1">{label}</label>
                        <input name={key} type="number" step="0.1" defaultValue={typeof showCustomerModal === 'object' ? (showCustomerModal as Customer).measurements[key] : ''} className="w-full px-2 py-3 bg-slate-50 rounded-xl focus:ring-2 ring-indigo-400 outline-none font-bold text-center text-sm"/>
                     </div>
                   ))}
                 </div>
              </div>

              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
                <Save size={22} />
                ثبت نهایی مشتری
              </button>
            </form>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center no-print">
          <div className="absolute inset-0" onClick={() => setShowOrderModal(null)} />
          <div className="relative bg-white w-full max-md rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 animate-in slide-in-from-bottom-10 border-t-8 border-indigo-600 overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <ShoppingBag className="text-indigo-600" />
                {showStylePanel ? 'جزئیات مدل لباس' : 'ثبت سفارش سریع'}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowStylePanel(!showStylePanel)}
                  className={`p-2 rounded-full transition-all active:scale-90 ${showStylePanel ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-indigo-600 hover:bg-slate-200'}`}
                  title="تنظیمات مدل و طرح"
                >
                  <Layers size={20} />
                </button>
                <button onClick={() => setShowOrderModal(null)} className="p-2 bg-slate-100 text-slate-400 rounded-full active:scale-90 transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {showStylePanel ? (
              <div className="space-y-5 animate-in slide-in-from-left-4 duration-300">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                  مدل هر بخش را بنویسید (مثلاً: گرد، مچی، پاچه تنگ)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(measurementLabels).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                       <label className="text-[11px] font-black text-slate-700 mr-2 truncate block">{label}</label>
                       <input 
                        type="text" 
                        value={styleDetails[key] || ''}
                        onChange={(e) => setStyleDetails(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:ring-2 ring-indigo-400"
                        placeholder="مدل..."
                       />
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setShowStylePanel(false)}
                  className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-xl active:scale-95 transition-all"
                >
                  بازگشت به قیمت‌ها
                </button>
              </div>
            ) : (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 mr-2 uppercase tracking-widest">عنوان سفارش (مدل لباس)</label>
                  <div className="relative">
                    <FileText className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input id="orderTitle" type="text" className="w-full pr-12 pl-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold focus:ring-2 ring-indigo-400 border border-slate-100" placeholder="مثلاً: پیراهن تنبان"/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-700 mr-2 uppercase tracking-widest">قیمت پارچه</label>
                    <input id="clothPrice" type="number" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-black text-center text-lg border border-slate-100" defaultValue="" placeholder="0" onChange={(e) => {
                      const cloth = parseFloat(e.target.value) || 0;
                      setQuickOrderPrices(prev => ({ ...prev, cloth }));
                    }}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-700 mr-2 uppercase tracking-widest">اجرت دوخت</label>
                    <input id="sewingFee" type="number" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-black text-center text-lg border border-slate-100" defaultValue="" placeholder="0" onChange={(e) => {
                      const sewing = parseFloat(e.target.value) || 0;
                      setQuickOrderPrices(prev => ({ ...prev, sewing }));
                    }}/>
                  </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-3xl text-center shadow-xl">
                   <div className="text-[10px] font-black text-slate-400 uppercase mb-1">جمع کل سفارش (افغانی)</div>
                   <div className="text-3xl font-black text-white">
                     {(quickOrderPrices.cloth + quickOrderPrices.sewing).toLocaleString()}
                   </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 mr-2 uppercase tracking-widest text-center block">نقد دریافتی علی‌الحساب</label>
                  <div className="relative">
                     <DollarSign className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isQuickOrderInvalid ? 'text-rose-500' : 'text-emerald-500'}`} size={18} />
                     <input 
                      id="receivedAmt" 
                      type="number" 
                      className={`w-full pr-12 pl-5 py-5 rounded-2xl outline-none font-black text-center text-2xl border-2 transition-all ${isQuickOrderInvalid ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`} 
                      placeholder="0"
                      onChange={(e) => {
                        const received = parseFloat(e.target.value) || 0;
                        setQuickOrderPrices(prev => ({ ...prev, received }));
                      }}
                     />
                  </div>
                </div>

                <button 
                  disabled={isQuickOrderInvalid}
                  onClick={() => {
                    const title = (document.getElementById('orderTitle') as HTMLInputElement).value;
                    createQuickOrder(showOrderModal, title);
                  }}
                  className={`w-full py-5 rounded-[1.5rem] font-black shadow-xl flex items-center justify-center gap-3 transition-all ${isQuickOrderInvalid ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white shadow-indigo-200 active:scale-95'}`}
                >
                  تایید و ثبت نهایی سفارش
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center no-print">
          <div className="absolute inset-0" onClick={() => setShowPaymentModal(null)} />
          <div className="relative bg-white w-full max-sm rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <DollarSign className="text-emerald-500" />
                ثبت پول دریافتی
              </h2>
              <button onClick={() => setShowPaymentModal(null)} className="p-2 bg-slate-100 rounded-full active:scale-90 transition-all"><X size={20}/></button>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 mr-2 uppercase tracking-widest text-center block">مبلغ پرداختی مشتری (افغانی)</label>
                <input id="newPmtAmt" type="number" autoFocus className="w-full px-5 py-6 bg-slate-50 rounded-2xl outline-none font-black text-center text-3xl focus:ring-2 ring-emerald-400 border border-slate-100" placeholder="0"/>
              </div>
              <button 
                onClick={() => {
                  const amt = parseFloat((document.getElementById('newPmtAmt') as HTMLInputElement).value) || 0;
                  addOrderPayment(showPaymentModal.orderId, showPaymentModal.custId, amt);
                }}
                className="w-full py-5 bg-emerald-500 text-white rounded-[1.5rem] font-black shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                ثبت و بروزرسانی حساب
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center no-print">
          <div className="absolute inset-0" onClick={() => setShowStatusModal(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 animate-in slide-in-from-bottom-10 border-t-8 border-indigo-600">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-3">
                <Bell className="text-indigo-600" />
                مدیریت وضعیت سفارش
              </h2>
              <button onClick={() => setShowStatusModal(null)} className="p-2 bg-slate-100 rounded-full active:scale-90 transition-all"><X size={18}/></button>
            </div>
            <div className="space-y-3">
              {[
                { s: OrderStatus.PENDING, label: 'در انتظار دوخت', icon: <Clock size={18} />, color: 'text-slate-500 bg-slate-50' },
                { s: OrderStatus.PROCESSING, label: 'در حال دوخت', icon: <ScissorsIcon size={18} />, color: 'text-blue-600 bg-blue-50' },
                { s: OrderStatus.SEWN, label: 'دوخته شده', icon: <CheckCircle size={18} />, color: 'text-indigo-600 bg-indigo-50' },
                { s: OrderStatus.READY, label: 'آماده تحویل (پیامک)', icon: <Gift size={18} />, color: 'text-amber-600 bg-amber-50' },
                { s: OrderStatus.COMPLETED, label: 'تحویل داده شد', icon: <Handshake size={18} />, color: 'text-emerald-600 bg-emerald-50' },
              ].map(item => (
                <button 
                  key={item.s}
                  onClick={() => updateOrderStatus(showStatusModal.id, item.s)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border border-transparent hover:border-indigo-100 active:scale-95 ${showStatusModal.status === item.s ? 'ring-2 ring-indigo-500' : ''} ${item.color}`}
                >
                  <div className="p-2 rounded-xl bg-white/50">{item.icon}</div>
                  <span className="font-black text-sm">{item.label}</span>
                  {showStatusModal.status === item.s && <Check className="mr-auto" size={18} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center no-print">
          <div className="absolute inset-0" onClick={() => setShowSettingsModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-8 flex flex-col gap-6 animate-in slide-in-from-bottom-10 h-[92vh] sm:h-[85vh]">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <Settings className="text-indigo-600" />
                تنظیمات شخصی‌سازی
              </h2>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 bg-slate-100 rounded-full active:scale-90 transition-all"><X size={20}/></button>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] gap-1 shadow-inner">
               <button 
                onClick={() => setActiveSettingsTab('SHOP')}
                className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeSettingsTab === 'SHOP' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
               >
                 <Store size={16} /> اطلاعات فروشگاه
               </button>
               <button 
                onClick={() => setActiveSettingsTab('FIELDS')}
                className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeSettingsTab === 'FIELDS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
               >
                 <Ruler size={16} /> مدیریت اندازه‌ها
               </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              {activeSettingsTab === 'SHOP' ? (
                <form onSubmit={handleSaveShopInfo} className="space-y-5 pb-6">
                   <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 mr-2 uppercase">نام خیاطی / برند</label>
                      <input 
                        value={shopInfo.name} 
                        onChange={e => setShopInfo({...shopInfo, name: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:ring-2 ring-indigo-400" 
                        placeholder="مثلاً: خیاطی الماس"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 mr-2 uppercase">نام استاد خیاط</label>
                      <input 
                        value={shopInfo.tailorName} 
                        onChange={e => setShopInfo({...shopInfo, tailorName: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:ring-2 ring-indigo-400" 
                        placeholder="نام شما"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 mr-2 uppercase">شماره تماس (جهت فاکتور)</label>
                      <input 
                        value={shopInfo.phone} 
                        onChange={e => setShopInfo({...shopInfo, phone: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:ring-2 ring-indigo-400 text-left" 
                        dir="ltr"
                        placeholder="07... / 09..."
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 mr-2 uppercase">آدرس</label>
                      <textarea 
                        value={shopInfo.address} 
                        onChange={e => setShopInfo({...shopInfo, address: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:ring-2 ring-indigo-400 h-24" 
                        placeholder="آدرس دقیق مغازه"
                      />
                   </div>
                   <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 transition-all">
                     <Save size={22} /> ذخیره اطلاعات فروشگاه
                   </button>
                </form>
              ) : (
                <div className="space-y-6 pb-6">
                  {/* Sub Tabs for Field Management */}
                  <div className="flex bg-slate-50 p-1 rounded-2xl gap-1 border border-slate-100">
                    <button 
                      onClick={() => setActiveFieldsSubTab('RENAME')}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${activeFieldsSubTab === 'RENAME' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                      <Type size={14} /> تغییر نام فیلدها
                    </button>
                    <button 
                      onClick={() => setActiveFieldsSubTab('CREATE')}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${activeFieldsSubTab === 'CREATE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                      <PlusCircle size={14} /> ایجاد فیلد جدید
                    </button>
                  </div>

                  {activeFieldsSubTab === 'RENAME' ? (
                    <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                      {Object.entries(measurementLabels).map(([key, label]) => {
                        const isProtected = PROTECTED_KEYS.includes(key);
                        return (
                          <div key={key} className="p-3.5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group shadow-sm">
                            <div className="flex-1 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-focus-within:bg-indigo-50 group-focus-within:text-indigo-600 transition-all">
                                 <Check size={16} />
                              </div>
                              <input 
                                value={label}
                                onChange={(e) => handleRenameField(key, e.target.value)}
                                className="bg-transparent border-none outline-none font-bold text-sm text-slate-700 w-full"
                                placeholder="نام فیلد..."
                              />
                            </div>
                            <div className="flex items-center gap-2">
                               <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg ${isProtected ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                 {isProtected ? 'ثابت' : 'سفارشی'}
                               </span>
                               {!isProtected && (
                                 <button 
                                  onClick={() => handleDeleteField(key)}
                                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                                  title="حذف فوری"
                                 >
                                   <Trash2 size={18} />
                                 </button>
                               )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-5 animate-in slide-in-from-right-2 duration-300 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-700 mr-2 uppercase tracking-widest">نام فیلد جدید را وارد کنید</label>
                        <div className="relative">
                          <PlusCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
                          <input 
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            className="w-full pr-12 pl-5 py-4 bg-white rounded-2xl outline-none font-bold border-2 border-transparent focus:border-indigo-400 shadow-sm"
                            placeholder="مثلاً: دور سینه، مچ، ..."
                            autoFocus
                          />
                        </div>
                      </div>
                      <button 
                        onClick={handleCreateNewField}
                        disabled={!newFieldName.trim()}
                        className={`w-full py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all ${newFieldName.trim() ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                        <Plus size={22} /> افزودن به لیست اندازه‌ها
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleModeView;
