import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Apple, Bot, MessagesSquare, Smartphone, Globe, ShoppingCart, 
  ChevronLeft, ChevronRight, ChevronDown, ShieldCheck, Store, LayoutDashboard, User, 
  Palette, Code, CheckCircle2, Loader2, Coins, ArrowRight, HelpCircle,
  Folder, GitMerge, Sparkles, Layers, Zap, Grid, Instagram, Send, Phone, Mail, MapPin, Twitter
} from 'lucide-react';
import { Product, Group, SubGroup } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import ThemeSwitcher from '../components/ThemeSwitcher';

const IconMap: Record<string, React.ReactNode> = {
  Apple: <Apple className="w-8 h-8 text-indigo-500 dark:text-white" />,
  Bot: <Bot className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
  Palette: <Palette className="w-8 h-8 text-purple-500 dark:text-purple-400" />,
  Globe: <Globe className="w-8 h-8 text-blue-500 dark:text-blue-400" />,
  MessageCircle: <MessagesSquare className="w-8 h-8 text-sky-500 dark:text-sky-400" />,
  Smartphone: <Smartphone className="w-8 h-8 text-orange-500 dark:text-orange-400" />
};

export function formatPrice(priceVal: string | number): string {
  if (!priceVal) return '';
  const str = String(priceVal);
  const normalized = str.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const cleanNumStr = normalized.replace(/[^\d]/g, '');
  if (!cleanNumStr) return str;

  const num = parseInt(cleanNumStr, 10);
  const formatted = num.toLocaleString('fa-IR');
  
  if (str.includes('از') || str.includes('شروع')) {
    return `از ${formatted} تومان`;
  }
  return `${formatted} تومان`;
}

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subGroups, setSubGroups] = useState<SubGroup[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [passwordLogin, setPasswordLogin] = useState(true);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotIsSubmitting, setForgotIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [enableMobileLogin, setEnableMobileLogin] = useState(false);
  const [siteConfig, setSiteConfig] = useState({
    socialInstagram: '',
    socialTelegram: '',
    socialWhatsapp: '',
    socialBale: '',
    socialX: '',
    registrationMethod: 'both',
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
    heroVideoUrl: ''
  });
  
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
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const isLogged = !!localStorage.getItem('userEmail') || !!localStorage.getItem('userPhone') || !!localStorage.getItem('userName');
  const userIdentifier = localStorage.getItem('userName') || localStorage.getItem('userEmail') || localStorage.getItem('userPhone') || 'کاربر عزیز';
  const activeUser = localStorage.getItem('userEmail') || localStorage.getItem('userPhone') || localStorage.getItem('userName') || '';

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => setProducts(d));

    fetch('/api/groups')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setGroups(d);
      })
      .catch(e => console.error(e));

    fetch('/api/subgroups')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setSubGroups(d);
      })
      .catch(e => console.error(e));

    fetch('/api/config')
      .then(r => r.json())
      .then(d => {
        setEnableMobileLogin(d.enableMobileLogin);
        setSiteConfig({
          socialInstagram: d.socialInstagram || '',
          socialTelegram: d.socialTelegram || '',
          socialWhatsapp: d.socialWhatsapp || '',
          socialBale: d.socialBale || '',
          socialX: d.socialX || '',
          registrationMethod: d.registrationMethod || 'both',
          contactPhone: d.contactPhone || '',
          contactEmail: d.contactEmail || '',
          contactAddress: d.contactAddress || '',
          heroVideoUrl: d.heroVideoUrl || ''
        });
      });
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

  // Check email validation and duplication
  useEffect(() => {
    if (!registerEmail.trim()) {
      setEmailError('');
      return;
    }
    const timeout = setTimeout(() => {
      fetch('/api/auth/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerEmail })
      })
      .then(r => r.json())
      .then(res => {
        if (res.exists) {
          setEmailError(res.message);
        } else {
          setEmailError('');
        }
      })
      .catch(() => {});
    }, 500);
    return () => clearTimeout(timeout);
  }, [registerEmail]);

  // Check phone duplication
  useEffect(() => {
    if (!registerPhone.trim()) {
      setPhoneError('');
      return;
    }
    const timeout = setTimeout(() => {
      fetch('/api/auth/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: registerPhone })
      })
      .then(r => r.json())
      .then(res => {
        if (res.exists) {
          setPhoneError(res.message);
        } else {
          setPhoneError('');
        }
      })
      .catch(() => {});
    }, 500);
    return () => clearTimeout(timeout);
  }, [registerPhone]);

  const handleForgotPasswordSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      showToast('شناسه ورود الزامی است', 'error');
      return;
    }
    setForgotIsSubmitting(true);
    fetch('/api/auth/forgot-password/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: forgotIdentifier })
    })
    .then(r => r.json())
    .then(res => {
      setForgotIsSubmitting(false);
      if (res.success) {
        setForgotOtpSent(true);
        showToast(res.message || 'کد بازیابی ارسال شد', 'success');
      } else {
        showToast(res.message || 'خطا در ارسال کد', 'error');
      }
    })
    .catch(() => {
      setForgotIsSubmitting(false);
      showToast('خطا در ارتباط با سرور', 'error');
    });
  };

  const handleForgotPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtpCode || !forgotNewPassword) {
      showToast('کد و کلمه عبور جدید الزامی هستند', 'error');
      return;
    }
    setForgotIsSubmitting(true);
    fetch('/api/auth/forgot-password/verify-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: forgotIdentifier,
        code: forgotOtpCode,
        newPassword: forgotNewPassword
      })
    })
    .then(r => r.json())
    .then(res => {
      setForgotIsSubmitting(false);
      if (res.success) {
        showToast(res.message || 'کلمه عبور با موفقیت بروزرسانی شد', 'success');
        setAuthTab('login');
        setPasswordLogin(true);
        setLoginIdentifier(forgotIdentifier);
        setLoginPassword(forgotNewPassword);
        // Clear forgot states
        setForgotIdentifier('');
        setForgotOtpSent(false);
        setForgotOtpCode('');
        setForgotNewPassword('');
      } else {
        showToast(res.message || 'کد وارد شده نامعتبر یا منقضی شده است', 'error');
      }
    })
    .catch(() => {
      setForgotIsSubmitting(false);
      showToast('خطا در ارتباط با سرور', 'error');
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailError) {
      showToast(emailError, 'error');
      return;
    }
    if (phoneError) {
      showToast(phoneError, 'error');
      return;
    }
    if (!registerName.trim()) {
      showToast('نام و نام خانوادگی الزامی است', 'error');
      return;
    }
    if (!registerPassword) {
      showToast('کلمه عبور الزامی است', 'error');
      return;
    }
    if (!registerEmail.trim() && !registerPhone.trim()) {
      showToast('پر کردن حداقل یکی از موارد ایمیل یا شماره موبایل الزامی است', 'error');
      return;
    }

    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: registerName,
        email: registerEmail,
        phone: registerPhone,
        password: registerPassword
      })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        showToast('ثبت نام شما با موفقیت انجام شد! اکنون میتوانید وارد شوید.', 'success');
        setAuthTab('login');
        setPasswordLogin(true);
        setLoginIdentifier(registerEmail || registerPhone || '');
        setLoginPassword(registerPassword);
        // Clean fields
        setRegisterName('');
        setRegisterEmail('');
        setRegisterPhone('');
        setRegisterPassword('');
      } else {
        showToast(res.message || 'خطا در ثبت نام', 'error');
      }
    })
    .catch(() => {
      showToast('خطا در ارتباط با سرور', 'error');
    });
  };

  const handleLoginWithPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      showToast('شناسه ورود و کلمه عبور الزامی است', 'error');
      return;
    }

    fetch('/api/auth/login-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: loginIdentifier,
        password: loginPassword
      })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        if (res.user.email) localStorage.setItem('userEmail', res.user.email);
        if (res.user.phone) localStorage.setItem('userPhone', res.user.phone);
        if (res.user.name) localStorage.setItem('userName', res.user.name);

        showToast(`خوش آمدید ${res.user.name || 'کاربر گرامی'}`, 'success');
        setIsLoginModalOpen(false);
        setLoginIdentifier('');
        setLoginPassword('');
        
        if (!selectedProduct) {
          navigate('/dashboard');
        }
      } else {
        showToast(res.message || 'مشخصات ورود یا کلمه عبور نادرست است', 'error');
      }
    })
    .catch(() => {
      showToast('خطا در ارتباط با سرور', 'error');
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
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              {siteConfig?.siteLogoUrl ? (
                <img src={siteConfig.siteLogoUrl} alt="Logo" className="h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Store className="text-white w-5 h-5" />
                </div>
              )}
              {!siteConfig?.siteLogoUrl && <span className="font-bold text-xl tracking-tight hidden sm:block">دیجیتال استور</span>}
            </div>

            {/* Products Interactive Dropdown & Details */}
            <div className="relative hidden md:block" onMouseLeave={() => setIsProductsDropdownOpen(false)}>
              <button 
                onMouseEnter={() => setIsProductsDropdownOpen(true)}
                onClick={() => setIsProductsDropdownOpen(!isProductsDropdownOpen)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800/40 transition-all cursor-pointer"
              >
                <Grid className="w-4 h-4 text-indigo-400" />
                <span>محصولات و دسته‌بندی‌ها</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isProductsDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
              </button>

              <AnimatePresence>
                {isProductsDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-[600px] bg-zinc-950/95 backdrop-blur-2xl border border-zinc-850 rounded-2xl p-6 shadow-2xl z-50 grid grid-cols-2 gap-6"
                  >
                    {groups.filter(g => g.active !== false).map((group) => {
                      const groupSubgroups = subGroups.filter(sg => sg.groupId === group.id && sg.active !== false);
                      return (
                        <div key={group.id} className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60">
                            <span className="text-xs font-bold text-indigo-400 tracking-wide uppercase">{group.name}</span>
                          </div>
                          
                          <div className="space-y-3">
                            {groupSubgroups.map((subg) => {
                              const subgProducts = products.filter(p => p.subGroupId === subg.id && p.active !== false);
                              return (
                                <div key={subg.id} className="space-y-1">
                                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-md shadow-purple-500/50"></span>
                                    {subg.name}
                                  </span>
                                  <div className="pr-3 flex flex-col gap-1 border-r border-zinc-900 mr-1">
                                    {subgProducts.map((prod) => (
                                      <button
                                        key={prod.id}
                                        onClick={() => {
                                          setSelectedProduct(prod);
                                          setOrderSuccess(null);
                                          setIsProductsDropdownOpen(false);
                                        }}
                                        className="text-right text-[11px] text-zinc-400 hover:text-indigo-400 hover:underline transition-all block w-full py-0.5 cursor-pointer"
                                      >
                                        {prod.title} <span className="text-[9px] text-zinc-600">({formatPrice(prod.price)})</span>
                                      </button>
                                    ))}
                                    {subgProducts.length === 0 && (
                                      <span className="text-[10px] text-zinc-600 italic">محصولی در این زیرگروه نیست</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Direct products */}
                            {(() => {
                              const directProducts = products.filter(p => p.groupId === group.id && !p.subGroupId && p.active !== false);
                              if (directProducts.length === 0) return null;
                              return (
                                <div className="space-y-1">
                                  <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">سایر موارد عمومی</span>
                                  <div className="pr-3 flex flex-col gap-1 border-r border-zinc-900 mr-1">
                                    {directProducts.map(prod => (
                                      <button
                                        key={prod.id}
                                        onClick={() => {
                                          setSelectedProduct(prod);
                                          setOrderSuccess(null);
                                          setIsProductsDropdownOpen(false);
                                        }}
                                        className="text-right text-[11px] text-zinc-400 hover:text-indigo-400 hover:underline transition-all block w-full py-0.5 cursor-pointer"
                                      >
                                        {prod.title}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">ورود مدیران</span>
            </Link>

            <ThemeSwitcher />

            {isLogged ? (
              <button 
                onClick={() => navigate('/dashboard')} 
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all shadow-md shadow-indigo-500/10 flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>پنل من ({userIdentifier})</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-black px-5 py-2.5 rounded-full font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-sm dark:shadow-none"
              >
                <User className="w-4 h-4" />
                ورود / عضویت
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Login / Register Modal */}
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

              {/* Tab Selector */}
              {authTab !== 'forgot' && (
                <div className="flex bg-zinc-900 rounded-xl p-1 mb-6">
                  <button 
                    type="button" 
                    onClick={() => { setAuthTab('login'); setOtpSent(false); }} 
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${authTab === 'login' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    ورود به حساب
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setAuthTab('register'); setOtpSent(false); }} 
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${authTab === 'register' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    عضویت جدید
                  </button>
                </div>
              )}

              {authTab === 'forgot' ? (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-1">بازیابی کلمه عبور</h3>
                    <p className="text-[11px] text-zinc-400">شناسه ورود (ایمیل یا شماره موبایل) خود را جهت دریافت کد وارد کنید:</p>
                  </div>

                  {!forgotOtpSent ? (
                    <form onSubmit={handleForgotPasswordSend} className="space-y-4">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">ایمیل یا شماره موبایل شما:</label>
                        <input 
                          type="text" 
                          placeholder="example@mail.com یا 09121234567"
                          value={forgotIdentifier}
                          onChange={e => setForgotIdentifier(e.target.value)}
                          dir="ltr"
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 text-white focus:border-indigo-500 rounded-xl px-4 py-2.5 text-center text-sm outline-none transition-colors"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={forgotIsSubmitting}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl py-3 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {forgotIsSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {forgotIsSubmitting ? 'در حال ارسال کد...' : 'ارسال کد بازیابی'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotPasswordReset} className="space-y-4">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-lg text-center text-[11px] leading-relaxed">
                        کد تایید بازیابی یکبار مصرف به {forgotIdentifier} ارسال شد. در صورت لزوم می‌توانید مجددا تلاش کنید.
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">کد تایید (6 رقمی):</label>
                        <input 
                          type="text" 
                          placeholder="مثلا 123456"
                          value={forgotOtpCode}
                          onChange={e => setForgotOtpCode(e.target.value)}
                          dir="ltr"
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 text-white focus:border-indigo-500 rounded-xl px-4 py-2.5 text-center text-sm outline-none tracking-widest font-mono transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">کلمه عبور جدید شما:</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={forgotNewPassword}
                          onChange={e => setForgotNewPassword(e.target.value)}
                          dir="ltr"
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 text-white focus:border-indigo-500 rounded-xl px-4 py-2.5 text-center text-sm outline-none transition-colors"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={forgotIsSubmitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl py-3 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {forgotIsSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {forgotIsSubmitting ? 'در حال بروزرسانی...' : 'بروزرسانی کلمه عبور جدید'}
                      </button>
                    </form>
                  )}

                  <button 
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      setForgotOtpSent(false);
                      setForgotOtpCode('');
                    }}
                    className="w-full text-indigo-400 hover:text-indigo-300 text-xs text-center block mt-2 cursor-pointer transition-colors"
                  >
                    ← بازگشت به صفحه ورود
                  </button>
                </div>
              ) : authTab === 'login' ? (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-1">ورود به حساب کاربری</h3>
                    <p className="text-xs text-zinc-400">به یکی از روش‌های زیر وارد شوید:</p>
                  </div>

                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-900">
                    <span className="text-[10px] text-zinc-400 font-medium">روش احراز هویت:</span>
                    <button 
                      type="button" 
                      onClick={() => { setPasswordLogin(!passwordLogin); setOtpSent(false); }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      {passwordLogin ? '🔑 ورود سریع بدون رمز (OTP)' : '🔒 ورود با کلمه عبور'}
                    </button>
                  </div>

                  {passwordLogin ? (
                    <form onSubmit={handleLoginWithPassword} className="space-y-4">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">ایمیل یا شماره موبایل:</label>
                        <input 
                          type="text" 
                          placeholder="example@mail.com یا 09121234567"
                          value={loginIdentifier}
                          onChange={e => setLoginIdentifier(e.target.value)}
                          dir="ltr"
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 text-white focus:border-indigo-500 rounded-xl px-4 py-2.5 text-center text-sm outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] text-zinc-400 block">کلمه عبور شما:</label>
                          <button 
                            type="button" 
                            onClick={() => {
                              setForgotIdentifier(loginIdentifier);
                              setAuthTab('forgot');
                              setForgotOtpSent(false);
                            }}
                            className="text-[9px] text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                          >
                            فراموشی رمز عبور؟
                          </button>
                        </div>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          dir="ltr"
                          required
                          className="w-full bg-zinc-900 border border-zinc-850 text-white focus:border-indigo-500 rounded-xl px-4 py-2.5 text-center text-sm outline-none transition-colors"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl py-3 text-xs font-bold transition-colors cursor-pointer"
                      >
                        ورود مطمئن به حساب
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                      {!otpSent ? (
                        <>
                          {enableMobileLogin && (
                            <div className="flex bg-zinc-900 rounded-xl p-1 mb-4">
                              <button type="button" onClick={() => setLoginMethod('email')} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${loginMethod === 'email' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>ایمیل</button>
                              <button type="button" onClick={() => setLoginMethod('phone')} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${loginMethod === 'phone' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>موبایل</button>
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
                                className="w-full bg-zinc-900 border border-zinc-850 text-white focus:border-indigo-500 rounded-xl px-4 py-2.5 text-center text-xs outline-none transition-colors"
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
                                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-center text-xs outline-none transition-colors"
                              />
                            </div>
                          )}
                          <button 
                            type="submit"
                            disabled={loginMethod === 'email' ? !email.includes('@') : phone.length < 10}
                            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl py-3 text-xs font-bold transition-colors cursor-pointer"
                          >
                            دریافت کد تایید یکبار مصرف
                          </button>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs text-center mb-3">کد تایید به {loginMethod === 'email' ? 'ایمیل' : 'پیام‌رسان'} ارسال شد.</p>
                            <input 
                              type="text" 
                              placeholder="کد تایید..."
                              value={otpCode}
                              onChange={e => setOtpCode(e.target.value)}
                              dir="ltr"
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-center tracking-widest outline-none transition-colors"
                            />
                          </div>
                          <button 
                            type="submit"
                            disabled={otpCode.length < 4}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl py-3 text-xs font-bold transition-colors cursor-pointer"
                          >
                            ورود به حساب
                          </button>
                          <button 
                            type="button"
                            onClick={() => setOtpSent(false)}
                            className="w-full text-zinc-400 hover:text-white text-xs mt-2 cursor-pointer"
                          >
                            تغییر {loginMethod === 'email' ? 'ایمیل' : 'شماره'}
                          </button>
                        </>
                      )}
                    </form>
                  )}
                </>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold mb-1">عضویت زودهنگام در سایت</h3>
                    <p className="text-[10px] text-zinc-400">تنها با پر کردن فیلدهای زیر حساب شما آماده میگردد</p>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">نام و نام خانوادگی:</label>
                    <input 
                      type="text" 
                      placeholder="امیر رضایی"
                      value={registerName}
                      onChange={e => setRegisterName(e.target.value)}
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 text-white focus:border-indigo-500 rounded-xl px-4 py-2 text-xs outline-none transition-colors"
                    />
                  </div>

                  {siteConfig.registrationMethod !== 'phone_only' && (
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">آدرس ایمیل {siteConfig.registrationMethod === 'email_only' ? '*(اجباری)' : '(اختیاری)'}:</label>
                      <input 
                        type="email" 
                        placeholder="yourname@gmail.com"
                        value={registerEmail}
                        onChange={e => setRegisterEmail(e.target.value)}
                        dir="ltr"
                        required={siteConfig.registrationMethod === 'email_only'}
                        className={`w-full bg-zinc-900 border text-white focus:border-indigo-500 rounded-xl px-4 py-2 text-xs outline-none transition-colors ${emailError ? 'border-red-500/80' : 'border-zinc-800'}`}
                      />
                      {emailError && (
                        <p className="text-[9px] text-rose-400 mt-1 flex items-center gap-1">
                          ⚠️ {emailError}
                        </p>
                      )}
                    </div>
                  )}

                  {siteConfig.registrationMethod !== 'email_only' && (
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">شماره همراه مراجع {siteConfig.registrationMethod === 'phone_only' ? '*(اجباری)' : '(اختیاری)'}:</label>
                      <input 
                        type="tel" 
                        placeholder="09121234567"
                        value={registerPhone}
                        onChange={e => setRegisterPhone(e.target.value)}
                        dir="ltr"
                        required={siteConfig.registrationMethod === 'phone_only'}
                        className={`w-full bg-zinc-900 border text-white focus:border-indigo-500 rounded-xl px-4 py-2 text-xs outline-none transition-colors ${phoneError ? 'border-red-500/80' : 'border-zinc-800'}`}
                      />
                      {phoneError && (
                        <p className="text-[9px] text-rose-400 mt-1 flex items-center gap-1">
                          ⚠️ {phoneError}
                        </p>
                      )}
                    </div>
                  )}

                  {siteConfig.registrationMethod === 'both' ? (
                    <p className="text-[9px] text-indigo-300">💡 وارد کردن حداقل یکی از موارد فوق (ایمیل یا همراه) در متد ثبت‌نام تجاری آزاد کافیست.</p>
                  ) : (
                    <p className="text-[9px] text-rose-300">💡 طبق الگوی احراز هویت ادمین، تکمیل فیلد اجباری فوق الزامی است.</p>
                  )}

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">تعیین کلمه عبور:</label>
                    <input 
                      type="password" 
                      placeholder="کلمه عبور دلخواه..."
                      value={registerPassword}
                      onChange={e => setRegisterPassword(e.target.value)}
                      dir="ltr"
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 text-white focus:border-indigo-500 rounded-xl px-4 py-2 text-xs outline-none transition-colors"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={!!emailError || !!phoneError}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ثبت نام و شروع خرید
                  </button>
                </form>
              )}

              <p className="text-[10px] text-zinc-500 text-center mt-6">
                شما همچنین میتوانید با استارت ربات‌های پیام‌رسان با یک کلیک ثبت نام و وارد شوید.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Cinematic Hero Video Header Banner */}
        {(() => {
          const fallbackVideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-32115-large.mp4";
          const currentVideoUrl = siteConfig.heroVideoUrl || fallbackVideoUrl;
          return (
            <div className="relative mb-12 overflow-hidden rounded-[32px] border border-zinc-200/50 dark:border-zinc-800/60 bg-zinc-950/40 h-[340px] md:h-[420px] flex items-center justify-center text-center p-8 shadow-2xl">
              {/* Background Video */}
              <video 
                key={currentVideoUrl}
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
              >
                <source src={currentVideoUrl} type="video/mp4" />
              </video>
              
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-indigo-950/25 pointer-events-none" />
              <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

              {/* Dynamic Slogan Text Content */}
              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider animate-pulse">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                  <span>بروزرسانی زنده و هوشمند</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                  فناوری نوین، <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300">در دستان شما</span>
                </h1>
                <p className="text-zinc-300 text-xs md:text-sm max-w-lg mx-auto leading-relaxed drop-shadow">
                  باکیفیت‌ترین لایسنس‌ها، اشتراک‌های ویژه، و خدمات برنامه‌نویسی و بات‌های هوشمند را در محیطی مدرن به صورت آنی دریافت کنید.
                </p>
                
                <div className="flex items-center justify-center gap-4 pt-2">
                  <a 
                    href="#products" 
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs md:text-sm px-6 py-3 rounded-full transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
                  >
                    مشاهده دسته‌بندی‌ها
                  </a>
                  {siteConfig.contactPhone && (
                    <a 
                      href={`tel:${siteConfig.contactPhone}`} 
                      className="bg-zinc-900/30 hover:bg-zinc-900/60 text-zinc-300 border border-zinc-800 font-bold text-xs md:text-sm px-6 py-3 rounded-full transition-all cursor-pointer backdrop-blur-md"
                    >
                      ارتباط با پشتیبانی
                    </a>
                  )}
                </div>
              </div>
              
              {/* Decorative bottom fade line */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
            </div>
          );
        })()}

        {/* --- Modern Dynamic Slideshow & Bento Tiles Section --- */}
        {products.filter(p => p.active !== false).length > 0 && (
          <div className="grid grid-cols-12 gap-6 mb-16">
            
            {/* Cinematic Slider - Col Span 8 */}
            <div className="col-span-12 lg:col-span-8 relative group overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-950/40 p-1 backdrop-blur-md">
              <div className="relative h-[340px] md:h-[380px] w-full overflow-hidden rounded-[22px] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-zinc-950/20 flex flex-col justify-between p-6 sm:p-10">
                
                {/* Background glow animation */}
                <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none opacity-80 group-hover:scale-110 transition-transform duration-700" />
                
                {/* Slider Header */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5 px-3.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                    <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">پیشنهاد برگزیده دیجیتال استور</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-550">
                    {activeSlide + 1} از {products.filter(p => p.active !== false).slice(0, 4).length}
                  </span>
                </div>

                {/* Slides Animation */}
                <div className="relative flex-grow flex items-center z-10 py-4">
                  <AnimatePresence mode="wait">
                    {products.filter(p => p.active !== false).slice(0, 4).map((prod, index) => {
                      if (index !== activeSlide) return null;
                      return (
                        <motion.div
                          key={prod.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.35 }}
                          className="w-full text-right space-y-4"
                        >
                          <div className="space-y-2">
                            <h2 className="text-2xl sm:text-3xl font-black text-zinc-905 dark:text-white tracking-tight leading-none">
                              {prod.title}
                            </h2>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm max-w-xl leading-relaxed line-clamp-2">
                              {prod.desc}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 pt-1">
                            <div className="text-xs sm:text-sm bg-zinc-200/50 dark:bg-zinc-900/60 border border-zinc-300 dark:border-zinc-800 px-4 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 font-bold">
                              قیمت استثنایی: {formatPrice(prod.price)}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedProduct(prod);
                                setOrderSuccess(null);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
                            >
                              <span>خرید و سفارش فوری</span>
                              <ArrowRight className="w-4 h-4 translate-y-[1px] rotate-180" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Dots / Manual Triggers */}
                <div className="flex items-center justify-between z-10 pt-4 border-t border-zinc-200/50 dark:border-zinc-900/40">
                  <div className="flex items-center gap-2">
                    {products.filter(p => p.active !== false).slice(0, 4).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${idx === activeSlide ? 'w-6 bg-indigo-500' : 'w-2 bg-zinc-300 dark:bg-zinc-800'}`}
                      />
                    ))}
                  </div>

                  {/* Manual Arrow Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const len = products.filter(p => p.active !== false).slice(0, 4).length;
                        setActiveSlide(p => (p - 1 + len) % len);
                      }}
                      className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5 animate-none rotate-180" />
                    </button>
                    <button
                      onClick={() => {
                        const len = products.filter(p => p.active !== false).slice(0, 4).length;
                        setActiveSlide(p => (p + 1) % len);
                      }}
                      className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5 animate-none rotate-180" />
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Special Bento Tiles - Col Span 4 */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
              
              {/* Tile 1: Delivery badge */}
              <div className="group flex-1 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 flex items-start gap-4 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                    تحویل آنی اکانت‌ها
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    بلافاصله پس از تکمیل ثبت سفارش، لایسنس و اطلاعات اکانت به صورت خودکار پیام‌رسانی و ارسال می‌شود.
                  </p>
                </div>
              </div>

              {/* Tile 2: Support badge */}
              <div className="group flex-1 bg-gradient-to-br from-purple-500/5 via-violet-500/5 to-transparent border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 flex items-start gap-4 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-100 mb-1">پشتیبانی ۲۴ ساعته مطمئن</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    تیم مجرب پشتیبانی دیجیتال استور در هر ساعت از شبانه‌روز آماده پاسخگویی و راهنمایی شما عزیزان است.
                  </p>
                </div>
              </div>

              {/* Tile 3: Safety badge */}
              <div className="group flex-1 bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-transparent border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 flex items-start gap-4 backdrop-blur-sm hover:border-indigo-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-100 mb-1">کاشی امنیت خرید شما</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    پرداختی کاملاً امن تحت پروتکل‌های رمزنگاری شده و گارانتی ۱۰۰ درصدی بازگشت وجه در صورت بروز مشکل.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Categories / Products Hierarchical Display */}
        <div className="space-y-16">
          {groups.filter(g => g.active !== false).map((group, gIdx) => {
            const groupSubGroups = subGroups.filter(sg => sg.groupId === group.id && sg.active !== false);
            // Products directly or indirectly in this group
            const groupProducts = products.filter(p => p.groupId === group.id && p.active !== false);

            if (groupProducts.length === 0 && groupSubGroups.length === 0) return null;

            return (
              <section key={group.id} className="bg-zinc-900/10 dark:bg-zinc-950/20 p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm">
                {/* Group Title Area */}
                <div className="flex items-center gap-4 mb-8 border-b border-zinc-200/80 dark:border-zinc-850/50 pb-5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {group.image ? (
                      <img src={group.image} alt={group.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Folder className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{group.name}</h2>
                    {group.description && <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">{group.description}</p>}
                  </div>
                </div>

                {/* Subgroups & Products inside subgroups */}
                <div className="space-y-12">
                  {groupSubGroups.map((subGroup) => {
                    const subGroupProducts = groupProducts.filter(p => p.subGroupId === subGroup.id);
                    if (subGroupProducts.length === 0) return null;

                    return (
                      <div key={subGroup.id} className="space-y-6">
                        {/* Subgroup Heading */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {subGroup.image ? (
                              <img src={subGroup.image} alt={subGroup.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <GitMerge className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{subGroup.name}</h3>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {subGroupProducts.map((prod, i) => (
                            <motion.div 
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              key={prod.id} 
                              onClick={() => { setSelectedProduct(prod); setOrderSuccess(null); }}
                              className="glass-panel p-6 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between"
                            >
                              <div>
                                <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-805 group-hover:scale-105 group-hover:border-indigo-500/30 transition-all overflow-hidden">
                                  {prod.image ? (
                                    <img src={prod.image} alt={prod.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                  ) : (
                                    IconMap[prod.icon] || <Coins className="text-indigo-500 dark:text-indigo-400 w-8 h-8" />
                                  )}
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-zinc-800 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{prod.title}</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 h-10 line-clamp-2">{prod.desc}</p>
                              </div>
                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{formatPrice(prod.price)}</span>
                                <button className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 border border-zinc-300 dark:border-zinc-800 group-hover:border-indigo-400 flex items-center justify-center transition-colors">
                                  <ChevronLeft className="w-5 h-5 text-zinc-700 dark:text-white" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Products in this group but not assigned to any subgroup */}
                  {(() => {
                    const ungroupedGroupProducts = groupProducts.filter(p => !p.subGroupId);
                    if (ungroupedGroupProducts.length === 0) return null;

                    return (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-zinc-450/10 border border-zinc-500/20 flex items-center justify-center flex-shrink-0">
                            <Folder className="w-4 h-4 text-zinc-500" />
                          </div>
                          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">سایر موارد عمومی</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {ungroupedGroupProducts.map((prod, i) => (
                            <motion.div 
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              key={prod.id} 
                              onClick={() => { setSelectedProduct(prod); setOrderSuccess(null); }}
                              className="glass-panel p-6 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between"
                            >
                              <div>
                                <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-805 group-hover:scale-105 group-hover:border-indigo-500/30 transition-all overflow-hidden">
                                  {prod.image ? (
                                    <img src={prod.image} alt={prod.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                  ) : (
                                    IconMap[prod.icon] || <Coins className="text-indigo-500 dark:text-indigo-400 w-8 h-8" />
                                  )}
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-zinc-800 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{prod.title}</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 h-10 line-clamp-2">{prod.desc}</p>
                              </div>
                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{formatPrice(prod.price)}</span>
                                <button className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 border border-zinc-300 dark:border-zinc-800 group-hover:border-indigo-400 flex items-center justify-center transition-colors">
                                  <ChevronLeft className="w-5 h-5 text-zinc-700 dark:text-white" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </section>
            );
          })}
        </div>

        {/* Fallback Section for uncategorized products */}
        {(() => {
          const ungroupedProducts = products.filter(p => !p.groupId && p.active !== false);
          if (ungroupedProducts.length === 0) return null;

          return (
            <section className="bg-zinc-900/10 dark:bg-zinc-950/20 p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm mt-16">
              <div className="flex items-center gap-4 mb-8 border-b border-zinc-200/80 dark:border-zinc-850/50 pb-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <Coins className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">سایر محصولات نایاب</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">سایر سرویس‌های عمومی و لایسنس‌های ارائه شده توسط دیجیتال استور</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ungroupedProducts.map((prod, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={prod.id} 
                    onClick={() => { setSelectedProduct(prod); setOrderSuccess(null); }}
                    className="glass-panel p-6 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-850 group-hover:scale-105 group-hover:border-indigo-500/30 transition-all overflow-hidden">
                        {prod.image ? (
                          <img src={prod.image} alt={prod.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          IconMap[prod.icon] || <Coins className="text-indigo-500 dark:text-indigo-400 w-8 h-8" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-zinc-800 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{prod.title}</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 h-10 line-clamp-2">{prod.desc}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{formatPrice(prod.price)}</span>
                      <button className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 border border-zinc-300 dark:border-zinc-800 group-hover:border-indigo-400 flex items-center justify-center transition-colors">
                        <ChevronLeft className="w-5 h-5 text-zinc-700 dark:text-white" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })()}
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
                  <div className="mb-4 bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-xl">
                    <h4 className="text-sm text-zinc-400 mb-2 flex items-center gap-1.5 font-medium">
                      <HelpCircle className="w-4 h-4 text-zinc-400" /> توضیحات و جزئیات محصول:
                    </h4>
                    <p className="text-sm text-zinc-300 leading-relaxed font-normal">{selectedProduct.desc}</p>
                  </div>

                  {/* Custom Specs Display */}
                  {selectedProduct.specs && (
                    <div className="mb-4 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl">
                      <h4 className="text-xs text-indigo-400 mb-2 flex items-center gap-1.5 font-semibold">
                        ✨ ویژگی‌های تعریف شده ادمین:
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedProduct.specs.split('\n').filter(Boolean).map((spec, sidx) => (
                          <li key={sidx} className="text-xs text-zinc-300 flex items-start gap-1 justify-start">
                            <span className="text-indigo-400 mt-0.5">•</span>
                            <span>{spec.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

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
                            <span className="block text-sm font-bold text-zinc-300">بستر میزان‌دهی ربات</span>
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
                    <span className="text-xl font-bold text-emerald-400 font-sans">
                      {selectedProduct.type === 'account' 
                        ? formatPrice(parseInt(selectedProduct.price.replace(/[^\d]/g, '') || '0') * quantity) 
                        : formatPrice(selectedProduct.price)}
                    </span>
                  </div>

                  {/* Authentification inside checkout flow (if not logged in) */}
                  {!isLogged ? (
                    <div className="border-t border-zinc-850/60 pt-6 text-center">
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl mb-6 text-xs leading-relaxed">
                        ⚠️ جهت ثبت سفارش جدید، هماهنگی و دسترسی به پنل کاربری لازم است ابتدا وارد حساب خود شوید و یا ثبت‌نام کنید.
                      </div>
                      
                      <div className="flex gap-3">
                        <button 
                          type="button"
                          onClick={() => {
                            setAuthTab('login');
                            setIsLoginModalOpen(true);
                          }}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-bold text-center text-xs transition-colors cursor-pointer"
                        >
                          ورود به حساب کاربری
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setAuthTab('register');
                            setIsLoginModalOpen(true);
                          }}
                          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl py-3 font-bold text-center text-xs transition-colors cursor-pointer"
                        >
                          ثبت نام و عضویت
                        </button>
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

      {/* Premium Glassmorphic Footer with Admin Socials & Contact Coordinates */}
      <footer className="mt-20 border-t border-zinc-200/50 dark:border-zinc-850 bg-zinc-100/30 dark:bg-zinc-950/40 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-right">
          
          {/* Col 1: Brand & Slogan */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Store className="text-white w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-zinc-900 dark:text-white font-sans">دیجیتال استور</span>
            </div>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed max-w-sm">
              بزرگ‌ترین مرجع تخصصی ارائه اکانت‌های بین‌المللی، اشتراک‌های دیجیتالی، سایت و ربات‌های فوق پیشرفته تلگرام و بله با تحویل فوری و گارانتی طلایی بازگشت هزینه.
            </p>
            
            {/* Social Icons based on configuration */}
            <div className="flex items-center gap-3 pt-2">
              {siteConfig.socialInstagram && (
                <a 
                  href={siteConfig.socialInstagram} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-zinc-200/55 dark:bg-zinc-900 hover:bg-pink-650/10 hover:text-pink-500 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center transition-all shadow-inner"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {siteConfig.socialTelegram && (
                <a 
                  href={siteConfig.socialTelegram} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-zinc-200/55 dark:bg-zinc-900 hover:bg-sky-655/10 hover:text-sky-400 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center transition-all shadow-inner"
                >
                  <Send className="w-4 h-4" />
                </a>
              )}
              {siteConfig.socialWhatsapp && (
                <a 
                  href={siteConfig.socialWhatsapp} 
                  target="_blank" 
                  rel="noreferrer"
                  title="واتساپ پشتیبانی"
                  className="w-9 h-9 rounded-xl bg-zinc-200/55 dark:bg-zinc-900 hover:bg-emerald-600/10 hover:text-emerald-400 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center transition-all shadow-inner"
                >
                  <MessagesSquare className="w-4 h-4 text-emerald-400" />
                </a>
              )}
              {siteConfig.socialBale && (
                <a 
                  href={siteConfig.socialBale} 
                  target="_blank" 
                  rel="noreferrer"
                  title="پیام‌رسان بله"
                  className="w-9 h-9 rounded-xl bg-zinc-200/55 dark:bg-zinc-900 hover:bg-green-600/10 hover:text-green-400 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center transition-all shadow-inner"
                >
                  <MessagesSquare className="w-4 h-4 text-green-400" />
                </a>
              )}
              {siteConfig.socialX && (
                <a 
                  href={siteConfig.socialX} 
                  target="_blank" 
                  rel="noreferrer"
                  title="صفحه X (توئیتر)"
                  className="w-9 h-9 rounded-xl bg-zinc-200/55 dark:bg-zinc-900 hover:bg-zinc-600/10 hover:text-zinc-400 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center transition-all shadow-inner"
                >
                  <Twitter className="w-4 h-4 text-zinc-400" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: High-availability Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-200/50 dark:border-zinc-850 max-w-xs font-sans">دسترسی سریع</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-2.5">
                <a href="#products" className="text-zinc-550 dark:text-zinc-400 hover:text-indigo-400 transition-colors">محصولات دیجیتال</a>
                <a href="/admin" className="text-zinc-550 dark:text-zinc-400 hover:text-indigo-400 transition-colors">پنل کارمندان</a>
                <a href="/dashboard" className="text-zinc-550 dark:text-zinc-400 hover:text-indigo-400 transition-colors font-semibold">حساب کاربری من</a>
              </div>
              <div className="flex flex-col gap-2.5">
                <button onClick={() => { setIsLoginModalOpen(true); setAuthTab('register'); }} className="text-right text-zinc-550 dark:text-zinc-400 hover:text-indigo-400 transition-colors cursor-pointer">عضویت زودهنگام</button>
                <span className="text-zinc-500/80 dark:text-zinc-600 text-[11px]">تحویل آنی ۲۴ ساعته</span>
                <span className="text-zinc-500/80 dark:text-zinc-650 text-[11px]">پروتکل امن پرداخت</span>
              </div>
            </div>
          </div>

          {/* Col 3: Contact Coordinates */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-200/50 dark:border-zinc-850 max-w-xs font-sans">ارتباط با ما</h4>
            <div className="space-y-3.5 text-xs text-zinc-550 dark:text-zinc-350">
              {siteConfig.contactPhone && (
                <div className="flex items-center justify-end gap-2">
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">{siteConfig.contactPhone}</span>
                  <Phone className="w-4 h-4 text-indigo-400" />
                </div>
              )}
              {siteConfig.contactEmail && (
                <div className="flex items-center justify-end gap-2">
                  <span className="font-mono text-zinc-850 dark:text-zinc-200">{siteConfig.contactEmail}</span>
                  <Mail className="w-4 h-4 text-indigo-400" />
                </div>
              )}
              {siteConfig.contactAddress && (
                <div className="flex items-start justify-end gap-2">
                  <span className="leading-relaxed max-w-[200px] text-zinc-850 dark:text-zinc-300">{siteConfig.contactAddress}</span>
                  <MapPin className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                </div>
              )}
              {!siteConfig.contactPhone && !siteConfig.contactEmail && !siteConfig.contactAddress && (
                <span className="italic text-zinc-550 text-[11px] text-center block">تلفن و آدرس تماس توسط ادمین ثبت نشده است.</span>
              )}
            </div>
          </div>

        </div>

        {/* Outer bottom copyright rail */}
        <div className="border-t border-zinc-200/30 dark:border-zinc-900 bg-zinc-250/10 dark:bg-zinc-950/80 py-4 text-center">
          <p className="text-[10px] text-zinc-400">
            تمامی حقوق مادی و معنوی محفوظ و متعلق به دیجیتال استور می‌باشد © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
