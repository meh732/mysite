import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Apple, Bot, MessagesSquare, Smartphone, Globe, ShoppingCart, ChevronLeft, ShieldCheck, Store, LayoutDashboard, User, Palette, Code, CheckCircle } from 'lucide-react';
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
  
  // Quick Order Modal States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  const userIdentifier = localStorage.getItem('userEmail') || localStorage.getItem('userPhone') || '';
  const isLogged = !!userIdentifier;

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
          alert('کد تایید به تلگرام و بله شما پیامک شد (در صورت شروع ربات‌ها)');
        }
      } else {
        alert(res.message || 'خطا در ارسال کد تایید');
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
        navigate('/dashboard');
      } else {
        alert(res.message || 'کد وارد شده نامعتبر یا منقضی است.');
      }
    });
  };

  const handleOpenOrderModal = (product: Product) => {
    if (!isLogged) {
      setIsLoginModalOpen(true);
      return;
    }
    setSelectedProduct(product);
    setPlacedOrder(null);
    setOrderDetails('');
    setIsOrderModalOpen(true);
  };

  const handlePlaceOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSubmittingOrder(true);
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: selectedProduct.id,
        userId: userIdentifier,
        details: orderDetails
      })
    })
    .then(r => r.json())
    .then(res => {
      setIsSubmittingOrder(false);
      if (res.success) {
        setPlacedOrder(res.order);
      } else {
        alert(res.message || 'خطا در ثبت سفارش');
      }
    })
    .catch(() => {
      setIsSubmittingOrder(false);
      alert('ارتباط با سرور برقرار نشد.');
    });
  };

  const accounts = products.filter(p => p.type === 'account');
  const services = products.filter(p => p.type === 'service');

  return (
    <div className="min-h-screen pb-24 relative bg-zinc-950 text-white selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass-panel !rounded-none !border-x-0 !border-t-0 px-6 py-4 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
              <Store className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">دیجیتال استور</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>پنل مدیریت</span>
            </Link>

            {isLogged ? (
              <button onClick={() => navigate('/dashboard')} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                <User className="w-4 h-4" />
                <span>پنل کاربری</span>
              </button>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="bg-white text-black px-5 py-2.5 rounded-full font-medium text-sm hover:bg-zinc-200 transition-all flex items-center gap-2">
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 left-4 text-zinc-500 hover:text-white transition-colors"
              >
                ✕
              </button>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">ورود به حساب کاربری</h3>
                <p className="text-sm text-zinc-400 text-right leading-relaxed">برای ثبت و پیگیری هوشمند سفارشات با یکبار ورود به سیستم لینک می‌شوید.</p>
              </div>
              
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                {!otpSent ? (
                  <>
                    {enableMobileLogin && (
                      <div className="flex bg-zinc-900 rounded-xl p-1 mb-4 border border-zinc-800">
                        <button type="button" onClick={() => setLoginMethod('email')} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${loginMethod === 'email' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}>ورود با ایمیل</button>
                        <button type="button" onClick={() => setLoginMethod('phone')} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${loginMethod === 'phone' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}>ورود با موبایل (بات)</button>
                      </div>
                    )}

                    {loginMethod === 'email' ? (
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">آدرس پست الکترونیکی</label>
                        <input 
                          type="email" 
                          placeholder="your-email@example.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          dir="ltr"
                          className="w-full bg-zinc-900 border border-zinc-805 border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-center outline-none transition-colors"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">شماره تلفن همراه</label>
                        <input 
                          type="tel" 
                          placeholder="0911XXXXXXX"
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
                      className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-xl py-3 font-medium transition-colors"
                    >
                      دریافت کد تایید یکبار مصرف
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-center mb-3">کد تایید ارسال گردید. آن را وارد کنید:</p>
                      <input 
                        type="text" 
                        placeholder="کد ۶ رقمی یا ۴ رقمی"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        dir="ltr"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-center tracking-widest outline-none transition-all"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={otpCode.length < 4}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-colors"
                    >
                      تایید کد و ورود به پنل
                    </button>
                    <button 
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-full text-zinc-500 hover:text-white text-xs mt-2 transition-colors"
                    >
                      تغییر گیرنده کلا
                    </button>
                  </>
                )}
              </form>
              
              <p className="text-xs text-zinc-500 text-center mt-6">
                برقراری ارتباط دو طرفه با پیگیری آنی از ربات تلگرام و بله مدیران
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Order Modal */}
      <AnimatePresence>
        {isOrderModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setIsOrderModalOpen(false)}
                className="absolute top-4 left-4 text-zinc-500 hover:text-white text-lg transition-colors"
              >
                ✕
              </button>

              {!placedOrder ? (
                <form onSubmit={handlePlaceOrderSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                      <span>ثبت سفارش سریع</span>
                      <span className="text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full">{selectedProduct.type === 'account' ? 'تحویل اکانت' : 'سرویس کدنویسی'}</span>
                    </h3>
                    <p className="text-zinc-400 text-sm">شما در حال خرید <strong>{selectedProduct.title}</strong> هستید.</p>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                    <p className="text-sm font-medium text-white">{selectedProduct.title}</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{selectedProduct.desc}</p>
                    <div className="flex justify-between items-center text-xs text-indigo-400 font-bold pt-2 border-t border-zinc-850">
                      <span>مبلغ قابل پرداخت فاکتور:</span>
                      <span>{selectedProduct.price}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">نیازمندی‌های دقیق یا توضیحات تحویل:</label>
                    <textarea 
                      rows={3}
                      value={orderDetails}
                      onChange={e => setOrderDetails(e.target.value)}
                      placeholder="توضیحات لازم، ایمیل اختصاصی شما، نوع پکیج یا مشخصات دلخواه را بنویسید..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                    <span className="text-[10px] text-zinc-500 block mt-1">توضیحات شما مستقیماً همراه پیام اطلاع‌رسانی به ادمین‌های تلگرام و بله مخابره می‌شود.</span>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-zinc-850">
                    <button 
                      type="button" 
                      onClick={() => setIsOrderModalOpen(false)}
                      className="bg-zinc-800 hover:bg-zinc-705 border border-zinc-700 hover:bg-zinc-700 px-5 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      انصراف
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                    >
                      {isSubmittingOrder ? 'در حال ثبت...' : 'تایید نهایی و سفارش'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full mx-auto flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">سفارش شما با موفقیت ثبت شد!</h3>
                    <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
                      شماره سفارش شما <strong>#{placedOrder.id}</strong> می‌باشد. ادمین‌های تلگرام و بله فوراً پیام خرید شما را دریافت کردند و پاسخ تحویل به زودی صادر خواهد شد.
                    </p>
                  </div>

                  <div className="flex gap-4 items-center justify-center pt-6">
                    <button 
                      onClick={() => {
                        setIsOrderModalOpen(false);
                        navigate('/dashboard');
                      }}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      ورود به پنل جهت پیگیری
                    </button>
                    <button 
                      onClick={() => setIsOrderModalOpen(false)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors border border-zinc-750"
                    >
                      بازگشت به فروشگاه
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 mt-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight"
          >
            آینده دیجیتال خود را <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse">
              همین امروز بسازید
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg md:text-xl leading-relaxed"
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
              <h2 className="text-2xl font-bold flex items-center gap-3 border-r-4 border-indigo-500 pr-3">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
                اکانت‌های آماده و لایسنس‌ها
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((prod, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={prod.id} 
                  onClick={() => handleOpenOrderModal(prod)}
                  className="glass-panel p-6 hover:border-indigo-500/50 transition-all duration-350 group cursor-pointer hover:bg-zinc-900/50 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
                >
                  <div className="w-16 h-16 rounded-2xl bg-zinc-850 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-zinc-800">
                    {IconMap[prod.icon] || <Bot className="w-8 h-8 text-indigo-400" />}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-100 group-hover:text-indigo-400 transition-colors">{prod.title}</h3>
                  <p className="text-zinc-400 text-sm mb-6 h-10 leading-relaxed">{prod.desc}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-indigo-400 font-extrabold">{prod.price}</span>
                    <button className="w-10 h-10 rounded-full bg-zinc-850 border border-zinc-800 flex items-center justify-center hover:bg-indigo-500 transition-colors group-hover:border-indigo-500 shadow-md">
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Services */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3 border-r-4 border-purple-500 pr-3">
                <Code className="w-6 h-6 text-purple-400" />
                خدمات تخصصی توسعه و برنامه نویسی
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((prod, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  key={prod.id}
                  onClick={() => handleOpenOrderModal(prod)}
                  className="glass-panel p-6 hover:border-purple-500/50 transition-all duration-350 group cursor-pointer flex flex-col hover:bg-zinc-900/50 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1"
                >
                  <div className="w-16 h-16 rounded-2xl bg-zinc-850 flex items-center justify-center mb-6 border border-zinc-800 group-hover:border-purple-500/50 transition-all">
                    {IconMap[prod.icon] || <Code className="w-8 h-8 text-purple-400" />}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-100 group-hover:text-purple-400 transition-colors">{prod.title}</h3>
                  <p className="text-zinc-400 text-sm mb-6 flex-grow leading-relaxed">{prod.desc}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-850">
                    <span className="text-zinc-300 font-bold text-sm">{prod.price}</span>
                    <button className="text-sm text-purple-400 font-bold hover:text-purple-300 flex items-center gap-1">
                      مشاوره و سفارش <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
