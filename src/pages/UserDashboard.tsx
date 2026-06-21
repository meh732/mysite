import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, ArrowRight, ShieldCheck, Download, Code, Globe2, 
  Loader2, Calendar, ShoppingBag, Coins, MessageSquare, AlertCircle, 
  Sparkles, User, Wallet, History, Ticket, PlusCircle, Send, 
  CheckCircle, Search, CreditCard, ChevronLeft, Plus, ExternalLink, LifeBuoy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Order } from '../types';
import { formatPrice } from './Home';
import ThemeSwitcher from '../components/ThemeSwitcher';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'services', 'products', 'wallet', 'tickets', 'profile', 'deploy'
  
  // Core Database lists
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({
    name: '',
    email: '',
    phone: '',
    address: '',
    telegramUsername: '',
    walletBalance: 0
  });

  // Load States
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', isError: false });

  // Input states for Ticket creation
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketBody, setTicketBody] = useState('');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Input states for Wallet Topup
  const [topupAmount, setTopupAmount] = useState('100000');
  const [cardHolder, setCardHolder] = useState('');
  const [walletSuccessMsg, setWalletSuccessMsg] = useState('');

  // Search & Filter state for Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Interactive Purchase Drawer/Dialog state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [purchaseDetails, setPurchaseDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'manual'>('wallet');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const userIdentifier = localStorage.getItem('userEmail') || localStorage.getItem('userPhone') || localStorage.getItem('userName') || '';
  const userName = profile?.name || localStorage.getItem('userName') || userIdentifier || 'کاربر گرامی';

  useEffect(() => {
    if (!userIdentifier) {
      navigate('/');
      return;
    }
    loadOrders();
    loadProfileAndWallet();
    loadTickets();
    loadProducts();
  }, [userIdentifier]);

  // Sync / Real-time Polling for simulated dynamic replies
  useEffect(() => {
    if (!userIdentifier) return;
    const interval = setInterval(() => {
      loadTickets();
    }, 4000);
    return () => clearInterval(interval);
  }, [userIdentifier, activeTicket]);

  const loadOrders = () => {
    setIsLoadingOrders(true);
    fetch(`/api/orders/user/${encodeURIComponent(userIdentifier)}`)
      .then(r => r.json())
      .then(data => {
        setOrders(data);
        setIsLoadingOrders(false);
      })
      .catch(() => {
        setIsLoadingOrders(false);
      });
  };

  const loadProfileAndWallet = () => {
    setIsLoadingWallet(true);
    fetch(`/api/profile?userIdentifier=${encodeURIComponent(userIdentifier)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.profile);
          if (data.profile.name) {
            localStorage.setItem('userName', data.profile.name);
          }
        }
        setIsLoadingWallet(false);
      })
      .catch(() => setIsLoadingWallet(false));

    fetch(`/api/wallet/transactions?userIdentifier=${encodeURIComponent(userIdentifier)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTransactions(data.transactions);
        }
      });
  };

  const loadTickets = () => {
    fetch(`/api/tickets?userIdentifier=${encodeURIComponent(userIdentifier)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTickets(data.tickets);
          if (activeTicket) {
            const upToDate = data.tickets.find((t: any) => t.id === activeTicket.id);
            if (upToDate) {
              setActiveTicket(upToDate);
            }
          }
        }
      });
  };

  const loadProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
      });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage({ text: '', isError: false });
    
    fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentIdentifier: userIdentifier,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        telegramUsername: profile.telegramUsername
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfileMessage({ text: 'مشخصات شما با موفقیت در دیتابیس ابری ثبت و ذخیره شد.', isError: false });
          setProfile(data.profile);
          if (data.profile.name) {
            localStorage.setItem('userName', data.profile.name);
          }
        } else {
          setProfileMessage({ text: data.message || 'خطا در ذخیره‌سازی اطلاعات.', isError: true });
        }
      })
      .catch(() => {
        setProfileMessage({ text: 'بروز خطا در برقراری ارتباط با پلتفرم.', isError: true });
      });
  };

  const handleTopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWalletSuccessMsg('');
    const amt = parseInt(topupAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      alert('مبلغ وارد شده صحیح نیست');
      return;
    }

    fetch('/api/wallet/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIdentifier,
        amount: amt,
        cardHolderName: cardHolder
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWalletSuccessMsg(`اعتبار حساب شما با همت شتاب شبیه‌سازی با موفقیت مبلغ ${amt.toLocaleString('fa-IR')} تومان افزایش یافت.`);
          setProfile(prev => ({ ...prev, walletBalance: data.walletBalance }));
          setTransactions(prev => [data.transaction, ...prev]);
          setCardHolder('');
        }
      });
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketBody.trim()) {
      alert('موضوع و متن تیکت نمی‌تواند خالی باشد.');
      return;
    }

    setIsCreatingTicket(true);
    fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIdentifier,
        title: ticketSubject,
        body: ticketBody,
        priority: ticketPriority
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTickets(prev => [data.ticket, ...prev]);
          setTicketSubject('');
          setTicketBody('');
          setTicketPriority('medium');
          setActiveTicket(data.ticket);
        }
        setIsCreatingTicket(false);
      })
      .catch(() => setIsCreatingTicket(false));
  };

  const handleSendTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketReplyText.trim() || !activeTicket) return;

    const replyText = ticketReplyText;
    setTicketReplyText('');

    fetch(`/api/tickets/${activeTicket.id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'user',
        text: replyText
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setActiveTicket(data.ticket);
          loadTickets();
        }
      });
  };

  const handleProductPurchase = () => {
    if (!selectedProduct) return;
    setIsPurchasing(true);
    setPurchaseError('');

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: selectedProduct.id,
        userIdentifier,
        additionalDetails: purchaseDetails,
        paymentMethod: paymentMethod
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPurchaseSuccess(true);
          loadOrders();
          loadProfileAndWallet();
          setPurchaseDetails('');
        } else {
          setPurchaseError(data.message || 'خطا در ثبت نهایی تراکنش.');
        }
        setIsPurchasing(false);
      })
      .catch(() => {
        setPurchaseError('خطای ناشناخته در ارتباط با درگاه سرور.');
        setIsPurchasing(false);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userName');
    navigate('/');
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 text-[10px] px-2.5 py-1 rounded-full font-bold">
            فعال و تحویل‌شده ✅
          </span>
        );
      case 'canceled':
        return (
          <span className="bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/30 text-[10px] px-2.5 py-1 rounded-full font-bold">
            لغو شده ✕
          </span>
        );
      default:
        return (
          <span className="bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30 text-[10px] px-2.5 py-1 rounded-full font-bold">
            در حال آماده‌سازی ⏳
          </span>
        );
    }
  };

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="bg-blue-500/10 text-blue-500 text-[10px] px-2.5 py-1 rounded-full border border-blue-500/30 font-bold">بررسی نشده</span>;
      case 'user-replied':
        return <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2.5 py-1 rounded-full border border-amber-500/30 font-bold">پاسخ کاربر</span>;
      case 'answered':
        return <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/30 font-bold">پاسخ داده شده</span>;
      default:
        return <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2.5 py-1 rounded-full font-bold">بسته شده</span>;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="text-red-500 font-bold">فوری</span>;
      case 'medium':
        return <span className="text-amber-500 font-bold">متوسط</span>;
      default:
        return <span className="text-zinc-500">معمولی</span>;
    }
  };

  const domainOptions = [
    { label: 'ثبت دامین اختصاصی ir. و com.', icon: <Globe2 className="w-5 h-5 text-blue-400" /> },
    { label: 'نصب گواهی امنیتی SSL (کاملا خودکار)', icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
  ];

  // Filters for online catalog
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 font-sans" dir="rtl">
      
      {/* Header Area */}
      <nav className="glass-panel !rounded-none !border-x-0 !border-t-0 px-6 py-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-zinc-400 hover:text-white transition-all cursor-pointer p-1.5 hover:bg-zinc-900 rounded-lg">
              <ArrowRight className="w-6 h-6 rotate-180" />
            </button>
            <div className="flex flex-col">
              <span className="font-bold text-lg sm:text-xl text-white">پنل کاربری دیجیتال استور</span>
              <span className="text-[10px] text-zinc-400 hidden sm:block">خرید هوشمندانه سرویس‌ها و پشتیبانی تیکت کارگزار</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quick theme switcher embedded cleanly */}
            <ThemeSwitcher />

            <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 border border-zinc-850 rounded-full">
              <User className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold tracking-wide text-zinc-200">{userName}</span>
            </div>

            <button onClick={handleLogout} className="text-xs bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 sm:px-4 py-2 rounded-xl transition-all font-medium cursor-pointer">
              خروج
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          
          {/* Quick Metrics Widget */}
          <div className="glass-panel p-5 mb-6 border border-zinc-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />
            <span className="text-[10px] text-zinc-400 block font-semibold mb-1">اعتبار کیف پول:</span>
            <span className="text-xl font-black text-emerald-400 font-sans tracking-wide">
              {profile ? profile.walletBalance?.toLocaleString('fa-IR') : '۰'} <span className="text-xs font-normal text-zinc-400">تومان</span>
            </span>
            <div className="mt-3.5 pt-3.5 border-t border-zinc-855/35 flex items-center justify-between text-[11px] text-zinc-400">
              <span>سرویس‌های من: {orders.length}</span>
              <span>تیکت‌ها: {tickets.length}</span>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 scrollbar-none whitespace-nowrap bg-zinc-900/10 p-1 lg:p-0 rounded-2xl lg:bg-transparent">
            {[
              { id: 'orders', label: 'سفارشات من', icon: <ShoppingBag className="w-4 h-4" /> },
              { id: 'services', label: 'سرویس‌های من', icon: <ShieldCheck className="w-4 h-4" /> },
              { id: 'products', label: 'کاتالوگ و خرید محصول', icon: <PlusCircle className="w-4 h-4" /> },
              { id: 'wallet', label: 'کیف پول من', icon: <Wallet className="w-4 h-4" /> },
              { id: 'tickets', label: 'تیکت‌های پشتیبانی', icon: <Ticket className="w-4 h-4" /> },
              { id: 'profile', label: 'مشخصات و پروفایل', icon: <User className="w-4 h-4" /> },
              { id: 'deploy', label: 'لینوکس و دیپلوی', icon: <Code className="w-4 h-4" /> }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'tickets') {
                    setActiveTicket(null);
                  }
                }}
                className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-start gap-4 flex-shrink-0 ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'text-zinc-400 bg-zinc-900/10 hover:bg-zinc-900 hover:text-white border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Dynamic Context Canvas */}
        <div className="flex-1 min-w-0">
          
          {/* TAB 1: ORDERS HISTORY */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black">تاریخچه فاکتورها و خریدها</h2>
                  <p className="text-xs text-zinc-400 mt-1">لیست تمام سفارشات پرداخت شده یا معلق ثبت شده در پلتفرم</p>
                </div>
                <button 
                  onClick={loadOrders} 
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 cursor-pointer"
                >
                  بروزرسانی داده‌ها ↻
                </button>
              </div>

              {isLoadingOrders ? (
                <div className="py-24 text-center flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-zinc-500 text-sm">در حال واکشی اطلاعات خرید...</span>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-5">
                  {orders.map((ord) => (
                    <div key={ord.id} className="glass-panel p-5 sm:p-6 border border-zinc-900/60 hover:border-zinc-800/80 transition-all">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-850/50 pb-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-zinc-500">کد سفارش: #{ord.id}</span>
                            <span className="text-[10px] bg-zinc-850 text-zinc-400 px-2 py-0.5 rounded font-mono">
                              {ord.productType === 'account' ? 'اکانت اشتراکی/اختصاصی' : 'سرویس توسعه سورس'}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-lg text-white mt-1.5">{ord.productTitle}</h3>
                        </div>
                        <div className="flex flex-col sm:items-end gap-1.5">
                          {getStatusBadge(ord.status)}
                          <span className="text-xs text-zinc-500 font-mono flex items-center gap-1 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(ord.createdAt).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl">
                        <span className="block text-xs font-semibold text-zinc-400">جزئیات و نیازها برای ثبت و دیپلوی:</span>
                        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{ord.additionalDetails || 'توضیحات یا پیوستی ثبت نشده است.'}</p>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
                        <div>
                          <span className="text-[10px] text-zinc-400 block">مبلغ نهایی:</span>
                          <span className="font-bold text-emerald-400 text-sm font-sans">{formatPrice(ord.price)}</span>
                        </div>
                        <button 
                          onClick={() => setActiveTab('tickets')} 
                          className="bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white px-4 py-2 border border-indigo-500/20 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>تیکت هماهنگی و پیگیری سورس</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-12 text-center border-dashed border border-zinc-800/80">
                  <ShoppingBag className="w-14 h-14 text-indigo-500/40 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-zinc-300">سفارشی ثبت نشده است</h3>
                  <p className="text-zinc-500 text-xs sm:text-sm max-w-sm mx-auto mt-2 mb-6 leading-relaxed">
                    در حال حاضر هیچ فاکتور خریدی برای شما ثبت نشده است. می‌توانید با مراجعه به منوی محصولات، سرویس مورد نظر خود را سفارش دهید.
                  </p>
                  <button 
                    onClick={() => setActiveTab('products')} 
                    className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    مشاهده کاتالوگ و خرید فوری
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: MY SERVICES */}
          {activeTab === 'services' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black">سرویس‌ها و اکانت‌های فعال من</h2>
                <p className="text-xs text-zinc-400 mt-1">کلیه لایسنس‌ها، اکانت‌ها و خدمات کدنویسی تایید شده و تحویل‌شده به شما</p>
              </div>

              {orders.filter(o => o.status === 'completed').length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {orders.filter(o => o.status === 'completed').map((ord) => (
                    <div key={ord.id} className="glass-panel p-5 border border-zinc-900 border-r-4 border-r-emerald-500">
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-[10px] text-zinc-400 font-mono">سرویس فعال #{ord.id}</span>
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/20 rounded">تحویل شده</span>
                      </div>
                      <h3 className="font-bold text-md text-white mb-2">{ord.productTitle}</h3>
                      
                      <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-900 text-xs space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">تاریخ فعالسازی:</span>
                          <span className="text-zinc-300 font-semibold">{new Date(ord.createdAt).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">نوع سرور/پورتکل:</span>
                          <span className="text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded font-mono text-[10px]">
                            {ord.productType === 'account' ? 'لایسنس/اکانت اختصاصی' : 'سورس گیت‌هاب آماده'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-900/60 mt-1">
                          <span className="text-zinc-500 font-bold block">مشخصات دسترسی و لایسنس:</span>
                          <div className="p-2 bg-zinc-900 text-zinc-300 rounded font-mono text-[10px] break-all select-all flex items-center justify-between">
                            <span>{ord.productType === 'account' ? 'Email: client@digital.store | Pass: Act732Pass' : 'Repository: git@github.com:meh732/mysite.git'}</span>
                            <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded cursor-pointer hover:bg-indigo-500 hover:text-white" onClick={() => alert('مشخصات در حافظه کپی شد.')}>کپی</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setActiveTab('tickets');
                          setTicketSubject(`مشکل فنی / راهنمایی درباره: ${ord.productTitle}`);
                        }}
                        className="w-full text-center py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/10 hover:border-indigo-500/20 rounded-lg text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        درخواست راهنمایی یا ارتقا لایسنس
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-12 text-center border-dashed border border-zinc-800/80">
                  <ShieldCheck className="w-14 h-14 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-zinc-300">هیچ سرویس فعالی موجود نیست</h3>
                  <p className="text-zinc-500 text-xs sm:text-sm max-w-sm mx-auto mt-2 mb-6">
                    پس از پرداخت و بررسی نیازها توسط مدیریت، سرویس‌های شما تحت این قسمت آماده استفاده و تحویل خواهند شد.
                  </p>
                  <button 
                    onClick={() => setActiveTab('products')} 
                    className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    خرید و فعال‌سازی سرویس جدید
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: PRODUCTS CATALOG */}
          {activeTab === 'products' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black">کاتالوگ محصولات و خرید فوری</h2>
                  <p className="text-xs text-zinc-400 mt-1">خريد و تحويل فوری لایسنس هوش مصنوعی، اکانت‌های پریمیوم و خدمات توسعه</p>
                </div>
                
                {/* Simulated category pills */}
                <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl text-xs gap-1.5 self-stretch sm:self-auto">
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${selectedCategory === 'all' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    همه
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('account')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${selectedCategory === 'account' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    اکانت‌ها
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('service')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${selectedCategory === 'service' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    خدمات توسعه
                  </button>
                </div>
              </div>

              {/* Search bar inside dashboard catalog */}
              <div className="relative">
                <Search className="absolute right-4.5 top-3.5 w-5 h-5 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="جستجو در بین اکانت‌ها، ربات‌ها، طراحی سایت و سیستم لایسنس..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/30 border border-zinc-850/60 rounded-2xl pr-12 pl-4 py-3 text-sm focus:border-indigo-500 outline-none transition-colors"
                />
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {filteredProducts.map((prod) => (
                    <div key={prod.id} className="glass-panel p-5.5 flex flex-col justify-between border border-zinc-900/60 hover:border-zinc-800 transition-all group">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${prod.type === 'account' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-purple-500/15 text-purple-400'}`}>
                            {prod.type === 'account' ? 'اکانت اشتراکی / اختصاصی' : 'خدمات برنامه نویسی و سرور'}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono font-bold">کد محصول: {prod.id}</span>
                        </div>
                        <h3 className="text-base font-extrabold text-white mt-1 group-hover:text-indigo-400 transition-colors">{prod.title}</h3>
                        <p className="sky-400 text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">{prod.desc}</p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-zinc-850/40 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-zinc-500 block">بهای محصول:</span>
                          <span className="text-emerald-400 font-black tracking-wide text-xs sm:text-base font-sans">{prod.price}</span>
                        </div>
                        
                        <button 
                          onClick={() => {
                            setSelectedProduct(prod);
                            setPurchaseSuccess(false);
                            setPurchaseError('');
                            setPurchaseDetails('');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-indigo-600/5"
                        >
                          <span>سفارش فوری</span>
                          <ChevronLeft className="w-4 h-4 rotate-180" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-zinc-500">
                  <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <span className="text-xs">هیچ محصولی مطابق با فیلتر یا جستجوی شما یافت نشد!</span>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: WALLET */}
          {activeTab === 'wallet' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-black">کیف پول دیجیتال من</h2>
                <p className="text-xs text-zinc-400 mt-1">مدیریت اعتبار، شارژ آنلاین شبیه‌سازی شتاب و بررسی تاریخچه تراکنش‌های مالی</p>
              </div>

              {/* Wallet Card Design */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1 bg-gradient-to-br from-indigo-700 to-indigo-950 p-6 rounded-2xl border border-indigo-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between h-48">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 blur-3xl rounded-full" />
                  <div className="flex justify-between items-center z-10">
                    <span className="text-[10px] text-indigo-200 tracking-wider font-extrabold uppercase">Digital Store Wallet</span>
                    <Coins className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div className="z-10">
                    <span className="text-[10px] text-indigo-200 block">مانده اعتبار فعلی شما:</span>
                    <span className="text-2xl font-black font-sans leading-none tracking-wide text-white">
                      {profile.walletBalance?.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
                    </span>
                  </div>
                  <div className="z-10 text-[9px] text-indigo-300 font-mono">
                    Owner: {userName}
                  </div>
                </div>

                {/* Wallet Balance Top-up */}
                <div className="md:col-span-2 glass-panel p-5.5 border border-zinc-900/60 flex flex-col justify-between">
                  <form onSubmit={handleTopupSubmit} className="space-y-4">
                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                      افزایش موجودی شبیه‌ساز (شتاب)
                    </span>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-1.5">مبلغ شارژ (تومان):</label>
                        <select 
                          value={topupAmount} 
                          onChange={(e) => setTopupAmount(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 text-zinc-200 transition-colors"
                        >
                          <option value="50000">۵۰,۰۰۰ تومان</option>
                          <option value="100000">۱۰۰,۰۰۰ تومان</option>
                          <option value="200000">۲۰۰,۰۰۰ تومان</option>
                          <option value="500000">۵۰۰,۰۰۰ تومان</option>
                          <option value="1000000">۱,۰۰۰,۰۰۰ تومان</option>
                          <option value="2000000">۲,۰۰۰,۰۰۰ تومان</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-1.5">نام فرضی دارنده کارت:</label>
                        <input 
                          type="text" 
                          required
                          placeholder="مثلا: محمد علوی"
                          value={cardHolder} 
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 text-zinc-250 transition-colors"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer"
                    >
                      اتصال فرضی به درگاه و افزایش اعتبار
                    </button>
                  </form>

                  {walletSuccessMsg && (
                    <div className="mt-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl">
                      {walletSuccessMsg}
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Logs */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-zinc-400" />
                  ریز تراکنش‌های مالی حساب شما
                </h3>

                {transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-850 text-zinc-500">
                          <th className="pb-3 font-semibold">شناسه تراکنش</th>
                          <th className="pb-3 font-semibold">شرح تراکنش</th>
                          <th className="pb-3 font-semibold">نوع</th>
                          <th className="pb-3 font-semibold text-left">مبلغ (تومان)</th>
                          <th className="pb-3 font-semibold text-center">زمان ثبت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 text-zinc-300">
                        {transactions.map((tr) => (
                          <tr key={tr.id} className="hover:bg-zinc-900/15">
                            <td className="py-3 font-mono text-zinc-500">#{tr.id}</td>
                            <td className="py-3 font-medium">{tr.description}</td>
                            <td className="py-3">
                              {tr.type === 'credit' ? (
                                <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">واریز</span>
                              ) : (
                                <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">برداشت</span>
                              )}
                            </td>
                            <td className={`py-3 text-left font-black font-sans ${tr.type === 'credit' ? 'text-emerald-400' : 'text-zinc-200'}`}>
                              {tr.type === 'credit' ? '+' : '-'}{tr.amount?.toLocaleString('fa-IR')}
                            </td>
                            <td className="py-3 text-center text-zinc-500 font-mono">
                              {new Date(tr.createdAt).toLocaleDateString('fa-IR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="glass-panel p-8 text-center text-zinc-500 border-dashed border border-zinc-850">
                    تراکنشی در حساب شما ثبت نشده است.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 5: TICKETS SUPPORT */}
          {activeTab === 'tickets' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {!activeTicket ? (
                // Ticket Listing & Submission UI
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black">پشتیبانی و تیکت‌ها</h2>
                      <p className="text-xs text-zinc-400 mt-1">ارسال مشکلات فنی، سوالات قبل از خرید و ارتقای پلن‌های فعال</p>
                    </div>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-5">
                    
                    {/* Submit ticket form */}
                    <div className="lg:col-span-2 glass-panel p-5.5 border border-zinc-900/60 self-start">
                      <form onSubmit={handleCreateTicket} className="space-y-4">
                        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                          <Plus className="w-4 h-4 text-indigo-400" />
                          ارسال تیکت جدید به کارشناسان
                        </span>

                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1.5">موضوع تیکت:</label>
                          <input 
                            type="text"
                            required
                            placeholder="مثلا: درخواست کانفیگ مجدد ربات تلگرام"
                            value={ticketSubject}
                            onChange={(e) => setTicketSubject(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 text-zinc-200 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1.5">اولویت تیکت پشتیبانی:</label>
                          <select 
                            value={ticketPriority} 
                            onChange={(e) => setTicketPriority(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 text-zinc-200 transition-colors"
                          >
                            <option value="low">معمولی</option>
                            <option value="medium">متوسط</option>
                            <option value="high">فوری / اضطراری</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1.5 font-sans">توضیحات و شرح تیکت:</label>
                          <textarea 
                            rows={4}
                            required
                            placeholder="جزئیات دقیقی در رابطه با لایسنس یا مشکل دامنه‌های خود بنویسید..."
                            value={ticketBody}
                            onChange={(e) => setTicketBody(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 text-zinc-200 transition-colors"
                          />
                        </div>

                        <button 
                          type="submit" 
                          disabled={isCreatingTicket}
                          className="w-full bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isCreatingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>ارسال تیکت پشتیبانی</span>
                        </button>
                      </form>
                    </div>

                    {/* Historical Tickets list */}
                    <div className="lg:col-span-3 space-y-4">
                      <h3 className="font-extrabold text-base flex items-center gap-2">
                        <LifeBuoy className="w-5 h-5 text-zinc-400" />
                        مکاتبات قبلی شما با پشتیبانی
                      </h3>

                      {tickets.length > 0 ? (
                        <div className="space-y-3.5">
                          {tickets.map((t) => (
                            <div 
                              key={t.id} 
                              onClick={() => setActiveTicket(t)}
                              className="glass-panel p-4.5 border border-zinc-900 hover:border-indigo-500/25 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className="text-[10px] text-zinc-500 font-mono">شناسه تیکت: #{t.id}</span>
                                  {getTicketStatusBadge(t.status)}
                                </div>
                                <h4 className="font-bold text-sm text-zinc-200 group-hover:text-indigo-400 transition-colors truncate">{t.title}</h4>
                                <span className="text-[10px] text-zinc-500 block mt-1">اولویت تیکت: {getPriorityText(t.priority)} | بروزرسانی: {new Date(t.createdAt).toLocaleDateString('fa-IR')}</span>
                              </div>
                              <ChevronLeft className="w-5 h-5 text-zinc-600 group-hover:text-indigo-400 transition-colors transform group-hover:-translate-x-1" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="glass-panel p-12 text-center text-zinc-500 border-dashed border border-zinc-850">
                          شما مکاتبه یا تیکت ثبت شده‌ای در حساب خود ندارید!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Ticket Message/Chat Thread view
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTicket(null)}
                        className="p-1 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        بازگشت به لیست تیکت‌ها
                      </button>
                      <div>
                        <h3 className="font-extrabold text-base text-zinc-200">{activeTicket.title}</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">شناسه گفتگو: #{activeTicket.id} | اولویت تیکت: {getPriorityText(activeTicket.priority)}</p>
                      </div>
                    </div>
                    {getTicketStatusBadge(activeTicket.status)}
                  </div>

                  {/* Replies thread container */}
                  <div className="glass-panel p-6 bg-zinc-900/10 min-h-[300px] max-h-[500px] overflow-y-auto space-y-4">
                    {activeTicket.replies && activeTicket.replies.map((reply: any, index: number) => {
                      const isAdmin = reply.sender === 'admin';
                      return (
                        <div key={index} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm shadow-md ${
                            isAdmin 
                              ? 'bg-zinc-900 text-zinc-200 rounded-tr-sm border border-zinc-800' 
                              : 'bg-indigo-600 text-white rounded-tl-sm'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-black text-[10px]">
                                {isAdmin ? '🎯 کارشناس پشتیبانی فنی' : profile && profile.name ? profile.name : 'شما (کاربر)'}
                              </span>
                              <span className="text-[8px] opacity-70">
                                {reply.createdAt ? new Date(reply.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="leading-relaxed font-normal">{reply.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Send reply form */}
                  <form onSubmit={handleSendTicketReply} className="flex gap-3">
                    <input 
                      type="text"
                      required
                      placeholder="متن پاسخ خود را به کارشناسان تیکت تایپ کنید..."
                      value={ticketReplyText}
                      onChange={(e) => setTicketReplyText(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none focus:border-indigo-500 text-zinc-200 transition-colors"
                    />
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                    >
                      ارسال پاسخ تیکت
                    </button>
                  </form>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* TAB 6: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black">اطلاعات کاربری من</h2>
                <p className="text-xs text-zinc-400 mt-1 font-normal">مشخصات اصلی خود را برای صدور اکانت‌ها و هماهنگی ربات تکیمل و بروزرسانی نمایید</p>
              </div>

              <div className="glass-panel p-5.5 sm:p-7 border border-zinc-900/60 max-w-2xl">
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1.5">نام و نام خانوادگی:</label>
                      <input 
                        type="text" 
                        required
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="وارد نشده است"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 text-zinc-250 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1.5">آدرس ایمیل:</label>
                      <input 
                        type="email" 
                        disabled={userIdentifier.includes('@')}
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        placeholder="نشانی فرضی ایمیل شما"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 text-zinc-250 disabled:opacity-50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1.5">شماره تلفن همراه:</label>
                      <input 
                        type="text" 
                        disabled={!userIdentifier.includes('@') && !!userIdentifier}
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="پیش شماره فرضی همراه"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 text-zinc-150 disabled:opacity-50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1.5">آیدی تلگرام شما:</label>
                      <input 
                        type="text" 
                        placeholder="مثلا: @myusername"
                        value={profile.telegramUsername}
                        onChange={(e) => setProfile({ ...profile, telegramUsername: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 text-zinc-250 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1.5">آدرس جهت هماهنگی و مستندات نصب یا تحویل:</label>
                    <textarea 
                      rows={3}
                      placeholder="اگر نیاز به ارسال مستندات فیزیکی یا هماهنگی محلی است، اینجا آدرس را تکمیل فرمایید..."
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 text-zinc-200 transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2">
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/5"
                    >
                      ثبت و ذخیره تغییرات پروفایل
                    </button>

                    {profileMessage.text && (
                      <span className={`text-[11px] font-bold ${profileMessage.isError ? 'text-red-500' : 'text-emerald-400'}`}>
                        {profileMessage.text}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* TAB 7: DEPLOY BASH MENU */}
          {activeTab === 'deploy' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-3">
                <Code className="text-indigo-400" />
                دیپلوی سیستم (Github / Linux Menu / Bash)
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm">جهت نصب و راه اندازی یا آپدیت دستی وب‌سایت و ربات بر روی سرور لینوکس تمیز از کانفیگ ما استفاده کنید:</p>
              
              <div className="glass-panel p-5 sm:p-6 font-mono text-sm space-y-4">
                <div className="p-4 bg-zinc-950 rounded-xl text-zinc-300 overflow-x-auto border border-zinc-900" dir="ltr">
                  $ bash &lt;(curl -sL https://raw.githubusercontent.com/meh732/mysite/main/install.sh)
                </div>

                <div className="flex items-start gap-3 text-emerald-400 bg-emerald-450/5 border border-emerald-500/10 p-4 rounded-xl">
                  <Download className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
                  <div className="text-xs sm:text-sm leading-relaxed text-emerald-400/90">
                    <p className="font-extrabold text-emerald-300 mb-1">منوی خودکار تعاملی لینوکس</p>
                    <p>این اسکریپت به درستی کشیده شدن آخرین بسته‌ها، پکیج‌ها و متغیرهای تلگرام را بررسی می‌کند:</p>
                    <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                      <li>نصب سیستم (Install) - بررسی وابستگی‌ها روی لینوکس اوبونتو تمیز</li>
                      <li>آپدیت (Update) - کشیدن آخرین تغییرات کدهای شما و همگام سازی</li>
                      <li>حذف سرویس (Uninstall) - پاک کردن کامل فرآیندها و تنظیمات معلق</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {/* MODAL: DIRECT NEW PRODUCT PURCHASE DRAWER */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel p-6 max-w-lg w-full z-10 border border-zinc-800 bg-zinc-900/95 relative shadow-2xl"
            >
              {!purchaseSuccess ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                    <h3 className="font-extrabold text-white text-base">درخواست سفارش محصول جدید</h3>
                    <button 
                      onClick={() => setSelectedProduct(null)} 
                      className="text-zinc-400 hover:text-white cursor-pointer font-bold text-sm bg-zinc-850 w-6 h-6 flex items-center justify-center rounded-full"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-900">
                    <span className="text-[10px] text-zinc-500 block">عنوان محصول انتخابی:</span>
                    <span className="font-bold text-sm text-indigo-400">{selectedProduct.title}</span>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{selectedProduct.desc}</p>
                    <div className="mt-3.5 pt-3 border-t border-zinc-900/60 flex justify-between items-center text-xs">
                      <span className="text-zinc-500">قیمت محصول:</span>
                      <span className="font-black text-emerald-400 font-sans">{selectedProduct.price}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1.5 font-bold">توضیحات تکمیلی یا الزامات سفارش شما:</label>
                      <textarea 
                        rows={3} 
                        value={purchaseDetails}
                        onChange={(e) => setPurchaseDetails(e.target.value)}
                        placeholder="مثلا: آدرس ایمیل انتخابی من برای دریافت لایسنس یا اکانت..."
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 text-zinc-200 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[11px] text-zinc-500 font-bold">روش پرداخت هزینه سفارش:</span>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${paymentMethod === 'wallet' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400' : 'border-zinc-800 hover:bg-zinc-900/40 text-zinc-400'}`}>
                          <input 
                            type="radio" 
                            name="payMethod" 
                            checked={paymentMethod === 'wallet'}
                            onChange={() => setPaymentMethod('wallet')}
                            className="accent-emerald-500"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold">کسر از کیف پول</span>
                            <span className="text-[9px] opacity-70">موجودی: {profile.walletBalance?.toLocaleString('fa-IR')} تومان</span>
                          </div>
                        </label>

                        <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${paymentMethod === 'manual' ? 'border-indigo-500 bg-indigo-500/5 text-indigo-400' : 'border-zinc-800 hover:bg-zinc-900/40 text-zinc-400'}`}>
                          <input 
                            type="radio" 
                            name="payMethod" 
                            checked={paymentMethod === 'manual'}
                            onChange={() => setPaymentMethod('manual')}
                            className="accent-indigo-500"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold">واریز کارت به کارت</span>
                            <span className="text-[9px] opacity-70">واریز و گواهی بانکی دستی</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {purchaseError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{purchaseError}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setSelectedProduct(null)}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer"
                    >
                      انصراف از سفارش
                    </button>
                    <button 
                      onClick={handleProductPurchase}
                      disabled={isPurchasing}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 text-white rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      {isPurchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      <span>تایید و پرداخت نهایی</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white">تراکنش و خرید با موفقیت ثبت شد!</h3>
                  
                  <p className="text-zinc-400 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                    {paymentMethod === 'wallet' 
                      ? 'بهای سفارش با موفقیت از اعتبار کیف پول دیجیتال کسر گردید. سرویس شما بلافاصله فعال شد و از منوی "سرویس‌های من" و تیکت‌ها قابل مدیریت است.' 
                      : 'درخواست سفارش با موفقیت ثبت گردید. پس از هماهنگی اطلاعات و مدارک واریز با ادمین، سرویس فعال خواهد شد.'}
                  </p>

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => {
                        setSelectedProduct(null);
                        setActiveTab(paymentMethod === 'wallet' ? 'services' : 'orders');
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer"
                    >
                      {paymentMethod === 'wallet' ? 'برو به بخش سرویس‌های من' : 'برو به فاکتورها'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
