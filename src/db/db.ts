import fs from 'fs';
import path from 'path';

// --- Interfaces & Types ---
export interface Group { id: number; title: string; image: string; active: boolean; }
export interface SubGroup { id: number; groupId: number; title: string; image: string; active: boolean; }
export interface Product { id: number; type: 'account' | 'service'; category: string; title: string; desc: string; price: string; icon: string; image: string; active: boolean; groupId: number; subGroupId: number; variants?: any[]; }
export interface Order { id: number; productId: number; productTitle: string; productType: 'account' | 'service' | 'dev'; userIdentifier: string; price: string; status: 'pending' | 'approved' | 'rejected' | 'completed' | 'canceled'; createdAt: string; additionalDetails?: string; }
export interface User { id: number; email?: string; phone?: string; role: 'user' | 'admin'; password?: string; walletBalance: number; status: 'active' | 'suspended'; createdAt: string; }
export interface Chat { id: number; userId: string; messages: { sender: 'user' | 'admin'; text: string; createdAt?: string; }[]; }
export interface Ticket { id: number; userIdentifier: string; title: string; body: string; status: 'open' | 'closed'; priority: 'low' | 'medium' | 'high'; createdAt: string; replies: { sender: 'user' | 'admin'; text: string; createdAt: string; }[]; }
export interface Transaction { id: number; userIdentifier: string; amount: number; description: string; type: 'credit' | 'debit'; createdAt: string; status?: 'pending' | 'approved' | 'rejected'; }
export interface BotUser { phone: string; telegramChatId?: number; baleChatId?: number; }

export interface Settings {
  telegramToken: string;
  baleToken: string;
  adminTelegramChatId: string;
  adminBaleChatId: string;
  adminIdNumber: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  enableMobileLogin: boolean;
  enableTelegramJoinCheck: boolean;
  telegramJoinChannel: string;
  enableBaleJoinCheck: boolean;
  baleJoinChannel: string;
  socialInstagram: string;
  socialTelegram: string;
  socialWhatsapp: string;
  socialBale: string;
  socialX: string;
  registrationMethod: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  heroVideoUrl: string;
  onlinePaymentUrl: string;
  cardNo: string;
  cardHolder: string;
  cardBank: string;
  siteLogoUrl: string;
  onlinePaymentEnabled: boolean;
  cardPaymentEnabled: boolean;
  siteName?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  servicesTitle?: string;
  servicesSubtitle?: string;
  deliveryTitle?: string;
  deliveryDesc?: string;
  supportTitle?: string;
  supportDesc?: string;
  paymentTitle?: string;
  paymentDesc?: string;
  footerCopy?: string;
  enableHeroSection?: boolean;
  enableFeaturesSection?: boolean;
  enableProductsSection?: boolean;
  enableStatsSection?: boolean;
  enableVideoBackground?: boolean;
}

// --- Initial State ---
export let groups: Group[] = [
  { id: 1, title: 'اشتراک‌ها و اکانت‌ها', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60', active: true },
  { id: 2, title: 'خدمات طراحی اختصاصی', image: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=500&auto=format&fit=crop&q=60', active: true }
];

export let subGroups: SubGroup[] = [
  { id: 11, groupId: 1, title: 'اکانت‌های هوش مصنوعی', image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=500&auto=format&fit=crop&q=60', active: true },
  { id: 12, groupId: 1, title: 'سرویس‌های شرکت اپل', image: 'https://images.unsplash.com/photo-1491933300451-c42917146e22?w=500&auto=format&fit=crop&q=60', active: true },
  { id: 21, groupId: 2, title: 'طراحی تخصصی وبسایت', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60', active: true },
  { id: 22, groupId: 2, title: 'ربات‌نویسی پیام‌رسان‌ها', image: 'https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?w=500&auto=format&fit=crop&q=60', active: true }
];

export let products: Product[] = [
  { id: 1, type: 'account', category: 'apple', title: 'اپل آیدی اختصاصی', desc: 'با ایمیل دلخواه شما', price: '۳۵۰,۰۰۰ تومان', icon: 'Apple', image: 'https://images.unsplash.com/photo-1491933300451-c42917146e22?w=500&auto=format&fit=crop&q=60', active: true, groupId: 1, subGroupId: 12 },
  { id: 2, type: 'account', category: 'ai', title: 'اکانت ChatGPT Plus', desc: 'دسترسی ۳۰ روزه به GPT-4', price: '۱,۴۵۰,۰۰۰ تومان', icon: 'Bot', image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=500&auto=format&fit=crop&q=60', active: true, groupId: 1, subGroupId: 11 },
  { id: 3, type: 'account', category: 'ai', title: 'اکانت Midjourney', desc: 'اشتراک استاندارد', price: '۱,۸۰۰,۰۰۰ تومان', icon: 'Palette', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60', active: true, groupId: 1, subGroupId: 11 },
  { id: 4, type: 'service', category: 'web', title: 'طراحی سایت شرکتی/فروشگاهی', desc: 'مدرن، ریسپانسیو و سئو شده', price: 'از ۱۰,۰۰۰,۰۰۰ تومان', icon: 'Globe', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60', active: true, groupId: 2, subGroupId: 21 },
  { id: 5, type: 'service', category: 'bot', title: 'طراحی ربات تلگرام و بله', desc: 'فروشگاهی، پشتیبانی، مدیریت گروه', price: 'از ۳,۰۰۰,۰۰۰ تومان', icon: 'MessageCircle', image: 'https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?w=500&auto=format&fit=crop&q=60', active: true, groupId: 2, subGroupId: 22 },
  { id: 6, type: 'service', category: 'app', title: 'ساخت اپلیکیشن اندروید', desc: 'نیتیو و کراس‌پلتفرم', price: 'از ۱۵,۰۰۰,۰۰۰ تومان', icon: 'Smartphone', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&auto=format&fit=crop&q=60', active: true, groupId: 2, subGroupId: 21 },
];

export let orders: Order[] = [
  { id: 1001, productId: 5, productTitle: 'طراحی ربات تلگرام و بله', productType: 'service', userIdentifier: 'meh732@gmail.com', price: 'از ۳,۰۰۰,۰۰۰ تومان', status: 'pending', createdAt: new Date().toISOString(), additionalDetails: 'نیاز به ربات پیشرفته فروشگاهی داریم' }
];

export let users: User[] = [];
export let tickets: Ticket[] = [];
export let transactions: Transaction[] = [];
export let chats: Chat[] = [];
export let botUsers: BotUser[] = [];
export let settings: Settings = {
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
  socialInstagram: 'https://instagram.com/digital_store',
  socialTelegram: 'https://t.me/digital_store',
  socialWhatsapp: 'https://wa.me/989123456789',
  socialBale: 'https://ble.ir/digital_store',
  socialX: 'https://x.com/digital_store',
  registrationMethod: 'both',
  contactPhone: '۰۹۱۲۳۴۵۶۷۸۹',
  contactEmail: 'info@digitalstore.com',
  contactAddress: 'تهران، خیابان ولیعصر، برج فناوری دیجیتال، طبقه ۵',
  heroVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-40134-large.mp4',
  onlinePaymentUrl: '',
  cardNo: '6037991823456789',
  cardHolder: 'محمدحسین علوی',
  cardBank: 'بانک ملی ایران',
  siteLogoUrl: '',
  onlinePaymentEnabled: true,
  cardPaymentEnabled: true,
  siteName: 'دیجیتال استور',
  heroTitle: 'مرجع تخصصی خرید اشتراک هوش مصنوعی و خدمات نوین دیجیتال',
  heroSubtitle: 'با ما، آینده همین امروز در دستان شماست. تحویل آنی و پشتیبانی ۲۴ ساعته واقعی.',
  servicesTitle: 'خدمات نوین و محصولات دیجیتال',
  servicesSubtitle: 'بهترین و باکیفیت‌ترین سرویس‌های پریمیوم را با خیال راحت تهیه کنید',
  deliveryTitle: 'تحویل آنی و مطمئن',
  deliveryDesc: 'تمام محصولات اکانت بلافاصله پس از پرداخت تحویل داده خواهند شد.',
  supportTitle: 'پشتیبانی ۲۴/۷ واقعی',
  supportDesc: 'پشتیبانی کامل و پاسخگویی به تمام تیکت‌ها و مشکلات شما در سریع‌ترین زمان ممکن.',
  paymentTitle: 'پرداخت امن و سریع',
  paymentDesc: 'پرداخت آنلاین از طریق درگاه‌های معتبر یا واریز مستقیم کارت به کارت با امکان ثبت رسید.',
  footerCopy: 'تمامی حقوق مادی و معنوی محفوظ است. توسعه داده شده برای تجارت مدرن شما.',
  enableHeroSection: true,
  enableFeaturesSection: true,
  enableProductsSection: true,
  enableStatsSection: true,
  enableVideoBackground: true
};

export const otps: Record<string, string> = {};
export const adminModeOverride: Record<number, 'user' | 'admin'> = {};
export const userCheckoutStates: Record<number, any> = {};

// Local Persistence Layer
const DB_FILE = path.join(process.cwd(), 'database.json');

export function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (data.groups) groups.splice(0, groups.length, ...data.groups);
      if (data.subGroups) subGroups.splice(0, subGroups.length, ...data.subGroups);
      if (data.products) products.splice(0, products.length, ...data.products);
      if (data.orders) orders.splice(0, orders.length, ...data.orders);
      if (data.users) users.splice(0, users.length, ...data.users);
      if (data.chats) chats.splice(0, chats.length, ...data.chats);
      if (data.settings) Object.assign(settings, data.settings);
      if (data.botUsers) botUsers.splice(0, botUsers.length, ...data.botUsers);
      if (data.tickets) tickets.splice(0, tickets.length, ...data.tickets);
      if (data.transactions) transactions.splice(0, transactions.length, ...data.transactions);
      console.log('Database loaded successfully');
    }
  } catch (err) {
    console.error('Error loading database:', err);
  }
}

export function saveDatabase() {
  try {
    const data = { groups, subGroups, products, orders, users, chats, settings, botUsers, tickets, transactions };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

// Utility functions
export function formatPriceToman(val: string | number): string {
  if (val === undefined || val === null || val === '') return '۰ تومان';
  let str = String(val).trim();
  
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  
  let normalized = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const pIdx = persianDigits.indexOf(char);
    const aIdx = arabicDigits.indexOf(char);
    if (pIdx !== -1) {
      normalized += pIdx.toString();
    } else if (aIdx !== -1) {
      normalized += aIdx.toString();
    } else {
      normalized += char;
    }
  }
  
  const cleanNumStr = normalized.replace(/[^\d]/g, '');
  if (!cleanNumStr) return '۰ تومان';
  
  const num = parseInt(cleanNumStr, 10);
  const englishFormatted = num.toLocaleString('en-US');
  
  let result = '';
  for (let i = 0; i < englishFormatted.length; i++) {
    const char = englishFormatted[i];
    if (char >= '0' && char <= '9') {
      result += persianDigits[parseInt(char, 10)];
    } else {
      result += char;
    }
  }
  
  return `${result} تومان`;
}

export function parsePrice(priceStr: string | number): number {
  if (!priceStr) return 0;
  let clean = String(priceStr)
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  clean = clean.replace(/\D/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}
