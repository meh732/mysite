import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Apple, Bot, MessagesSquare, Smartphone, Globe, ShoppingCart, ChevronLeft, ShieldCheck, Store, LayoutDashboard, User, Palette, Code } from 'lucide-react';
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
  
  const isLogged = !!localStorage.getItem('userEmail') || !!localStorage.getItem('userPhone');

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
          // Tell the user
          alert('کد تایید به تلگرام و بله شما ارسال شد (در صورت شروع ربات)');
        }
      } else {
        alert(res.message || 'خطا در ارسال کد');
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
        alert(res.message || 'کد وارد شده نامعتبر است');
      }
    });
  };

  const accounts = products.filter(p => p.type === 'account');
  const services = products.filter(p => p.type === 'service');

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass-panel !rounded-none !border-x-0 !border-t-0 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
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
              <button onClick={() => navigate('/dashboard')} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-colors flex items-center gap-2">
                <User className="w-4 h-4" />
                پنل من
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
                className="absolute top-4 left-4 text-zinc-500 hover:text-white"
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
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-center outline-none transition-colors"
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
                      className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-colors"
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
                      className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-colors"
                    >
                      ورود به حساب
                    </button>
                    <button 
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-full text-zinc-400 hover:text-white text-sm mt-2"
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
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          >
            آینده دیجیتال خود را <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              همین امروز بسازید
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
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
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
                اکانت‌های آماده
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((prod, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={prod.id} 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="glass-panel p-6 hover:border-indigo-500/50 transition-colors group cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {IconMap[prod.icon]}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{prod.title}</h3>
                  <p className="text-zinc-400 text-sm mb-6 h-10">{prod.desc}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-indigo-400 font-bold">{prod.price}</span>
                    <button className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-indigo-500 transition-colors">
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
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Code className="w-6 h-6 text-purple-400" />
                خدمات توسعه
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((prod, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  key={prod.id}
                  onClick={() => setIsLoginModalOpen(true)}
                  className="glass-panel p-6 hover:border-purple-500/50 transition-colors group cursor-pointer flex flex-col"
                >
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-6 border border-zinc-700/50 group-hover:border-purple-500/50 transition-colors">
                    {IconMap[prod.icon]}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{prod.title}</h3>
                  <p className="text-zinc-400 text-sm mb-6 flex-grow">{prod.desc}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-800/50">
                    <span className="text-zinc-300 font-medium text-sm">{prod.price}</span>
                    <button className="text-sm text-purple-400 font-medium hover:text-purple-300 flex items-center gap-1">
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
