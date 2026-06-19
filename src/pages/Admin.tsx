import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, ShoppingBag, Settings, Bot, Shield, LogOut, 
  Activity, Database, MessageSquare, Plus, Trash2, Edit2, CheckCircle, 
  X, ToggleLeft, ToggleRight, Loader2, Eye, EyeOff, AlertCircle, ShoppingCart, RefreshCw, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product, Order } from '../types';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLogged, setIsLogged] = useState(false);
  const navigate = useNavigate();

  // Settings & DB State
  const [adminSettings, setAdminSettings] = useState({ telegramToken: '', baleToken: '', adminIdNumber: '', smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '', enableMobileLogin: true });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sub tab inside "سفارشات/محصولات"
  const [productsSubTab, setProductsSubTab] = useState<'products' | 'orders'>('products');

  // --- Product CRUD Form / Modal State ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState<'account' | 'service'>('account');
  const [formCategory, setFormCategory] = useState('ai');
  const [formIcon, setFormIcon] = useState('Bot');
  const [formActive, setFormActive] = useState(true);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLogged) {
      loadAllData();
    }
  }, [isLogged]);

  const loadAllData = () => {
    setIsLoading(true);
    const p1 = fetch('/api/admin/settings').then(r => r.json()).then(d => setAdminSettings(d));
    const p2 = fetch('/api/products').then(r => r.json()).then(d => setProducts(d));
    const p3 = fetch('/api/orders').then(r => r.json()).then(d => setOrders(d));
    
    Promise.all([p1, p2, p3])
      .catch((err) => console.error("Error fetching admin metrics:", err))
      .finally(() => setIsLoading(false));
  };

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
    }).then(() => alert('تنظیمات پایه و توکن ربات‌ها با موفقیت ذخیره شد.'));
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

  // --- Product CRUD Actions ---
  const openNewProductModal = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormPrice('');
    setFormDesc('');
    setFormType('account');
    setFormCategory('ai');
    setFormIcon('Bot');
    setFormActive(true);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormTitle(prod.title);
    setFormPrice(prod.price);
    setFormDesc(prod.desc);
    setFormType(prod.type);
    setFormCategory(prod.category);
    setFormIcon(prod.icon);
    setFormActive(prod.active !== false);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formPrice) {
      alert('وارد کردن عنوان و قیمت الزامی است.');
      return;
    }

    const payload = {
      title: formTitle,
      price: formPrice,
      desc: formDesc,
      type: formType,
      category: formCategory,
      icon: formIcon,
      active: formActive
    };

    if (editingProduct) {
      // Edit mode
      fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          alert('محصول با موفقیت ویرایش شد.');
          setIsProductModalOpen(false);
          loadAllData();
        } else {
          alert(res.message || 'خطا در ویرایش محصول');
        }
      });
    } else {
      // Create mode
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          alert('محصول جدید با موفقیت افزوده شد.');
          setIsProductModalOpen(false);
          loadAllData();
        } else {
          alert(res.message || 'خطا در افزودن محصول جدید');
        }
      });
    }
  };

  const handleDeleteProduct = (id: number) => {
    if (!confirm('آیا از حذف کامل این محصول/لات مطمئن هستید؟')) return;

    fetch(`/api/products/${id}`, {
      method: 'DELETE'
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        alert('محصول با موفقیت حذف شد.');
        loadAllData();
      } else {
        alert(res.message || 'خطا در حذف محصول');
      }
    });
  };

  const toggleProductActiveStatus = (prod: Product) => {
    const nextStatus = prod.active === false ? true : false;
    fetch(`/api/products/${prod.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: nextStatus })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        loadAllData();
      }
    });
  };

  // --- User Order CRUD Actions ---
  const handleUpdateOrderStatus = (orderId: number, nextStatus: 'pending' | 'completed' | 'canceled') => {
    fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        loadAllData();
      } else {
        alert('خطا در آپدیت وضعیت سفارش');
      }
    });
  };

  const handleDeleteOrder = (orderId: number) => {
    if (!confirm('آیا از حذف این سفارش مطمئن هستید؟ (اطلاعات خریدار حذف خواهد شد)')) return;

    fetch(`/api/orders/${orderId}`, {
      method: 'DELETE'
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        alert('سفارش با موفقیت حذف شد.');
        loadAllData();
      } else {
        alert(res.message || 'خطا در حذف سفارش');
      }
    });
  };

  // Format Persian currency numbers inside UI and estimate income
  const testNumber = (str: string) => {
    const cleanNum = str.replace(/[^\d]/g, '');
    return parseInt(cleanNum, 10) || 0;
  };

  const totalCalculatedRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + testNumber(o.price), 0);

  if (!isLogged) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 text-white selection:bg-indigo-500/30">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 w-full max-w-md border border-zinc-800"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">ورود به پنل مدیریت</h2>
            <p className="text-zinc-400 text-sm">برای ورود از حساب کاربری ادمین استفاده کنید</p>
            <p className="text-zinc-500 text-xs mt-2 bg-zinc-900 py-1 px-4 rounded-full w-fit mx-auto border border-zinc-900">یوزر: admin | رمز: 1234</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
             <div>
              <label className="block text-sm font-medium mb-2 text-zinc-355">نام کاربری ادمین</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors focus:ring-1 focus:ring-indigo-500 text-center"
                placeholder="admin"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-355 block">رمز عبور</label>
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors focus:ring-1 focus:ring-indigo-500 text-center"
                placeholder="••••"
                dir="ltr"
              />
            </div>
            {error && <p className="text-red-400 text-xs bg-red-450/10 p-2 rounded-lg text-center font-bold border border-red-500/20">{error}</p>}
            <button type="submit" className="w-full bg-indigo-505 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-4 py-3 font-semibold transition-colors mt-4 cursor-pointer">
              ورود به سیستم مدیریت
            </button>
          </form>
          <button onClick={() => navigate('/')} className="w-full text-zinc-400 hover:text-white mt-5 text-xs transition-colors cursor-pointer">
            بازگشت به صفحه اصلی سایت
          </button>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'داشبورد', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'orders', label: 'سفارشات و محصولات', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'chats', label: 'پشتیبانی/پیام‌ها', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'settings', label: 'تنظیمات پایه و ربات', icon: <Settings className="w-5 h-5" /> },
    { id: 'backup', label: 'بکاپ سیستم', icon: <Database className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex text-zinc-100 selection:bg-indigo-500/30 bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 border-l border-zinc-800 bg-zinc-900/40 backdrop-blur flex flex-col hidden md:flex">
        <div className="p-6 border-b border-zinc-850">
          <div className="flex items-center gap-3 text-xl font-bold">
             <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-zinc-100">پنل ادمین</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/10' 
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <div className={activeTab === tab.id ? 'text-white' : 'text-zinc-400'}>
                {tab.icon}
              </div>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-850">
          <button onClick={() => {setIsLogged(false); navigate('/')}} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer">
            <LogOut className="w-5 h-5" />
            <span>خروج از پنل</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {isLoading && (
          <div className="fixed top-4 left-4 z-50 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Load ...
          </div>
        )}

        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">داشبورد مدیریت یکپارچه</h1>
                <p className="text-zinc-450 text-sm mt-1">نمای آماری از محصولات هوشمند فعال و سفارشات تحویل شده.</p>
              </div>
              <button 
                onClick={loadAllData} 
                className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                title="بروزرسانی داده‌ها"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'درآمد تأیید شده (سفارشات تحویل شده)', val: `${totalCalculatedRevenue.toLocaleString('fa-IR')} تومان`, icon: <Activity className="text-emerald-400" /> },
                { title: 'کل سفارشات دریافتی', val: orders.length.toString(), icon: <ShoppingBag className="text-orange-400" /> },
                { title: 'محصولات / خدمات تعریف شده', val: products.length.toString(), icon: <Users className="text-indigo-400" /> }
              ].map((stat, i) => (
                <div key={i} className="glass-panel p-6 flex flex-col gap-4 border border-zinc-800/80">
                  <div className="flex items-center justify-between">
                     <span className="text-zinc-400 text-sm font-medium">{stat.title}</span>
                     <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                      {stat.icon}
                    </div>
                  </div>
                  <span className="text-2xl font-bold font-mono text-zinc-100">{stat.val}</span>
                </div>
              ))}
            </div>

             <div className="glass-panel p-6 mt-6 border border-zinc-800/80">
               <h2 className="font-bold text-lg mb-6 text-zinc-100 flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-indigo-400" />
                 آخرین سفارشات ثبتی کاربران با جزئیات
               </h2>
               <div className="space-y-4">
                 {orders.slice(0, 5).map(ord => (
                  <div key={ord.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 border-b border-zinc-850 last:border-0 last:pb-0 gap-3">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-zinc-905 bg-zinc-800 rounded-xl flex items-center justify-center text-xs text-indigo-400 font-mono border border-zinc-700/50">#{ord.id}</div>
                      <div>
                        <p className="font-bold text-sm text-zinc-100">{ord.productTitle}</p>
                        <p className="text-xs text-zinc-500 mt-1 font-mono">کاربر: {ord.userIdentifier} | تاریخ: {new Date(ord.createdAt).toLocaleDateString('fa-IR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-400 pl-4">{ord.price}</span>
                      {ord.status === 'completed' && <span className="text-xs text-emerald-400 bg-emerald-400/5 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">تکمیل شده</span>}
                      {ord.status === 'canceled' && <span className="text-xs text-red-400 bg-red-450/5 border border-red-500/20 px-3 py-1 rounded-full font-bold">لغو شده</span>}
                      {ord.status === 'pending' && <span className="text-xs text-amber-400 bg-amber-400/5 border border-amber-500/20 px-3 py-1 rounded-full font-bold">در انتظار اقدام</span>}
                    </div>
                  </div>
                 ))}
                 {orders.length === 0 && (
                   <p className="text-sm text-zinc-500 text-center py-6">هیچ فرآیند سفارش فعالی ثبت نشده است.</p>
                 )}
               </div>
             </div>
          </motion.div>
        )}

        {/* --- Unified Content, Price, Active status, and Orders management tab --- */}
        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-850 pb-6">
              <div>
                 <h1 className="text-3xl font-bold tracking-tight text-zinc-100">بخش فروشگاه دیجیتال</h1>
                 <p className="text-zinc-450 text-sm mt-1.5">مدیریت محصولات، تعیین قیمت‌ها، فعال/غیرفعال کردن منوی لات‌ها و نظارت بر فاکتورها.</p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setProductsSubTab('products')} 
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${productsSubTab === 'products' ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
                >
                  جعبه محصولات و لات‌ها ({products.length})
                </button>
                <button 
                  onClick={() => setProductsSubTab('orders')} 
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${productsSubTab === 'orders' ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
                >
                  حق اشتراک و سفارشات ({orders.length})
                </button>
              </div>
            </header>

            {productsSubTab === 'products' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-zinc-900/20 p-4 rounded-xl border border-zinc-850">
                  <span className="text-sm text-zinc-450 font-normal">تعیین خدمات، محصولات و بخش‌های فروشگاه در دو دستهٔ اکانت‌های آماده و طراحی سفارشی.</span>
                  <button 
                    onClick={openNewProductModal}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>سرویس یا محصول جدید +</span>
                  </button>
                </div>

                <div className="glass-panel overflow-hidden border border-zinc-800/80">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-zinc-450">
                      <thead className="text-xs text-zinc-300 uppercase bg-zinc-900/60 border-b border-zinc-850">
                        <tr>
                          <th className="px-6 py-4 font-bold text-center w-20">آیکون</th>
                          <th className="px-6 py-4 text-right">عنوان محصول/خدمت</th>
                          <th className="px-6 py-4 text-center">نوع بخش</th>
                          <th className="px-6 py-4 text-center">دسته‌بندی</th>
                          <th className="px-6 py-4 text-center">قیمت پایانی/پایه</th>
                          <th className="px-6 py-4 text-center">وضعیت نمایش</th>
                          <th className="px-6 py-4 text-center">عملیات ادمین</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p.id} className="border-b border-zinc-850/60 hover:bg-zinc-900/20 transition-colors">
                             <td className="px-6 py-4 text-center">
                               <span className="inline-block bg-zinc-850/60 rounded px-2.5 py-1 text-xs select-none border border-zinc-800">
                                 {p.icon}
                               </span>
                             </td>
                             <td className="px-6 py-4 font-bold text-zinc-200">
                               <div>
                                 <p className="text-sm font-bold text-white mb-0.5">{p.title}</p>
                                 <p className="text-xs text-zinc-500 font-normal truncate max-w-[280px]">{p.desc}</p>
                               </div>
                             </td>
                             <td className="px-6 py-4 text-center">
                               <span className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-bold ${p.type === 'account' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                 {p.type === 'account' ? 'اکانت' : 'خدمات توسعه'}
                               </span>
                             </td>
                             <td className="px-6 py-4 text-center font-mono text-xs text-zinc-450">
                               {p.category}
                             </td>
                             <td className="px-6 py-4 text-center text-emerald-400 font-bold font-mono">
                               {p.price}
                             </td>
                             <td className="px-6 py-4 text-center">
                               <button 
                                 onClick={() => toggleProductActiveStatus(p)}
                                 className="cursor-pointer font-bold focus:outline-none transition-transform active:scale-95"
                               >
                                 {p.active !== false ? (
                                   <span className="flex items-center justify-center gap-1.5 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                                     <Eye className="w-3.5 h-3.5" />
                                     <span>فعال</span>
                                   </span>
                                 ) : (
                                   <span className="flex items-center justify-center gap-1.5 text-xs text-red-400 bg-red-450/10 border border-red-500/25 px-2.5 py-1 rounded-full">
                                     <EyeOff className="w-3.5 h-3.5" />
                                     <span>مخفی/غیرفعال</span>
                                   </span>
                                 )}
                               </button>
                             </td>
                             <td className="px-6 py-4">
                               <div className="flex items-center justify-center gap-2.5">
                                 <button 
                                   onClick={() => openEditProductModal(p)}
                                   className="text-sky-400 hover:text-sky-300 p-1.5 rounded bg-sky-400/5 hover:bg-sky-400/15 transition-all cursor-pointer"
                                   title="ویرایش محصول"
                                 >
                                   <Edit2 className="w-4 h-4" />
                                 </button>
                                 <button 
                                   onClick={() => handleDeleteProduct(p.id)}
                                   className="text-red-400 hover:text-red-300 p-1.5 rounded bg-red-450/5 hover:bg-red-450/15 transition-all cursor-pointer"
                                   title="حذف کامل"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              // Order Sub-Tab Panel for Administrators
              <div className="space-y-6">
                <div className="bg-zinc-900/20 p-4 rounded-xl border border-zinc-850">
                  <p className="text-sm text-zinc-450">نظارت بر پرداخت‌های حق اشتراک، نیازمندی‌ها، سناریوهای سفارش داده شده و تغییر زنده فاکتورها.</p>
                </div>

                <div className="glass-panel overflow-hidden border border-zinc-800/80">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-zinc-450">
                      <thead className="text-xs text-zinc-300 uppercase bg-zinc-900/60 border-b border-zinc-850">
                        <tr>
                          <th className="px-6 py-4 text-center w-24">شناسه سفارش</th>
                          <th className="px-6 py-4">خریدار / مشتری</th>
                          <th className="px-6 py-4">محصول فرعی</th>
                          <th className="px-6 py-4 text-center">نوع</th>
                          <th className="px-6 py-4">مجموع مبلغ</th>
                          <th className="px-6 py-4 text-center">وضعیت</th>
                          <th className="px-6 py-4 text-center">تغییر وضعیت</th>
                          <th className="px-6 py-4 text-center">حذف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(ord => (
                          <tr key={ord.id} className="border-b border-zinc-850/60 hover:bg-zinc-900/20 transition-colors">
                            <td className="px-6 py-4 text-center font-mono text-zinc-300 font-bold">
                              #{ord.id}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs text-zinc-200 bg-zinc-900/80 border border-zinc-800 px-2 py-1 rounded block w-fit">
                                {ord.userIdentifier}
                              </span>
                              <span className="text-[10px] text-zinc-500 block mt-1">تارخ ثبت: {new Date(ord.createdAt).toLocaleString('fa-IR')}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-[240px]">
                                <p className="font-bold text-white text-sm">{ord.productTitle}</p>
                                <p className="text-xs text-zinc-500 mt-1 truncate bg-zinc-950/40 p-1.5 rounded border border-zinc-900" title={ord.additionalDetails}>
                                  {ord.additionalDetails || 'توضیحات تکمیلی ثبت نشده'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-block text-[10px] px-2 py-0.5 rounded ${ord.productType === 'account' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                {ord.productType === 'account' ? 'اکانت' : 'خدمات'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-emerald-400 font-mono">
                              {ord.price}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {ord.status === 'completed' && <span className="text-xs text-emerald-400 bg-emerald-400/5 px-2 py-1 rounded-full border border-emerald-500/20 font-bold">تکمیل شده</span>}
                              {ord.status === 'canceled' && <span className="text-xs text-red-500 bg-red-500/5 px-2 py-1 rounded-full border border-red-500/20 font-bold">لغو شده</span>}
                              {ord.status === 'pending' && <span className="text-xs text-amber-550 text-amber-400 bg-amber-400/5 px-2 py-1 rounded-full border border-amber-500/20 font-bold animate-pulse">در انتظار بررسی</span>}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <select 
                                value={ord.status}
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                                className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg p-1.5 focus:border-indigo-400 transition-colors outline-none cursor-pointer"
                              >
                                <option value="pending">در انتظار بررسی</option>
                                <option value="completed">تکمیل و فعال کردن</option>
                                <option value="canceled">لغو سناریو</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => handleDeleteOrder(ord.id)}
                                className="text-red-400 hover:text-red-300 p-1.5 rounded bg-red-450/5 hover:bg-red-450/15 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-12 text-zinc-500">هیچ سفارشی تاکنون ثبت نشده است.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-4xl mx-auto">
             <header>
               <h1 className="text-3xl font-bold tracking-tight text-white">تنظیمات پایه سیستم</h1>
               <p className="text-zinc-400 text-sm mt-2">مدیریت توکن ربات‌ها و دسترسی مدیران ارشد</p>
             </header>

             <div className="glass-panel p-6 space-y-6 border border-zinc-805/40 pb-8 rounded-2xl bg-zinc-900/30">
                <div>
                   <label className="text-sm font-bold text-zinc-300 block mb-2">شناسه ادمین اصلی (جهت دریافت اطلاعیه‌ها در ربات)</label>
                   <input 
                     type="text" 
                     value={adminSettings.adminIdNumber || ''} 
                     onChange={e => setAdminSettings({...adminSettings, adminIdNumber: e.target.value})}
                     className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors" 
                     dir="ltr" 
                     placeholder="e.g. 123456789"
                   />
                </div>
                
                <div className="flex items-center gap-4 py-2 border-t border-zinc-850 pt-4">
                  <div>
                    <label className="text-sm font-bold text-zinc-355 block">فعال بودن ورود با شماره موبایل (پیام‌رسان)</label>
                    <span className="text-xs text-zinc-500 block">فعال یا غیرفعال کردن لاگین بله و تلگرام در سراسر سایت</span>
                  </div>
                  <button 
                    onClick={() => setAdminSettings({...adminSettings, enableMobileLogin: !adminSettings.enableMobileLogin})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${adminSettings.enableMobileLogin ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${adminSettings.enableMobileLogin ? 'translate-x-1' : 'translate-x-6'}`} />
                  </button>
                </div>
             </div>

             <div className="glass-panel p-6 border border-zinc-805/40 bg-zinc-900/30">
                <h3 className="font-bold text-lg mb-4 text-white">تنظیمات ایمیل (جهت ارسال کد یکبار مصرف)</h3>
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
                <div className="glass-panel p-6 border border-zinc-805/40 bg-zinc-900/30">
                   <div className="flex items-center gap-3 mb-6">
                     <Bot className="w-8 h-8 text-sky-450" />
                     <div>
                       <h3 className="font-bold text-lg text-white">ربات تلگرام</h3>
                       <p className="text-zinc-500 text-xs mt-1">متصل به @BotFather</p>
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

                <div className="glass-panel p-6 border border-zinc-805/40 bg-zinc-900/30">
                   <div className="flex items-center gap-3 mb-6">
                     <MessageSquare className="w-8 h-8 text-emerald-450" />
                     <div>
                       <h3 className="font-bold text-lg text-white">ربات بله</h3>
                       <p className="text-zinc-500 text-xs mt-1">داخلی و سازمانی</p>
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
               <button onClick={handleSaveSettings} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer">
                 ذخیره قطعی تمامی تنظیمات
               </button>
             </div>
           </motion.div>
        )}

        {activeTab === 'backup' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
             <header className="mb-8">
               <h1 className="text-3xl font-bold tracking-tight text-white">پشتیبان‌گیری سیستم</h1>
               <p className="text-zinc-400 text-sm mt-2">تهیه فایل بکاپ کامل از کاربران، محصولات و فاکتور چت‌ها</p>
             </header>

             <div className="glass-panel p-8 text-center border-dashed border-2 border-zinc-800 bg-zinc-900/20">
               <Database className="w-16 h-16 text-indigo-400 mx-auto mb-6 opacity-80" />
               <h3 className="text-xl font-bold mb-2">استخراج کامل پایگاه داده محلی</h3>
               <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8">
                 تمامی داده‌های ورودی شما شامل سفارشات، کاربران متصل، توکن‌های هوایی و باگمن‌های ستاپ شده در یک فرمت منسجم دانلود میگردد.
               </p>
               <button onClick={handleBackup} className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold transition-colors cursor-pointer shadow-md shadow-indigo-500/10">
                 تولید و دانلود فایل بکاپ (.JSON)
               </button>
             </div>
           </motion.div>
        )}

        {/* Support Chat Panel */}
        {activeTab === 'chats' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
             <header className="mb-8">
               <h1 className="text-3xl font-bold tracking-tight text-white">تیکت‌های چت کاربران</h1>
               <p className="text-zinc-400 text-sm mt-2">نظارت عمومی به مشکلات ارتباطی و ارسال توکن مستقیم به مشتریان.</p>
             </header>

             <div className="flex flex-col md:flex-row gap-6 h-[600px]">
               <div className="w-full md:w-1/3 glass-panel overflow-y-auto border border-zinc-800 bg-zinc-900/20">
                 <div className="p-4 border-b border-zinc-800">
                   <h3 className="font-bold text-white text-sm">لیست گفتگوها</h3>
                 </div>
                 {['user@example.com (سایت)', 'meh732@gmail.com (نشانه فعال)', 'کاربر تلگرام (1241)'].map((p, i) => (
                    <div key={i} className={`p-4 border-b border-zinc-800/50 hover:bg-zinc-900/60 transition-colors cursor-pointer ${i===1?'bg-indigo-500/5 border-r-2 border-indigo-500':''}`}>
                      <p className="font-bold text-sm text-zinc-200">{p}</p>
                      <p className="text-xs text-zinc-550 text-zinc-450 mt-1 truncate">سلام، آخرین جزییات تحویل اشتراک ChatGPT را بفرمایید.</p>
                    </div>
                 ))}
               </div>
               <div className="flex-1 glass-panel flex flex-col bg-zinc-900/10 border border-zinc-800">
                 <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                    <p className="font-bold text-sm text-white">پشتیبانی زنده ادمین با: meh732@gmail.com</p>
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-bold">اتصال زنده</span>
                 </div>
                 <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-zinc-950/25">
                    <div className="max-w-[80%] bg-zinc-850 p-3 rounded-2xl rounded-tr-none text-xs text-zinc-200 border border-zinc-800">
                      کاربر: سلام، برای طراحی سایتی که درخواست دادم سناریو رو براتون فرستادم.
                    </div>
                    <div className="max-w-[80%] ml-auto bg-indigo-500 p-3 rounded-2xl rounded-tl-none text-xs text-white shadow-md shadow-indigo-500/10">
                      ادمین سیستم: سلام بر شما. سفارش شما دریافت شد و تیم فنی آماده به کار است. به زودی در گیت هاب لایو دمو را پیوست میکنیم.
                    </div>
                 </div>
                 <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/40 flex gap-2">
                   <input type="text" placeholder="پاسخ به این کاربر ادمین..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 text-white" />
                   <button className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer">ارسال پاسخ</button>
                 </div>
               </div>
             </div>
           </motion.div>
        )}
      </main>

      {/* --- Product CRUD Modal form (افزودن و ویرایش محصولات) --- */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="absolute top-4 left-4 text-zinc-400 hover:text-white cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all"
              >
                ✕
              </button>
              
              <h2 className="text-2xl font-bold mb-6 text-white border-b border-zinc-850 pb-3 flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-400" />
                {editingProduct ? 'ویرایش اطلاعات محصول/خدمت' : 'ثبت محصول جدید در دو تراز'}
              </h2>

              <form onSubmit={handleSaveProduct} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-300">عنوان محصول/سرویس</label>
                    <input 
                      type="text"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="مثلا: حساب کاربری چت جی پی تی"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-300">هزینه / قیمت (با فرمت متنی)</label>
                    <input 
                      type="text"
                      value={formPrice}
                      onChange={e => setFormPrice(e.target.value)}
                      placeholder="مثلا: ۳۵۰,۰۰۰ تومان یا از ۵ میلیون"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-300">نوع تراز/بخش</label>
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-150 focus:border-indigo-500 transition-colors outline-none cursor-pointer"
                    >
                      <option value="account">اکانت آماده (تحویل آنی)</option>
                      <option value="service">خدمات توسعه (طراحی سفارشی)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-300">شناسه دسته بندی (انگلیسی)</label>
                    <input 
                      type="text"
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      placeholder="مثلا: ai, web, apple"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors outline-none font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-300">آیکون نمایش (Lucide)</label>
                    <select
                      value={formIcon}
                      onChange={e => setFormIcon(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-150 focus:border-indigo-500 transition-colors outline-none cursor-pointer"
                    >
                      <option value="Bot">ربات (Bot)</option>
                      <option value="Apple">سیب (Apple)</option>
                      <option value="Palette">پالت هنر (Palette)</option>
                      <option value="Globe">جهان شبکه (Globe)</option>
                      <option value="MessageCircle">مکالمه چت (MessageCircle)</option>
                      <option value="Smartphone">موبایل اندروید (Smartphone)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-300">وضعیت پیشفرض نمایش</label>
                    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-805/80 p-2 px-4 rounded-xl mt-1.5">
                      <span className="text-xs text-zinc-400 font-normal">نمایش در لیست اصلی فروشگاه:</span>
                      <button 
                        type="button" 
                        onClick={() => setFormActive(!formActive)}
                        className="cursor-pointer text-indigo-400 font-bold focus:outline-none transition-transform"
                      >
                        {formActive ? (
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">نمایان</span>
                        ) : (
                          <span className="text-xs text-red-400 bg-red-450/10 px-2 py-0.5 rounded border border-red-500/20 font-bold">مخفی</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-300">توضیحات کوتاه محصول / پکیج</label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="جزییات تحویل پکیج، حجم سرویس، یا سناریوی لایسنس را بنویسید..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors outline-none"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-4 border-t border-zinc-850 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl py-3 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl py-3 text-sm font-bold transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                  >
                    {editingProduct ? 'ذخیره تغییرات محصول' : 'ذخیره محصول جدید'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
