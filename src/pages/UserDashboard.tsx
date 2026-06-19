import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, ArrowRight, ShieldCheck, Download, Code, Globe2, ShoppingBag, ClipboardList, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Order, ChatMessage } from '../types';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  
  // Real orders & support stats
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const userIdentifier = localStorage.getItem('userEmail') || localStorage.getItem('userPhone') || '';
  const isLogged = !!userIdentifier;

  useEffect(() => {
    if (!isLogged) {
      navigate('/');
      return;
    }

    // Load dynamic orders
    fetchOrdersList();

    // Load live chat
    fetchChatHistory();

    // Set polling for support logs
    const interval = setInterval(() => {
      fetchChatHistory();
    }, 4000);

    return () => clearInterval(interval);
  }, [userIdentifier, isLogged]);

  const fetchOrdersList = () => {
    fetch(`/api/orders?userId=${encodeURIComponent(userIdentifier)}`)
      .then(r => r.json())
      .then(data => {
        setOrders(data);
      })
      .catch(() => {});
  };

  const fetchChatHistory = () => {
    fetch(`/api/chat/${encodeURIComponent(userIdentifier)}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.messages) {
          setMessages(data.messages);
        }
      })
      .catch(() => {});
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const payload = {
      sender: 'user',
      text: newMessage
    };

    // Optimistic UI updates
    const tempMsg: ChatMessage = {
      sender: 'user',
      text: newMessage,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    fetch(`/api/chat/${encodeURIComponent(userIdentifier)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
      if (data && data.messages) {
        setMessages(data.messages);
      }
    })
    .catch(() => {});
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    navigate('/');
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const domainOptions = [
    { label: 'ثبت دامین اختصاصی ملی یا بین‌المللی', icon: <Globe2 className="w-5 h-5 text-blue-400" /> },
    { label: 'سفارش و اعمال گواهی رمزنگاری SSL رایگان', icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">
      {/* Header bar */}
      <nav className="glass-panel !rounded-none !border-x-0 !border-t-0 px-6 py-4 sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-zinc-400 hover:text-white transition-colors bg-zinc-900 p-2 rounded-xl border border-zinc-800">
              <ArrowRight className="w-5 h-5" />
            </button>
            <span className="font-bold text-xl">پنل کاربری</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400 font-mono tracking-wider bg-zinc-900 border border-zinc-805 border-zinc-800 px-3 py-1.5 rounded-lg">{userIdentifier}</span>
            <button onClick={handleLogout} className="text-xs bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-4 py-2 rounded-xl transition-all border border-red-500/20 font-bold">
              خروج از حساب
            </button>
          </div>
        </div>
      </nav>

      {/* Main body wrapper */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 flex flex-col gap-2 relative">
          <div className="lg:sticky lg:top-24 space-y-2">
            {[
              { id: 'orders', label: 'سفارشات من', count: orders.length },
              { id: 'chat', label: 'پشتیبانی آنلاین direct', count: messages.filter(m => m.sender === 'admin').length },
              { id: 'domain', label: 'ثبت دامین و گواهی SSL' },
              { id: 'deploy', label: 'کدهای نصب لینوکس' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-right px-5 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                  activeTab === tab.id 
                    ? 'bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/15' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent hover:border-zinc-800/40'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white text-indigo-600' : 'bg-zinc-850 text-indigo-400 border border-indigo-500/10'}`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                   <h2 className="text-2xl font-bold">سفارشات ثبت شده</h2>
                   <p className="text-sm text-zinc-400 mt-1">لیست خریدهای آنلاین و سرویس‌های درخواستی شما در دیجیتال استور</p>
                </div>
                <button onClick={() => navigate('/')} className="text-xs bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-xl transition-colors font-bold shadow-lg shadow-indigo-500/15">
                  خرید محصول جدید +
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="glass-panel p-12 text-center space-y-4 border-dashed border-2 border-zinc-850">
                  <ClipboardList className="w-12 h-12 text-zinc-600 mx-auto" />
                  <p className="text-zinc-400 text-sm">هیچ سفارشی تا کنون برای این حساب ثبت نشده است.</p>
                  <button onClick={() => navigate('/')} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-300 text-xs px-5 py-2.5 rounded-xl transition-colors">مشاهده ویترین محصولات</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => {
                    const isCompleted = order.status === 'completed';
                    const isCanceled = order.status === 'canceled';
                    
                    return (
                      <div key={order.id} className="glass-panel p-6 border border-zinc-800/80 hover:border-zinc-700/60 transition-colors space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-base text-zinc-100">{order.productTitle}</span>
                              <span className="text-xs text-zinc-500 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-805">سفارش #{order.id}</span>
                            </div>
                            <p className="text-xs text-zinc-500">ثبت شده در: {new Date(order.createdAt).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl font-bold">{order.productPrice}</span>
                            {isCompleted && (
                              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-3 py-1.5 rounded-full flex items-center gap-1 font-bold">
                                <CheckCircle className="w-3.5 h-3.5" /> تحویل شده
                              </span>
                            )}
                            {isCanceled && (
                              <span className="text-xs text-red-400 bg-red-400/10 border border-red-400/15 px-3 py-1.5 rounded-full flex items-center gap-1 font-bold">
                                <XCircle className="w-3.5 h-3.5" /> لغو شده
                              </span>
                            )}
                            {!isCompleted && !isCanceled && (
                              <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/15 px-3 py-1.5 rounded-full flex items-center gap-1 font-bold">
                                <Clock className="w-3.5 h-3.5" /> در حال پردازش
                              </span>
                            )}
                          </div>
                        </div>

                        {order.details && (
                          <div className="text-xs bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-900 text-zinc-400 leading-relaxed">
                            <strong>یادداشت کاربر برای سفارش:</strong> {order.details}
                          </div>
                        )}

                        {isCompleted && order.deliveredContent && (
                          <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-indigo-300">🔑 اطلاعات تحویل دیجیتال ادمین:</span>
                              <button 
                                onClick={() => copyToClipboard(order.deliveredContent || '', order.id)}
                                className="text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded transition-colors text-[10px]"
                              >
                                {copiedId === order.id ? 'کپی شد!' : 'کپی اطلاعات'}
                              </button>
                            </div>
                            <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap text-zinc-100 bg-zinc-950 p-3 rounded-lg border border-zinc-900 text-right" dir="ltr">
                              {order.deliveredContent}
                            </pre>
                          </div>
                        )}

                        {!isCompleted && !isCanceled && (
                          <div className="flex sm:justify-end">
                            <button onClick={() => setActiveTab('chat')} className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-400/10 px-4 py-2 rounded-xl transition-colors font-bold w-full sm:w-auto text-center">
                              مکاتبه با پشتیبانی جهت تسریع
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* SUPPORT LIVE CHAT */}
          {activeTab === 'chat' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-[600px] flex flex-col glass-panel overflow-hidden border border-zinc-800/80">
              <div className="p-4 border-b border-zinc-850 bg-zinc-900/50 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-base">گفتگو مستقیم با پشتیبانی</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">ثبت نیازمندی‌های پروژه‌ها و پیگیری مشکلات پرداخت</p>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">پشتیبان آنلاین</span>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-950/20">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center text-zinc-500 space-y-3">
                    <Clock className="w-10 h-10 text-zinc-700" />
                    <p className="text-sm">پشتیبانی با چت مستقیم فعال است.</p>
                    <p className="text-xs text-zinc-600">اولین پیام خود را ارسال کنید تا تیکت باز شود.</p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.sender === 'user' 
                          ? 'bg-indigo-500 text-white rounded-br-sm shadow-md shadow-indigo-500/10' 
                          : 'bg-zinc-850 text-zinc-200 rounded-bl-sm border border-zinc-800'
                      }`}>
                        <p>{m.text}</p>
                        {m.createdAt && (
                          <span className="text-[9px] block text-right mt-1 opacity-60">
                            {new Date(m.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-zinc-850 bg-zinc-900/30 flex gap-3">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-600 text-zinc-200"
                />
                <button onClick={sendMessage} className="bg-indigo-500 hover:bg-indigo-600 px-5 rounded-xl text-sm font-bold transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Send className="w-4 h-4 ml-1" />
                  <span>ارسال</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* DOMAIN AND SSL TAB */}
          {activeTab === 'domain' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-2xl font-bold">زیرساخت ثبت دامین و امنیت SSL</h2>
              <p className="text-zinc-400 text-sm max-w-lg leading-relaxed">در صورتی که قصد دارید سیستم دیجیتال استور را روی دامنه‌ی اختصاصی خودتان پیاده کرده یا برای اتصال به درگاه پرداخت مستقیم گواهی SSL ست کنید، درخواست بگذارید:</p>
              
              <div className="grid gap-6 mt-6">
                {domainOptions.map((opt, i) => (
                  <div key={i} className="glass-panel p-6 flex flex-col sm:flex-row items-center gap-6 justify-between border border-zinc-800/80">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-900 border border-zinc-850 rounded-xl flex items-center justify-center">
                        {opt.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-100">{opt.label}</h3>
                        <p className="text-zinc-400 text-xs mt-1">مشاوره و راه‌اندازی سریع به همراه ادمین</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveTab('chat');
                        setNewMessage(`سلام، برای سفارش خدمت "${opt.label}" نیاز به راه‌اندازی دارم.`);
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition-colors"
                     >
                      ثبت و مکاتبه
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* LINUX DEPLOYMENT SCRIPTS */}
          {activeTab === 'deploy' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Code className="text-indigo-400 w-6 h-6" />
                دیپلوی یکپارچه لینوکس (Bash)
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">جهت نصب، بروزرسانی خودکار، تغییر پورت به پورت غیرتداخلی بدون خاموش شدن سایر بات‌های سرور، فرمان زیر را در ترمینال سرور لینوکس خود اجرا کنید:</p>
              
              <div className="glass-panel p-6 font-mono text-sm space-y-4 border border-zinc-800/80">
                <div className="p-4 bg-zinc-950 rounded-xl text-indigo-400 overflow-x-auto text-[13px] border border-zinc-905" dir="ltr">
                  $ bash &lt;(curl -sL https://raw.githubusercontent.com/meh732/mysite/main/install.sh)
                </div>

                <div className="flex items-start gap-3 bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
                  <Download className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-zinc-300">
                    <p className="font-bold text-white mb-1.5">مزایای اسکریپت نصب دیجیتال استور:</p>
                    <ul className="list-disc list-inside space-y-1.5 text-zinc-400">
                      <li>تغییر پورت و نام PM2 به صورت هوشمند و بدون اختلال با سایر سرویس‌های شما</li>
                      <li>لود مستقیم آخرین سورس‌کدها از ریپازیتوری گیت</li>
                      <li>ایمن‌سازی مسیرها و مدیریت خودکار Nginx با پشتیبانی از SSL</li>
                      <li>تداوم کارکرد بات‌های ثبت شده تلگرام و بله</li>
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
