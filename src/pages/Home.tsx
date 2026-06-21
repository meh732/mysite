import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Apple, Bot, MessagesSquare, Smartphone, Globe, ShoppingCart, 
  ChevronLeft, ShieldCheck, Store, LayoutDashboard, User, 
  Palette, Code, CheckCircle2, Loader2, Coins, ArrowRight, HelpCircle
} from 'lucide-react';
import { Product } from '../types';
import { Link, useNavigate } from 'react-router-dom';

const IconMap: Record<string, React.ReactNode> = {
  Apple: <Apple className="w-8 h-8 text-white" />,
  Bot: <Bot className="w-8 h-8 text-emerald-400" />,
  Palette: <Palette className="w-8 h-8 text-purple-400" />,
  Globe: <Globe className="w-8 h-8 text-blue-400" />,
  MessageCircle: <MessagesSquare className="w-8 h-8 text-sky-400" />,
  Smartphone: <Smartphone className="w-8 h-8 text-orange-400" />
};

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [enableMobileLogin, setEnableMobileLogin] = useState(false);
  
  // Reusable inline Toast system instead of iframe-blocked alerts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({ message: '', type: null });
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev.message === message ? { message: '', type: null } : prev);
    }, 4500);
  };
  
  // --- Active Lot/Product Detail Modal State ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [customDomain, setCustomDomain] = useState(false);
  const [deployEnv, setDeployEnv] = useState('Telegram & Bale');
  const [quantity, setQuantity] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const isLogged = !!localStorage.getItem('userEmail') || !!localStorage.getItem('userPhone');
  const userIdentifier = localStorage.getItem('userEmail') || localStorage.getItem('userPhone') || '';

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => setProducts(d));

    fetch('/api/config')
      .then(r => r.json())
      .then(d => setEnableMobileLogin(d.enableMobileLogin));
  }, []);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMethod === 'email' && !email.includes('@')) return;
    if (loginMethod === 'phone' && phone.length < 10) return;
    
    const url = loginMethod === 'email' ? '/api/auth/email/send' : '/api/auth/phone/send';
    const body = loginMethod === 'email' ? { email } : { phone };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(r => r.json())
    .then(res => {
      if(res.success) {
        setOtpSent(true);
        if (loginMethod === 'phone') {
          showToast('کد تایید ۲ عاملی به تلگرام و بله شما فرستاده شد (ربات را ابتدا استارت کنید)', 'success');
        } else {
          showToast('کد ورود به ایمیل شما فرستاده شد.', 'success');
        }
      } else {
        showToast(res.message || 'خطا در ارسال کد', 'error');
      }
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) return;
    
    const url = loginMethod === 'email' ? '/api/auth/email/verify' : '/api/auth/phone/verify';
    const body = loginMethod === 'email' ? { email, code: otpCode } : { phone, code: otpCode };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(r => r.json())
    .then(res => {
      if(res.success) {
        if (loginMethod === 'email') {
          localStorage.setItem('userEmail', email);
        } else {
          localStorage.setItem('userPhone', phone);
        }
        setIsLoginModalOpen(false);
        // Clear OTP states
        setOtpSent(false);
        setOtpCode('');
        
        // If not in middle of buying a lot, go to dashboard
        if (!selectedProduct) {
          navigate('/dashboard');
        }
      } else {
        showToast(res.message || 'کد وارد شده نامعتبر است', 'error');
      }
    });
  };

  const handlePlaceOrder = () => {
    if (!selectedProduct) return;
    const activeUser = localStorage.getItem('userEmail') || localStorage.getItem('userPhone');
    if (!activeUser) return;

    setIsSubmittingOrder(true);
    
    let details = '';
    if (selectedProduct.type === 'service') {
      details = `نیاز به دامین اختصاصی: ${customDomain ? 'بله' : 'خیر'} | بستر میزبانی: ${deployEnv} | توضیحات اجمالی: ${additionalDetails}`;
    } else {
      details = `تعداد درخواستی: ${quantity} عدد | یادداشت خریدار: ${additionalDetails}`;
    }

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: selectedProduct.id,
        userIdentifier: activeUser,
        additionalDetails: details
      })
    })
    .then(r => r.json())
    .then(res => {
      setIsSubmittingOrder(false);
      if (res.success) {
        setOrderSuccess(res.order);
        setAdditionalDetails('');
        setCustomDomain(false);
        setQuantity(1);
        showToast('سفارش شما با موفقیت ثبت شد!', 'success');
      } else {
        showToast(res.message || 'خطا در ثبت سفارش', 'error');
      }
    })
    .catch(() => {
      setIsSubmittingOrder(false);
      showToast('خطا در ارتباط با وب‌سرور دیتابیس', 'error');
    });
  };

  // Only show active lots! (Filter active !== false)
  const accounts = products.filter(p => p.type === 'account' && p.active !== false);
  const services = products.filter(p => p.type === 'service' && p.active !== false);

  return (
    <div className="min-h-screen pb-24 relative bg-zinc-950 text-zinc-100">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toast.message && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 right-6 md:right-auto md:left-6 z-[100] max-w-sm"
          >
            <div className={`p-4 rounded-2xl backdrop-blur-xl border shadow-xl flex items-center justify-between gap-3 ${
              toast.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300 shadow-emerald-950/20' 
                : toast.type === 'error' 
                ? 'bg-red-950/90 border-red-500/40 text-red-300 shadow-red-950/20' 
                : 'bg-zinc-900/90 border-zinc-700/50 text-indigo-300 shadow-zinc-950/20'
            }`}>
              <span className="text-xs font-semibold">{toast.message}</span>
              <button 
                onClick={() => setToast({ message: '', type: null })}
                className="text-zinc-400 hover:text-white cursor-pointer text-sm font-bold bg-zinc-800/50 w-6 h-6 flex items-center justify-center rounded-full"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass-panel !rounded-none !border-x-0 !border-t-0 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Store className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">دیجیتال استور</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">ورود مدیران</span>
            </Link>

            {isLogged ? (
              <button onClick={() => navigate('/dashboard')} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all shadow-md shadow-indigo-500/10 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>پنل من ({userIdentifier.split('@')[0]})</span>
              </button>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="bg-white text-black px-5 py-2.5 rounded-full font-medium text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2">
                <User className="w-4 h-4" />
                ورود / عضویت
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 left-4 text-zinc-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">ورود به حساب</h3>
                <p className="text-sm text-zinc-400">برای پیگیری سفارشات و پشتیبانی وارد شوید</p>
              </div>
              
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                {!otpSent ? (
                  <>
                    {enableMobileLogin && (
                      <div className="flex bg-zinc-900 rounded-xl p-1 mb-6">
                        <button type="button" onClick={() => setLoginMethod('email')} className={`flex-1 py-2 text-sm rounded-lg transition-colors ${loginMethod === 'email' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>ایمیل</button>
                        <button type="button" onClick={() => setLoginMethod('phone')} className={`flex-1 py-2 text-sm rounded-lg transition-colors ${loginMethod === 'phone' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>موبایل</button>
                      </div>
                    )}

                    {loginMethod === 'email' ? (
                      <div>
                        <input 
                          type="email" 
                          placeholder="ایمیل خود را وارد کنید..."
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          dir="ltr"
                          className="w-full bg-zinc-900 border border-zinc-805/40 text-white focus:border-indigo-500 rounded-xl px-4 py-3 text-center outline-none transition-colors"
                        />
                      </div>
                    ) : (
                      <div>
                        <input 
                          type="tel" 
                          placeholder="موبایل (مثال: 09121234567)"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          dir="ltr"
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-center outline-none transition-colors"
                        />
                      </div>
                    )}
                    <button 
                      type="submit"
                      disabled={loginMethod === 'email' ? !email.includes('@') : phone.length < 10}
                      className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-colors cursor-pointer"
                    >
                      دریافت کد تایید
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-center mb-3">کد تایید به {loginMethod === 'email' ? 'ایمیل' : 'پیام‌رسان'} ارسال شد.</p>
                      <input 
                        type="text" 
                        placeholder="کد تایید..."
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        dir="ltr"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-center tracking-widest outline-none transition-colors"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={otpCode.length < 4}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-colors cursor-pointer"
                    >
                      ورود به حساب
                    </button>
                    <button 
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-full text-zinc-400 hover:text-white text-sm mt-2 cursor-pointer"
                    >
                      تغییر {loginMethod === 'email' ? 'ایمیل' : 'شماره'}
                    </button>
                  </>
                )}
              </form>
              
              <p className="text-xs text-zinc-500 text-center mt-6">
               شما همچنین میتوانید مستقیما از طریق ربات‌های تلگرام و بله وارد سایت شوید.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 mt-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          >
            آینده دیجیتال خود را <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              همین امروز بسازید
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg md:text-xl"
          >
            خرید آنی اپل آیدی ایمن، اکانت‌های هوش مصنوعی (ChatGPT، Midjourney) 
            و سفارش اختصاصی طراحی سایت، بات تلگرام/بله و اپلیکیشن اندروید.
          </motion.p>
        </div>

        {/* Categories / Products */}
        <div className="space-y-20">
          
          {/* Accounts */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-indigo-400 animate-pulse" />
                اکانت‌های آماده (تحویل خودکار)
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((prod, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  key={prod.id} 
                  onClick={() => { setSelectedProduct(prod); setOrderSuccess(null); }}
                  className="glass-panel p-6 hover:border-indigo-500/50 transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5"
                >
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800/40 flex items-center justify-center mb-6 border border-zinc-800/80 group-hover:scale-105 group-hover:border-indigo-500/30 transition-all">
                    {IconMap[prod.icon] || <Coins className="text-indigo-400 w-8 h-8" />}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-100 group-hover:text-indigo-300 transition-colors">{prod.title}</h3>
                  <p className="text-zinc-400 text-sm mb-6 h-10 line-clamp-2">{prod.desc}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-800/50">
                    <span className="text-indigo-400 font-bold">{prod.price}</span>
                    <button className="w-10 h-10 rounded-full bg-zinc-900 group-hover:bg-indigo-500 border border-zinc-800 group-hover:border-indigo-400 flex items-center justify-center transition-colors">
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </motion.div>
              ))}
              {accounts.length === 0 && (
                <div className="col-span-full text-center py-12 text-zinc-500">اکانت فعالی در حال حاضر ثبت نشده است.</div>
              )}
            </div>
          </section>

          {/* Services */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Code className="w-6 h-6 text-purple-400" />
                سفارش خدمات توسعه (طراحی اختصاصی)
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((prod, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (i * 0.08) }}
                  key={prod.id}
                  onClick={() => { setSelectedProduct(prod); setOrderSuccess(null); }}
                  className="glass-panel p-6 hover:border-purple-500/50 transition-all duration-300 group cursor-pointer flex flex-col hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5"
                >
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800/40 flex items-center justify-center mb-6 border border-zinc-800/80 group-hover:border-purple-500/30 transition-all">
                    {IconMap[prod.icon] || <Code className="text-purple-400 w-8 h-8" />}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-100 group-hover:text-purple-300 transition-colors">{prod.title}</h3>
                  <p className="text-zinc-400 text-sm mb-6 flex-grow line-clamp-3">{prod.desc}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-800/50">
                    <span className="text-zinc-300 font-medium text-sm">شروع قیمت: {prod.price}</span>
                    <button className="text-sm text-purple-400 font-medium hover:text-purple-300 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                      <span>مشاوره و سفارش</span> 
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
              {services.length === 0 && (
                <div className="col-span-full text-center py-12 text-zinc-500">خدمات فعالی در حال حاضر ثبت نشده است.</div>
              )}
            </div>
          </section>

        </div>
      </main>

      {/* --- Glassmorphic Checkout and Lot Menus (شیشه‌ای و راحت) --- */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-md overflow-y-auto pt-10 pb-10">
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative my-auto"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 left-4 text-zinc-400 hover:text-white cursor-pointer w-8 h-8 flex items-center justify-center bg-zinc-950/60 rounded-full border border-zinc-800 hover:bg-zinc-800 transition-colors z-10"
              >
                ✕
              </button>

              {!orderSuccess ? (
                <div>
                  {/* Product Header */}
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-800/60">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center shadow-inner">
                      {IconMap[selectedProduct.icon] || <Coins className="text-indigo-400 w-8 h-8" />}
                    </div>
                    <div>
                      <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10">
                        {selectedProduct.type === 'account' ? 'اکانت آماده' : 'سرویس توسعه نرم‌افزار'}
                      </span>
                      <h3 className="text-2xl font-bold mt-1 text-white">{selectedProduct.title}</h3>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6 bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-xl">
                    <h4 className="text-sm text-zinc-400 mb-2 flex items-center gap-1.5 font-medium">
                      <HelpCircle className="w-4 h-4 text-zinc-400" /> توضیحات و جزئیات محصول:
                    </h4>
                    <p className="text-sm text-zinc-300 leading-relaxed font-normal">{selectedProduct.desc}</p>
                  </div>

                  {/* Product Specific Menu Fields */}
                  {selectedProduct.type === 'account' ? (
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/40">
                        <div>
                          <label className="block text-sm font-bold text-zinc-300">تعداد محصول درخواستی</label>
                          <span className="text-xs text-zinc-500">تحویل آنی بلافاصله پس از پرداخت</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center cursor-pointer text-base select-none"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-lg font-mono">{quantity}</span>
                          <button 
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center cursor-pointer text-base select-none"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-zinc-300">یادداشت خریدار (اختیاری)</label>
                        <input 
                          type="text" 
                          placeholder="مثلاً: ایمیل شخصی جهت ساخت اکانت جدید"
                          value={additionalDetails}
                          onChange={e => setAdditionalDetails(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800/60 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm outline-none transition-colors"
                        />
                      </div>
                    </div>
                  ) : (
                    // Services Specific Selection Fields
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/40 flex flex-col justify-between">
                          <div>
                            <span className="block text-sm font-bold text-zinc-300">دامین اختصاصی</span>
                            <span className="text-[10px] text-zinc-500">خرید دامنه ir. یا com.</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setCustomDomain(!customDomain)}
                            className={`w-full py-1.5 mt-3 text-xs rounded-lg transition-colors font-semibold ${customDomain ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'bg-zinc-800 text-zinc-400 border border-zinc-800'}`}
                          >
                            {customDomain ? 'نیاز دارم + خرید' : 'نیازی ندارم'}
                          </button>
                        </div>

                        <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/40 flex flex-col justify-between">
                          <div>
                            <span className="block text-sm font-bold text-zinc-300">بستر میزبانی</span>
                            <span className="text-[10px] text-zinc-500">نحوه اجرای ربات/سایت</span>
                          </div>
                          <select 
                            value={deployEnv} 
                            onChange={e => setDeployEnv(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg block w-full p-2 mt-2 outline-none"
                          >
                            <option value="Telegram & Bale">هر دو پیام‌رسان</option>
                            <option value="Telegram Only">فقط تلگرام</option>
                            <option value="Bale Only">فقط پیام‌رسان بله</option>
                            <option value="Web Servers">سرور اختصاصی وب</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-zinc-300">بیان نیازمندی‌ها و سناریوهای ربات/سایت</label>
                        <textarea 
                          rows={3}
                          placeholder="توضیحات کلی از امکاناتی که مدنظر دارید بنویسید تا بررسی شده و زمان‌بندی تحویل مشخص گردد..."
                          value={additionalDetails}
                          onChange={e => setAdditionalDetails(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800/60 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                        ></textarea>
                      </div>
                    </div>
                  )}

                  {/* Summary / Price Box */}
                  <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/60 mb-6">
                    <span className="text-sm text-zinc-400">مجموع هزینه حدودی:</span>
                    <span className="text-xl font-bold text-emerald-400">
                      {selectedProduct.type === 'account' ? `${(parseInt(selectedProduct.price.replace(/[^\d]/g, '')) * quantity).toLocaleString('fa-IR')} تومان` : selectedProduct.price}
                    </span>
                  </div>

                  {/* Authentification inside checkout flow (if not logged in) */}
                  {!isLogged ? (
                    <div className="border-t border-zinc-800/60 pt-6">
                      <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-4 rounded-xl mb-4 text-xs leading-relaxed text-center">
                        برقراری هماهنگی، سفارش‌دهی و چت با ادمین در پنل نیاز به شماره تلفن یا ایمیل تایید شده دارد. لطفا مشخصات خود را وارد کنید:
                      </div>
                      
                      <div className="space-y-4">
                        {!otpSent ? (
                          <div className="space-y-3">
                            {enableMobileLogin && (
                              <div className="flex bg-zinc-900 rounded-lg p-1">
                                <button type="button" onClick={() => setLoginMethod('email')} className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${loginMethod === 'email' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>ایمیل</button>
                                <button type="button" onClick={() => setLoginMethod('phone')} className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${loginMethod === 'phone' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>موبایل</button>
                              </div>
                            )}

                            <div className="flex gap-2">
                              {loginMethod === 'email' ? (
                                <input 
                                  type="email" 
                                  placeholder="ایمیل خود را جهت دریافت کد وارد کنید"
                                  value={email}
                                  onChange={e => setEmail(e.target.value)}
                                  className="flex-1 bg-zinc-900 border border-zinc-800/85 rounded-xl px-4 py-2.5 text-sm outline-none text-center"
                                  dir="ltr"
                                />
                              ) : (
                                <input 
                                  type="tel" 
                                  placeholder="شماره موبایل (مثلا 09121234567)"
                                  value={phone}
                                  onChange={e => setPhone(e.target.value)}
                                  className="flex-1 bg-zinc-900 border border-zinc-800/85 rounded-xl px-4 py-2.5 text-sm outline-none text-center"
                                  dir="ltr"
                                />
                              )}
                              <button 
                                type="button"
                                onClick={handleSendOtp}
                                disabled={loginMethod === 'email' ? !email.includes('@') : phone.length < 10}
                                className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl px-4 text-sm font-medium transition-colors cursor-pointer"
                              >
                                ارسال کد
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-xs text-center text-zinc-400">کد تایید ارسال شد. لطفاً آن را وارد کنید:</p>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="کد تایید..."
                                value={otpCode}
                                onChange={e => setOtpCode(e.target.value)}
                                className="flex-1 bg-zinc-900 border border-zinc-805/80 text-white rounded-xl px-4 py-2.5 text-sm outline-none text-center tracking-widest font-mono"
                                dir="ltr"
                              />
                              <button 
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={otpCode.length < 4}
                                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl px-6 text-sm font-medium transition-colors cursor-pointer"
                              >
                                تأیید ورود
                              </button>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setOtpSent(false)} 
                              className="text-xs text-zinc-500 text-center block w-full hover:text-zinc-300"
                            >
                              تصحیح {loginMethod === 'email' ? 'آدرس ایمیل' : 'شماره تلفن'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Logged in submission actions
                    <div className="space-y-3">
                      <div className="text-xs text-zinc-500 text-center flex items-center justify-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        ثبت سفارش به عنوان: <span className="font-mono text-zinc-300 font-semibold">{userIdentifier}</span>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={isSubmittingOrder}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl py-3.5 font-bold text-center flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
                      >
                        {isSubmittingOrder ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            در حال ثبت اطلاعات...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5" />
                            <span>تأیید و ثبت نهایی سفارش</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Success screen */
                <div className="text-center py-6 animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/5">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">سفارش با موفقیت ثبت شد</h3>
                  <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">
                    سفارش شما برای <strong className="text-zinc-200">"{selectedProduct.title}"</strong> با موفقیت در پایگاه داده ذخیره شد. کد سفارش شما:
                    <span className="block text-xl font-mono text-indigo-400 bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-4 w-fit mx-auto mt-3 shadow-inner">
                      #{orderSuccess.id}
                    </span>
                  </p>

                  <div className="bg-zinc-900/40 p-4 border border-zinc-800/80 rounded-2xl text-right mb-8 text-sm text-zinc-300">
                    <p className="font-bold border-b border-zinc-800/80 pb-2 mb-2 text-zinc-400">جزئیات سفارش:</p>
                    <p className="mb-1.5"><span className="text-zinc-500">مبلغ سفارش:</span> {orderSuccess.price}</p>
                    <p className="mb-1.5"><span className="text-zinc-500">تاریخ ثبت:</span> {new Date(orderSuccess.createdAt).toLocaleString('fa-IR')}</p>
                    <p><span className="text-zinc-500">توضیحات تکمیلی:</span> {orderSuccess.additionalDetails || 'ندارد'}</p>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => { setSelectedProduct(null); setOrderSuccess(null); }}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl py-3 text-sm font-semibold transition-colors cursor-pointer"
                    >
                      بستن کادر
                    </button>
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer"
                    >
                      پنل کاربری <ArrowRight className="w-4 h-4" />
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
