import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, ArrowRight, ShieldCheck, Download, Code, Globe2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([
    { sender: 'user', text: 'سلام، در مورد طراحی سایت فروشگاهی سوال داشتم.' },
    { sender: 'admin', text: 'سلام کاربر عزیز! در خدمت شما هستیم. امکانات مدنظرتون رو بفرمایید.' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, { sender: 'user', text: newMessage }]);
    setNewMessage('');
    // Simulate admin auto-reply
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'admin', text: 'درخواست شما ثبت شد، همکاران ما به زودی پاسخ خواهند داد.' }]);
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    navigate('/');
  };

  const userIdentifier = localStorage.getItem('userEmail') || localStorage.getItem('userPhone');

  const domainOptions = [
    { label: 'ثبت دامین', icon: <Globe2 className="w-5 h-5 text-blue-400" /> },
    { label: 'دریافت گواهی SSL (رایگان/پولی)', icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">
      <nav className="glass-panel !rounded-none !border-x-0 !border-t-0 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-zinc-400 hover:text-white transition-colors">
              <ArrowRight className="w-6 h-6" />
            </button>
            <span className="font-bold text-xl">پنل کاربری</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400 font-mono tracking-wider">{userIdentifier}</span>
            <button onClick={handleLogout} className="text-sm bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-white px-4 py-2 rounded-xl transition-colors">
              خروج
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex flex-col gap-2 relative">
          <div className="sticky top-24 space-y-2">
            {[
              { id: 'orders', label: 'سفارشات من' },
              { id: 'chat', label: 'پشتیبانی آنلاین' },
              { id: 'domain', label: 'دامنه و SSL (اختیاری)' },
              { id: 'deploy', label: 'راه‌اندازی و دیپلوی' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-right px-5 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-indigo-500 text-white' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
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
              <h2 className="text-2xl font-bold mb-6">سفارشات اخیر</h2>
              <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold mb-1">طراحی ربات تلگرام اختصاصی</h3>
                  <p className="text-zinc-400 text-sm">وضعیت: <span className="text-amber-400">در حال بررسی نیازها</span></p>
                </div>
                <button onClick={() => setActiveTab('chat')} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-sm transition-colors">
                  ارسال پیام به ادمین
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-[600px] flex flex-col glass-panel overflow-hidden">
              <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/50">
                <h2 className="font-bold">پشتیبانی آنلاین</h2>
                <p className="text-xs text-zinc-400 mt-1">بیان نیازمندی‌ها، پیگیری سفارش، مشاوره</p>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm ${
                      m.sender === 'user' ? 'bg-indigo-500 text-white rounded-br-sm' : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                    }`}>
                      {m.text}
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
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors"
                />
                <button onClick={sendMessage} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-3 rounded-xl text-sm font-medium transition-colors">
                  ارسال
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'domain' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-2xl font-bold">زیرساخت دامین و امنیت</h2>
              <p className="text-zinc-400 mb-8 max-w-lg">در صورت نیاز به دامنه اختصاصی برای سایت یا پنل ربات، این گزینه‌ها را تکمیل کنید.</p>
              
              <div className="grid gap-6">
                {domainOptions.map((opt, i) => (
                  <div key={i} className="glass-panel p-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                        {opt.icon}
                      </div>
                      <div>
                        <h3 className="font-bold">{opt.label}</h3>
                        <p className="text-zinc-400 text-sm mt-1">مشاوره و ثبت سریع</p>
                      </div>
                    </div>
                    <button className="bg-zinc-800 hover:bg-zinc-700 w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
                      ثبت درخواست
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
                <div className="p-4 bg-zinc-950 rounded-xl text-zinc-300 overflow-x-auto" dir="ltr">
                  $ bash &lt;(curl -sL https://raw.githubusercontent.com/meh732/mysite/main/install.sh)
                </div>

                <div className="flex items-start gap-3 text-emerald-400/80 bg-emerald-400/10 p-4 rounded-xl">
                  <Download className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm leading-relaxed">
                    <p className="font-bold mb-1">منوی نصب تعاملی</p>
                    <p>این اسکریپت دارای بخش مدیریت است و چک میکند که نصب تکراری انجام نشود. دارای منوی:</p>
                    <ul className="list-disc list-inside mt-2 text-emerald-500/90 text-xs space-y-1">
                      <li>نصب سیستم (Install) - بررسی در سرور خام</li>
                      <li>آپدیت (Update) - کشیدن آخرین تغییرات گیت و ری‌استارت PM2</li>
                      <li>حذف سرویس (Uninstall) - پاک کردن کامل</li>
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
