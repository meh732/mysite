import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, ShoppingBag, Settings, Bot, Shield, LogOut, 
  Activity, Database, MessageSquare, Plus, Trash2, Edit2, CheckCircle, 
  X, ToggleLeft, ToggleRight, Loader2, Eye, EyeOff, AlertCircle, ShoppingCart, RefreshCw, Sparkles, Folder, GitMerge, FileText,
  Coins, CreditCard, Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product, Order, Group, SubGroup, ProductVariation } from '../types';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLogged, setIsLogged] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Settings & DB State
  const [adminSettings, setAdminSettings] = useState({ 
    telegramToken: '', 
    baleToken: '', 
    adminTelegramChatId: '', 
    adminBaleChatId: '', 
    adminIdNumber: '', 
    smtpHost: '', 
    smtpPort: '', 
    smtpUser: '', 
    smtpPass: '', 
    enableMobileLogin: true,
    enableTelegramJoinCheck: false,
    telegramJoinChannel: '',
    enableBaleJoinCheck: false,
    baleJoinChannel: '',
    socialInstagram: '',
    socialTelegram: '',
    socialWhatsapp: '',
    socialBale: '',
    socialX: '',
    registrationMethod: 'both',
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
    heroVideoUrl: '',
    onlinePaymentUrl: '',
    cardNo: '',
    cardHolder: '',
    cardBank: ''
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subGroups, setSubGroups] = useState<SubGroup[]>([]);
  const [adminTransactions, setAdminTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sub tab inside "سفارشات/محصولات"
  const [productsSubTab, setProductsSubTab] = useState<'products' | 'orders' | 'groups' | 'subgroups' | 'transactions'>('products');

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
  const [formSpecs, setFormSpecs] = useState('');
  const [formGroupId, setFormGroupId] = useState<number | undefined>(undefined);
  const [formSubGroupId, setFormSubGroupId] = useState<number | undefined>(undefined);
  const [formImage, setFormImage] = useState('');
  const [formVariations, setFormVariations] = useState<ProductVariation[]>([]);

  // --- Group CRUD Dialog states ---
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupFormTitle, setGroupFormTitle] = useState('');
  const [groupFormImage, setGroupFormImage] = useState('');
  const [groupFormActive, setGroupFormActive] = useState(true);

  // --- SubGroup CRUD Dialog states ---
  const [isSubGroupModalOpen, setIsSubGroupModalOpen] = useState(false);
  const [editingSubGroup, setEditingSubGroup] = useState<SubGroup | null>(null);
  const [subGroupFormGroupId, setSubGroupFormGroupId] = useState<number>(0);
  const [subGroupFormTitle, setSubGroupFormTitle] = useState('');
  const [subGroupFormImage, setSubGroupFormImage] = useState('');
  const [subGroupFormActive, setSubGroupFormActive] = useState(true);

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
    const p4 = fetch('/api/groups').then(r => r.json()).then(d => setGroups(d));
    const p5 = fetch('/api/subgroups').then(r => r.json()).then(d => setSubGroups(d));
    const p6 = fetch('/api/admin/transactions').then(r => r.json()).then(d => setAdminTransactions(d)).catch(() => {});
    
    Promise.all([p1, p2, p3, p4, p5, p6])
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
    setFormSpecs('');
    setFormGroupId(groups[0]?.id || undefined);
    setFormSubGroupId(undefined);
    setFormImage('');
    setFormVariations([]);
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
    setFormSpecs(prod.specs || '');
    setFormGroupId(prod.groupId);
    setFormSubGroupId(prod.subGroupId);
    setFormImage(prod.image || '');
    setFormVariations(prod.variations || []);
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
      active: formActive,
      specs: formSpecs,
      groupId: formGroupId ? Number(formGroupId) : undefined,
      subGroupId: formSubGroupId ? Number(formSubGroupId) : undefined,
      image: formImage,
      variations: formVariations
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

  // --- Group CRUD Actions ---
  const openNewGroupModal = () => {
    setEditingGroup(null);
    setGroupFormTitle('');
    setGroupFormImage('');
    setGroupFormActive(true);
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (g: Group) => {
    setEditingGroup(g);
    setGroupFormTitle(g.title);
    setGroupFormImage(g.image);
    setGroupFormActive(g.active !== false);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormTitle) {
      alert('وارد کردن عنوان گروه الزامی است.');
      return;
    }
    const payload = { title: groupFormTitle, image: groupFormImage, active: groupFormActive };

    const url = editingGroup ? `/api/groups/${editingGroup.id}` : '/api/groups';
    const method = editingGroup ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        alert(editingGroup ? 'گروه با موفقیت ویرایش شد.' : 'گروه جدید با موفقیت اضافه شد.');
        setIsGroupModalOpen(false);
        loadAllData();
      } else {
        alert(res.message || 'خطا در ثبت اطلاعات گروه');
      }
    });
  };

  const handleDeleteGroup = (id: number) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این گروه را حذف کنید؟ با حذف گروه، ارتباط زیرمجموعه‌ها ممکن است گسیخته شود.')) return;
    fetch(`/api/groups/${id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          alert('گروه با موفقیت حذف شد.');
          loadAllData();
        } else {
          alert(res.message || 'خطا در حذف گروه');
        }
      });
  };

  const toggleGroupActive = (g: Group) => {
    fetch(`/api/groups/${g.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !g.active })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) loadAllData();
    });
  };

  // --- SubGroup CRUD Actions ---
  const openNewSubGroupModal = () => {
    setEditingSubGroup(null);
    setSubGroupFormGroupId(groups[0]?.id || 0);
    setSubGroupFormTitle('');
    setSubGroupFormImage('');
    setSubGroupFormActive(true);
    setIsSubGroupModalOpen(true);
  };

  const openEditSubGroupModal = (sg: SubGroup) => {
    setEditingSubGroup(sg);
    setSubGroupFormGroupId(sg.groupId);
    setSubGroupFormTitle(sg.title);
    setSubGroupFormImage(sg.image);
    setSubGroupFormActive(sg.active !== false);
    setIsSubGroupModalOpen(true);
  };

  const handleSaveSubGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subGroupFormTitle || !subGroupFormGroupId) {
      alert('وارد کردن عنوان و انتخاب گروه والد الزامی است.');
      return;
    }
    const payload = { 
      groupId: Number(subGroupFormGroupId), 
      title: subGroupFormTitle, 
      image: subGroupFormImage, 
      active: subGroupFormActive 
    };

    const url = editingSubGroup ? `/api/subgroups/${editingSubGroup.id}` : '/api/subgroups';
    const method = editingSubGroup ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        alert(editingSubGroup ? 'زیرمجموعه با موفقیت ویرایش شد.' : 'زیرمجموعه جدید با موفقیت اضافه شد.');
        setIsSubGroupModalOpen(false);
        loadAllData();
      } else {
        alert(res.message || 'خطا در ثبت اطلاعات زیرمجموعه');
      }
    });
  };

  const handleDeleteSubGroup = (id: number) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این زیرمجموعه را حذف کنید؟')) return;
    fetch(`/api/subgroups/${id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          alert('زیرمجموعه با موفقیت حذف شد.');
          loadAllData();
        } else {
          alert(res.message || 'خطا در حذف زیرمجموعه');
        }
      });
  };

  const toggleSubGroupActive = (sg: SubGroup) => {
    fetch(`/api/subgroups/${sg.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !sg.active })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) loadAllData();
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
      {/* Mobile Floating Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden" dir="rtl">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 max-w-[80vw] bg-zinc-900 border-l border-zinc-805 h-full flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-6 border-b border-zinc-800 mb-6 font-sans">
                <div className="flex items-center gap-3 text-lg font-bold">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white">پنل مدیریت</span>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileSidebarOpen(false);
                    }}
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

              <div className="pt-4 border-t border-zinc-850">
                <button onClick={() => {setIsLogged(false); navigate('/')}} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer">
                  <LogOut className="w-5 h-5" />
                  <span>خروج از پنل</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar for Desktop */}
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
      <main className="flex-1 overflow-y-auto">
        {/* Mobile top bar toggle */}
        <div className="flex md:hidden items-center justify-between border-b border-zinc-900 bg-zinc-950/95 px-4 py-4 sticky top-0 z-40 backdrop-blur">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-zinc-300 transition-colors cursor-pointer shadow-md"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-white drop-shadow-md">پنل مدیریت هوشمند</span>
          </div>
          <button 
            onClick={() => {setIsLogged(false); navigate('/')}}
            className="text-xs bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold"
          >
            خروج
          </button>
        </div>

        <div className="p-4 md:p-8">
          {isLoading && (
            <div className="fixed top-4 left-4 z-50 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold">
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
                      {ord.status === 'canceled' && <span className="text-xs text-red-500 bg-red-450/5 border border-red-500/25 px-3 py-1 rounded-full font-bold font-sans">لغو شده</span>}
                      {ord.status === 'pending' && <span className="text-xs text-amber-400 bg-amber-400/5 border border-amber-500/20 px-3 py-1 rounded-full font-bold animate-pulse">در انتظار اقدام</span>}
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

        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-850 pb-6">
              <div>
                 <h1 className="text-3xl font-bold tracking-tight text-zinc-100">بخش فروشگاه دیجیتال</h1>
                 <p className="text-zinc-450 text-sm mt-1.5">{"مدیریت سلسله‌مراتب محصولات (گروه -> زیرگروه -> محصول)، فعال/غیرفعال کردن نمایش عمومی و بررسی فاکتورها."}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setProductsSubTab('groups')} 
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${productsSubTab === 'groups' ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
                >
                  📁 گروه‌ها ({groups.length})
                </button>
                <button 
                  onClick={() => setProductsSubTab('subgroups')} 
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${productsSubTab === 'subgroups' ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
                >
                  🌿 زیرگروه‌ها ({subGroups.length})
                </button>
                <button 
                  onClick={() => setProductsSubTab('products')} 
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${productsSubTab === 'products' ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
                >
                  📦 محصولات و لات‌ها ({products.length})
                </button>
                <button 
                  onClick={() => setProductsSubTab('orders')} 
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${productsSubTab === 'orders' ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
                >
                  🧾 سفارشات ({orders.length})
                </button>
                <button 
                  onClick={() => setProductsSubTab('transactions')} 
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${productsSubTab === 'transactions' ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
                >
                  💳 تایید واریزها ({adminTransactions.filter(t => t.status === 'pending').length})
                </button>
              </div>
            </header>

            {productsSubTab === 'groups' ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900/20 p-4 rounded-xl border border-zinc-850 gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">📁 مدیریت گروه‌های اصلی محصولات</h3>
                    <p className="text-xs text-zinc-500 mt-1">تعریف دسته‌بندی‌های کلان سایت (مثال: اشتراک‌ها و اکانت‌ها، خدمات طراحی اختصاصی، لایسنس‌ها)</p>
                  </div>
                  <button 
                    onClick={openNewGroupModal}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>گروه جدید +</span>
                  </button>
                </div>

                <div className="glass-panel overflow-hidden border border-zinc-800/80">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-zinc-450">
                      <thead className="text-xs text-zinc-300 bg-zinc-900/60 border-b border-zinc-850">
                        <tr>
                          <th className="px-6 py-4 text-right w-24">عکس گروه</th>
                          <th className="px-6 py-4 text-right">عنوان گروه اصلی</th>
                          <th className="px-6 py-4 text-center">وضعیت نمایش</th>
                          <th className="px-6 py-4 text-center">زیرشاخه‌ها</th>
                          <th className="px-6 py-4 text-center">عملیات ادمین</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups.map(g => (
                          <tr key={g.id} className="border-b border-zinc-850/60 hover:bg-zinc-900/20 transition-colors">
                            <td className="px-6 py-3">
                              {g.image ? (
                                <img src={g.image} alt={g.title} className="w-10 h-10 object-contain p-0.5 bg-white rounded-lg border border-zinc-800" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-[10px] text-zinc-500">بدون عکس</div>
                              )}
                            </td>
                            <td className="px-6 py-3 font-bold text-white text-sm">{g.title}</td>
                            <td className="px-6 py-3 text-center">
                              <button onClick={() => toggleGroupActive(g)} className="cursor-pointer focus:outline-none transition-transform active:scale-95">
                                {g.active !== false ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">فعال</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-red-400 bg-red-450/10 px-2.5 py-1 rounded-full border border-red-500/20 font-bold">مخفی/غیرفعال</span>
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-3 text-center text-zinc-400 text-xs">
                              {subGroups.filter(s => s.groupId === g.id).length} زیرشاخه
                            </td>
                            <td className="px-6 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => openEditGroupModal(g)} className="text-sky-400 hover:text-sky-300 p-1.5 rounded bg-sky-400/5 hover:bg-sky-400/15 cursor-pointer">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteGroup(g.id)} className="text-red-400 hover:text-red-300 p-1.5 rounded bg-red-450/5 hover:bg-red-450/15 cursor-pointer">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {groups.length === 0 && (
                          <tr><td colSpan={5} className="text-center py-6 text-zinc-550 text-sm">هیچ گروه کاربری فعالی تعریف نشده است.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : productsSubTab === 'subgroups' ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900/20 p-4 rounded-xl border border-zinc-850 gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">🌿 مدیریت زیرگروه‌های تخصصی</h3>
                    <p className="text-xs text-zinc-500 mt-1">تعریف دسته‌های میانی وب‌سایت (مثال: اکانت‌های هوش مصنوعی، سرویس‌های کمپانی اپل، طراحی سایت)</p>
                  </div>
                  <button 
                    onClick={openNewSubGroupModal}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>زیرگروه جدید +</span>
                  </button>
                </div>

                <div className="glass-panel overflow-hidden border border-zinc-800/80">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-zinc-450">
                      <thead className="text-xs text-zinc-300 bg-zinc-900/60 border-b border-zinc-850">
                        <tr>
                          <th className="px-6 py-4 text-right w-24">تصویر</th>
                          <th className="px-6 py-4 text-right">عنوان زیرگروه</th>
                          <th className="px-6 py-4 text-right">گروه والد اصلی</th>
                          <th className="px-6 py-4 text-center">وضعیت نمایش</th>
                          <th className="px-6 py-4 text-center">جمع محصولات</th>
                          <th className="px-6 py-4 text-center">عملیات ادمین</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subGroups.map(sg => {
                          const parentG = groups.find(g => g.id === sg.groupId);
                          const prodCount = products.filter(p => p.subGroupId === sg.id).length;
                          return (
                            <tr key={sg.id} className="border-b border-zinc-850/60 hover:bg-zinc-900/20 transition-colors">
                              <td className="px-6 py-3">
                                {sg.image ? (
                                  <img src={sg.image} alt={sg.title} className="w-10 h-10 object-contain p-0.5 bg-white rounded-lg border border-zinc-800" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-[10px] text-zinc-500">بدون عکس</div>
                                )}
                              </td>
                              <td className="px-6 py-3 font-bold text-white text-sm">{sg.title}</td>
                              <td className="px-6 py-3 text-zinc-300 text-xs">
                                {parentG ? (
                                  <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-1 rounded">
                                    {parentG.title}
                                  </span>
                                ) : (
                                  <span className="text-red-500">یافت نشد</span>
                                )}
                              </td>
                              <td className="px-6 py-3 text-center">
                                <button onClick={() => toggleSubGroupActive(sg)} className="cursor-pointer focus:outline-none transition-transform active:scale-95">
                                  {sg.active !== false ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">فعال</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-red-400 bg-red-450/10 px-2.5 py-1 rounded-full border border-red-500/20 font-bold">مخفی</span>
                                  )}
                                </button>
                              </td>
                              <td className="px-6 py-3 text-center text-zinc-400 text-xs">
                                {prodCount} محصول
                              </td>
                              <td className="px-6 py-3 text-center">
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => openEditSubGroupModal(sg)} className="text-sky-400 hover:text-sky-300 p-1.5 rounded bg-sky-400/5 hover:bg-sky-400/15 cursor-pointer">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteSubGroup(sg.id)} className="text-red-400 hover:text-red-300 p-1.5 rounded bg-red-450/5 hover:bg-red-450/15 cursor-pointer">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {subGroups.length === 0 && (
                          <tr><td colSpan={6} className="text-center py-6 text-zinc-550 text-sm">هیچ زیرشاخه‌ای برای تخصیص به محصولات یافت نشد. ابتدا یک زیرشاخه بسازید.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : productsSubTab === 'products' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-zinc-900/20 p-4 rounded-xl border border-zinc-850">
                  <span className="text-sm text-zinc-450 font-normal">تعیین خدمات، محصولات و بخش‌های فروشگاه مرتبط با گروه‌ها و زیرگروه‌های والد.</span>
                  <button 
                    onClick={openNewProductModal}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
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
                          <th className="px-6 py-4 text-right">عنوان محصول/خدمت</th>
                          <th className="px-6 py-4 text-center">نوع بخش</th>
                          <th className="px-6 py-4 text-center">مسیر دسته‌بندی اصلی</th>
                          <th className="px-6 py-4 text-center">قیمت فاکتور</th>
                          <th className="px-6 py-4 text-center">وضعیت نمایش</th>
                          <th className="px-6 py-4 text-center">عملیات ادمین</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(p => {
                          const productGroup = groups.find(g => g.id === p.groupId);
                          const productSubGroup = subGroups.find(sg => sg.id === p.subGroupId);
                          return (
                            <tr key={p.id} className="border-b border-zinc-850/60 hover:bg-zinc-900/20 transition-colors">
                               <td className="px-6 py-4 font-bold text-zinc-200">
                                 <div className="flex items-center gap-3">
                                   {p.image ? (
                                     <img src={p.image} alt={p.title} className="w-10 h-10 object-contain p-0.5 bg-white rounded-lg border border-zinc-200" referrerPolicy="no-referrer" />
                                   ) : (
                                     <div className="w-10 h-10 bg-zinc-805/70 rounded-lg flex items-center justify-center text-zinc-500 text-xs select-none border border-zinc-800">
                                       {p.icon}
                                     </div>
                                   )}
                                   <div>
                                     <p className="text-sm font-bold text-white mb-0.5">{p.title}</p>
                                     <p className="text-xs text-zinc-500 font-normal truncate max-w-[280px]">{p.desc}</p>
                                   </div>
                                 </div>
                               </td>
                               <td className="px-6 py-4 text-center">
                                 <span className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-bold ${p.type === 'account' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                   {p.type === 'account' ? 'اکانت' : 'خدمات توسعه'}
                                 </span>
                               </td>
                               <td className="px-6 py-4 text-center font-mono text-xs text-zinc-450">
                                 <div className="text-xs space-y-0.5">
                                   <div className="text-zinc-200 font-bold font-sans">{productGroup ? productGroup.title : <span className="text-zinc-600 font-normal">نامشخص</span>}</div>
                                   <div className="text-zinc-500 text-[10px] font-sans">{productSubGroup ? productSubGroup.title : <span className="text-zinc-600 font-normal">-</span>}</div>
                                 </div>
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : productsSubTab === 'orders' ? (
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
            ) : (
              <div className="space-y-6">
                <div className="bg-zinc-900/20 p-5 rounded-3xl border border-zinc-850">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-400" />
                    تایید تراکنش‌های واریزی و شارژ کیف پول دستی (کارت به کارت)
                  </h3>
                  <p className="text-xs text-zinc-500 pb-4 border-b border-zinc-900">
                    رسیدهای آپلود شده توسط کاربران در سایت یا ربات را بررسی کنید. در صورت تطبیق وجه، تراکنش را «تایید» کنید تا کیف پول کاربر فوراً شارژ شود و پیامک/نوتیفیکیشن بات ارسال گردد.
                  </p>

                  <div className="overflow-x-auto mt-6">
                    <table className="w-full text-zinc-400 text-right text-sm">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-450 border-zinc-800">
                          <th className="py-3 px-4 text-right">شناسه</th>
                          <th className="py-3 px-4 text-right">کاربر (موبایل/ایمیل)</th>
                          <th className="py-3 px-4 text-right">مبلغ اعلامی</th>
                          <th className="py-3 px-4 text-right">واریز کننده</th>
                          <th className="py-3 px-4 text-right">شرح تراکنش</th>
                          <th className="py-3 px-4 text-right">وضعیت فیش</th>
                          <th className="py-3 px-4 text-center">جزئیات / رسید تصویری</th>
                          <th className="py-3 px-4 text-center">اقدام‌ها</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminTransactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-zinc-900 hover:bg-zinc-900/10 transition-all text-xs">
                            <td className="py-4 px-4 font-mono font-bold text-zinc-400">#{tx.id}</td>
                            <td className="py-4 px-4 text-zinc-300 font-semibold">{tx.userIdentifier}</td>
                            <td className="py-4 px-4 font-bold text-indigo-400">
                              {Number(tx.amount || 0) > 0 ? `${Number(tx.amount).toLocaleString('fa-IR')} تومان` : 'نامشخص'}
                            </td>
                            <td className="py-4 px-4 text-zinc-400">{tx.cardHolderName || 'ثبت نشده'}</td>
                            <td className="py-4 px-4 text-zinc-500">{tx.description}</td>
                            <td className="py-4 px-4">
                              {tx.status === 'approved' && <span className="text-[10px] text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">تایید شده ✅</span>}
                              {tx.status === 'rejected' && <span className="text-[10px] text-red-450 text-red-400 bg-red-450/10 border border-red-500/20 px-2.5 py-1 rounded-full font-bold">لغو/رد شده ❌</span>}
                              {tx.status === 'pending' && <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold animate-pulse">در انتظار تایید ⏳</span>}
                              {!tx.status && <span className="text-[10px] text-zinc-450 bg-zinc-800 px-2.5 py-1 rounded-full">سیستمی ⚙️</span>}
                            </td>
                            <td className="py-4 px-4 text-center font-mono">
                              {tx.receiptImage ? (
                                <a
                                  href={tx.receiptImage.startsWith('http') ? tx.receiptImage : `https://api.telegram.org/file/bot${adminSettings.telegramToken}/${tx.receiptImage}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 hover:underline text-xs bg-indigo-500/5 px-2.5 py-1.5 rounded-lg border border-indigo-500/10 transition-all"
                                >
                                  مشاهده فیش ارسالی 👁️
                                </a>
                              ) : (
                                <span className="text-zinc-600 text-xs">فاقد پیوست تصویری</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center">
                              {tx.status === 'pending' ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      if (confirm('آیا از تایید این واریزی و افزایش شارژ کیف پول کاربر مطمئن هستید؟')) {
                                        fetch(`/api/admin/transactions/${tx.id}/approve`, { method: 'POST' })
                                          .then(r => r.json())
                                          .then(res => {
                                            if (res.success) {
                                              alert('واریز وجه با موفقیت تایید و کاربر شارژ شد!');
                                              loadAllData();
                                            }
                                          });
                                      }
                                    }}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer shadow shadow-emerald-500/10"
                                  >
                                    تایید واریز
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('آیا مایل به رد این درخواست پرداخت هستید؟')) {
                                        fetch(`/api/admin/transactions/${tx.id}/reject`, { method: 'POST' })
                                          .then(r => r.json())
                                          .then(res => {
                                            if (res.success) {
                                              alert('درخواست رد شد.');
                                              loadAllData();
                                            }
                                          });
                                      }
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer shadow shadow-red-500/10"
                                  >
                                    رد فیش
                                  </button>
                                </div>
                              ) : (
                                <span className="text-zinc-650 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {adminTransactions.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-12 text-zinc-500 italic">هیچ تراکنش یا رسیدی ثبت نشده است.</td>
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
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-zinc-950/40 rounded-2xl border border-zinc-800/40 -mx-4 mb-4">
                      <div>
                        <label className="text-sm font-bold text-zinc-300 block mb-2">شناسه ادمین تلگرام (Telegram Admin Chat ID)</label>
                        <input 
                          type="text" 
                          value={adminSettings.adminTelegramChatId || ''} 
                          onChange={e => setAdminSettings({...adminSettings, adminTelegramChatId: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors" 
                          dir="ltr" 
                          placeholder="e.g. 123456789"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-zinc-300 block mb-2">شناسه ادمین بله (Bale Admin Chat ID)</label>
                        <input 
                          type="text" 
                          value={adminSettings.adminBaleChatId || ''} 
                          onChange={e => setAdminSettings({...adminSettings, adminBaleChatId: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors" 
                          dir="ltr" 
                          placeholder="e.g. 987654321"
                        />
                      </div>
                    </div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2">شناسه ادمین عمومی (فیلد همگام قدیمی کاربری):</label>
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

             <div className="glass-panel p-6 border border-zinc-805/40 bg-zinc-900/30 rounded-2xl">
                <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-indigo-400" />
                  تنظیمات درگاه پرداخت و کارت به کارت
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-300 block mb-2">لینک مستقیم درگاه خرید آنلاین (مانند زرین‌پال)</label>
                    <input 
                      type="text" 
                      value={adminSettings.onlinePaymentUrl || ''} 
                      onChange={e => setAdminSettings({...adminSettings, onlinePaymentUrl: e.target.value})} 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500 font-mono text-xs" 
                      dir="ltr" 
                      placeholder="https://zarinpal.com/your_store" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300 block mb-2">شماره کارت بانکی (کارت به کارت)</label>
                    <input 
                      type="text" 
                      value={adminSettings.cardNo || ''} 
                      onChange={e => setAdminSettings({...adminSettings, cardNo: e.target.value})} 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500 font-mono text-xs" 
                      dir="ltr" 
                      placeholder="60379918..." 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300 block mb-2">نام صاحب کارت/حساب</label>
                    <input 
                      type="text" 
                      value={adminSettings.cardHolder || ''} 
                      onChange={e => setAdminSettings({...adminSettings, cardHolder: e.target.value})} 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500 text-sm" 
                      placeholder="مثلا: محمد علوی" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300 block mb-2">نام بانک صادرکننده</label>
                    <input 
                      type="text" 
                      value={adminSettings.cardBank || ''} 
                      onChange={e => setAdminSettings({...adminSettings, cardBank: e.target.value})} 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500 text-sm" 
                      placeholder="مثلا: بانک ملی ایران" 
                    />
                  </div>
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
                   <div className="mt-4 pt-4 border-t border-zinc-850 space-y-3">
                     <div className="flex items-center justify-between">
                       <span className="text-xs font-semibold text-zinc-300">عضویت اجباری کانال تلگرام:</span>
                       <button 
                         type="button"
                         onClick={() => setAdminSettings({...adminSettings, enableTelegramJoinCheck: !adminSettings.enableTelegramJoinCheck})}
                         className={`px-3 py-1.5 text-[10px] rounded-lg font-bold border transition-colors cursor-pointer ${adminSettings.enableTelegramJoinCheck ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-zinc-850 text-zinc-400 border-zinc-800'}`}
                       >
                         {adminSettings.enableTelegramJoinCheck ? 'روشن ✅' : 'خاموش ❌'}
                       </button>
                     </div>
                     {adminSettings.enableTelegramJoinCheck && (
                       <div>
                         <label className="text-[10px] text-zinc-400 block mb-1">آدرس کانال تلگرام (با @):</label>
                         <input 
                           type="text"
                           value={adminSettings.telegramJoinChannel || ''}
                           onChange={e => setAdminSettings({...adminSettings, telegramJoinChannel: e.target.value})}
                           placeholder="@mychannel"
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-sky-500 transition-colors font-mono"
                           dir="ltr"
                         />
                       </div>
                     )}
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
                   <div className="mt-4 pt-4 border-t border-zinc-850 space-y-3">
                     <div className="flex items-center justify-between">
                       <span className="text-xs font-semibold text-zinc-300">عضویت اجباری کانال بله:</span>
                       <button 
                         type="button"
                         onClick={() => setAdminSettings({...adminSettings, enableBaleJoinCheck: !adminSettings.enableBaleJoinCheck})}
                         className={`px-3 py-1.5 text-[10px] rounded-lg font-bold border transition-colors cursor-pointer ${adminSettings.enableBaleJoinCheck ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-zinc-850 text-zinc-400 border-zinc-800'}`}
                       >
                         {adminSettings.enableBaleJoinCheck ? 'روشن ✅' : 'خاموش ❌'}
                       </button>
                     </div>
                     {adminSettings.enableBaleJoinCheck && (
                       <div>
                         <label className="text-[10px] text-zinc-400 block mb-1">آدرس کانال بله (با @):</label>
                         <input 
                           type="text"
                           value={adminSettings.baleJoinChannel || ''}
                           onChange={e => setAdminSettings({...adminSettings, baleJoinChannel: e.target.value})}
                           placeholder="@mychannel"
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-colors font-mono"
                           dir="ltr"
                         />
                       </div>
                     )}
                   </div>
                </div>
             </div>
             <div>
              <div className="glass-panel p-6 border border-zinc-805/40 bg-zinc-900/30 rounded-2xl mb-6">
                 <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2 font-sans">
                   <Sparkles className="w-5 h-5 text-indigo-400" />
                   تنظیمات ویدیو هیرو و لندینگ پیج
                 </h3>
                 <div className="space-y-4">
                   <div>
                     <label className="text-sm font-medium text-zinc-300 block mb-2">آدرس لینک مستقیم ویدیو (Hero Video URL)</label>
                     <input 
                       type="text" 
                       value={adminSettings.heroVideoUrl || ''} 
                       onChange={e => setAdminSettings({...adminSettings, heroVideoUrl: e.target.value})} 
                       className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 font-mono text-sm shadow-inner" 
                       dir="ltr" 
                       placeholder="e.g. https://example.com/video.mp4" 
                     />
                     <p className="text-[10px] text-zinc-500 mt-1">
                       یک لینک مستقیم به فایل ویدیویی MP4 وارد کنید تا در بخش هیرو (بالای سایت) به صورت بک‌گراند زنده و سینماتیک لوپ شود.
                     </p>
                   </div>
                   <div>
                     <label className="text-sm font-medium text-zinc-300 block mb-2">لینک عکس لوگوی سایت</label>
                     <input 
                       type="text" 
                       value={adminSettings.siteLogoUrl || ''} 
                       onChange={e => setAdminSettings({...adminSettings, siteLogoUrl: e.target.value})} 
                       className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 font-mono text-sm shadow-inner" 
                       dir="ltr" 
                       placeholder="e.g. https://example.com/logo.png" 
                     />
                     <p className="text-[10px] text-zinc-500 mt-1">
                       لینک یک عکس دلخواه وارد کنید تا بجای کلمه متنی DStore نمایش داده شود.
                     </p>
                   </div>
                 </div>
              </div>

              <div className="glass-panel p-6 border border-zinc-805/40 bg-zinc-900/30 rounded-2xl mb-6">
                 <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2 font-sans">
                   <Activity className="w-5 h-5 text-indigo-400" />
                   شبکه‌های اجتماعی و اطلاعات تماس (ارتباط با ما در فوتر)
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="text-sm font-medium text-zinc-300 block mb-2">آدرس اینستاگرام</label>
                     <input 
                       type="text" 
                       value={adminSettings.socialInstagram || ''} 
                       onChange={e => setAdminSettings({...adminSettings, socialInstagram: e.target.value})} 
                       className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500 text-sm" 
                       dir="ltr" 
                       placeholder="https://instagram.com/profile" 
                     />
                   </div>
                   <div>
                     <label className="text-sm font-medium text-zinc-300 block mb-2">لینک کانال یا ادمین تلگرام</label>
                     <input 
                       type="text" 
                       value={adminSettings.socialTelegram || ''} 
                       onChange={e => setAdminSettings({...adminSettings, socialTelegram: e.target.value})} 
                       className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500 text-sm" 
                       dir="ltr" 
                       placeholder="https://t.me/username" 
                     />
                   </div>
                   <div>
                     <label className="text-sm font-medium text-zinc-300 block mb-2">آیدی یا لینک واتساپ</label>
                     <input 
                       type="text" 
                       value={adminSettings.socialWhatsapp || ''} 
                       onChange={e => setAdminSettings({...adminSettings, socialWhatsapp: e.target.value})} 
                       className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500 text-sm" 
                       dir="ltr" 
                       placeholder="https://wa.me/number" 
                     />
                   </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300 block mb-2">لینک یا آیدی ربات/کانال بله</label>
                      <input 
                        type="text" 
                        value={adminSettings.socialBale || ''} 
                        onChange={e => setAdminSettings({...adminSettings, socialBale: e.target.value})} 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500 text-sm" 
                        dir="ltr" 
                        placeholder="https://ble.ir/digital_store" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300 block mb-2">لینک اکانت یا آیدی X (توئیتر سابق)</label>
                      <input 
                        type="text" 
                        value={adminSettings.socialX || ''} 
                        onChange={e => setAdminSettings({...adminSettings, socialX: e.target.value})} 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500 text-sm" 
                        dir="ltr" 
                        placeholder="https://x.com/digital_store" 
                      />
                    </div>
                   <div>
                     <label className="text-sm font-medium text-zinc-300 block mb-2">تلفن تماس مدیریت / پشتیبانی</label>
                     <input 
                       type="text" 
                       value={adminSettings.contactPhone || ''} 
                       onChange={e => setAdminSettings({...adminSettings, contactPhone: e.target.value})} 
                       className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500 text-sm" 
                       placeholder="مثلا: ۰۹۱۲۳۴۵۶۷۸۹" 
                     />
                   </div>
                   <div className="md:col-span-2">
                     <label className="text-sm font-medium text-zinc-300 block mb-2">ایمیل ارتباط باما</label>
                     <input 
                       type="text" 
                       value={adminSettings.contactEmail || ''} 
                       onChange={e => setAdminSettings({...adminSettings, contactEmail: e.target.value})} 
                       className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500 font-mono text-xs" 
                       dir="ltr"
                       placeholder="info@yourstore.com" 
                     />
                   </div>
                   <div className="md:col-span-2">
                     <label className="text-sm font-medium text-zinc-300 block mb-2">آدرس حضوری آکادمی / شرکت</label>
                     <textarea 
                       rows={2}
                       value={adminSettings.contactAddress || ''} 
                       onChange={e => setAdminSettings({...adminSettings, contactAddress: e.target.value})} 
                       className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 text-sm" 
                       placeholder="تهران، خیابان ولیعصر، مجتمع تجاری..." 
                     />
                   </div>
                 </div>
              </div>

               

               <div className="glass-panel p-6 border border-zinc-805/40 bg-zinc-900/30 rounded-2xl mb-6">
                  <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2 font-sans">
                    <Users className="w-5 h-5 text-indigo-400" />
                    تنظیمات عضویت و ثبت‌نام مراجعین (احراز هویت تجاری)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-300 block mb-2">روش‌های مجاز ثبت‌نام مراجعین:</label>
                      <select
                        value={adminSettings.registrationMethod || 'both'}
                        onChange={e => setAdminSettings({...adminSettings, registrationMethod: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 text-xs cursor-pointer"
                      >
                        <option value="both">✨ فعال بودن هر دو روش تجاری (عضویت با ایمیل یا موبایل - منعطف)</option>
                        <option value="email_only">📧 اجبار مراجعین به ثبت‌نام رسمی فقط با آدرس ایمیل و کلمه عبور</option>
                        <option value="phone_only">📱 اجبار مراجعین به ثبت‌نام امن فقط با شماره همراه و کلمه عبور (بدون نیاز به ایمیل)</option>
                      </select>
                      <p className="text-[11px] text-zinc-550 dark:text-zinc-500 mt-2 leading-relaxed">
                        با انتخاب یکی از متدهای اختصاصی، فیلد نامرتبط در فرم ثبت‌نام وب‌سایت پنهان شده و سیستم مراجع را ترغیب خواهد کرد تا طبق الگوی تجاری شما حساب خود را ثبت نماید. این متد کاملاً به فلو ثبت‌نام بک‌اند متصل است.
                      </p>
                    </div>
                  </div>
               </div>

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
        </div>
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
                    <label className="block text-sm font-medium mb-1.5 text-zinc-300">شناسه کلی دسته‌بندی</label>
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

                {/* Parent Group and Subgroup selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-300">🔗 گروه والد محصولات</label>
                    <select
                      value={formGroupId || ''}
                      onChange={e => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        setFormGroupId(val);
                        setFormSubGroupId(undefined);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-150 focus:border-indigo-500 transition-colors outline-none cursor-pointer"
                    >
                      <option value="">(انتخاب گروه والد اصلی)</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-300">🌿 زیرگروه والد محصولات</label>
                    <select
                      value={formSubGroupId || ''}
                      onChange={e => setFormSubGroupId(e.target.value ? Number(e.target.value) : undefined)}
                      disabled={!formGroupId}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-150 focus:border-indigo-500 transition-colors outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">(انتخاب زیرگروه والد)</option>
                      {subGroups.filter(s => s.groupId === formGroupId).map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Product/Service Image URL Selector */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-300">🖼️ آدرس تصویر یا عکس کارت (Image URL)</label>
                  <input 
                    type="text"
                    value={formImage || ''}
                    onChange={e => setFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/... یا از تصاویر نمونه زیر"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors outline-none"
                    dir="ltr"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-zinc-550 text-xs py-1">تصاویر آماده سریع:</span>
                    {[
                      { label: 'اپل', url: 'https://images.unsplash.com/photo-1491933300451-c42917146e22?w=500&auto=format&fit=crop&q=60' },
                      { label: 'هوش مصنوعی', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=500&auto=format&fit=crop&q=60' },
                      { label: 'کارت بنفش', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60' },
                      { label: 'توسعه وب', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60' },
                      { label: 'ربات‌نویسی', url: 'https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?w=500&auto=format&fit=crop&q=60' },
                      { label: 'موبایل', url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&auto=format&fit=crop&q=60' }
                    ].map((img, idx) => (
                      <button 
                        key={idx} 
                        type="button" 
                        onClick={() => setFormImage(img.url)}
                        className="text-[10px] bg-zinc-900 hover:bg-indigo-500/20 hover:text-indigo-400 border border-zinc-800 px-2 py-0.5 rounded transition-all cursor-pointer"
                      >
                        {img.label}
                      </button>
                    ))}
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
                    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-805/80 p-2 px-4 rounded-xl mt-1.5 font-sans">
                      <span className="text-xs text-zinc-400 font-normal">وضعیت:</span>
                      <button 
                        type="button" 
                        onClick={() => setFormActive(!formActive)}
                        className="cursor-pointer text-indigo-400 font-bold focus:outline-none transition-transform"
                      >
                        {formActive ? (
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 font-bold">نمایان</span>
                        ) : (
                          <span className="text-xs text-red-400 bg-red-450/10 px-2.5 py-0.5 rounded border border-red-500/20 font-bold">مخفی</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-300">توضیحات کوتاه محصول / پکیج</label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="جزییات تحویل پکیج، حجم سرویس، یا سناریوی لایسنس را بنویسید..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors outline-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-300">ویژگی‌ها و جزئیات تکمیلی نمایش در سایت (هر ویژگی در یک خط جداگانه)</label>
                  <textarea
                    rows={3}
                    value={formSpecs}
                    onChange={e => setFormSpecs(e.target.value)}
                    placeholder="مثال:&#10;پشتیبانی ۲۴ ساعته اختصاصی ادمین&#10;تضمین بازگشت وجه تا ۷ روز&#10;سرعت فوق‌العاده بالا و پایداری بالا"
                    className="w-full bg-zinc-900 border border-indigo-550/10 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:border-indigo-500 transition-colors outline-none"
                  ></textarea>
                </div>

                {/* Specific Tier Variations Editor */}
                <div className="border border-zinc-900 bg-zinc-900/40 rounded-2xl p-4 space-y-4">
                  <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5 pb-2 border-b border-zinc-850">
                    <Sparkles className="w-4 h-4" />
                    تعریف بسته‌ها و گزینه‌های فرعی قیمت (Product Variations & Tiers)
                  </h3>

                  {formVariations.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      {formVariations.map((v, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-zinc-950/80 border border-zinc-850 p-2.5 rounded-xl">
                          <div>
                            <span className="text-zinc-250 font-bold">{v.duration}</span>
                            <span className="text-zinc-400 mx-1">({v.provider})</span>
                            <span className="text-zinc-400">- {v.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-400 font-sans font-medium">{Number(v.price).toLocaleString('fa-IR')} تومان</span>
                            <button
                              type="button"
                              onClick={() => setFormVariations(formVariations.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-300 p-1 bg-red-400/10 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic pr-2">هیچ بسته یا تعرفه قیمت فرعی ایجاد نشده است. (در صورت عدم ایجاد، کلیک روی محصول با تک قیمت پیشفرض در بات انجام می‌شود.)</p>
                  )}

                  {/* Add variation fields */}
                  <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-900 space-y-3">
                    <p className="text-[11px] font-medium text-zinc-400">مثال: اکانت یک‌ماهه OpenAI، اشتراکی، ۱۰۰,۰۰۰ تومان</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <input
                          id="newVarDuration"
                          type="text"
                          placeholder="مدت (مثلا: ۱ ماهه)"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-white outline-none"
                        />
                      </div>
                      <div>
                        <input
                          id="newVarProvider"
                          type="text"
                          placeholder="ارائه‌دهنده (مثلا: ChatGPT Plus)"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-white outline-none"
                        />
                      </div>
                      <div>
                        <input
                          id="newVarType"
                          type="text"
                          placeholder="نوع (مثلا: اختصاصی / تمدید)"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-white outline-none"
                        />
                      </div>
                      <div>
                        <input
                          id="newVarPrice"
                          type="number"
                          placeholder="قیمت تومان (مثلا: 150000)"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-white outline-none font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const durInput = document.getElementById('newVarDuration') as HTMLInputElement;
                        const provInput = document.getElementById('newVarProvider') as HTMLInputElement;
                        const typeInput = document.getElementById('newVarType') as HTMLInputElement;
                        const priceInput = document.getElementById('newVarPrice') as HTMLInputElement;

                        if (!durInput.value || !priceInput.value) {
                          alert('وارد کردن حداقل مدت و قیمت عددی الزامی است.');
                          return;
                        }

                        const newVar: ProductVariation = {
                          id: String(Date.now()),
                          duration: durInput.value,
                          provider: provInput.value || 'نامشخص',
                          type: typeInput.value || 'اکانت فرعی',
                          price: parseInt(priceInput.value, 10)
                        };

                        setFormVariations([...formVariations, newVar]);

                        // Reset input values
                        durInput.value = '';
                        provInput.value = '';
                        typeInput.value = '';
                        priceInput.value = '';
                      }}
                      className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs py-2 rounded-xl border border-indigo-500/20 transition-all font-bold cursor-pointer"
                    >
                      افزودن این بسته قیمت +
                    </button>
                  </div>
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

      {/* --- Group CRUD Modal (ثبت و ویرایش گروه اصلی) --- */}
      <AnimatePresence>
        {isGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative my-auto"
            >
              <button 
                onClick={() => setIsGroupModalOpen(false)}
                className="absolute top-4 left-4 text-zinc-400 hover:text-white cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800"
              >
                ✕
              </button>
              
              <h2 className="text-xl font-bold mb-6 text-white border-b border-zinc-850 pb-3 flex items-center gap-2">
                <Folder className="w-5 h-5 text-indigo-400" />
                {editingGroup ? 'ویرایش گروه محصول' : 'ایجاد گروه محصول جدید'}
              </h2>

              <form onSubmit={handleSaveGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-300">عنوان گروه اصلی</label>
                  <input 
                    type="text"
                    value={groupFormTitle}
                    onChange={e => setGroupFormTitle(e.target.value)}
                    placeholder="مثلا: اشتراک اکانت‌های توسعه"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-300">آدرس تصویر گروه (URL)</label>
                  <input 
                    type="text"
                    value={groupFormImage}
                    onChange={e => setGroupFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/... یا از تصاویر نمونه"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors outline-none"
                    dir="ltr"
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[
                      { label: 'بنفش مدرن', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60' },
                      { label: 'طرح آبی', url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=500&auto=format&fit=crop&q=60' },
                      { label: 'تکنولوژی', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60' }
                    ].map((img, idx) => (
                      <button key={idx} type="button" onClick={() => setGroupFormImage(img.url)} className="text-[9px] bg-zinc-900 text-zinc-400 hover:text-indigo-400 border border-zinc-800 px-1.5 py-0.5 rounded cursor-pointer">{img.label}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input 
                    type="checkbox" 
                    id="groupFormActive"
                    checked={groupFormActive} 
                    onChange={e => setGroupFormActive(e.target.checked)}
                    className="rounded border-zinc-800 bg-zinc-90 w-4 h-4 text-indigo-550" 
                  />
                  <label htmlFor="groupFormActive" className="text-xs text-zinc-300 select-none cursor-pointer">نمایش عمومی در سایت (فعال)</label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-zinc-850">
                  <button type="button" onClick={() => setIsGroupModalOpen(false)} className="flex-1 bg-zinc-900 text-zinc-400 rounded-xl py-2.5 text-xs transition-colors cursor-pointer">انصراف</button>
                  <button type="submit" className="flex-1 bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer">{editingGroup ? 'ذخیره تغییرات' : 'افزودن گروه'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SubGroup CRUD Modal (ثبت و ویرایش زیرشاخه‌ها) --- */}
      <AnimatePresence>
        {isSubGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative my-auto"
            >
              <button 
                onClick={() => setIsSubGroupModalOpen(false)}
                className="absolute top-4 left-4 text-zinc-400 hover:text-white cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800"
              >
                ✕
              </button>
              
              <h2 className="text-xl font-bold mb-6 text-white border-b border-zinc-850 pb-3 flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-indigo-400" />
                {editingSubGroup ? 'ویرایش زیرگروه' : 'ایجاد زیرگروه جدید'}
              </h2>

              <form onSubmit={handleSaveSubGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-300">گروه والد اصلی</label>
                  <select
                    value={subGroupFormGroupId}
                    onChange={e => setSubGroupFormGroupId(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-150 focus:border-indigo-500 transition-colors outline-none cursor-pointer"
                  >
                    <option value="0">(انتخاب گروه والد)</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-300">عنوان زیرشاخه</label>
                  <input 
                    type="text"
                    value={subGroupFormTitle}
                    onChange={e => setSubGroupFormTitle(e.target.value)}
                    placeholder="مثلا: سرویس‌های هوش مصنوعی"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-300">تصویر مرتبط زیرشاخه</label>
                  <input 
                    type="text"
                    value={subGroupFormImage}
                    onChange={e => setSubGroupFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors outline-none"
                    dir="ltr"
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[
                      { label: 'سفید نویسی', url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=500&auto=format&fit=crop&q=60' },
                      { label: 'اکانت پلاس', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=500&auto=format&fit=crop&q=60' },
                      { label: 'توسعه وبسایت', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60' }
                    ].map((img, idx) => (
                      <button key={idx} type="button" onClick={() => setSubGroupFormImage(img.url)} className="text-[9px] bg-zinc-900 text-zinc-400 hover:text-indigo-400 border border-zinc-800 px-1.5 py-0.5 rounded cursor-pointer">{img.label}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input 
                    type="checkbox" 
                    id="subGroupFormActive"
                    checked={subGroupFormActive} 
                    onChange={e => setSubGroupFormActive(e.target.checked)}
                    className="rounded border-zinc-800 bg-zinc-90 w-4 h-4 text-indigo-550" 
                  />
                  <label htmlFor="subGroupFormActive" className="text-xs text-zinc-300 select-none cursor-pointer">نمایش عمومی (فعال)</label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-zinc-850">
                  <button type="button" onClick={() => setIsSubGroupModalOpen(false)} className="flex-1 bg-zinc-900 text-zinc-400 rounded-xl py-2.5 text-xs transition-colors cursor-pointer">انصراف</button>
                  <button type="submit" className="flex-1 bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer">{editingSubGroup ? 'ذخیره تغییرات' : 'افزودن زیرشاخه'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
