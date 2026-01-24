
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Order, Transaction, OrderStatus } from '../types';
import { SIMPLE_MEASUREMENT_LABELS } from '../constants';
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
  Info
} from 'lucide-react';

interface SimpleModeViewProps {
  onExit: () => void;
}

const SimpleModeView: React.FC<SimpleModeViewProps> = ({ onExit }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyViewId, setHistoryViewId] = useState<string | null>(null);

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState<Customer | boolean>(false);
  const [showOrderModal, setShowOrderModal] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<{ orderId: string, custId: string } | null>(null);

  // Quick Order Local State for Validation
  const [quickOrderPrices, setQuickOrderPrices] = useState({ cloth: 0, sewing: 0, received: 0 });

  useEffect(() => {
    const loadData = async () => {
      setCustomers(await StorageService.getSimpleCustomers());
      setOrders(await StorageService.getSimpleOrders());
      setTransactions(await StorageService.getSimpleTransactions());
    };
    loadData();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers.slice(-3).reverse();
    return customers.filter(c => c.name.includes(searchTerm) || c.phone.includes(searchTerm)).reverse();
  }, [customers, searchTerm]);

  const saveCustomer = async (data: Partial<Customer>) => {
    let updated;
    if (typeof showCustomerModal === 'object') {
      updated = customers.map(c => c.id === showCustomerModal.id ? { ...c, ...data } : c);
    } else {
      const newCustomer: Customer = {
        id: Date.now().toString(),
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
      alert('این مشتری دارای سوابق سفارش یا تراکنش باز است. ابتدا سوابق را پاک یا تسویه کنید.');
      return;
    }

    if (!confirm('آیا از حذف این مشتری مطمئن هستید؟')) return;
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    await StorageService.saveSimpleCustomers(updated);
  };

  const deleteOrder = async (orderId: string, custId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const debt = getOrderDebt(orderId);
    if (Math.abs(debt) > 0.1) {
      alert('تنها سفارشات کاملاً تسویه شده قابل حذف هستند.');
      return;
    }

    if (!confirm('آیا از حذف این سفارش از تاریخچه مطمئن هستید؟')) return;

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
      alert('خطا: مبلغ دریافتی نمی‌تواند بیشتر از مبلغ کل سفارش باشد.');
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
      deposit: received
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
    setQuickOrderPrices({ cloth: 0, sewing: 0, received: 0 });
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

  const isQuickOrderInvalid = quickOrderPrices.received > (quickOrderPrices.cloth + quickOrderPrices.sewing);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Vazirmatn'] select-none">
      {/* Header */}
      <header className="bg-white px-6 py-5 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Zap size={20} />
          </div>
          <h1 className="text-xl font-black text-slate-800">حالت ساده</h1>
        </div>
        <button 
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
        >
          <LogOut size={16} />
          خروج از حالت ساده
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6 pb-32 max-w-2xl mx-auto w-full">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="جستجوی نام یا تلفن مشتری..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-14 pl-6 py-5 bg-white border-2 border-transparent rounded-[2rem] shadow-xl shadow-slate-200/50 focus:border-indigo-400 outline-none text-base font-bold transition-all"
          />
        </div>

        {/* Customer List */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest px-2">
            {searchTerm ? 'نتایج جستجو' : 'آخرین مشتریان'}
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
                    <div className="text-lg font-bold text-slate-800 break-words leading-tight">{customer.name}</div>
                    <div className="text-sm text-slate-400 font-bold mt-0.5" dir="ltr">{customer.phone}</div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      onClick={() => {
                        setQuickOrderPrices({ cloth: 0, sewing: 0, received: 0 });
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
                    {/* Measurements Row */}
                    <div className="bg-slate-50 rounded-3xl p-4 grid grid-cols-4 gap-2">
                      {Object.entries(SIMPLE_MEASUREMENT_LABELS).map(([key, label]) => (
                        <div key={key} className="text-center">
                          <div className="text-[9px] font-black text-slate-700 mb-1">{label}</div>
                          <div className="text-sm font-black text-slate-900">{customer.measurements[key] || '-'}</div>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div className={`p-5 rounded-3xl flex justify-between items-center border ${customer.balance > 0 ? 'bg-rose-50 border-rose-100' : customer.balance < 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'}`}>
                      <div>
                        <div className="text-[10px] font-black uppercase text-slate-700 mb-1">تراز مالی کل</div>
                        <div className={`text-lg font-black ${customer.balance > 0 ? 'text-rose-600' : customer.balance < 0 ? 'text-indigo-600' : 'text-emerald-600'}`}>
                          {Math.abs(customer.balance).toLocaleString()} افغانی
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black ${customer.balance > 0 ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : customer.balance < 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'}`}>
                        {customer.balance > 0 ? 'قرضدار' : customer.balance < 0 ? 'بستانکار (طلبکار)' : 'تسویه / صفر'}
                      </div>
                    </div>

                    {/* Quick Actions */}
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
                        title={!canDeleteCust ? "به دلیل وجود سوابق، حذف مشتری مقدور نیست" : "حذف مشتری"}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Order History / Detailed Ledger */}
                {isHistoryOpen && (
                  <div className="px-6 pb-8 space-y-4 bg-slate-50/50 border-t border-slate-50 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between pt-6 px-1">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        <History size={14} /> تاریخچه (۵ مورد اخیر)
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                        <Info size={10} /> برای موارد قدیمی‌تر اسکرول کنید
                      </div>
                    </div>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                      {customerOrders.length > 0 ? customerOrders.slice().reverse().map(order => {
                        const debt = getOrderDebt(order.id);
                        const isSettled = Math.abs(debt) < 0.1;
                        const isCreditor = debt < -0.1;

                        return (
                          <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 transition-all hover:shadow-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-sm font-black text-slate-800">{order.description}</div>
                                <div className="text-[10px] text-slate-400 font-bold" dir="ltr">{order.dateCreated}</div>
                              </div>
                              <div className="text-left flex items-center gap-3">
                                <div>
                                  <div className="text-[10px] font-black text-slate-700 mb-0.5">قیمت کل</div>
                                  <div className="text-sm font-black text-slate-800">{order.totalPrice?.toLocaleString()}</div>
                                </div>
                                <button 
                                  disabled={!isSettled}
                                  onClick={() => deleteOrder(order.id, customer.id)}
                                  className={`p-2 rounded-xl transition-all ${isSettled ? 'text-rose-400 hover:bg-rose-50' : 'text-slate-100 cursor-not-allowed'}`}
                                  title={!isSettled ? "ابتدا سفارش را تسویه کنید" : "پاک کردن از تاریخچه"}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="flex justify-between items-center py-3 border-y border-slate-50">
                              <div className="flex items-center gap-2">
                                {isSettled ? (
                                  <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-black">
                                    <CheckCircle2 size={16} />
                                    تسویه کامل
                                  </div>
                                ) : isCreditor ? (
                                  <div className="flex items-center gap-1.5 text-indigo-600 text-[11px] font-black">
                                    <DollarSign size={16} />
                                    طلب مشتری: {Math.abs(debt).toLocaleString()}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-black">
                                    <AlertCircle size={16} />
                                    قرضدار: {debt.toLocaleString()}
                                  </div>
                                )}
                              </div>
                              {!isSettled && (
                                <button 
                                  onClick={() => setShowPaymentModal({ orderId: order.id, custId: customer.id })}
                                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black shadow-lg shadow-emerald-200 active:scale-95 transition-all"
                                >
                                  ثبت پول جدید
                                </button>
                              )}
                            </div>
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

      {/* Floating Add Button */}
      <button 
        onClick={() => setShowCustomerModal(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-[1.8rem] shadow-2xl shadow-indigo-600/40 flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white"
      >
        <UserPlus size={28} />
      </button>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0" onClick={() => setShowCustomerModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <UserPlus className="text-indigo-600" />
                {typeof showCustomerModal === 'object' ? 'ویرایش اطلاعات' : 'تشکیل پرونده جدید'}
              </h2>
              <button onClick={() => setShowCustomerModal(false)} className="p-2 bg-slate-100 text-slate-400 rounded-full active:scale-90 transition-all"><X size={20}/></button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const m: any = {};
              Object.keys(SIMPLE_MEASUREMENT_LABELS).forEach(k => m[k] = parseFloat(formData.get(k) as string) || 0);
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
                 <label className="text-[12px] font-black text-slate-700 mr-2 uppercase">اندازه‌های طلایی (سانتی‌متر)</label>
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                   {Object.entries(SIMPLE_MEASUREMENT_LABELS).map(([key, label]) => (
                     <div key={key} className="space-y-1">
                        <label className="text-[11px] font-black text-slate-700 text-center block">{label}</label>
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

      {/* Quick Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0" onClick={() => setShowOrderModal(null)} />
          <div className="relative bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 animate-in slide-in-from-bottom-10 border-t-8 border-indigo-600">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <ShoppingBag className="text-indigo-600" />
                ثبت سفارش سریع
              </h2>
              <button onClick={() => setShowOrderModal(null)} className="p-2 bg-slate-100 text-slate-400 rounded-full active:scale-90 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 mr-2 uppercase tracking-widest">عنوان سفارش (مدل لباس)</label>
                <div className="relative">
                  <FileText className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input id="orderTitle" type="text" className="w-full pr-12 pl-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold focus:ring-2 ring-indigo-400 border border-slate-100" placeholder="مثلاً: کت و شلوار مجلسی"/>
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
                {isQuickOrderInvalid && (
                  <div className="text-[10px] font-bold text-rose-600 text-center mt-1 flex items-center justify-center gap-1">
                    <AlertCircle size={12} /> مبلغ دریافتی نمی‌تواند از کل سفارش بیشتر باشد.
                  </div>
                )}
              </div>

              <button 
                disabled={isQuickOrderInvalid}
                onClick={() => {
                  const title = (document.getElementById('orderTitle') as HTMLInputElement).value;
                  createQuickOrder(showOrderModal, title);
                }}
                className={`w-full py-5 rounded-[1.5rem] font-black shadow-xl flex items-center justify-center gap-3 transition-all ${isQuickOrderInvalid ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white shadow-indigo-200 active:scale-95'}`}
              >
                تایید و ثبت سفارش
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center">
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
    </div>
  );
};

export default SimpleModeView;
