import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, LayoutDashboard, ShoppingBag, Settings, MessageSquare, Database, LogOut, 
  Activity, Users, Edit, Trash2, Plus, Check, Clock, X, Eye, FileText, Bot, Save, AlertTriangle,
  Upload, Lock, Unlock, Send, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product, Order, Chat } from '../types';

export default function Admin() {
  const navigate = useNavigate();
  const [isLogged, setIsLogged] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // App active states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<string>('');
  const [adminReplyText, setAdminReplyText] = useState('');
  
  // Base site settings state
  const [adminSettings, setAdminSettings] = useState({
    telegramToken: '',
    baleToken: '',
    adminIdNumber: '',
    subAdminIds: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    enableMobileLogin: true,
    backupAutoEnabled: false,
    backupScheduleHour: 2,
    backupScheduleMinute: 0,
    backupPassword: '',
    backupSendTelegram: true,
    backupSendBale: true
  });

  // Modal control states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product Form states
  const [pTitle, setPTitle] = useState('');
  const [pType, setPType] = useState<'account' | 'service'>('account');
  const [pCategory, setPCategory] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pIcon, setPIcon] = useState('Bot');
  const [pDetails, setPDetails] = useState('');
  const [pAvailable, setPAvailable] = useState(true);

  // Deliver/edit order modal
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveryContent, setDeliveryContent] = useState('');

  useEffect(() => {
    // Check if session token of admin exists
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLogged(true);
      fetchDashboardData();
    }
  }, []);

  useEffect(() => {
    if (isLogged) {
      fetchDashboardData();
      
      const poller = setInterval(() => {
        fetchDashboardDataSilently();
      }, 5000);

      return () => clearInterval(poller);
    }
  }, [isLogged, selectedChatUser]);

  const fetchDashboardData = () => {
    // Fetch Settings
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => setAdminSettings(data))
      .catch(() => {});

    // Fetch Products
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(() => {});

    // Fetch Orders
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(() => {});

    // Fetch Chats
    fetch('/api/admin/chats')
      .then(res => res.json())
      .then(data => {
        setChats(data);
        if (data.length > 0 && !selectedChatUser) {
          setSelectedChatUser(data[0].userId);
        }
      })
      .catch(() => {});
  };

  const fetchDashboardDataSilently = () => {
    fetch('/api/products').then(res => res.json()).then(data => setProducts(data)).catch(() => {});
    fetch('/api/orders').then(res => res.json()).then(data => setOrders(data)).catch(() => {});
    fetch('/api/admin/chats').then(res => res.json()).then(data => setChats(data)).catch(() => {});
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsLogged(true);
        fetchDashboardData();
      } else {
        setError(data.message || 'نام کاربری یا رمز عبور اشتباه است.');
      }
    })
    .catch(() => {
      setError('ارتباط با سرور پنل ادمین برقرار نشد.');
    });
  };

  const handleSaveSettings = () => {
    fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminSettings)
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        alert('تنظیمات پایه و ربات‌های متصل با موفقیت بروزرسانی و فعال شدند!');
      } else {
        alert('تنظیمات ذخیره شد ولی خطا در راه‌اندازی ماژول ربات اتفاق افتاد.');
      }
    });
  };

  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFileText, setRestoreFileText] = useState('');
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const handleBackup = () => {
    const password = adminSettings.backupPassword || '';
    const url = password 
      ? `/api/admin/backup?password=${encodeURIComponent(password)}` 
      : `/api/admin/backup`;

    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (!d.success) {
          alert('خطا در تهیه فایل پشتیبان: ' + d.message);
          return;
        }
        let fileContent = '';
        let filename = '';
        if (d.encrypted) {
          fileContent = d.data;
          filename = `backup-digitalstore-${new Date().toISOString().split('T')[0]}-secure.enc`;
        } else {
          fileContent = JSON.stringify(d.backup, null, 2);
          filename = `backup-digitalstore-${new Date().toISOString().split('T')[0]}.json`;
        }
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        a.click();
      });
  };

  const handleRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRestoreFileText(text);
      
      // If it looks encrypted (contains ':' and doesn't start with '{'), prompt for password
      if (text.includes(':') && !text.trim().startsWith('{')) {
        setIsRestoreModalOpen(true);
      } else {
        if (confirm('آیا مطمئن هستید که می‌خواهید این بکاپ را بازیابی کنید؟ تیکت‌های پشتیبانی، کالاها و همه‌ی سفارشات جاری با این فایل بازنویسی خواهند شد.')) {
          executeRestore(text, '');
        }
      }
    };
    reader.readAsText(file);
  };

  const executeRestore = (dataStr: string, pass: string) => {
    fetch('/api/admin/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: dataStr, password: pass })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        alert('پایگاه داده کامل سیستم به همراه تنظیمات با موفقیت بازیابی شد!');
        setIsRestoreModalOpen(false);
        setRestorePassword('');
        fetchDashboardData();
      } else {
        alert('خطا در بازیابی بکاپ: ' + res.message);
      }
    })
    .catch(() => {
      alert('ارتباط با پورت انتقال داده با شکست مواجه شد.');
    });
  };

  const handleSendBackupNow = () => {
    fetch('/api/admin/backup/send-now', {
      method: 'POST'
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        alert('بکاپ دیتابیس فعلی با موفقیت به تلگرام یا بله ادمین فرستاده شد!');
      } else {
        alert('خطا در ارسال مستقیم بکاپ: ' + res.message);
      }
    })
    .catch(() => {
      alert('خطا در ارتباط با سرور.');
    });
  };

  const handleDeleteProduct = (id: number) => {
    if (!confirm('آیا مایلید این کالا برای همیشه حذف شود؟')) return;
    
    fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(() => {
        setProducts(prev => prev.filter(p => p.id !== id));
      });
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setPTitle('');
    setPType('account');
    setPCategory('apple');
    setPPrice('');
    setPDesc('');
    setPIcon('Bot');
    setPDetails('');
    setPAvailable(true);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setPTitle(p.title);
    setPType(p.type);
    setPCategory(p.category || 'general');
    setPPrice(p.price);
    setPDesc(p.desc);
    setPIcon(p.icon || 'Bot');
    setPDetails(p.details || '');
    setPAvailable(p.isAvailable !== false);
    setIsProductModalOpen(true);
  };

  const handleProductFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: pTitle,
      type: pType,
      category: pCategory,
      price: pPrice,
      desc: pDesc,
      icon: pIcon,
      details: pDetails,
      isAvailable: pAvailable
    };

    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
    const method = editingProduct ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        setIsProductModalOpen(false);
        fetchDashboardData();
        alert('کالا با موفقیت ذخیره شد.');
      } else {
        alert('خطایی در ثبت کالا رخ داد.');
      }
    });
  };

  // Deliver order (Status complete + Delivery details log)
  const handleDeliverOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    fetch(`/api/admin/orders/${selectedOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        deliveredContent: deliveryContent
      })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        setIsDeliverModalOpen(false);
        fetchDashboardData();
        alert(`سفارش #${selectedOrder.id} با موفقیت تحویل داده شد و لایسنس ارسال گردید.`);
      }
    });
  };

  const handleCancelOrder = (orderId: number) => {
    if (!confirm(`آیا مایلید سفارش #${orderId} لغو شود؟`)) return;

    fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'canceled' })
    })
    .then(r => r.json())
    .then(() => {
      fetchDashboardData();
    });
  };

  const handleDeleteOrder = (orderId: number) => {
    if (!confirm('آیا سفارش به طور کامل از لاگ‌ها حذف شود؟')) return;

    fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(() => {
        fetchDashboardData();
      });
  };

  // Send admin chat reply
  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedChatUser) return;

    fetch(`/api/chat/${encodeURIComponent(selectedChatUser)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'admin', text: adminReplyText })
    })
    .then(r => r.json())
    .then(() => {
      setAdminReplyText('');
      fetchDashboardData();
    });
  };

  const activeChat = chats.find(c => c.userId === selectedChatUser);

  // Calculations for Admin Dashboard Header statistics
  const totalSalesCount = orders.filter(o => o.status === 'completed').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  
  if (!isLogged) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 text-white select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 w-full max-w-md border border-zinc-800 bg-zinc-900/30 backdrop-blur-xl"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-indigo-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/25">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2 tracking-tight">پنل ادمین دیجیتال استور</h2>
            <p className="text-zinc-400 text-sm">احراز هویت و دسترسی به مدیریت کامل فروشگاه و ربات‌ها</p>
            <div className="bg-indigo-500/10 border border-indigo-500/15 py-1.5 px-3 rounded-lg text-xs mt-3 inline-block font-mono text-indigo-400">
              admin | 1234
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
             <div>
              <label className="block text-xs font-semibold mb-2 text-zinc-400">نام کاربری مأخذ</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                placeholder="Username..."
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 text-zinc-400">گذرواژه اصلی</label>
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                placeholder="••••"
                dir="ltr"
              />
            </div>
            {error && <p className="text-red-400 text-xs mt-1 text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">{error}</p>}
            <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-4 py-3 font-semibold transition-colors shadow-lg shadow-indigo-500/20 mt-4">
              ورود امن به کنترل پنل
            </button>
          </form>
          <button onClick={() => navigate('/')} className="w-full text-zinc-500 hover:text-white mt-4 text-xs transition-colors">
            ← لغو و بازگشت به سایت اصلی
          </button>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'داشبورد فروشگاه', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'orders', label: 'مدیریت سفارشات', icon: <ShoppingBag className="w-5 h-5" />, badge: pendingOrdersCount },
    { id: 'products', label: 'مدیریت محصولات و قیمت‌ها', icon: <Settings className="w-5 h-5" /> },
    { id: 'chats', label: 'پشتیبانی/تیکت‌ها', icon: <MessageSquare className="w-5 h-5" />, badge: chats.length },
    { id: 'settings', label: 'تنظیمات ربات‌ها و SMTP', icon: <Bot className="w-5 h-5" /> },
    { id: 'backup', label: 'بکاپ سیستم', icon: <Database className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex text-zinc-100 bg-zinc-950">
      {/* Sidebar navigation */}
      <aside className="w-68 border-l border-zinc-900 bg-zinc-900/30 backdrop-blur flex flex-col hidden lg:flex select-none">
        <div className="p-6">
          <div className="flex items-center gap-3 text-lg font-bold">
            <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight">پنل مدیریت یکپارچه</span>
              <span className="text-[10px] text-zinc-500">کنترل کامل سایت و ربات ها</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 text-xs rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/15' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={activeTab === tab.id ? 'text-white' : 'text-zinc-500'}>
                  {tab.icon}
                </div>
                <span>{tab.label}</span>
              </div>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-white text-indigo-600' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <button 
            onClick={() => {
              localStorage.removeItem('adminToken');
              setIsLogged(false);
              navigate('/');
            }} 
            className="w-full flex items-center gap-3 px-4 py-3 text-xs text-red-400 font-bold rounded-xl hover:bg-red-500/5 transition-colors border border-transparent hover:border-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            خروج گن و قفل پنل
          </button>
        </div>
      </aside>

      {/* Main dashboard viewport */}
      <main className="flex-1 p-8 overflow-y-auto w-full">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight">پنل سرپرستی دیجیتال استور</h1>
              <p className="text-zinc-400 text-xs mt-2">خلاصه سریع و مانیتورینگ وضعیت مشتریان و بات‌های متصل تلگرام و بله.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 flex flex-col gap-4 border border-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-xs font-bold">تعداد کل کالاها</span>
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center text-indigo-400">
                    <Settings className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-3xl font-extrabold">{products.length} کالا</span>
              </div>

              <div className="glass-panel p-6 flex flex-col gap-4 border border-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-xs font-bold">سفارشات تحویل شده (موفق)</span>
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center text-emerald-400">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-3xl font-extrabold text-emerald-400">{totalSalesCount} سفارش</span>
              </div>

              <div className="glass-panel p-6 flex flex-col gap-4 border border-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-xs font-bold">تیکت‌های چت آنلاین فعال</span>
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center text-sky-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-3xl font-extrabold text-sky-400">{chats.length} کاربر</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Recent Orders List Card */}
              <div className="glass-panel p-6 border border-zinc-900 space-y-4">
                <h2 className="font-bold text-base border-r-3 border-indigo-500 pr-2">آخرین فرآیندهای خرید صادر شده</h2>
                <div className="space-y-3.5">
                  {orders.slice(0, 4).map(o => (
                    <div key={o.id} className="flex items-center justify-between py-3 border-b border-zinc-900 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-900 border border-zinc-850 rounded-xl flex items-center justify-center text-[10px] font-mono text-zinc-500">#{o.id}</div>
                        <div>
                          <p className="font-bold text-xs text-zinc-200">{o.productTitle}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{o.userId}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : o.status === 'canceled' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {o.status === 'completed' ? 'تحویل شد' : o.status === 'canceled' ? 'لغو شد' : 'در انتظار'}
                      </span>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-xs text-zinc-500 text-center py-6">سفارشی ثبت نشده است.</p>}
                </div>
              </div>

              {/* Bot Network Connections status check */}
              <div className="glass-panel p-6 border border-zinc-905 border-zinc-900 space-y-4">
                <h2 className="font-bold text-base border-r-3 border-purple-500 pr-2">وضعیت اتصال ربات‌ها</h2>
                
                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-900">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center justify-center">
                        <Bot className="w-5 h-5 text-sky-400" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-zinc-200">ربات تلگرام هوشمند</p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">{adminSettings.telegramToken ? 'توکن ست شده و در حال گوش دادن' : 'بدون تنظیمات فعال'}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold ${adminSettings.telegramToken ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {adminSettings.telegramToken ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-900">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                        <Bot className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-zinc-200">ربات پیام‌رسان بله</p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">{adminSettings.baleToken ? 'در حال دریافت آپدیت‌ها و پولینگ خودکار' : 'بدون تنظیمات فعال'}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold ${adminSettings.baleToken ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {adminSettings.baleToken ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-4xl mx-auto">
            <header>
              <h1 className="text-3xl font-bold tracking-tight">تنظیمات پایه و ربات‌های ارتباطی</h1>
              <p className="text-zinc-400 text-xs mt-2 font-medium">پیکربندی هویت ربات‌های متصل به تلگرام و بله به همراه مشخصات خروجی ایمیل احراز هویت.</p>
            </header>

            <div className="glass-panel p-6 space-y-6 border border-zinc-900">
               <h2 className="text-sm font-bold border-r-3 border-indigo-500 pr-2">پیکربندی مدیران و ورود</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-2">شناسه عددی تلگرام مدیر ارشد (ارسال هشدارهای سفارش و چت)</label>
                    <input 
                      type="text" 
                      value={adminSettings.adminIdNumber} 
                      onChange={e => setAdminSettings({...adminSettings, adminIdNumber: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-colors font-mono" 
                      dir="ltr" 
                      placeholder="e.g. 12345678"
                    />
                 </div>

                 <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-2">شناسه عددی سایر ادمین‌های فرعی تلگرام (با کاراکتر کاما جدا کنید)</label>
                    <input 
                      type="text" 
                      value={adminSettings.subAdminIds} 
                      onChange={e => setAdminSettings({...adminSettings, subAdminIds: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-colors font-mono" 
                      dir="ltr" 
                      placeholder="e.g. 87654321, 55443322"
                    />
                 </div>
               </div>

                <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                  <div className="space-y-1">
                     <p className="text-xs font-bold">ورود دو مرحله‌ای با موبایل (پیام‌رسان متصل)</p>
                     <p className="text-[10px] text-zinc-500">کد احراز هویت یکبار مصرف از طریق ربات‌های زنده به تلگرام و بله کاربران برای ورود دلیوری می‌شود.</p>
                  </div>
                  <button 
                    onClick={() => setAdminSettings({...adminSettings, enableMobileLogin: !adminSettings.enableMobileLogin})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${adminSettings.enableMobileLogin ? 'bg-indigo-500' : 'bg-zinc-850'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${adminSettings.enableMobileLogin ? 'translate-x-1' : '-translate-x-6'}`} />
                  </button>
                </div>
            </div>

            {/* Email configuration SMTP guidance */}
            <div className="glass-panel p-6 border border-zinc-900 space-y-4">
              <h2 className="text-sm font-bold border-r-3 border-indigo-500 pr-2">تنظیم فرستنده ایمیل SMTP (ارسال کدهای OTP حساب به ایمیل)</h2>
              
              <div className="bg-indigo-500/5 border border-indigo-500/10 text-indigo-400/90 p-4 rounded-xl text-xs leading-relaxed space-y-1">
                <p><strong>💡 راهنمای جیمیل (Gmail SMTP):</strong></p>
                <p>۱. سرور میزبان را برابر <code>smtp.gmail.com</code> و پورت را <code>587</code> وارد کنید.</p>
                <p>۲. ایمیل خود را در User وارد کنید.</p>
                <p>۳. رمز عبور فرستنده باید <b>App Password اختصاصی گوگل</b> باشد. رمز معمولی بعلت مسائل امنیتی یا تایید دو مرحله‌ای کار نخواهد کرد.</p>
                <p><a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-indigo-300">دریافت رمز عبور جیمیل گوگل اپ (App Passwords) →</a></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-2">سرور فرستنده (SMTP Host)</label>
                  <input type="text" value={adminSettings.smtpHost} onChange={e => setAdminSettings({...adminSettings, smtpHost: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 font-mono" dir="ltr" placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-2">پورت SMTP (SMTP Port)</label>
                  <input type="text" value={adminSettings.smtpPort} onChange={e => setAdminSettings({...adminSettings, smtpPort: e.target.value})} className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 font-mono" dir="ltr" placeholder="587" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-2">نام گیرنده ایمبل (SMTP User)</label>
                  <input type="email" value={adminSettings.smtpUser} onChange={e => setAdminSettings({...adminSettings, smtpUser: e.target.value})} className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 font-mono" dir="ltr" placeholder="your@gmail.com" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-2">گذرواژه نرم‌افزار ایمیل (SMTP Pass)</label>
                  <input type="password" value={adminSettings.smtpPass} onChange={e => setAdminSettings({...adminSettings, smtpPass: e.target.value})} className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 font-mono" dir="ltr" placeholder="••••••••••••" />
                </div>
              </div>
            </div>

            {/* TG and Bale Tokens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-6 border border-zinc-900 space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-sky-500/15 rounded-xl flex items-center justify-center text-sky-400">
                     <Bot className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="font-bold text-sm text-zinc-100">آدرس توکن بات تلگرام</p>
                     <p className="text-[10px] text-zinc-500 mt-0.5">دریافت شده از @BotFather</p>
                   </div>
                 </div>
                 <input 
                   type="password" 
                   value={adminSettings.telegramToken} 
                   onChange={e => setAdminSettings({...adminSettings, telegramToken: e.target.value})}
                   placeholder="Telegram Token..." 
                   className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-xl px-4 py-2 text-xs font-mono text-zinc-300 outline-none transition-all" 
                   dir="ltr" 
                 />
              </div>

              <div className="glass-panel p-6 border border-zinc-900 space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-400">
                     <Bot className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="font-bold text-sm text-zinc-100">آدرس توکن بات پیام‌رسان بله</p>
                     <p className="text-[10px] text-zinc-500 mt-0.5">دریافت شده از بازوی پشتیبان در بله</p>
                   </div>
                 </div>
                 <input 
                   type="password" 
                   value={adminSettings.baleToken} 
                   onChange={e => setAdminSettings({...adminSettings, baleToken: e.target.value})}
                   placeholder="Bale Token..." 
                   className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2 text-xs font-mono text-zinc-300 outline-none transition-all" 
                   dir="ltr" 
                 />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleSaveSettings} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-3 rounded-xl font-bold text-xs transition-colors shadow-lg shadow-indigo-500/15 flex items-center gap-1">
                <Save className="w-4 h-4" />
                ذخیره و پیاده‌سازی ربات‌ها
              </button>
            </div>
          </motion.div>
        )}

        {/* BACKUP TAB */}
        {activeTab === 'backup' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
            <header className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">پشتیبان‌گیری امن پایگاه داده</h1>
              <p className="text-zinc-400 text-xs mt-2 font-medium">پیکربندی کامل سیستم بکاپ گیری خودکار روزانه با تکنولوژی رمزنگاری و دلیوری هوشمند به بات‌ها.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manual Backup Download and Restore Section */}
              <div className="glass-panel p-6 border border-zinc-900 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                      <Database className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-100">دریافت مستقیم فایل پشتیبان (JSON)</h3>
                      <p className="text-[10px] text-zinc-500">دانلود محلی فوری کل پایگاه داده در مرورگر شما</p>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    شما می‌توانید خروجی ساختاریافته فروشگاه شامل محصولات، گزارشات تراکنش، سبد و پشتیبانی را بصورت یکجا روی سیستم محلی تان فودکرده و در آینده هر زمانی نیاز شد لود کنید.
                  </p>
                </div>
                <div className="pt-4 flex flex-wrap gap-3">
                  <button onClick={handleBackup} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/15">
                    <RefreshCw className="w-4 h-4" />
                    تولید و دانلود فوری بکاپ
                  </button>
                  <button onClick={handleSendBackupNow} className="bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-zinc-400" />
                    تست ارسال آنی به بات‌ها
                  </button>
                </div>
              </div>

              {/* Database Restore from file */}
              <div className="glass-panel p-6 border border-zinc-900 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Upload className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-100">بازیابی پایگاه داده و ریستور داده‌ها</h3>
                      <p className="text-[10px] text-zinc-500">آپلود خروجی بکاپ .json یا .enc</p>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed mb-4">
                    فایل کپی برداری شده قبلی سیستم را آپلود کنید تا دیتابیس مجدداً ری‌استور گردد. در صورتی که فایل شما حاوی کلمه عبور حفاظتی باشد، سیستم قبل از اجرا آن را از شما میخواهد.
                  </p>
                </div>

                <div>
                  <input 
                    type="file" 
                    accept=".json,.enc,.txt" 
                    onChange={handleRestoreUpload} 
                    className="hidden" 
                    id="db-restore-file-uploader" 
                  />
                  <label 
                    htmlFor="db-restore-file-uploader" 
                    className="w-full bg-zinc-950 hover:bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Upload className="w-6 h-6 text-indigo-400" />
                    <span className="text-xs font-bold text-zinc-300">برای بازیابی، فایل بکاپ را انتخاب کنید</span>
                    <span className="text-[9px] text-zinc-500">پشتیبانی از فرمت‌های JSON و دیتای کدگذاری‌شده AES</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Auto Schedule Configurations Section */}
            <div className="glass-panel p-6 border border-zinc-900 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-zinc-100">تنظیمات پایگاه پشتیبان‌گیری اتوماتیک روزانه</h3>
                    <p className="text-[10px] text-zinc-500">تهیه آرشیو و ارسال زمان‌بندی‌شده مستمر بدون مداخله دستی</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-zinc-950 px-3.5 py-1.5 rounded-xl border border-zinc-900">
                  <span className="text-[11px] text-zinc-400 font-bold">بکاپ خودکار روزانه:</span>
                  <button 
                    onClick={() => setAdminSettings({...adminSettings, backupAutoEnabled: !adminSettings.backupAutoEnabled})}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${adminSettings.backupAutoEnabled ? 'bg-indigo-500' : 'bg-zinc-800'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${adminSettings.backupAutoEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                  </button>
                </div>
              </div>

              {adminSettings.backupAutoEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                  {/* Time Picker */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-2">ساعت دقیق اجرای بکاپ روزانه (۲۴ ساعته)</label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <span className="text-[9px] text-zinc-500 block mb-1 font-bold">ساعت (Hour)</span>
                          <input 
                            type="number" 
                            min="0" 
                            max="23" 
                            value={adminSettings.backupScheduleHour} 
                            onChange={e => setAdminSettings({...adminSettings, backupScheduleHour: Math.max(0, Math.min(23, parseInt(e.target.value) || 0))})}
                            className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-center font-mono text-white outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="text-zinc-500 font-bold self-end mb-2">:</div>
                        <div className="flex-1">
                          <span className="text-[9px] text-zinc-500 block mb-1 font-bold">دقیقه (Minute)</span>
                          <input 
                            type="number" 
                            min="0" 
                            max="59" 
                            value={adminSettings.backupScheduleMinute} 
                            onChange={e => setAdminSettings({...adminSettings, backupScheduleMinute: Math.max(0, Math.min(59, parseInt(e.target.value) || 0))})}
                            className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-center font-mono text-white outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2">سرور در ساعت تعیین شده فوق روزانه کل دیتابیس را پکیج و کپسوله می‌کند.</p>
                    </div>

                    {/* Channel Selection Checkboxes */}
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-zinc-400">کانال‌های دلیوری بکاپ کلاینت:</p>
                      
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-3 bg-zinc-950/40 border border-zinc-950 rounded-xl p-3 cursor-pointer hover:bg-zinc-950 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={adminSettings.backupSendTelegram} 
                            onChange={e => setAdminSettings({...adminSettings, backupSendTelegram: e.target.checked})}
                            className="rounded border-zinc-800 text-indigo-500 focus:ring-indigo-500 h-4 w-4" 
                          />
                          <div className="text-xs">
                            <span className="font-bold text-sky-400 block">ارسال به بات تلگرام ادمین ارشد و ادمین‌های فرعی</span>
                            <span className="text-[9px] text-zinc-500 mt-0.5 block">فایل مستقیماً به چت‌آیدی مشخص‌شده در زبانه پیکربندی ارسال می‌شود.</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 bg-zinc-950/40 border border-zinc-950 rounded-xl p-3 cursor-pointer hover:bg-zinc-950 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={adminSettings.backupSendBale} 
                            onChange={e => setAdminSettings({...adminSettings, backupSendBale: e.target.checked})}
                            className="rounded border-zinc-805 border-zinc-800 text-indigo-500 focus:ring-indigo-500 h-4 w-4" 
                          />
                          <div className="text-xs">
                            <span className="font-bold text-emerald-400 block">ارسال به بازوی هوشمند پیام‌رسان بله</span>
                            <span className="text-[9px] text-zinc-500 mt-0.5 block">ارسال سند به آیدی عددی ادمین روی پلتفرم بله ایران.</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Encryption Password Setup */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-zinc-300">
                        <Lock className="w-4 h-4 text-amber-500" />
                        <label className="text-[11px] font-bold">رمز عبور حفاظتی بکاپ (AES-256)</label>
                      </div>
                      <input 
                        type="password" 
                        value={adminSettings.backupPassword} 
                        onChange={e => setAdminSettings({...adminSettings, backupPassword: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 font-mono" 
                        placeholder="در صورت تمایل رمزی برای امنیت حداکثری ست کنید"
                        dir="ltr"
                      />
                      <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-[10px] text-amber-400/90 leading-relaxed mt-2.5 space-y-1">
                        <p><strong>🔒 حفاظت کامل در مقابل نشت اطلاعات:</strong></p>
                        <p>با ست کردن کلمه عبور، فایل قبل از ارسال بصورت سخت دست‌انداز و با قوی‌ترین متد رمزنگاری ارتش‌های پیشرفته (AES-256) کپی‌برداری می‌شود تا در تلگرام و بله کاملاً ضد هک باشد.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-zinc-900 pt-4 flex justify-between items-center">
                <span className="text-[10px] text-zinc-500">پس از اتمام اعمال تغییرات حتما دکمه ذیل را کلیک کنید تا جدول زمانبندی فعال شود.</span>
                <button onClick={handleSaveSettings} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-lg shadow-indigo-500/15 flex items-center gap-1">
                  <Save className="w-4 h-4" />
                  ذخیره کانفیگ بکاپ
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* CHATS/SUPPORT DESK TAB */}
        {activeTab === 'chats' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
            <header className="mb-4">
              <h1 className="text-3xl font-extrabold tracking-tight">میز پاسخگویی به پشتیبانی</h1>
              <p className="text-zinc-400 text-xs mt-2 font-medium">پاسخ مستقیم و همزمان به سوالات و استعلام‌های ثبتی کاربران سایت و ربات‌های متصل.</p>
            </header>

            {chats.length === 0 ? (
              <div className="glass-panel p-12 text-center text-zinc-500">گفتگوی فعالی تا الان ثبت نشده است.</div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6 h-[550px]">
                {/* Users List */}
                <div className="w-full lg:w-1/3 glass-panel overflow-y-auto border border-zinc-900 bg-zinc-950/25">
                  <div className="p-4 border-b border-zinc-900 bg-zinc-900/10">
                    <h3 className="font-bold text-xs">لیست تیکت‌ها</h3>
                  </div>
                  {chats.map((c, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedChatUser(c.userId)}
                      className={`p-4 border-b border-zinc-905 border-zinc-900 cursor-pointer transition-colors ${selectedChatUser === c.userId ? 'bg-indigo-500/10 border-r-3 border-r-indigo-500' : 'hover:bg-zinc-900/30'}`}
                    >
                      <p className="font-bold text-xs text-zinc-200">{c.userId}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 truncate">{c.messages[c.messages.length - 1]?.text || 'بدون پیام'}</p>
                    </div>
                  ))}
                </div>

                {/* Dialog Pane */}
                <div className="flex-1 glass-panel flex flex-col bg-zinc-900/10 border border-zinc-900">
                  <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
                    <p className="font-bold text-xs text-indigo-400">ارتباط با مخاطب: <code>{selectedChatUser}</code></p>
                  </div>

                  <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-zinc-950/15">
                    {activeChat && activeChat.messages.map((m, i) => (
                      <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${m.sender === 'admin' ? 'bg-indigo-500 text-white rounded-br-sm' : 'bg-zinc-850 text-zinc-200 rounded-bl-sm border border-zinc-800'}`}>
                          <p>{m.text}</p>
                        </div>
                      </div>
                    ))}
                    {!activeChat && <p className="text-center text-xs text-zinc-500 py-12">یک مخاطب را از سمت راست انتخاب کنید.</p>}
                  </div>

                  <form onSubmit={handleSendAdminReply} className="p-4 border-t border-zinc-900 flex gap-2">
                    <input 
                      type="text" 
                      value={adminReplyText}
                      onChange={e => setAdminReplyText(e.target.value)}
                      placeholder="پاسخ ادمین..." 
                      className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 text-xs rounded-xl px-4 py-3 outline-none transition-colors text-white" 
                    />
                    <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 px-5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10">ارسال</button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ORDERS MANAGEMENT TAB */}
        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
            <header className="mb-4 flex justify-between items-end">
              <div>
                 <h1 className="text-3xl font-extrabold tracking-tight">کنترل و تحویل سفارشات</h1>
                 <p className="text-zinc-400 text-xs mt-2 font-medium">سفارشات ثبت شده در درگاه‌های سایت و ربات ها را بررسی، تایید و لایسنس‌دهی کنید.</p>
              </div>
            </header>

            <div className="glass-panel overflow-hidden border border-zinc-900">
              <table className="w-full text-xs text-right text-zinc-400">
                <thead className="text-[10px] text-zinc-300 uppercase bg-zinc-900">
                  <tr>
                    <th className="px-6 py-4">شناسه سفارش</th>
                    <th className="px-6 py-4">محصول فرضی</th>
                    <th className="px-6 py-4">نام کاربری خریدار</th>
                    <th className="px-6 py-4">قیمت کل</th>
                    <th className="px-6 py-4">وضعیت</th>
                    <th className="px-6 py-4">عملیات مالی / تحویل دیجیتال</th>
                  </tr>
                </thead>
                <tbody>
                   {orders.map(order => {
                     const isPend = order.status === 'pending';
                     const isComp = order.status === 'completed';
                     const isCanc = order.status === 'canceled';

                     return (
                       <tr key={order.id} className="border-b border-zinc-900 hover:bg-zinc-900/25 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-200">#{order.id}</td>
                          <td className="px-6 py-4">{order.productTitle}</td>
                          <td className="px-6 py-4 font-mono text-zinc-300">{order.userId}</td>
                          <td className="px-6 py-4 text-indigo-400 font-bold">{order.productPrice}</td>
                          <td className="px-6 py-4">
                            {isComp && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold">✅ تحویل شده</span>}
                            {isCanc && <span className="text-[10px] text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full font-bold">❌ لغو شده</span>}
                            {isPend && <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full font-bold">⏳ در انتظار بررسی</span>}
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            {isPend && (
                              <button 
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setDeliveryContent('');
                                  setIsDeliverModalOpen(true);
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] transition-colors font-bold"
                              >
                                تحویل نهایی و لایسنس
                              </button>
                            )}
                            {isPend && (
                              <button 
                                onClick={() => handleCancelOrder(order.id)}
                                className="bg-pink-500/10 hover:bg-pink-500 hover:text-white text-pink-400 px-3 py-1.5 rounded-lg text-[10px] transition-colors"
                              >
                                لغو سفارش
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-zinc-500 hover:text-red-400 p-1.5 transition-colors"
                              title="حذف کامل لاگ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                       </tr>
                     );
                   })}
                   {orders.length === 0 && (
                     <tr>
                       <td colSpan={6} className="text-center py-8 text-zinc-500 text-xs">سفارشی ثبت نشده است.</td>
                     </tr>
                   )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* PRODUCTS MANAGEMENT TAB */}
        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
            <header className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                 <h1 className="text-3xl font-extrabold tracking-tight">محصولات دیجیتال استور</h1>
                 <p className="text-zinc-400 text-xs mt-2 font-medium">کالاها، اشتراک‌ها و خدمات برنامه نویسی را ثبت و با ربات و سایت یکپارچه کنید.</p>
              </div>
              <button 
                onClick={handleOpenAddProduct}
                className="bg-indigo-500 hover:bg-indigo-600 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/15 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                محصول دیجیتالی جدید
              </button>
            </header>

            <div className="glass-panel overflow-hidden border border-zinc-900">
              <table className="w-full text-xs text-right text-zinc-400">
                <thead className="text-[10px] text-zinc-300 uppercase bg-zinc-900">
                  <tr>
                    <th className="px-6 py-4">عنوان محصول</th>
                    <th className="px-6 py-4">نوع</th>
                    <th className="px-6 py-4">توضیحات کوتاه</th>
                    <th className="px-6 py-4">قیمت</th>
                    <th className="px-6 py-4">وضعیت موجودی</th>
                    <th className="px-6 py-4">عملیات ادمین</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-zinc-900 hover:bg-zinc-900/25 transition-colors">
                       <td className="px-6 py-4 font-bold text-zinc-200 flex items-center gap-2">
                         <span>{p.title}</span>
                       </td>
                       <td className="px-6 py-4 text-zinc-500">
                         <span className="bg-zinc-900 border border-zinc-850 rounded px-2 py-0.5 text-[9px] uppercase font-mono">
                           {p.type === 'account' ? 'اکانت' : 'خدمات توسعه'}
                         </span>
                       </td>
                       <td className="px-6 py-4 truncate max-w-[200px] text-zinc-400" title={p.desc}>{p.desc}</td>
                       <td className="px-6 py-4 text-emerald-400 font-bold">{p.price}</td>
                       <td className="px-6 py-4">
                         <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${p.isAvailable !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/10 text-red-400'}`}>
                           {p.isAvailable !== false ? 'موجود' : 'ناموجود'}
                         </span>
                       </td>
                       <td className="px-6 py-4 flex gap-2">
                         <button 
                           onClick={() => handleOpenEditProduct(p)}
                           className="text-indigo-400 hover:text-indigo-300 p-1.5 rounded transition-colors"
                           title="ویرایش جزئیات کالا"
                         >
                           <Edit className="w-4 h-4" />
                         </button>
                         <button 
                           onClick={() => handleDeleteProduct(p.id)}
                           className="text-red-400/80 hover:text-red-400 p-1.5 rounded transition-colors"
                           title="حذف کامل از فروشگاه"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-zinc-500 text-xs">کالایی ثبت نشده است. کالا جدید بسازید.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>

      {/* PRODUCT DIALOG BOX (ADD / EDIT) */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans"
            >
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="absolute top-4 left-4 text-zinc-500 hover:text-white text-lg transition-colors"
              >
                ✕
              </button>
              
              <h3 className="text-xl font-bold mb-6 border-b border-zinc-800 pb-3 text-white">
                {editingProduct ? '📝 ویرایش مشخصات کالا' : '✨ تعریف کالای جدید دیجیتال'}
              </h3>

              <form onSubmit={handleProductFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2">نام / عنوان محصول</label>
                    <input 
                      type="text" 
                      value={pTitle} 
                      onChange={e => setPTitle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white outline-none" 
                      placeholder="مانند: اکانت 1 ماهه ChatGPT"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2">نوع محصول</label>
                    <select 
                      value={pType} 
                      onChange={e => setPType(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                    >
                      <option value="account">آماده (تحویل کلید/مشخصات اکانت)</option>
                      <option value="service">توسعه/تخصصی (نیازمند مشاوره و زمان)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2">دسته‌بندی (category)</label>
                    <input 
                      type="text" 
                      value={pCategory} 
                      onChange={e => setPCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white outline-none" 
                      placeholder="مانند: ai, apple, web, app"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2">قیمت (به حروف یا ریال)</label>
                    <input 
                      type="text" 
                      value={pPrice} 
                      onChange={e => setPPrice(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white outline-none" 
                      placeholder="مثلا: ۳۵۰,۰۰۰ تومان"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2">توضیح کوتاه ظاهری (desc)</label>
                  <input 
                    type="text" 
                    value={pDesc} 
                    onChange={e => setPDesc(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white outline-none" 
                    placeholder="نمایش در زیر کارت محصول در سایت و ربات"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2">آیکون کارت (icon)</label>
                    <select 
                      value={pIcon} 
                      onChange={e => setPIcon(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono"
                    >
                      <option value="Apple">Apple (لوگو اپل سفید)</option>
                      <option value="Bot">Bot (هوش مصنوعی سبز)</option>
                      <option value="Palette">Palette (طراحی مالتی مدیا بنفش)</option>
                      <option value="Globe">Globe (سایت اینترنتی آبی)</option>
                      <option value="MessageCircle">MessageCircle (ربات تلگرام چتر)</option>
                      <option value="Smartphone">Smartphone (اندروید موبایل نارنجی)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input 
                      type="checkbox" 
                      id="avail_chk"
                      checked={pAvailable} 
                      onChange={e => setPAvailable(e.target.checked)}
                      className="rounded bg-zinc-950 focus:ring-0 text-indigo-500 w-4 h-4"
                    />
                    <label htmlFor="avail_chk" className="text-xs font-bold text-zinc-300 cursor-pointer">کالا موجود و قابل سفارش باشد؟</label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2">جزئیات اختصاصی تمپلیت تحویل کالا (اختیاری)</label>
                  <textarea 
                    rows={3}
                    value={pDetails} 
                    onChange={e => setPDetails(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-805 border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white outline-none resize-none font-mono text-right" 
                    placeholder="اطلاعات تکمیلی در مورد اکانت یا زمان طراحی..."
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => setIsProductModalOpen(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 px-5 py-2 rounded-xl text-xs"
                  >
                    انصراف
                  </button>
                  <button 
                    type="submit" 
                    className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-500/15"
                  >
                    ثبت و ذخیره در آرشیو
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELIVER PRODUCT ORDER MODAL */}
      <AnimatePresence>
        {isDeliverModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md select-none font-sans">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setIsDeliverModalOpen(false)}
                className="absolute top-4 left-4 text-zinc-500 hover:text-white transition-colors"
              >
                ✕
              </button>

              <h3 className="text-lg font-bold mb-4 text-white border-b border-zinc-805 border-zinc-800 pb-3 flex items-center gap-1.5">
                <Check className="w-5 h-5 text-emerald-400" />
                تحویل و ارسال سفارش #{selectedOrder.id}
              </h3>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1 mb-4 text-xs text-zinc-400">
                <p>🛍️ محصول خرید شده: <b>{selectedOrder.productTitle}</b></p>
                <p>👤 خریدار (آیدی): <b>{selectedOrder.userId}</b></p>
                {selectedOrder.details && <p>✍️ توضیحات خریدار: <i>{selectedOrder.details}</i></p>}
              </div>

              <form onSubmit={handleDeliverOrderSubmit} className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-zinc-400 mb-2">مشخصات اکانت صادر شده یا لایسنس تحویل (deliveredContent):</label>
                   <textarea
                     rows={5}
                     value={deliveryContent}
                     onChange={e => setDeliveryContent(e.target.value)}
                     className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-white outline-none resize-none font-mono text-right"
                     placeholder="مشخصات اکانت مثل یوزرنیم و پسورد، یا کدهای دیجیتالی را وارد کنید. این لایسنس مستقیماً در پنل کاربر و ماژول پیگیری بات‌های او لایو می‌شود."
                     required
                   />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => setIsDeliverModalOpen(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-xs"
                  >
                    انصراف
                  </button>
                  <button 
                    type="submit" 
                    className="bg-emerald-500 hover:bg-emerald-600 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg"
                  >
                    تایید تراکنش و ارسال لایسنس با موفقیت
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DECRYPT RESTORE BACKUP MODAL */}
      <AnimatePresence>
        {isRestoreModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md select-none font-sans">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setRestorePassword('');
                }}
                className="absolute top-4 left-4 text-zinc-500 hover:text-white transition-colors"
              >
                ✕
              </button>

              <h3 className="text-lg font-bold mb-4 text-white border-b border-zinc-800 pb-3 flex items-center gap-1.5">
                <Lock className="w-5 h-5 text-amber-400" />
                رمزگشایی و بازیابی دیتابیس
              </h3>

              <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 mb-4 text-xs text-amber-400 leading-relaxed">
                ⚠️ این فایل بکاپ رمزنگاری شده است و بدون کلمه عبور حفاظتی صحیح باز نمی‌شود. لطفاً گذرواژه بکاپ خود را وارد کنید تا پس از گشایش، دیتابیس بازیابی شود.
              </div>

              <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-zinc-400 mb-2">کلمه عبور بکاپ (AES Decryption Security Password):</label>
                   <input
                     type="password"
                     value={restorePassword}
                     onChange={e => setRestorePassword(e.target.value)}
                     className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono text-center"
                     placeholder="••••••••••••"
                     required
                   />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsRestoreModalOpen(false);
                      setRestorePassword('');
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-xs"
                  >
                    انصراف
                  </button>
                  <button 
                    onClick={() => executeRestore(restoreFileText, restorePassword)}
                    className="bg-amber-500 hover:bg-amber-600 px-5 py-2 rounded-xl text-xs font-bold text-zinc-950 shadow-lg"
                  >
                    تایید رمز و بازیابی اطلاعات
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
