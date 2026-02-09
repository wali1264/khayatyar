
import React, { useState, useEffect, useRef } from 'react';
import { 
  Customer, 
  Order, 
  Transaction, 
  AppView, 
  OrderStatus
} from './types';
import { 
  MEASUREMENT_LABELS 
} from './constants';
import { StorageService } from './services/storage';
import { supabase } from './services/supabase';
import { AuthService } from './services/authService';
import { CloudService } from './services/cloudService';
import { 
  Scissors, 
  Download, 
  Database, 
  X, 
  UploadCloud, 
  LogOut, 
  Mail, 
  Lock, 
  Loader2, 
  ShieldCheck, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Cpu,
  AlertTriangle,
  Home
} from 'lucide-react';
import SimpleModeView from './components/SimpleModeView';

const AuthView = ({ 
  authMode, 
  setAuthMode, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  authError, 
  authLoading, 
  handleAuth
}: any) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-8 border border-slate-100">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-indigo-600 rounded-[1.8rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/20 mb-4 transition-transform hover:scale-110">
            <Scissors size={40} />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">خیاطیار</h1>
          <p className="text-slate-400 text-sm font-bold">همیار هوشمند خیاطان برتر</p>
        </div>

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
      </div>
    </div>
  );
};

const LoadingView = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
    <div className="relative w-24 h-24 mb-8">
      <div className="absolute inset-0 bg-indigo-600/20 rounded-[2rem] animate-ping"></div>
      <div className="relative bg-white border-2 border-indigo-600 w-full h-full rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-xl">
        <Cpu size={40} className="animate-pulse" />
      </div>
    </div>
    <h2 className="text-xl font-black text-slate-800 animate-pulse">در حال بارگذاری...</h2>
    <p className="text-slate-400 text-sm mt-2 font-bold tracking-tight">لطفاً شکیبا باشید</p>
  </div>
);

const ApprovalView = ({ user, checkApproval, signOut }: any) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
    <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 border border-slate-100">
      <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[1.8rem] flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10 mb-4 animate-pulse">
        <ShieldCheck size={44} />
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-800">در انتظار تایید مدیریت</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          حساب کاربری شما با موفقیت ساخته شد. برای استفاده از اپلیکیشن، مدیر باید دسترسی شما را تایید کند.
        </p>
        <p className="text-slate-400 text-xs">لطفاً پس از دریافت تاییدیه، اپلیکیشن را مجدداً باز کنید.</p>
      </div>

      <div className="flex flex-col gap-3">
         <button 
          onClick={() => checkApproval(user.id)}
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

const ExitConfirmationModal = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in" onClick={onCancel} />
    <div className="relative bg-white/90 backdrop-blur-xl border border-white/20 w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
       <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-2 animate-bounce">
             <AlertTriangle size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-800">خروج از برنامه؟</h3>
          <p className="text-sm text-slate-500 font-bold leading-relaxed">
            آیا مطمئن هستید که می‌خواهید برنامه را ببندید؟ تغییرات ذخیره نشده ممکن است از بین بروند.
          </p>
       </div>

       <div className="flex flex-col gap-3">
          <button 
            onClick={onCancel}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            خیر، می‌مانم
          </button>
          <button 
            onClick={onConfirm}
            className="w-full py-3 text-slate-400 font-bold text-sm hover:text-rose-500 transition-colors"
          >
            بله، خارج می‌شوم
          </button>
       </div>
    </div>
  </div>
);

const GoodbyeView = ({ onRestart }: { onRestart: () => void }) => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center overflow-hidden">
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-600 rounded-full blur-[100px]" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-600 rounded-full blur-[100px]" />
    </div>
    <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-12 space-y-8 shadow-2xl animate-in fade-in zoom-in duration-500">
       <div className="space-y-4">
          <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
             <CheckCircle2 size={48} className="animate-in slide-in-from-bottom-2" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">خروج موفقیت‌آمیز</h2>
          <p className="text-slate-400 text-sm leading-relaxed font-bold">
            نشست شما با امنیت کامل به پایان رسید. اطلاعات شما در حافظه دائمی خیاطیار محفوظ است.
          </p>
       </div>

       <div className="pt-4 space-y-4">
          <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">اکنون می‌توانید این پنجره را ببندید</div>
          <button 
            onClick={onRestart}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 border border-white/10"
          >
            <Home size={18} />
            بازگشت به برنامه
          </button>
       </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [cloudActionLoading, setCloudActionLoading] = useState(false);
  const [isStoragePersistent, setIsStoragePersistent] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' | null }>({ message: '', type: null });
  
  // سیستم محافظت از خروج
  const [showExitModal, setShowExitModal] = useState(false);
  const [isExited, setIsExited] = useState(false);
  const exitAllowed = useRef(false);

  // فعال‌سازی پیش‌فرض پشتیبان‌گیری خودکار (Default ON)
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(localStorage.getItem('auto_cloud_backup') !== 'false');

  // جلوگیری از بررسی مجدد در یک نشست (Session) واحد
  const sessionVerified = useRef(false);

  useEffect(() => {
    const initApp = async () => {
      await StorageService.init();
      setIsStoragePersistent(await StorageService.isPersistenceEnabled());
      await checkUser();
    };

    initApp();

    // هندلینگ دکمه بازگشت در موبایل (History API)
    window.history.pushState({ noExit: true }, '');
    const handlePopState = (event: PopStateEvent) => {
      if (!exitAllowed.current && !isExited) {
        // جلوگیری از خروج و نمایش مودال
        window.history.pushState({ noExit: true }, '');
        setShowExitModal(true);
      }
    };

    // هندلینگ بستن تب یا رفرش (سیستمی)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!exitAllowed.current && !isExited) {
        e.preventDefault();
        e.returnValue = 'آیا مطمئن هستید؟';
        return 'آیا مطمئن هستید؟';
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        startVerificationFlow(session.user.id);
      } else {
        setUser(null);
        setIsApproved(false);
        setIsVerifying(false);
        sessionVerified.current = false;
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isExited]);

  const startVerificationFlow = async (userId: string) => {
    // استراتژی Cache-First: ابتدا کش را چک می‌کنیم
    const cached = await StorageService.getApprovalCache();
    
    // اگر قبلاً تایید شده و کش معتبر داریم، لودینگ نشان نمی‌دهیم
    if (cached && cached.status) {
      setIsApproved(true);
      setIsVerifying(false);
      // بررسی بی‌صدا در پس‌زمینه
      checkApprovalSilent(userId);
      return;
    }

    // اگر کش نداریم یا تایید نشده، روند عادی لودینگ را طی می‌کنیم
    setIsVerifying(true);
    const startTime = Date.now();
    await checkApproval(userId);
    const elapsed = Date.now() - startTime;
    const remainingDelay = Math.max(0, 1500 - elapsed);
    setTimeout(() => setIsVerifying(false), remainingDelay);
  };

  const checkUser = async () => {
    setAuthLoading(true);
    const session = await AuthService.getSession();
    if (session) {
      setUser(session.user);
      await startVerificationFlow(session.user.id);
    }
    setAuthLoading(false);
  };

  // بررسی وضعیت بدون مسدود کردن رابط کاربری
  const checkApprovalSilent = async (userId: string) => {
    if (!navigator.onLine || sessionVerified.current) return;
    try {
      const { data } = await AuthService.getProfile(userId);
      if (data) {
        const approvalStatus = data.is_approved;
        if (approvalStatus !== isApproved) {
          setIsApproved(approvalStatus);
        }
        await StorageService.saveApprovalCache(approvalStatus);
        sessionVerified.current = true;
        if (approvalStatus) handleAutoBackupCheck(userId);
      }
    } catch (err) {
      console.warn("Silent verification failed.");
    }
  };

  const checkApproval = async (userId: string) => {
    const isOnline = navigator.onLine;
    const cached = await StorageService.getApprovalCache();

    if (isOnline) {
      try {
        const { data } = await AuthService.getProfile(userId);
        if (data) {
          const approvalStatus = data.is_approved;
          setIsApproved(approvalStatus);
          await StorageService.saveApprovalCache(approvalStatus);
          sessionVerified.current = true;
          if (approvalStatus) {
            handleAutoBackupCheck(userId);
          }
          return;
        }
      } catch (err) {
        console.warn("Online approval check failed, falling back to cache.");
      }
    }

    if (cached) {
      setIsApproved(cached.status);
      if (cached.status && isOnline) {
        handleAutoBackupCheck(userId);
      }
    } else {
      setIsApproved(false);
    }
  };

  const handleAutoBackupCheck = async (userId: string) => {
    if (!navigator.onLine) return; 
    // منطق پیش‌فرض روشن (مگر اینکه کاربر غیرفعال کرده باشد)
    const isEnabled = localStorage.getItem('auto_cloud_backup') !== 'false';
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
      }
    } catch (err: any) {
      setAuthError(err.message || 'خطای ناشناخته');
    } finally {
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

  const handleExportData = async () => {
    const data = { 
      professional: { 
        customers: await StorageService.getCustomers(), 
        orders: await StorageService.getOrders(), 
        transactions: await StorageService.getTransactions() 
      },
      simple: {
        customers: await StorageService.getSimpleCustomers(),
        orders: await StorageService.getSimpleOrders(),
        transactions: await StorageService.getSimpleTransactions(),
      },
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khayatiyar_all_backup_${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.json`;
    a.click();
    setShowBackupModal(false);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('اطلاعات فعلی جایگزین خواهد شد. ادامه می‌دهید؟')) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.version === '2.0' && data.professional && data.simple) {
          await StorageService.saveCustomers(data.professional.customers || []);
          await StorageService.saveOrders(data.professional.orders || []);
          await StorageService.saveTransactions(data.professional.transactions || []);
          await StorageService.saveSimpleCustomers(data.simple.customers || []);
          await StorageService.saveSimpleOrders(data.simple.orders || []);
          await StorageService.saveSimpleTransactions(data.simple.transactions || []);
          window.location.reload();
        } else {
          alert('فرمت فایل نامعتبر است.');
        }
      } catch (err) {
        alert('خطا در خواندن فایل.');
      }
    };
    reader.readAsText(file);
  };

  const toggleAutoBackup = () => {
    const newState = !autoBackupEnabled;
    setAutoBackupEnabled(newState);
    localStorage.setItem('auto_cloud_backup', newState.toString());
  };

  const handleFinalExit = () => {
    exitAllowed.current = true;
    setIsExited(true);
    setShowExitModal(false);
  };

  const handleRestart = () => {
    exitAllowed.current = false;
    setIsExited(false);
    window.history.pushState({ noExit: true }, '');
  };

  if (isExited) {
    return <GoodbyeView onRestart={handleRestart} />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
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
      />
    );
  }

  if (isVerifying) {
    return <LoadingView />;
  }

  if (!isApproved) {
    return <ApprovalView user={user} checkApproval={checkApproval} signOut={() => AuthService.signOut()} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <SimpleModeView onOpenBackup={() => setShowBackupModal(true)} />

      {/* مودال خروج تصادفی */}
      {showExitModal && (
        <ExitConfirmationModal 
          onConfirm={handleFinalExit}
          onCancel={() => setShowExitModal(false)}
        />
      )}

      {showBackupModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end md:items-center justify-center">
          <div className="absolute inset-0" onClick={() => { if (!cloudActionLoading) setShowBackupModal(false); }} />
          <div className="relative bg-white rounded-t-[2.5rem] md:rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col shadow-2xl p-8 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">مدیریت پشتیبانی و داده‌ها</h2>
              <button onClick={() => setShowBackupModal(false)} disabled={cloudActionLoading} className="p-2 hover:bg-slate-100 rounded-full disabled:opacity-50"><X size={20}/></button>
            </div>
            
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl flex items-center gap-3 border transition-all ${isStoragePersistent ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isStoragePersistent ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-200 text-slate-400'}`}>
                  {isStoragePersistent ? <ShieldCheck size={22} /> : <Database size={22} />}
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-bold">وضعیت حافظه: {isStoragePersistent ? 'دائمی و فوق امن' : 'معمولی (قابل پاک شدن)'}</div>
                  <div className="text-[9px] opacity-70 mt-0.5">{isStoragePersistent ? 'مرورگر داده‌های خیاطی شما را پاک نخواهد کرد.' : 'مرورگر ممکن است در صورت کمبود فضا داده‌ها را پاک کند.'}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">پشتیبان‌گیری ابری</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleCloudBackup} disabled={cloudActionLoading} className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center gap-2 group hover:bg-indigo-100 transition-all disabled:opacity-60">
                    {cloudActionLoading && cloudStatus.type === 'info' && cloudStatus.message.includes('ارسال') ? <Loader2 className="animate-spin text-indigo-600" size={24} /> : <UploadCloud className="text-indigo-600 group-hover:scale-110 transition-transform" />}
                    <span className="text-[10px] font-bold">ارسال به ابر</span>
                  </button>
                  <button onClick={handleCloudRestore} disabled={cloudActionLoading} className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center gap-2 group hover:bg-blue-100 transition-all disabled:opacity-60">
                    {cloudActionLoading && cloudStatus.type === 'info' && cloudStatus.message.includes('بازیابی') ? <Loader2 className="animate-spin text-blue-600" size={24} /> : <RefreshCw className="text-blue-600 group-hover:scale-110 transition-transform" />}
                    <span className="text-[10px] font-bold">بازیابی از ابر</span>
                  </button>
                </div>
                
                {cloudStatus.type && (
                  <div className={`p-3 rounded-xl text-[10px] font-bold flex items-center gap-2 ${cloudStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : cloudStatus.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                    {cloudStatus.message}
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                  <div className="text-[10px] font-bold text-slate-700">پشتیبان‌گیری خودکار ۲۴ ساعته</div>
                  <button onClick={toggleAutoBackup}>{autoBackupEnabled ? <ToggleRight size={32} className="text-indigo-600"/> : <ToggleLeft size={32} className="text-slate-300"/>}</button>
                </div>
              </div>

              <div className="space-y-4">
                 <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">پشتیبان‌گیری محلی</h3>
                 <div className="grid grid-cols-2 gap-3">
                   <button onClick={handleExportData} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center gap-2 hover:bg-emerald-100 transition-all">
                     <Download className="text-emerald-600" />
                     <span className="text-[10px] font-bold">دانلود فایل</span>
                   </button>
                   <label className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-100 transition-all">
                     <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
                     <UploadCloud className="text-slate-600" />
                     <span className="text-[10px] font-bold">بارگذاری فایل</span>
                   </label>
                 </div>
              </div>
              <button onClick={() => AuthService.signOut()} className="w-full py-5 bg-rose-50 text-rose-600 rounded-[1.5rem] font-black flex items-center justify-center gap-3 mt-4 hover:bg-rose-100 active:scale-95 transition-all shadow-lg shadow-rose-600/5"><LogOut size={22}/> خروج از حساب کاربری</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
