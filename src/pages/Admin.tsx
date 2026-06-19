import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Users, ShoppingBag, Settings, Bot, Shield, LogOut, Activity, Database, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('settings');
  const [isLogged, setIsLogged] = useState(false);
  const navigate = useNavigate();

  // Settings & DB State
  const [adminSettings, setAdminSettings] = useState({ telegramToken: '', baleToken: '', adminIdNumber: '', smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '', enableMobileLogin: true });
  const [products, setProducts] = useState<Product[]>([]);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLogged) {
      fetch('/api/admin/settings').then(r => r.json()).then(d => setAdminSettings(d));
      fetch('/api/products').then(r => r.json()).then(d => setProducts(d));
    }
  }, [isLogged]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        setIsLogged(true);
      } else {
        setError(res.message);
      }
    });
  };

  const handleSaveSettings = () => {
    fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminSettings)
    }).then(() => alert('تنظیمات با موفقیت ذخیره شد.'));
  };

  const handleBackup = () => {
    fetch('/api/admin/backup')
      .then(r => r.json())
      .then(d => {
        const str = JSON.stringify(d.backup, null, 2);
        const blob = new Blob([str], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString()}.json`;
        a.click();
      });
  };

  if (!isLogged) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl mx-auto flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">ورود به پنل مدیریت</h2>
            <p className="text-zinc-400 text-sm">برای ورود از حساب کاربری ادمین استفاده کنید</p>
            <p className="text-zinc-500 text-xs mt-2">یوزر: admin | رمز: 1234</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
             <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">نام کاربری</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors focus:ring-1 focus:ring-indigo-500"
                placeholder="admin"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">رمز عبور</label>
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors focus:ring-1 focus:ring-indigo-500"
                placeholder="••••"
                dir="ltr"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-4 py-3 font-medium transition-colors mt-4">
              ورود به سیستم
            </button>
          </form>
          <button onClick={() => navigate('/')} className="w-full text-zinc-400 hover:text-white mt-4 text-sm transition-colors">
            بازگشت به سایت
          </button>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'داشبورد', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'orders', label: 'سفارشات/محصولات', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'chats', label: 'پشتیبانی/پیام‌ها', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'settings', label: 'تنظیمات پایه و ربات', icon: <Settings className="w-5 h-5" /> },
    { id: 'backup', label: 'بکاپ سیستم', icon: <Database className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex text-zinc-100 selection:bg-indigo-500/30 bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 border-l border-zinc-800/50 bg-zinc-900/30 backdrop-blur flex flex-col hidden md:flex">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 text-xl font-bold">
             <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            پنل ادمین
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <div className={activeTab === tab.id ? 'text-white' : ''}>
                {tab.icon}
              </div>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <button onClick={() => {setIsLogged(false); navigate('/')}} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 rounded-xl hover:bg-red-500/10 transition-colors">
            <LogOut className="w-5 h-5" />
            خروج از سیستم
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">داشبورد یکپارچه</h1>
              <p className="text-zinc-400 text-sm mt-2">نمای کلی از وضعیت سایت و ربات‌های متصل.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'درآمد کل', val: '۳۵,۰۰۰,۰۰۰ تومان', icon: <Activity className="text-emerald-400" /> },
                { title: 'سفارشات جدید', val: '۱۲', icon: <ShoppingBag className="text-orange-400" /> },
                { title: 'کاربران ربات/سایت', val: '۴۵۸', icon: <Users className="text-indigo-400" /> }
              ].map((stat, i) => (
                <div key={i} className="glass-panel p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                     <span className="text-zinc-400 text-sm font-medium">{stat.title}</span>
                     <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                      {stat.icon}
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{stat.val}</span>
                </div>
              ))}
            </div>
             <div className="glass-panel p-6 mt-6">
               <h2 className="font-bold text-lg mb-6">آخرین فعالیت‌ها</h2>
               <div className="space-y-4">
                 {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-zinc-800/50 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-xs text-zinc-400 font-mono">#{1000 + i}</div>
                      <div>
                        <p className="font-medium text-sm">سفارش جدید - اپل آیدی</p>
                        <p className="text-xs text-zinc-500 mt-1">توسط کاربر در {i===1?'سایت':'ربات تلگرام'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full font-medium">آماده تحویل</span>
                  </div>
                 ))}
               </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-4xl mx-auto">
             <header>
               <h1 className="text-3xl font-bold tracking-tight">تنظیمات پایه سیستم</h1>
               <p className="text-zinc-400 text-sm mt-2">مدیریت توکن ربات‌ها و دسترسی مدیران ارشد</p>
             </header>

             <div className="glass-panel p-6 space-y-6">
                <div>
                   <label className="text-sm font-medium text-zinc-300 block mb-2">شناسه ادمین اصلی (جهت دریافت اطلاعیه‌ها در ربات)</label>
                   <input 
                     type="text" 
                     value={adminSettings.adminIdNumber || ''} 
                     onChange={e => setAdminSettings({...adminSettings, adminIdNumber: e.target.value})}
                     className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500 transition-colors" 
                     dir="ltr" 
                     placeholder="e.g. 123456789"
                   />
                </div>
                
                <div className="flex items-center gap-4 py-2">
                  <label className="text-sm font-medium text-zinc-300">فعال بودن ورود با شماره موبایل (پیام‌رسان)</label>
                  <button 
                    onClick={() => setAdminSettings({...adminSettings, enableMobileLogin: !adminSettings.enableMobileLogin})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${adminSettings.enableMobileLogin ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${adminSettings.enableMobileLogin ? 'translate-x-1' : '-translate-x-6'}`} />
                  </button>
                </div>
             </div>

             <div className="glass-panel p-6">
               <h3 className="font-bold text-lg mb-4">تنظیمات ایمیل (جهت ارسال کد یکبار مصرف)</h3>
               
               <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-xl text-sm mb-6 leading-relaxed">
                 <strong>راهنمای تنظیم جیمیل (Gmail):</strong><br />
                 ۱. <strong>SMTP Host:</strong> <code>smtp.gmail.com</code> | <strong>SMTP Port:</strong> <code>587</code> یا <code>465</code><br />
                 ۲. <strong>SMTP User:</strong> آدرس جیمیل شما (مثلا example@gmail.com)<br />
                 ۳. <strong>SMTP Password:</strong> باید از گوگل یک <strong>App Password (رمز عبور برنامه)</strong> بگیرید. رمز اصلی جیمیل کار نمی‌کند.<br />
                 <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline mt-1 inline-block">لینک ساخت App Password در گوگل</a>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium text-zinc-300 block mb-2">SMTP Host</label>
                   <input type="text" value={adminSettings.smtpHost || ''} onChange={e => setAdminSettings({...adminSettings, smtpHost: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500" dir="ltr" placeholder="smtp.gmail.com" />
                 </div>
                 <div>
                   <label className="text-sm font-medium text-zinc-300 block mb-2">SMTP Port</label>
                   <input type="text" value={adminSettings.smtpPort || ''} onChange={e => setAdminSettings({...adminSettings, smtpPort: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500" dir="ltr" placeholder="587" />
                 </div>
                 <div>
                   <label className="text-sm font-medium text-zinc-300 block mb-2">SMTP User (Email)</label>
                   <input type="email" value={adminSettings.smtpUser || ''} onChange={e => setAdminSettings({...adminSettings, smtpUser: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500" dir="ltr" placeholder="your-email@gmail.com" />
                 </div>
                 <div>
                   <label className="text-sm font-medium text-zinc-300 block mb-2">SMTP Password</label>
                   <input type="password" value={adminSettings.smtpPass || ''} onChange={e => setAdminSettings({...adminSettings, smtpPass: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500" dir="ltr" placeholder="App Password" />
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="glass-panel p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Bot className="w-8 h-8 text-sky-400" />
                    <div>
                      <h3 className="font-bold text-lg">وات تلگرام</h3>
                      <p className="text-zinc-400 text-xs mt-1">متصل به @BotFather</p>
                    </div>
                  </div>
                  <div>
                    <input 
                      type="password" 
                      value={adminSettings.telegramToken} 
                      onChange={e => setAdminSettings({...adminSettings, telegramToken: e.target.value})}
                      placeholder="توکن تلگرام..." 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-zinc-300 outline-none focus:border-sky-500 transition-colors" 
                      dir="ltr" 
                    />
                  </div>
               </div>

               <div className="glass-panel p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <MessageSquare className="w-8 h-8 text-emerald-400" />
                    <div>
                      <h3 className="font-bold text-lg">وات بله</h3>
                      <p className="text-zinc-400 text-xs mt-1">داخلی و سازمانی</p>
                    </div>
                  </div>
                  <div>
                    <input 
                      type="password" 
                      value={adminSettings.baleToken} 
                      onChange={e => setAdminSettings({...adminSettings, baleToken: e.target.value})}
                      placeholder="توکن پلتفرم بله..." 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-zinc-300 outline-none focus:border-emerald-500 transition-colors" 
                      dir="ltr" 
                    />
                  </div>
               </div>
             </div>
             <div>
               <button onClick={handleSaveSettings} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2.5 rounded-xl font-medium transition-colors">
                 ذخیره تغییرات
               </button>
             </div>
           </motion.div>
        )}

        {activeTab === 'backup' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
             <header className="mb-8">
               <h1 className="text-3xl font-bold tracking-tight">پشتیبان‌گیری سیستم</h1>
               <p className="text-zinc-400 text-sm mt-2">تهیه فایل بکاپ کامل از کاربران، تنظیمات سایت و ربات‌ها</p>
             </header>

             <div className="glass-panel p-8 text-center border-dashed border-2 border-zinc-800">
               <Database className="w-16 h-16 text-indigo-400 mx-auto mb-6 opacity-80" />
               <h3 className="text-xl font-bold mb-2">استخراج کامل پایگاه داده</h3>
               <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8">
                 شما میتوانید از تمامی محصولات، اکانت‌های فروش رفته، اطلاعات کاربران سایت/ربات‌ها و چت‌های پی‌وی فایل بکاپ JSON دریافت کنید.
               </p>
               <button onClick={handleBackup} className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium transition-colors">
                 تولید و دانلود فایل بکاپ
               </button>
             </div>
           </motion.div>
        )}

        {activeTab === 'chats' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
             <header className="mb-8">
               <h1 className="text-3xl font-bold tracking-tight">پیام‌های پشتیبانی</h1>
               <p className="text-zinc-400 text-sm mt-2">پاسخ‌گویی به نیازها و چت‌های ارسالی کاربران از سایت و ربات</p>
             </header>

             <div className="flex flex-col md:flex-row gap-6 h-[600px]">
               <div className="w-full md:w-1/3 glass-panel overflow-y-auto">
                 <div className="p-4 border-b border-zinc-800">
                   <h3 className="font-bold">لیست تیکت‌ها</h3>
                 </div>
                 {['user@example.com (سایت)', 'کاربر تلگرام (1241)'].map((p, i) => (
                    <div key={i} className="p-4 border-b border-zinc-800/50 hover:bg-zinc-900 cursor-pointer">
                      <p className="font-medium text-sm">{p}</p>
                      <p className="text-xs text-zinc-500 mt-1 truncate">سلام، برای طراحی ربات نیاز به مشاوره دارم.</p>
                    </div>
                 ))}
               </div>
               <div className="flex-1 glass-panel flex flex-col bg-zinc-900/10">
                 <div className="p-4 border-b border-zinc-800">
                   <p className="font-bold text-sm">چت با: user@example.com</p>
                 </div>
                 <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                   <div className="max-w-[80%] bg-zinc-800 p-3 rounded-xl rounded-tr-none text-sm text-zinc-200">
                     سلام، برای طراحی سایت فروشگاهی سوال داشتم.
                   </div>
                   <div className="max-w-[80%] ml-auto bg-indigo-500 p-3 rounded-xl rounded-tl-none text-sm text-white">
                      سلام کاربر عزیز! در خدمت شما هستیم. امکانات مدنظرتون رو بفرمایید.
                   </div>
                 </div>
                 <div className="p-4 border-t border-zinc-800 flex gap-2">
                   <input type="text" placeholder="پاسخ ادمین..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500" />
                   <button className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2 rounded-xl text-sm font-medium">ارسال</button>
                 </div>
               </div>
             </div>
           </motion.div>
        )}

        {activeTab === 'orders' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
             <header className="mb-8 flex justify-between items-end">
               <div>
                  <h1 className="text-3xl font-bold tracking-tight">مدیریت محصولات</h1>
                  <p className="text-zinc-400 text-sm mt-2">افزودن و ویرایش قیمت و توضیحات محصولات و اکانت‌ها</p>
               </div>
               <button className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-xl text-sm font-medium">
                 محصول جدید +
               </button>
             </header>

             <div className="glass-panel overflow-hidden">
               <table className="w-full text-sm text-left rtl:text-right text-zinc-400">
                 <thead className="text-xs text-zinc-300 uppercase bg-zinc-900/50">
                   <tr>
                     <th className="px-6 py-4">عنوان محصول</th>
                     <th className="px-6 py-4">توضیحات کوتاه</th>
                     <th className="px-6 py-4">قیمت</th>
                     <th className="px-6 py-4">عملیات</th>
                   </tr>
                 </thead>
                 <tbody>
                   {products.map(p => (
                     <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                        <td className="px-6 py-4 font-medium text-zinc-200">{p.title}</td>
                        <td className="px-6 py-4 truncate max-w-[200px]">{p.desc}</td>
                        <td className="px-6 py-4 text-emerald-400">{p.price}</td>
                        <td className="px-6 py-4 flex gap-2">
                          <button className="text-sky-400 hover:text-sky-300">ویرایش</button>
                        </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </motion.div>
        )}
      </main>
    </div>
  );
}
