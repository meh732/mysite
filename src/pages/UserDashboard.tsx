import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Phone, ArrowRight, ShieldCheck, Download, Code, Globe2, 
  Loader2, Calendar, ShoppingBag, Coins, MessageSquare, AlertCircle, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Order } from '../types';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [messages, setMessages] = useState<{sender: string, text: string, createdAt?: string}[]>([
    { sender: 'admin', text: 'سلام کاربر عزیز! خوش آمدید. ما سناریوی پروژه شما را بررسی کرده و جزییات تکمیلی را همینجا تغییر می‌دهیم.' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const userIdentifier = localStorage.getItem('userEmail') || localStorage.getItem('userPhone');

  useEffect(() => {
    if (!userIdentifier) {
      navigate('/');
      return;
    }
    loadOrders();
  }, [userIdentifier]);

  const loadOrders = () => {
    setIsLoadingOrders(true);
    fetch(`/api/orders/user/${encodeURIComponent(userIdentifier || '')}`)
      .then(r => r.json())
      .then(data => {
        setOrders(data);
        setIsLoadingOrders(false);
      })
      .catch(() => {
        setIsLoadingOrders(false);
      });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !userIdentifier) return;
    const userMsg = { sender: 'user', text: newMessage, createdAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    
    // Save to server chat
    fetch(`/api/chat/${encodeURIComponent(userIdentifier)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'user', text: newMessage })
    });

    setNewMessage('');
    
    // Simulate smart support auto-reply from administrator
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        sender: 'admin', 
        text: 'درخواست شما در ریپوزیتوری ادمین درج شد. سیستم آماده به‌کار است و ادمین به زودی در همین صفحه با شما مستقیماً گفتگو خواهد کرد.',
        createdAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    navigate('/');
  };

  const domainOptions = [
    { label: 'ثبت دامین اختصاصی ir. و com.', icon: <Globe2 className="w-5 h-5 text-blue-400" /> },
    { label: 'نصب گواهی امنیتی SSL (کاملا خودکار و ری‌استارت سالانه)', icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
  ];

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-bold">تحویل شده و فعال</span>;
      case 'canceled':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-xs px-3 py-1 rounded-full font-bold">لغو شده</span>;
      default:
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-bold">در انتظار بررسی نیازها</span>;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">
      {/* Header */}
      <nav className="glass-panel !rounded-none !border-x-0 !border-t-0 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 hover:bg-zinc-900 rounded-lg">
              <ArrowRight className="w-6 h-6" />
            </button>
            <span className="font-bold text-xl">پنل کاربری دیجیتال استور</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-zinc-900 text-zinc-400 border border-zinc-800 px-3 py-1.5 rounded-full font-mono tracking-wider">{userIdentifier}</span>
            <button onClick={handleLogout} className="text-sm bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-xl transition-all font-medium cursor-pointer">
              خروج از حساب
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex flex-col gap-2 relative">
          <div className="sticky top-24 space-y-2">
            {[
              { id: 'orders', label: 'سفارشات من' },
              { id: 'chat', label: 'پشتیبانی و مشاوره آنلاین' },
              { id: 'domain', label: 'خدمات دامنه و SSL' },
              { id: 'deploy', label: 'دیپلوی و اسکریپت نصب' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-right px-5 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-zinc-450 text-zinc-450 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">سفارشات اخیر شما</h2>
                <button 
                  onClick={loadOrders} 
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 cursor-pointer"
                >
                  بروزرسانی لیست ↻
                </button>
              </div>

              {isLoadingOrders ? (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-zinc-400 text-sm">در حال دریافت وضعیت سفارشات...</span>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((ord) => (
                    <div key={ord.id} className="glass-panel p-6 border border-zinc-800/80 hover:border-zinc-700/80 transition-all">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-zinc-500 block">کد سفارش: #{ord.id}</span>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                              {ord.productType === 'account' ? 'اکانت' : 'خدمات توسعه'}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg text-white mt-1.5">{ord.productTitle}</h3>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {getStatusBadge(ord.status)}
                          <span className="text-xs text-zinc-500 font-mono flex items-center gap-1 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(ord.createdAt).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 bg-zinc-900/30 p-4 border border-zinc-900/60 rounded-xl">
                        <span className="block text-xs font-bold text-zinc-400">نیازمندی‌ها و جزییات درخواستی شما:</span>
                        <p className="text-sm text-zinc-350 leading-relaxed font-normal">{ord.additionalDetails || 'توضیحات تکمیلی یا جزییاتی وارد نشده است.'}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-zinc-500 block">مبلغ سفارش:</span>
                          <span className="font-bold text-emerald-400 text-md">{ord.price}</span>
                        </div>
                        <button 
                          onClick={() => setActiveTab('chat')} 
                          className="bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white px-4 py-2 border border-indigo-500/20 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>گفتگو درباره پروژه و تحویل</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-12 text-center border-dashed border border-zinc-800">
                  <ShoppingBag className="w-16 h-16 text-indigo-400/55 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-zinc-200">سفارشی یافت نشد</h3>
                  <p className="text-zinc-400 text-sm max-w-sm mx-auto mt-2 mb-6">
                    شما در حال حاضر هیچ سفارشی برای دامنه‌ها، اکانت‌های اختصاصی یا کدهای توسعه ثبت نکرده‌اید! همین حالا محصول مورد نظر خود را سفارش دهید.
                  </p>
                  <button 
                    onClick={() => navigate('/')} 
                    className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    مشاهده دسته بندی‌ها و محصولات
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-[600px] flex flex-col glass-panel overflow-hidden">
              <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/50">
                <h2 className="font-bold text-white">پشتیبانی آنلاین و تحویل سناریو</h2>
                <p className="text-xs text-zinc-400 mt-1">بیان نیازمندی‌ها، پیگیری سفارش، مشاوره اختصاصی ساخت سورس پروژه</p>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-950/20">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm ${
                      m.sender === 'user' ? 'bg-indigo-500 text-white rounded-br-sm' : 'bg-zinc-850 text-zinc-200 rounded-bl-sm border border-zinc-800/70'
                    }`}>
                      <p className="font-normal">{m.text}</p>
                      {m.createdAt && (
                        <span className="block text-[8px] text-zinc-400 text-left mt-1 font-mono">{m.createdAt}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 flex gap-3">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 text-zinc-100 transition-colors"
                />
                <button onClick={sendMessage} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
                  ارسال پیام
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'domain' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-2xl font-bold">زیرساخت دامین و امنیت کانکشن</h2>
              <p className="text-zinc-400 mb-8 max-w-lg">در صورت نیاز به دامنه اختصاصی برای سایت یا انتقال پورت وب‌هوکی ربات‌ها، جزئیات ذیل را بررسی فرمایید:</p>
              
              <div className="grid gap-6">
                {domainOptions.map((opt, i) => (
                  <div key={i} className="glass-panel p-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 shadow-inner">
                        {opt.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{opt.label}</h3>
                        <p className="text-zinc-400 text-sm mt-1">مشاوره و فعال‌سازی سریع روی سرور شما</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert('درخواست ثبت دامین/امکانات با موفقیت به پشتیبانی ارسال شد.')}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/10 transition-colors cursor-pointer"
                    >
                      ثبت درخواست فوری
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'deploy' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Code className="text-indigo-400" />
                دیپلوی سرویس (Github / Bash)
              </h2>
              <p className="text-zinc-400 mb-2">جهت نصب و راه اندازی یا آپدیت دستی سایت و ربات بر روی سرور لینوکسی از اسکریپت نصب ما استفاده کنید:</p>
              
              <div className="glass-panel p-6 font-mono text-sm space-y-4">
                <div className="p-4 bg-zinc-950 rounded-xl text-zinc-300 overflow-x-auto border border-zinc-850" dir="ltr">
                  $ bash &lt;(curl -sL https://raw.githubusercontent.com/meh732/mysite/main/install.sh)
                </div>

                <div className="flex items-start gap-3 text-emerald-400/80 bg-emerald-400/5 border border-emerald-500/15 p-4 rounded-xl">
                  <Download className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
                  <div className="text-sm leading-relaxed">
                    <p className="font-bold text-emerald-300 mb-1">منوی نصب تعاملی لینوکس</p>
                    <p>این اسکریپت دارای بخش مدیریت است و چک میکند که نصب تکراری انجام نشود. دارای منوی:</p>
                    <ul className="list-disc list-inside mt-2 text-emerald-500/80 text-xs space-y-1">
                      <li>نصب سیستم (Install) - بررسی وابستگی‌ها روی لینوکس اوبونتو تمیز</li>
                      <li>آپدیت (Update) - کشیدن آخرین تغییرات گیت و ری‌استارت با PM2</li>
                      <li>حذف سرویس (Uninstall) - پاک کردن کامل فولدرها و دیمن‌های لینوکسی</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
