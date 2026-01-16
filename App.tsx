
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Customer, 
  Order, 
  Transaction, 
  AppView, 
  OrderStatus
} from './types';
import { 
  NAVIGATION_ITEMS, 
  STATUS_COLORS, 
  MEASUREMENT_LABELS 
} from './constants';
import { StorageService } from './services/storage';
import { supabase } from './services/supabase';
import { AuthService } from './services/authService';
import { CloudService } from './services/cloudService';
import { 
  Search, 
  Plus, 
  Scissors, 
  User, 
  Users,
  History,
  TrendingUp,
  TrendingDown,
  Download,
  Database,
  X,
  Filter,
  ArrowLeft,
  UploadCloud,
  LogOut,
  Mail,
  Lock,
  Loader2,
  ShieldCheck,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle
} from 'lucide-react';
import CustomerForm from './components/CustomerForm';

type MobileCustomerTab = 'INFO' | 'MEASUREMENTS' | 'ORDERS';
type DashboardFilter = 'ALL' | OrderStatus;

// --- Sub-components ---

const AuthView = ({ 
  authMode, 
  setAuthMode, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  authError, 
  authLoading, 
  handleAuth,
  regSuccess 
}: any) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-8 border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-indigo-600 rounded-[1.8rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/20 mb-4">
            <Scissors size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">خیاطیار</h1>
          <p className="text-slate-400 text-sm">سامانه مدیریت خیاطی هوشمند</p>
        </div>

        {regSuccess ? (
          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Mail size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-emerald-800 text-lg">ایمیل خود را تایید کنید</h3>
              <p className="text-emerald-700 text-sm leading-relaxed">
                یک لینک فعال‌سازی به ایمیل شما ارسال شد. لطفاً پوشه ورودی یا هرزنامه خود را چک کرده و روی لینک کلیک کنید.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/20"
            >
              متوجه شدم (بازگشت به ورود)
            </button>
          </div>
        ) : (
          <>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
              <button 
                onClick={() => setAuthMode('LOGIN')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${authMode === 'LOGIN' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
              >
                ورود
              </button>
              <button 
                onClick={() => setAuthMode('REGISTER')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${authMode === 'REGISTER' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
              >
                ثبت‌نام
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 mr-2">ایمیل شما</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pr-12 pl-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="tailor@example.com"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 mr-2">رمز عبور</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pr-12 pl-12 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {authError && <div className="p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-2xl text-center leading-relaxed">{authError}</div>}

              <button 
                type="submit" 
                disabled={authLoading}
                className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {authLoading ? <Loader2 className="animate-spin" size={20} /> : (authMode === 'LOGIN' ? 'ورود به حساب' : 'ایجاد حساب کاربری')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const ApprovalView = ({ user, checkApproval, signOut }: any) => (
  <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-6 text-center">
    <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
      <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[1.8rem] flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10 mb-4 animate-pulse">
        <ShieldCheck size={44} />
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-800">در انتظار تایید مدیریت</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          حساب کاربری شما با موفقیت ساخته شد. برای استفاده از اپلیکیشن، مدیر باید دسترسی شما را تایید کند.
        </p>
        {!navigator.onLine && (
           <div className="p-3 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-xl flex items-center gap-2 justify-center">
             <AlertCircle size={14} />
             شما در حال حاضر آفلاین هستید. برای بررسی تاییدیه به اینترنت متصل شوید.
           </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
         <button 
          onClick={() => checkApproval(user.id, true)}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
         >
           <RefreshCw size={18} />
           بررسی مجدد وضعیت
         </button>
         <button 
          onClick={signOut}
          className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
         >
           <LogOut size={18} />
           خروج از حساب
         </button>
      </div>
    </div>
  </div>
);

const OrderForm = ({ onSubmit, onClose }: any) => {
  const [description, setDescription] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      description,
      totalPrice: Number(totalPrice) || 0,
      deposit: Number(deposit) || 0,
      dueDate
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-t-[2.5rem] md:rounded-3xl w-full max-w-lg overflow-hidden flex flex-col mobile-bottom-sheet shadow-2xl max-h-[90dvh]">
        <div className="md:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Scissors className="text-indigo-600" /> ثبت سفارش جدید</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
        </div>
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 mr-2 uppercase">شرح سفارش (مدل لباس)</label>
            <div className="relative">
              <FileText className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" required value={description} onChange={e => setDescription(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                placeholder="مثلاً: کت و شلوار مجلسی آبی"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 mr-2 uppercase">قیمت کل (افغانی)</label>
              <div className="relative">
                <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="number" required value={totalPrice} onChange={e => setTotalPrice(e.target.value)}
                  className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                  placeholder="0" dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 mr-2 uppercase">بیعانه دریافتی</label>
              <div className="relative">
                <Download className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" size={18} />
                <input 
                  type="number" value={deposit} onChange={e => setDeposit(e.target.value)}
                  className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                  placeholder="0" dir="ltr"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 mr-2 uppercase">تاریخ تحویل</label>
            <div className="relative">
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                placeholder="مثلاً: ۱۴۰۳/۰۴/۱۵"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">ثبت نهایی سفارش</button>
        </form>
      </div>
    </div>
  );
};

const TransactionForm = ({ type, onSubmit, onClose }: any) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = type === 'DEBT' ? Number(amount) : -Number(amount);
    onSubmit(finalAmount, description);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-t-[2.5rem] md:rounded-3xl w-full max-w-md overflow-hidden flex flex-col mobile-bottom-sheet shadow-2xl">
        <div className="md:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className={`text-xl font-bold flex items-center gap-2 ${type === 'DEBT' ? 'text-rose-600' : 'text-emerald-600'}`}>
            {type === 'DEBT' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            {type === 'DEBT' ? 'ثبت بدهی جدید' : 'ثبت دریافتی (تسویه)'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 mr-2 uppercase">مبلغ (افغانی)</label>
            <input 
              type="number" required autoFocus value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-2xl font-bold text-center"
              placeholder="0" dir="ltr"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 mr-2 uppercase">بابتِ (توضیحات)</label>
            <input 
              type="text" required value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
              placeholder="مثلاً: بابت تعمیر لباس"
            />
          </div>
          <button type="submit" className={`w-full py-4 text-white rounded-2xl font-bold shadow-lg transition-all ${type === 'DEBT' ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700' : 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700'}`}>
            ثبت تراکنش
          </button>
        </form>
      </div>
    </div>
  );
};

const HistorySheet = ({ orders, transactions, customers, onClose }: any) => {
  const allEvents = useMemo(() => {
    const orderEvents = orders.map((o: Order) => ({ ...o, type: 'ORDER' }));
    const txEvents = transactions.map((t: Transaction) => ({ ...t, type: 'TX' }));
    return [...orderEvents, ...txEvents].sort((a, b) => {
      return b.id.localeCompare(a.id);
    }).slice(0, 30);
  }, [orders, transactions]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-t-[2.5rem] w-full max-w-xl h-[85dvh] overflow-hidden flex flex-col mobile-bottom-sheet shadow-2xl">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History className="text-indigo-600" /> تاریخچه آخرین فعالیت‌ها</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {allEvents.map((ev: any) => {
            const customer = customers.find((c: Customer) => c.id === ev.customerId);
            return (
              <div key={ev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${ev.type === 'ORDER' ? 'bg-indigo-100 text-indigo-600' : ev.amount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {ev.type === 'ORDER' ? <Scissors size={20} /> : ev.amount > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-800">{customer?.name || 'نامشخص'}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{ev.description}</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[9px] text-slate-300 font-bold mb-1" dir="ltr">{ev.date || ev.dateCreated}</div>
                  {ev.type === 'TX' && (
                    <div className={`text-[11px] font-bold ${ev.amount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {ev.amount > 0 ? '+' : ''}{ev.amount.toLocaleString()} افغانی
                    </div>
                  )}
                  {ev.type === 'ORDER' && (
                    <div className="text-[9px] font-bold text-indigo-600">ثبت سفارش جدید</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

const App: React.FC = () => {
  // Auth States
  const [user, setUser] = useState<any>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Data States
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountingSearchTerm, setAccountingSearchTerm] = useState('');
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilter>('ALL');
  
  // Modal States
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(null as 'DEBT' | 'PAYMENT' | null);
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [cloudActionLoading, setCloudActionLoading] = useState(false);
  const [isStoragePersistent, setIsStoragePersistent] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' | null }>({ message: '', type: null });
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedAccountingCustomerId, setSelectedAccountingCustomerId] = useState<string | null>(null);
  const [activeCustomerTab, setActiveCustomerTab] = useState<MobileCustomerTab>('INFO');

  const [autoBackupEnabled, setAutoBackupEnabled] = useState(localStorage.getItem('auto_cloud_backup') === 'true');

  const loadAppData = useCallback(async () => {
    const custs = await StorageService.getCustomers();
    const ords = await StorageService.getOrders();
    const txs = await StorageService.getTransactions();
    setCustomers(custs);
    setOrders(ords);
    setTransactions(txs);
  }, []);

  const handleAutoBackupCheck = useCallback(async (userId: string) => {
    const isEnabled = localStorage.getItem('auto_cloud_backup') === 'true';
    if (!isEnabled) return;

    const lastBackup = Number(localStorage.getItem('last_auto_backup_ts') || 0);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - lastBackup > twentyFourHours) {
      const res = await CloudService.uploadBackup(userId);
      if (res.success) {
        localStorage.setItem('last_auto_backup_ts', now.toString());
      }
    }
  }, []);

  // --- Optimized License & Approval Check ---
  const checkApproval = useCallback(async (userId: string, forceCheck: boolean = false) => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const cacheKey = `approval_cache_${userId}`;
    const tsKey = `approval_ts_${userId}`;
    
    const cachedStatus = localStorage.getItem(cacheKey);
    const lastCheckTs = Number(localStorage.getItem(tsKey) || 0);

    if (!navigator.onLine) {
      const approved = cachedStatus === 'true';
      setIsApproved(approved);
      if (approved) await loadAppData();
      setAuthLoading(false);
      return;
    }

    const needsCheck = forceCheck || !cachedStatus || (now - lastCheckTs > twentyFourHours);

    if (needsCheck) {
      try {
        const { data, error } = await AuthService.getProfile(userId);
        if (error) throw error;

        const approved = !!data?.is_approved;
        setIsApproved(approved);
        
        localStorage.setItem(cacheKey, approved.toString());
        localStorage.setItem(tsKey, now.toString());

        if (approved) {
          await loadAppData();
          handleAutoBackupCheck(userId);
        }
      } catch (err) {
        console.warn('License check failed online, falling back to cache:', err);
        const approved = cachedStatus === 'true';
        setIsApproved(approved);
        if (approved) await loadAppData();
      }
    } else {
      const approved = cachedStatus === 'true';
      setIsApproved(approved);
      if (approved) {
        await loadAppData();
        handleAutoBackupCheck(userId);
      }
    }
    setAuthLoading(false);
  }, [loadAppData, handleAutoBackupCheck]);

  // Unified App Initialization
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await StorageService.init();
      if (!mounted) return;
      
      setIsStoragePersistent(await StorageService.isPersistenceEnabled());

      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await checkApproval(session.user.id);
      } else {
        setAuthLoading(false);
      }

      // Single listener for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;
        
        if (newSession?.user) {
          setUser(newSession.user);
          await checkApproval(newSession.user.id);
        } else {
          setUser(null);
          setIsApproved(false);
          setAuthLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    const cleanup = init();

    const handleOnline = () => {
      if (user) checkApproval(user.id);
    };
    window.addEventListener('online', handleOnline);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
    };
  }, []); // Empty dependency array for stability

  const translateAuthError = (err: string) => {
    if (err.includes('Invalid login credentials')) return 'ایمیل یا رمز عبور اشتباه است.';
    if (err.includes('Email not confirmed')) return 'لطفاً ابتدا ایمیل خود را از طریق لینکی که برایتان ارسال شده تایید کنید.';
    if (err.includes('User already registered')) return 'این ایمیل قبلاً در سیستم ثبت شده است.';
    if (err.includes('Password should be at least 6 characters')) return 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
    return 'خطایی رخ داد: ' + err;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'LOGIN') {
        const { error } = await AuthService.signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await AuthService.signUp(email, password);
        if (error) throw error;
        setRegSuccess(true);
      }
    } catch (err: any) {
      setAuthError(translateAuthError(err.message || 'خطای ناشناخته'));
      setAuthLoading(false);
    }
  };

  const handleCloudBackup = async () => {
    if (!user) return;
    setCloudStatus({ message: 'در حال ارسال داده‌ها به فضای ابری...', type: 'info' });
    setCloudActionLoading(true);
    const res = await CloudService.uploadBackup(user.id);
    setCloudActionLoading(false);
    if (res.success) {
      setCloudStatus({ message: 'پشتیبان‌گیری ابری با موفقیت انجام شد.', type: 'success' });
      localStorage.setItem('last_auto_backup_ts', Date.now().toString());
      setTimeout(() => setCloudStatus({ message: '', type: null }), 4000);
    } else {
      setCloudStatus({ message: 'خطا در پشتیبان‌گیری: ' + (res.error as any).message, type: 'error' });
    }
  };

  const handleCloudRestore = async () => {
    if (!user) return;
    if (!confirm('آیا مطمئن هستید؟ تمام اطلاعات فعلی با اطلاعات ابری جایگزین خواهد شد.')) return;
    
    setCloudStatus({ message: 'در حال بازیابی داده‌ها از فضای ابری...', type: 'info' });
    setCloudActionLoading(true);
    const res = await CloudService.downloadBackup(user.id);
    setCloudActionLoading(false);
    
    if (res.success) {
      setCloudStatus({ message: 'بازیابی موفقیت‌آمیز بود. در حال بازنشانی برنامه...', type: 'success' });
      setTimeout(() => window.location.reload(), 2000);
    } else {
      setCloudStatus({ message: 'خطا در بازیابی: ' + (res.error as any).message, type: 'error' });
    }
  };

  const toggleAutoBackup = () => {
    const newState = !autoBackupEnabled;
    setAutoBackupEnabled(newState);
    localStorage.setItem('auto_cloud_backup', newState.toString());
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => c.name.includes(searchTerm) || c.phone.includes(searchTerm));
  }, [customers, searchTerm]);

  const filteredAccountingCustomers = useMemo(() => {
    return customers.filter(c => c.name.includes(accountingSearchTerm) || c.phone.includes(accountingSearchTerm));
  }, [customers, accountingSearchTerm]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const selectedAccountingCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedAccountingCustomerId);
  }, [customers, selectedAccountingCustomerId]);

  const handleAddCustomer = async (data: Partial<Customer>) => {
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: data.name!,
      phone: data.phone!,
      measurements: data.measurements || {},
      balance: 0,
    };
    const updated = [...customers, newCustomer];
    setCustomers(updated);
    await StorageService.saveCustomers(updated);
    setShowCustomerForm(false);
  };

  const handleAddTransaction = async (amount: number, description: string, custId: string = selectedAccountingCustomerId || selectedCustomerId!) => {
    const newTx: Transaction = {
      id: Date.now().toString(),
      customerId: custId,
      amount,
      date: new Date().toLocaleDateString('fa-IR'),
      description
    };
    const updatedTxs = [...transactions, newTx];
    setTransactions(updatedTxs);
    await StorageService.saveTransactions(updatedTxs);

    const updatedCustomers = customers.map(c => 
      c.id === custId ? { ...c, balance: c.balance + amount } : c
    );
    setCustomers(updatedCustomers);
    await StorageService.saveCustomers(updatedCustomers);
    setShowTransactionForm(null);
  };

  const handleCreateOrder = async (orderData: { description: string, totalPrice: number, deposit: number, dueDate: string }) => {
    if (!selectedCustomerId) return;

    const newOrder: Order = {
      id: Date.now().toString(),
      customerId: selectedCustomerId,
      description: orderData.description,
      status: OrderStatus.PENDING,
      dateCreated: new Date().toLocaleDateString('fa-IR'),
      totalPrice: orderData.totalPrice,
      deposit: orderData.deposit,
      dueDate: orderData.dueDate || undefined
    };

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    await StorageService.saveOrders(updatedOrders);

    if (orderData.totalPrice > 0) {
      await handleAddTransaction(orderData.totalPrice, `هزینه سفارش: ${orderData.description}`, selectedCustomerId);
    }
    if (orderData.deposit > 0) {
      await handleAddTransaction(-orderData.deposit, `بیعانه سفارش: ${orderData.description}`, selectedCustomerId);
    }
    
    setShowOrderForm(false);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
    setOrders(updated);
    await StorageService.saveOrders(updated);
  };

  const handleExportData = () => {
    const data = { customers, orders, transactions, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khayatyar_backup_${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.json`;
    a.click();
    setShowBackupModal(false);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('آیا مطمئن هستید؟ تمام اطلاعات فعلی با اطلاعات این فایل جایگزین خواهد شد.')) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.customers && data.orders && data.transactions) {
          await StorageService.saveCustomers(data.customers);
          await StorageService.saveOrders(data.orders);
          await StorageService.saveTransactions(data.transactions);
          window.location.reload();
        } else {
          alert('فایل انتخاب شده معتبر نیست.');
        }
      } catch (err) {
        alert('خطا در خواندن فایل.');
      }
    };
    reader.readAsText(file);
  };

  const renderDashboard = () => {
    const totalCustomers = customers.length;
    const activeOrdersCount = orders.filter(o => o.status !== OrderStatus.COMPLETED).length;
    const totalDebt = customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);

    const countsByStatus = {
      'ALL': orders.length,
      [OrderStatus.PENDING]: orders.filter(o => o.status === OrderStatus.PENDING).length,
      [OrderStatus.PROCESSING]: orders.filter(o => o.status === OrderStatus.PROCESSING).length,
      [OrderStatus.READY]: orders.filter(o => o.status === OrderStatus.READY).length,
      [OrderStatus.COMPLETED]: orders.filter(o => o.status === OrderStatus.COMPLETED).length,
    };

    const dashboardFilteredOrders = orders
      .filter(o => dashboardFilter === 'ALL' || o.status === dashboardFilter)
      .slice().reverse();

    return (
      <div className="space-y-5 pb-24">
        <div className="flex gap-2 w-full overflow-x-auto no-scrollbar pb-1">
          <div className="flex-1 min-w-[110px] bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5 shadow-sm">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={16}/></div>
            <div>
              <div className="text-[8px] font-bold text-slate-400 leading-none mb-1">مشتریان</div>
              <div className="text-xs font-bold text-slate-800">{totalCustomers}</div>
            </div>
          </div>
          <div className="flex-1 min-w-[110px] bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5 shadow-sm">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Scissors size={16}/></div>
            <div>
              <div className="text-[8px] font-bold text-slate-400 leading-none mb-1">سفارشات</div>
              <div className="text-xs font-bold text-slate-800">{activeOrdersCount}</div>
            </div>
          </div>
          <div className="flex-1 min-w-[130px] bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5 shadow-sm">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><TrendingUp size={16}/></div>
            <div>
              <div className="text-[8px] font-bold text-slate-400 leading-none mb-1">کل طلب‌ها</div>
              <div className="text-xs font-bold text-slate-800 truncate">{totalDebt.toLocaleString()} افغانی</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
          {(['ALL', ...Object.values(OrderStatus)] as DashboardFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setDashboardFilter(status)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                dashboardFilter === status 
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-600/20' 
                  : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
              }`}
            >
              <span>{status === 'ALL' ? 'همه سفارشات' : status}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                dashboardFilter === status ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {countsByStatus[status]}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Filter size={14} />
              نمایش: {dashboardFilter === 'ALL' ? 'همه موارد' : dashboardFilter}
            </h3>
          </div>
          
          <div className="space-y-2">
            {dashboardFilteredOrders.length > 0 ? dashboardFilteredOrders.map(order => {
              const customer = customers.find(c => c.id === order.customerId);
              return (
                <div 
                  key={order.id} 
                  onClick={() => { setSelectedCustomerId(order.customerId); setView('CUSTOMER_DETAIL'); setActiveCustomerTab('ORDERS'); }}
                  className="bg-white p-3.5 rounded-2xl border border-slate-50 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 ${STATUS_COLORS[order.status].replace('text-', 'bg-').replace('-700', '-50')}`}>
                      <Scissors size={18} className={STATUS_COLORS[order.status].split(' ')[1]} />
                    </div>
                    <div className="truncate">
                      <div className="text-[13px] font-bold text-slate-800 leading-tight mb-0.5">{customer?.name}</div>
                      <div className="text-[10px] text-slate-400 truncate w-full">{order.description}</div>
                    </div>
                  </div>
                  <div className="text-left flex flex-col items-end gap-1.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold whitespace-nowrap shadow-sm border ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                    <div className="text-[9px] text-slate-300 font-bold" dir="ltr">{order.dateCreated}</div>
                  </div>
                </div>
              );
            }) : (
              <div className="p-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <Scissors size={32} className="mx-auto text-slate-200 mb-3" />
                <p className="text-xs font-bold text-slate-400">سفارشی در این وضعیت یافت نشد.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCustomers = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="جستجوی نام یا تلفن..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pr-12 pl-6 py-4 bg-white border border-slate-100 shadow-sm rounded-3xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
        />
      </div>
      <div className="grid grid-cols-1 gap-2.5 pb-24">
        {filteredCustomers.map(customer => {
          const balance = customer.balance;
          const isDebtor = balance > 0;
          
          const activeMeasures = Object.entries(customer.measurements)
            .filter(([_, val]) => val !== undefined && val !== null && val !== 0);

          return (
            <div 
              key={customer.id} 
              onClick={() => { setSelectedCustomerId(customer.id); setView('CUSTOMER_DETAIL'); setActiveCustomerTab('INFO'); }} 
              className="bg-white px-4 py-3 rounded-2xl border border-slate-50 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col gap-2 group relative overflow-hidden active:bg-slate-50"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate max-w-[120px]">
                    {customer.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium" dir="ltr">{customer.phone}</span>
                </div>
                
                {balance !== 0 && (
                  <div className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${
                    isDebtor 
                      ? 'bg-rose-50/50 text-rose-600 border-rose-200/50 shadow-[0_0_8px_rgba(225,29,72,0.15)]' 
                      : 'bg-emerald-50/50 text-emerald-600 border-emerald-200/50 shadow-[0_0_8px_rgba(5,150,105,0.15)]'
                  }`}>
                    {Math.abs(balance).toLocaleString()} افغانی {isDebtor ? 'بدهکار' : 'طلبکار'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 pt-1">
                {activeMeasures.map(([key, value]) => (
                  <div 
                    key={key} 
                    className="bg-slate-50/80 px-1.5 py-1 rounded-md border border-slate-100 flex items-center justify-center min-w-[40px]"
                  >
                    <span className="text-[8px] text-slate-400 font-bold leading-none mb-1 truncate w-full text-center">
                      {MEASUREMENT_LABELS[key] || key}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 leading-none drop-shadow-[0_0_1px_rgba(79,70,229,0.3)]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <button 
        onClick={() => setShowCustomerForm(true)} 
        className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center z-[80] active:scale-95 transition-all shadow-indigo-600/40"
      >
        <Plus size={28} />
      </button>
    </div>
  );

  const renderView = () => {
    switch (view) {
      case 'DASHBOARD': return renderDashboard();
      case 'CUSTOMERS': return renderCustomers();
      case 'ACCOUNTING': return (selectedAccountingCustomerId ? null : renderAccounting()); // Simplified check
      default: return renderDashboard();
    }
  };

  const renderAccounting = () => {
    // Shared list for choosing customer in accounting
    return (
      <div className="space-y-6">
        <div className="relative mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="جستجوی مشتری..." 
            value={accountingSearchTerm} 
            onChange={(e) => setAccountingSearchTerm(e.target.value)} 
            className="w-full pr-12 pl-6 py-4 bg-white border border-slate-100 shadow-sm rounded-3xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
          />
        </div>
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden mb-20">
           <div className="divide-y divide-slate-50">
             {filteredAccountingCustomers.map(c => (
               <div key={c.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => setSelectedAccountingCustomerId(c.id)}>
                 <div className="flex gap-4 items-center">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all group-hover:scale-110 ${c.balance > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{c.name[0]}</div>
                   <div><div className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{c.name}</div><div className="text-[10px] text-slate-400" dir="ltr">{c.phone}</div></div>
                 </div>
                 <div className="text-right">
                   <div className={`font-bold ${c.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{Math.abs(c.balance).toLocaleString()} افغانی</div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthView 
        authMode={authMode}
        setAuthMode={setAuthMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        authError={authError}
        authLoading={authLoading}
        handleAuth={handleAuth}
        regSuccess={regSuccess}
      />
    );
  }

  if (!isApproved) {
    return <ApprovalView user={user} checkApproval={checkApproval} signOut={() => AuthService.signOut()} />;
  }

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-[#f8fafc] overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-80 bg-slate-950 text-white flex-col p-8 sticky top-0 h-full border-l border-white/5">
        <div className="flex items-center gap-4 mb-14 px-2">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-2xl shadow-indigo-600/30">
            <Scissors size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">خیاطیار</h1>
        </div>
        <nav className="space-y-3 flex-1">
          {NAVIGATION_ITEMS.map((item) => (
            <button 
              key={item.id} 
              onClick={() => { setView(item.id as AppView); setSelectedCustomerId(null); setSelectedAccountingCustomerId(null); }} 
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 group ${view === item.id ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20 translate-x-1' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
              {item.icon}<span className="font-bold tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-8 border-t border-white/10">
           <button onClick={() => setShowBackupModal(true)} className="w-full flex items-center gap-4 px-6 py-4 text-slate-500 hover:text-emerald-400 transition-colors">
              <Database size={20}/>
              <span className="font-bold">مدیریت پشتیبان</span>
           </button>
           <div className="w-full flex items-center gap-4 px-2 mt-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-indigo-400"><User size={24} /></div>
              <div className="overflow-hidden">
                <div className="text-white font-bold">پنل کاربری</div>
                <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden sticky top-0 z-[60] bg-white/80 backdrop-blur-lg px-6 py-4 flex items-center justify-between border-b border-slate-100 pb-safe">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Scissors size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">خیاطیار</h1>
          </div>
          <div className="flex items-center gap-2">
            {!navigator.onLine && <div className="p-1 px-2 bg-amber-100 text-amber-700 text-[8px] font-bold rounded-lg flex items-center gap-1">آفلاین</div>}
            <button onClick={() => setShowHistorySheet(true)} className="p-2 text-slate-400"><History size={24} /></button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-12 overflow-y-auto no-scrollbar pb-24 md:pb-12">
          <div className="max-w-6xl mx-auto">
            {renderView()}
          </div>
        </main>
        
        {/* Mobile Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav px-6 py-3 flex justify-between items-center z-[70] pb-safe rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          {NAVIGATION_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id as AppView); setSelectedCustomerId(null); setSelectedAccountingCustomerId(null); }}
              className={`flex flex-col items-center gap-1.5 transition-all ${view === item.id ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <div className={`p-2 rounded-2xl ${view === item.id ? 'bg-indigo-50' : ''}`}>
                {React.cloneElement(item.icon as React.ReactElement<any>, { size: 22 })}
              </div>
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {showCustomerForm && <CustomerForm onSave={handleAddCustomer} onClose={() => setShowCustomerForm(false)} initialData={selectedCustomer || undefined} />}
      {showOrderForm && <OrderForm onSubmit={handleCreateOrder} onClose={() => setShowOrderForm(false)} />}
      {showTransactionForm && <TransactionForm type={showTransactionForm} onSubmit={handleAddTransaction} onClose={() => setShowTransactionForm(null)} />}
      {showHistorySheet && <HistorySheet orders={orders} transactions={transactions} customers={customers} onClose={() => setShowHistorySheet(false)} />}

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0" onClick={() => setShowBackupModal(false)} />
          <div className="relative bg-white rounded-t-[2.5rem] md:rounded-3xl w-full max-w-xl max-h-[90dvh] overflow-y-auto no-scrollbar p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">مدیریت داده‌ها</h2>
              <button onClick={() => setShowBackupModal(false)} className="p-2"><X size={20}/></button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleCloudBackup} disabled={!navigator.onLine} className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center gap-2">
                  <UploadCloud className="text-indigo-600" />
                  <span className="text-[10px] font-bold">پشتیبان ابری</span>
                </button>
                <button onClick={handleCloudRestore} disabled={!navigator.onLine} className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center gap-2">
                  <RefreshCw className="text-blue-600" />
                  <span className="text-[10px] font-bold">بازیابی ابری</span>
                </button>
              </div>
              
              {cloudStatus.type && (
                <div className={`p-3 rounded-xl text-[10px] font-bold flex items-center gap-2 ${cloudStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {cloudStatus.message}
                </div>
              )}

              <button onClick={() => AuthService.signOut()} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2"><LogOut size={18}/> خروج از حساب</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
