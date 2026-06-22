import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import fs from 'fs';

function formatPriceToman(val: string | number): string {
  if (!val) return '۰ تومان';
  const str = String(val);
  const normalized = str.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const cleanNumStr = normalized.replace(/[^\d]/g, '');
  if (!cleanNumStr) return str;
  const num = parseInt(cleanNumStr, 10);
  return `${num.toLocaleString('fa-IR')} تومان`;
}

function parsePrice(priceStr: string | number): number {
  if (!priceStr) return 0;
  let clean = String(priceStr)
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  clean = clean.replace(/\D/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}

// --- Mock Database ---
let groups = [
  { id: 1, title: 'اشتراک‌ها و اکانت‌ها', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60', active: true },
  { id: 2, title: 'خدمات طراحی اختصاصی', image: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=500&auto=format&fit=crop&q=60', active: true }
];

let subGroups = [
  { id: 11, groupId: 1, title: 'اکانت‌های هوش مصنوعی', image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=500&auto=format&fit=crop&q=60', active: true },
  { id: 12, groupId: 1, title: 'سرویس‌های شرکت اپل', image: 'https://images.unsplash.com/photo-1491933300451-c42917146e22?w=500&auto=format&fit=crop&q=60', active: true },
  { id: 21, groupId: 2, title: 'طراحی تخصصی وبسایت', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60', active: true },
  { id: 22, groupId: 2, title: 'ربات‌نویسی پیام‌رسان‌ها', image: 'https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?w=500&auto=format&fit=crop&q=60', active: true }
];

let products: any[] = [
  { id: 1, type: 'account' as const, category: 'apple', title: 'اپل آیدی اختصاصی', desc: 'با ایمیل دلخواه شما', price: '۳۵۰,۰۰۰ تومان', icon: 'Apple', image: 'https://images.unsplash.com/photo-1491933300451-c42917146e22?w=500&auto=format&fit=crop&q=60', active: true, groupId: 1, subGroupId: 12 },
  { id: 2, type: 'account' as const, category: 'ai', title: 'اکانت ChatGPT Plus', desc: 'دسترسی ۳۰ روزه به GPT-4', price: '۱,۴۵۰,۰۰۰ تومان', icon: 'Bot', image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=500&auto=format&fit=crop&q=60', active: true, groupId: 1, subGroupId: 11 },
  { id: 3, type: 'account' as const, category: 'ai', title: 'اکانت Midjourney', desc: 'اشتراک استاندارد', price: '۱,۸۰۰,۰۰۰ تومان', icon: 'Palette', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60', active: true, groupId: 1, subGroupId: 11 },
  { id: 4, type: 'service' as const, category: 'web', title: 'طراحی سایت شرکتی/فروشگاهی', desc: 'مدرن، ریسپانسیو و سئو شده', price: 'از ۱۰,۰۰۰,۰۰۰ تومان', icon: 'Globe', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60', active: true, groupId: 2, subGroupId: 21 },
  { id: 5, type: 'service' as const, category: 'bot', title: 'طراحی ربات تلگرام و بله', desc: 'فروشگاهی، پشتیبانی، مدیریت گروه', price: 'از ۳,۰۰۰,۰۰۰ تومان', icon: 'MessageCircle', image: 'https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?w=500&auto=format&fit=crop&q=60', active: true, groupId: 2, subGroupId: 22 },
  { id: 6, type: 'service' as const, category: 'app', title: 'ساخت اپلیکیشن اندروید', desc: 'نیتیو و کراس‌پلتفرم', price: 'از ۱۵,۰۰۰,۰۰۰ تومان', icon: 'Smartphone', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&auto=format&fit=crop&q=60', active: true, groupId: 2, subGroupId: 21 },
];

let orders: any[] = [
  { id: 1001, productId: 5, productTitle: 'طراحی ربات تلگرام و بله', productType: 'service' as const, userIdentifier: 'meh732@gmail.com', price: 'از ۳,۰۰۰,۰۰۰ تومان', status: 'pending' as const, createdAt: new Date().toISOString(), additionalDetails: 'نیاز به ربات پیشرفته فروشگاهی داریم' }
];

let users: any[] = [];
let tickets: any[] = [
  { 
    id: 2001, 
    userIdentifier: 'meh732@gmail.com', 
    title: 'درخواست راه اندازی دامنه اختصاصی', 
    body: 'سلام، لطفا دامنه جدید من را تعریف کنید تا بتوانم دیپلوی کنم.', 
    status: 'open', 
    priority: 'high', 
    createdAt: new Date().toISOString(), 
    replies: [
      { sender: 'user', text: 'سلام، لطفا دامنه جدید من را تعریف کنید تا بتوانم دیپلوی کنم.', createdAt: new Date().toISOString() },
      { sender: 'admin', text: 'سلام کاربر عزیز، پورت و نیم سرورهای دامنه را برای ما تیکت کنید یا آی‌آی‌پی سرور خود را بفرستید تا سریعاً فعال‌سازی انجام شود.', createdAt: new Date().toISOString() }
    ]
  }
];
let transactions: any[] = [
  { id: 3001, userIdentifier: 'meh732@gmail.com', amount: 500000, description: 'هدیه خوش‌آمدگویی و شارژ اولیه حساب', type: 'credit', createdAt: new Date().toISOString() }
];
let chats = [
  { id: 1, userId: 'user@example.com', messages: [{ sender: 'user', text: 'سلام، برای ربات تلگرام نیاز به مشاوره دارم.' }, { sender: 'admin', text: 'سلام! در خدمتیم. چه امکانی مد نظرتون هست؟' }] }
];
let settings = {
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
  registrationMethod: 'both', // 'both' | 'email_only' | 'phone_only'
  contactPhone: '۰۹۱۲۳۴۵۶۷۸۹',
  contactEmail: 'info@digitalstore.com',
  contactAddress: 'تهران، خیابان ولیعصر، برج فناوری دیجیتال، طبقه ۵',
  heroVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-40134-large.mp4',
  onlinePaymentUrl: 'https://zarinpal.com/digital_store',
  cardNo: '6037991823456789',
  cardHolder: 'محمدحسین علوی',
  cardBank: 'بانک ملی ایران',
  siteLogoUrl: ''
};
let botUsers: Array<{
  phone: string;
  telegramChatId?: number;
  baleChatId?: number;
}> = [];

// Local Persistence Layer
const DB_FILE = path.join(process.cwd(), 'database.json');

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (data.groups) groups = data.groups;
      if (data.subGroups) subGroups = data.subGroups;
      if (data.products) products = data.products;
      if (data.orders) orders = data.orders;
      if (data.users) users = data.users;
      if (data.chats) chats = data.chats;
      if (data.settings) settings = { ...settings, ...data.settings };
      if (data.botUsers) botUsers = data.botUsers;
      if (data.tickets) tickets = data.tickets;
      if (data.transactions) transactions = data.transactions;
      console.log('Database loaded successfully from database.json');
    }
  } catch (err) {
    console.error('Error loading database.json:', err);
  }
}

function saveDatabase() {
  try {
    const data = { groups, subGroups, products, orders, users, chats, settings, botUsers, tickets, transactions };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database.json:', err);
  }
}

// Load initial database
loadDatabase();

// Temp store for OTPs
const otps: Record<string, string> = {};

// Helper: Make requests to Telegram or Bale API
async function botRequest(apiHost: string, token: string, method: string, body?: any) {
  try {
    if (body && method === 'sendMessage' && !body.parse_mode) {
      body.parse_mode = 'Markdown';
    }
    const response = await fetch(`${apiHost}/bot${token}/${method}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (err) {
    return null;
  }
}

// Active polling states
let telegramOffset = 0;
let baleOffset = 0;

async function pollTelegram() {
  if (!settings.telegramToken) {
    setTimeout(pollTelegram, 4000);
    return;
  }
  try {
    const res: any = await botRequest(
      'https://api.telegram.org',
      settings.telegramToken,
      `getUpdates?offset=${telegramOffset}&timeout=3`
    );
    if (res && res.ok && res.result && res.result.length > 0) {
      for (const update of res.result) {
        telegramOffset = update.update_id + 1;
        await handleBotUpdate('telegram', update);
      }
    }
  } catch (e) {
    console.error('Telegram polling error:', e);
  }
  setTimeout(pollTelegram, 1000);
}

async function pollBale() {
  if (!settings.baleToken) {
    setTimeout(pollBale, 4000);
    return;
  }
  try {
    const res: any = await botRequest(
      'https://tapi.bale.ai',
      settings.baleToken,
      `getUpdates?offset=${baleOffset}&timeout=3`
    );
    if (res && res.ok && res.result && res.result.length > 0) {
      for (const update of res.result) {
        baleOffset = update.update_id + 1;
        await handleBotUpdate('bale', update);
      }
    }
  } catch (e) {
    console.error('Bale polling error:', e);
  }
  setTimeout(pollBale, 1000);
}

// Active states for checkout flow and admin panel overrides
const userCheckoutStates: Record<string, any> = {};
const adminModeOverride: Record<string, 'admin' | 'user'> = {};

// Helper to check user membership in Telegram or Bale channel (Mandatory Join check)
async function isUserMemberOfChannel(platform: 'telegram' | 'bale', botToken: string, channel: string, userId: number): Promise<boolean> {
  if (!botToken || !channel) return true; // fail-safe
  const apiHost = platform === 'telegram' ? 'https://api.telegram.org' : 'https://tapi.bale.ai';
  try {
    const formattedChannel = channel.trim().startsWith('@') ? channel.trim() : (channel.trim().startsWith('-') ? channel.trim() : `@${channel.trim()}`);
    const checkUrl = `${apiHost}/bot${botToken}/getChatMember`;
    const response = await fetch(checkUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: formattedChannel,
        user_id: userId
      })
    });
    if (!response.ok) {
      console.warn(`getChatMember responded with error status ${response.status} on ${platform}`);
      return false;
    }
    const data: any = await response.json();
    if (data && data.ok && data.result) {
      const status = data.result.status;
      return ['creator', 'administrator', 'member', 'restricted'].includes(status);
    }
    return false;
  } catch (err) {
    console.error(`Error checking channel membership on ${platform}:`, err);
    return true; // fail-open so bot remains accessible on errors
  }
}

// Helper to send JSON backup as a document
async function sendBotDocument(apiHost: string, token: string, chatId: number, filename: string, content: string) {
  try {
    const formData = new FormData();
    formData.append('chat_id', chatId.toString());
    const blob = new Blob([content], { type: 'application/json' });
    formData.append('document', blob, filename);
    
    const res = await fetch(`${apiHost}/bot${token}/sendDocument`, {
      method: 'POST',
      body: formData
    });
    return res.ok;
  } catch (err) {
    console.error('Error sending bot document:', err);
    return false;
  }
}

// Process incoming bot chat messages
async function handleBotUpdate(platform: 'telegram' | 'bale', update: any) {
  let isCallback = false;
  let callbackQueryId = '';
  let callbackData = '';

  let message = update.message || update.edited_message;
  if (update.callback_query) {
    isCallback = true;
    callbackQueryId = update.callback_query.id;
    callbackData = update.callback_query.data;
    message = update.callback_query.message;
  }

  if (!message) return;

  const chat = message.chat;
  if (!chat || !chat.id) return;

  let text = message.text ? message.text.trim() : '';
  if (isCallback && callbackData) {
    text = callbackData;
  }

  const contact = message.contact;
  const platformName = platform === 'telegram' ? 'تلگرام' : 'بله';
  const apiHost = platform === 'telegram' ? 'https://api.telegram.org' : 'https://tapi.bale.ai';
  const token = platform === 'telegram' ? settings.telegramToken : settings.baleToken;

  function reply(textMsg: string, replyMarkup?: any) {
    return botRequest(apiHost, token, 'sendMessage', {
      chat_id: chat.id,
      text: textMsg,
      reply_markup: replyMarkup
    });
  }

  // Answer callback queries to resolve client loading spinner
  if (isCallback && callbackQueryId) {
    try {
      await botRequest(apiHost, token, 'answerCallbackQuery', {
        callback_query_id: callbackQueryId
      }).catch(err => console.error('Error answering callback:', err));
    } catch (e) {
      // Ignored
    }
  }

  // Determine if sender is Admin based on Telegram/Bale specific settings or fallback
  const isAdmin = 
    (platform === 'telegram' && settings.adminTelegramChatId && String(chat.id) === String(settings.adminTelegramChatId)) ||
    (platform === 'bale' && settings.adminBaleChatId && String(chat.id) === String(settings.adminBaleChatId)) ||
    (settings.adminIdNumber && String(chat.id) === String(settings.adminIdNumber));

  // Default mode for Admin is 'admin' unless they override it to act as 'user'
  const currentMode = isAdmin ? (adminModeOverride[chat.id] || 'admin') : 'user';

  // Keyboards Def
  const adminKeyboard = {
    keyboard: [
      [{ text: "📊 وضعیت سیستم" }, { text: "💾 دانلود بکاپ کلی" }],
      [{ text: "📦 مدیریت سفارشات" }, { text: "🛍️ مدیریت محصولات" }],
      [{ text: "🔐 فعال/غیرفعال‌سازی لاگین موبایل" }, { text: "👤 سوییچ به پنل کاربری" }]
    ],
    resize_keyboard: true
  };

  const getUserKeyboard = (isAdminUser: boolean) => {
    const kb = [
      [{ text: "🛒 لیست محصولات و خدمات" }, { text: "📦 پیگیری سفارشات من" }],
      [{ text: "💰 موجودی و شارژ حساب" }, { text: "🔑 دریافت کد دو مرحله‌ای ورود" }],
      [{ text: "💬 ارتباط با پشتیبانی" }]
    ];
    if (isAdminUser) {
      kb.push([{ text: "⚙️ برگشت به پنل مدیریت" }]);
    }
    return { keyboard: kb, resize_keyboard: true };
  };

  const registerKeyboard = {
    keyboard: [
      [{ text: "ارسال شماره موبایل 📱", request_contact: true }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  };

  // --- MANDATORY CHANNEL JOIN CHECK ---
  const isChannelCheckEnabled = platform === 'telegram' 
    ? (settings.enableTelegramJoinCheck && settings.telegramJoinChannel) 
    : (settings.enableBaleJoinCheck && settings.baleJoinChannel);

  const targetChannel = platform === 'telegram' ? settings.telegramJoinChannel : settings.baleJoinChannel;

  if (isChannelCheckEnabled && !isAdmin) {
    const tokenToCheck = platform === 'telegram' ? settings.telegramToken : settings.baleToken;
    const isMember = await isUserMemberOfChannel(platform, tokenToCheck, targetChannel, chat.id);
    
    if (!isMember) {
      const channelUsername = targetChannel.replace('@', '');
      const channelLink = platform === 'telegram' 
        ? `https://t.me/${channelUsername}` 
        : `https://ble.ir/${channelUsername}`;

      const joinPrompt = `⚠️ **عضویت اجباری در کانال دیجیتال استور**\n\nبرای استفاده از خدمات این ربات، ابتدا باید در کانال اختصاصی ما عضو شوید.\n\n📢 آیدی کانال: ${targetChannel}\n\nلطفاً پس از عضویت در کانال، دکمه **«تایید عضویت ✅»** زیر را فشار دهید:`;

      const joinKeyboard = {
        inline_keyboard: [
          [{ text: "📢 ورود به کانال", url: channelLink }],
          [{ text: "تایید عضویت ✅", callback_data: "check_membership" }]
        ]
      };

      if (text === 'check_membership') {
        await reply(`❌ هنوز عضو کانال نشده‌اید! لطفاً ابتدا عضو شده و مجدداً تلاش کنید.`, joinKeyboard);
      } else {
        await reply(joinPrompt, joinKeyboard);
      }
      return;
    } else {
      if (text === 'check_membership') {
        const userMap = botUsers.find(u => 
          (platform === 'telegram' && u.telegramChatId === chat.id) || 
          (platform === 'bale' && u.baleChatId === chat.id)
        );
        await reply(`🎉 با تشکر! عضویت شما در کانال تایید شد. اکنون می‌توانید از ربات استفاده کنید.`);
        if (!userMap) {
          await reply(
            `برای همگام‌سازی سریع حساب و دریافت لحظه‌ای کدهای تایید در پیام‌رسان ${platformName}، لطفا شماره تلفن ۱۱ رقمی خود را تایپ کنید (مثلاً: 09123456789) یا دکمه زیر را جهت ارسال شماره فشار دهید:`,
            registerKeyboard
          );
        } else {
          await reply(`🛍️ منوی کامل فروشگاه فعال است:`, getUserKeyboard(false));
        }
        return;
      }
    }
  }

  // --- ADMIN COMMANDS INTERFACE ---
  if (isAdmin && currentMode === 'admin') {
    if (text === '/start' || text.toLowerCase() === 'سلام' || text === '⚙️ برگشت به پنل مدیریت') {
      adminModeOverride[chat.id] = 'admin'; // ensure reset
      await reply(
        `سلام مدیر محترم! 👑\nبه پنل ارشد مدیریت ربات هوشمند دیجیتال استور خوش آمدید.\n\nشما به بخش تنظیمات زنده، دریافت فاکتورها، و پشتیبان‌گیری کل سرور دسترسی مستقیم دارید.\n\nلطفاً از دکمه‌های کنترل هوشمند زیر استفاده کنید:`,
        adminKeyboard
      );
      return;
    }

    if (text === "📊 وضعیت سیستم") {
      const testNumber = (str: string) => {
        const cleanNum = str.replace(/[^\d]/g, '');
        return parseInt(cleanNum, 10) || 0;
      };
      const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + testNumber(o.price), 0);
      const pendingCount = orders.filter(o => o.status === 'pending').length;
      
      const statsText = 
        `📊 **گزارش لحظه‌ای وضعیت سیستم دیجیتال استور** 📊\n\n` +
        `💰 **کل فروش تایید شده**: ${totalRevenue.toLocaleString('fa-IR')} تومان\n` +
        `⏳ **سفارشات در انتظار بررسی**: ${pendingCount} عدد\n` +
        `📦 **تعداد کل فاکتورها**: ${orders.length} عدد\n` +
        `👥 **کاربران همگام شده با ربات‌ها**: ${botUsers.length} نفر\n` +
        `🛍️ **تعداد محصولات فعال**: ${products.filter(p => p.active !== false).length} از ${products.length} محصول\n` +
        `🔐 **وضعیت لاگین دو مرحله‌ای پیام‌رسان**: ${settings.enableMobileLogin ? '🟢 فعال' : '🔴 غیرفعال'}`;
      
      await reply(statsText, adminKeyboard);
      return;
    }

    if (text === "💾 دانلود بکاپ کلی") {
      await reply("⏳ در حال آماده‌سازی و ارسال فایل پشتیبان پایگاه داده...", adminKeyboard);
      const backupContent = JSON.stringify({ products, orders, users, chats, settings, botUsers, timestamp: new Date() }, null, 2);
      const success = await sendBotDocument(apiHost, token, chat.id, `digital_store_backup_${Date.now()}.json`, backupContent);
      if (!success) {
        await reply("❌ خطا در ارسال فایل بکاپ رخ داد. در حال ارسال ۱۰۰۰ کاراکتر اول به صورت متنی:\n\n" + backupContent.substring(0, 1000) + "\n...", adminKeyboard);
      } else {
        await reply("✅ فایل بکاپ کامل (.json) با موفقیت ارسال شد.", adminKeyboard);
      }
      return;
    }

    if (text === "🔐 فعال/غیرفعال‌سازی لاگین موبایل") {
      settings.enableMobileLogin = !settings.enableMobileLogin;
      saveDatabase();
      await reply(
        `🔐 وضعیت ورود دو مرحله‌ای موبایل در کل سیستم همگام شد.\n\nوضعیت جدید: ${settings.enableMobileLogin ? '🟢 فعال (کاربران مجاز به دریافت کد هستند)' : '🔴 غیرفعال (ارسال پیامک/کد مسدود شد)'}`,
        adminKeyboard
      );
      return;
    }

    if (text === "👤 سوییچ به پنل کاربری") {
      adminModeOverride[chat.id] = 'user';
      await reply(
        `👤 با موفقیت به نمای کاربری سوییچ کردید.\n\nاکنون می‌توانید منوی سفارشات، فاکتورهای فروشگاه و دریافت کدهای تایید را عینا مشابه خریداران تست نمایید.`,
        getUserKeyboard(true)
      );
      return;
    }

    if (text === "📦 مدیریت سفارشات") {
      const pendingOrders = orders.filter(o => o.status === 'pending');
      if (pendingOrders.length === 0) {
        await reply("✅ هیچ سفارش در انتظار بررسی وجود ندارد.", adminKeyboard);
      } else {
        const keyboard = pendingOrders.slice(0, 5).map(o => [
            { text: `📦 #${o.id} - ${o.productTitle}`, callback_data: `admin_order_${o.id}` }
        ]);
        await reply(`📦 تعداد ${pendingOrders.length} سفارش در انتظار بررسی است.\nبرای مدیریت روی سفارش کلیک کنید:`, { inline_keyboard: keyboard });
      }
      return;
    }

    if (text === "🛍️ مدیریت محصولات") {
        const keyboard = products.map(p => [
            { text: `${p.active !== false ? '✅' : '❌'} ${p.title}`, callback_data: `admin_prod_${p.id}` }
        ]);
        await reply(`🛍️ لیست محصولات:\nبرای تغییر وضعیت، روی محصول کلیک کنید:`, { inline_keyboard: keyboard });
        return;
    }

    // --- Admin Callback Handlers ---
    if (text.startsWith('admin_order_') || text.startsWith('approve_order_') || text.startsWith('reject_order_') || text.startsWith('admin_prod_')) {
      if (text.startsWith('admin_order_')) {
          const orderId = parseInt(text.split('_')[2], 10);
          const order = orders.find(o => o.id === orderId);
          if (!order) { await reply("سفارش یافت نشد."); return; }
          
          await reply(`📦 سفارش شماره #${order.id}\nمحصول: ${order.productTitle}\nکاربر: ${order.userIdentifier}\nوضعیت: ${order.status}\nتوضیحات: ${order.additionalDetails || 'ندارد'}`, {
              inline_keyboard: [
                  [{ text: '✅ تایید', callback_data: `approve_order_${orderId}` }, { text: '❌ رد', callback_data: `reject_order_${orderId}` }]
              ]
          });
          return;
      }
      if (text.startsWith('approve_order_')) {
          const orderId = parseInt(text.split('_')[2], 10);
          const order = orders.find(o => o.id === orderId);
          if (order) { order.status = 'approved'; saveDatabase(); await reply(`✅ سفارش #${orderId} تایید شد.`); }
          return;
      }
      if (text.startsWith('reject_order_')) {
          const orderId = parseInt(text.split('_')[2], 10);
          const order = orders.find(o => o.id === orderId);
          if (order) { order.status = 'rejected'; saveDatabase(); await reply(`❌ سفارش #${orderId} رد شد.`); }
          return;
      }
      if (text.startsWith('admin_prod_')) {
          const prodId = parseInt(text.split('_')[2], 10);
          const prod = products.find(p => p.id === prodId);
          if (!prod) { await reply("محصول یافت نشد."); return; }
          
          prod.active = prod.active === false ? true : false;
          saveDatabase();
          await reply(`✅ وضعیت محصول "${prod.title}" به ${prod.active ? 'فعال' : 'غیرفعال'} تغییر یافت.`);
          return;
      }
      return;
    }

    // Admin general support command / interactive guide
    await reply(
      `مدیر گرامی، دستور "${text}" شناسایی نشد.\n\nلطفاً از دکمه‌های ناوبری زیر سیستم استفاده کنید:`,
      adminKeyboard
    );
    return;
} // admin mode ends
  }

  // --- REGULAR USER / CUSTOMER FLOWS WITH ACTIVE STORE MENU ---

  // Helper check: Is this chat registered with a phone number?
  const userMap = botUsers.find(u => 
    (platform === 'telegram' && u.telegramChatId === chat.id) || 
    (platform === 'bale' && u.baleChatId === chat.id)
  );

  // Handle Shared Contact Registration
  if (contact && contact.phone_number) {
    let rawPhone = contact.phone_number;
    let phone = rawPhone.replace(/\D/g, '');
    if (phone.startsWith('98')) {
      phone = '0' + phone.substring(2);
    } else if (!phone.startsWith('0')) {
      phone = '0' + phone;
    }

    let newUser = botUsers.find(u => u.phone === phone);
    if (!newUser) {
      newUser = { phone };
      botUsers.push(newUser);
    }
    if (platform === 'telegram') {
      newUser.telegramChatId = chat.id;
    } else {
      newUser.baleChatId = chat.id;
    }

    saveDatabase();

    await reply(
      `✅ شماره تلفن شما (${phone}) با موفقیت به سیستم متمرکز دیجیتال استور متصل شد.\n\n🛍️ منوی کامل فروشگاه، فاکتورهای من و خدمات آنلاین اکنون برای شما آماده و فعال است!`,
      getUserKeyboard(isAdmin)
    );
    return;
  }

  // Handle Raw Phone typing registration
  const phoneRegex = /^(09\d{9})$/;
  const match = text.match(phoneRegex);
  if (match) {
    const phone = match[1];
    let newUser = botUsers.find(u => u.phone === phone);
    if (!newUser) {
      newUser = { phone };
      botUsers.push(newUser);
    }
    if (platform === 'telegram') {
      newUser.telegramChatId = chat.id;
    } else {
      newUser.baleChatId = chat.id;
    }

    saveDatabase();

    await reply(
      `✅ شماره تلفن شما (${phone}) با موفقیت ارزیابی و ثبت شد.\n\n🛍️ منوی کامل فروشگاه، فاکتورها و دریافت هوشمند کد تایید برای شما باز شد.`,
      getUserKeyboard(isAdmin)
    );
    return;
  }

  // If user is NOT registered, they must send their phone first
  if (!userMap) {
    await reply(
      `سلام! به ربات پشتیبانی و احراز هویت هوشمند دیجیتال استور خوش آمدید. 👋\n\nبرای همگام‌سازی سریع حساب و دریافت لحظه‌ای کدهای تایید در پیام‌رسان ${platformName}، لطفا شماره تلفن ۱۱ رقمی خود را تایپ کنید (مثلاً: 09123456789) یا دکمه زیر را جهت ارسال شماره فشار دهید:`,
      registerKeyboard
    );
    return;
  }

  // --- REGISTERED USERS' INTERACTIVE CLIENT (THE ACTUAL STORE MENU) ---

  // Handle Switch Back to Admin Panel if they are an admin
  if (isAdmin && text === '⚙️ برگشت به پنل مدیریت') {
    adminModeOverride[chat.id] = 'admin';
    await reply(`⚙️ با موفقیت به پنل مدیریت ارشد بازگشتید.`, adminKeyboard);
    return;
  }

  // Check 1: User selection is '🛒 لیست محصولات و خدمات'
  if (text === '🛒 لیست محصولات و خدمات' || text.toLowerCase() === 'فروشگاه' || text === '/shop') {
    const activeProducts = products.filter(p => p.active !== false);
    if (activeProducts.length === 0) {
      await reply("⚠️ در حال حاضر هیچ محصول فعالی در فروشگاه ثبت نشده است. به زودی محصولات جدید اضافه خواهند شد.", getUserKeyboard(isAdmin));
      return;
    }

    let shopMsg = `🛒 **لیست محصولات و خدمات فعال دیجیتال استور** 🛒\n\n`;
    activeProducts.forEach((p, idx) => {
      const typeFa = p.type === 'account' ? 'اکانت اشتراکی / اختصاصی' : 'خدمات توسعه و طراحی زنده';
      shopMsg += `🔹 ${idx + 1}. **${p.title}** (${typeFa})\n`;
      if (p.desc) shopMsg += `📝 توضیحات: *${p.desc}*\n`;
      shopMsg += `💰 قیمت: **${p.price}**\n`;
      shopMsg += `------------------------------------\n`;
    });
    shopMsg += `\n💡 جهت ثبت سفارش فوری، کافیست روی نام محصول در دکمه‌های شیشه‌ای زیر ضربه بزنید یا کد شناسه محصول را برای ربات بفرستید.`;
    
    // Glassy Inline Keyboard Menu
    const inline_keyboard = activeProducts.map(p => [
      { text: `🛍️ سفارش ${p.title} (${p.price})`, callback_data: `buy_${p.id}` }
    ]);

    await reply(shopMsg, {
      inline_keyboard,
      resize_keyboard: true
    });
    return;
  }

  // Check 2: User selection is '📦 پیگیری سفارشات من'
  if (text === '📦 پیگیری سفارشات من' || text === '/orders') {
    const userOrders = orders.filter(o => o.userIdentifier === userMap.phone);
    if (userOrders.length === 0) {
      await reply(
        `⚠️ خریدار گرامی، شما تاکنون هیچ سفارشی در سیستم ثبت نکرده‌اید.\n\nمی‌توانید همین حالا محصولات فعال را از دکمه "🛒 لیست محصولات و خدمات" مجدداً بازبینی و سفارش دهید.`,
        getUserKeyboard(isAdmin)
      );
      return;
    }

    let ordersMsg = `📦 **لیست سفارشات و فاکتورهای شما با تلفن ${userMap.phone}**:\n\n`;
    userOrders.forEach(o => {
      const statusFa = o.status === 'completed' ? 'تکمیل و تحویل شده ✅' : o.status === 'canceled' ? 'لغو شده ❌' : 'در انتظار اقدام مدیریت ⏳';
      ordersMsg += `🆔 کد فاکتور: #${o.id}\n`;
      ordersMsg += `📦 محصول فرعی: **${o.productTitle}**\n`;
      ordersMsg += `💰 مبلغ فاکتور: ${o.price}\n`;
      ordersMsg += `📊 وضعیت سفارش: ${statusFa}\n`;
      ordersMsg += `📅 ثبت شده در: ${new Date(o.createdAt).toLocaleDateString('fa-IR')}\n`;
      if (o.additionalDetails) {
        ordersMsg += `📝 جزئیات ارسال شده شما: ${o.additionalDetails}\n`;
      }
      ordersMsg += `------------------------------------\n`;
    });

    await reply(ordersMsg, getUserKeyboard(isAdmin));
    return;
  }

  // --- Photo/Document Photo Receipt Checking ---
  const photo = message.photo || (message.document && message.document.mime_type?.startsWith('image/') ? [message.document] : null);
  if (photo && photo.length > 0) {
    const fileId = message.photo ? photo[photo.length - 1].file_id : message.document.file_id;
    let reqAmount = 0;
    if (userCheckoutStates[chat.id] && userCheckoutStates[chat.id].pendingTopupAmount) {
      reqAmount = userCheckoutStates[chat.id].pendingTopupAmount;
      delete userCheckoutStates[chat.id].pendingTopupAmount;
    }

    const newTrans = {
      id: 3000 + transactions.length + 1,
      userIdentifier: userMap.phone,
      amount: reqAmount,
      description: `رسید کارت به کارت ارسالی از بات ${platformName}`,
      type: 'credit' as const,
      status: 'pending' as const,
      receiptImage: `file_id_${fileId}`,
      createdAt: new Date().toISOString()
    };
    transactions.push(newTrans);
    saveDatabase();
    
    await reply(
      `📸 **رسید تصویری شما دریافت شد!**\n\n` +
      `این رسید با شناسه پیگیری #${newTrans.id} ثبت شد.\n` +
      `💰 امور مالی در اسرع وقت فیش واریزی را بررسی کرده و کیف پول شما را شارژ خواهد کرد.\n\n` +
      `از پرداخت شما صمیمانه سپاسگزاریم! 🙏`,
      getUserKeyboard(isAdmin)
    );
    
    const adminMsg = `📸 **رسید بانکی تصویری جدید از بات ${platformName}!**\n\n👤 فرستنده (تلفن): ${userMap.phone}\n💰 مبلغ درخواستی: ${reqAmount > 0 ? reqAmount.toLocaleString('fa-IR') + ' تومان' : 'نامشخص'}\n🆔 شناسه تراکنش: #${newTrans.id}\n\nجهت بررسی و تایید/رد تراکنش به پنل ادمین مراجعه نمایید.`;
    
    // Admin Inline Keyboard
    const adminInlineKeyboard = [
      [
        { text: '✅ تایید', callback_data: `approve_trans_${newTrans.id}` },
        { text: '❌ رد', callback_data: `reject_trans_${newTrans.id}` }
      ]
    ];

    if (settings.adminTelegramChatId && settings.telegramToken) {
      botRequest('https://api.telegram.org', settings.telegramToken, 'sendPhoto', { 
        chat_id: settings.adminTelegramChatId, 
        photo: fileId,
        caption: adminMsg,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: adminInlineKeyboard } 
      });
    }
    if (settings.adminBaleChatId && settings.baleToken) {
      botRequest('https://tapi.bale.ai', settings.baleToken, 'sendPhoto', { 
        chat_id: settings.adminBaleChatId, 
        photo: fileId, 
        caption: adminMsg,
        reply_markup: { inline_keyboard: adminInlineKeyboard }
      });
    }
    return;
  }

  // --- Textual Receipt Parsing ---
  if (text.startsWith('رسید ') || text.startsWith('واریز ')) {
    const parts = text.split(/\s+/);
    const amountPart = parts[1] || '';
    const namePart = parts.slice(2).join(' ') || 'پیگیری رسید دستی';
    const amountVal = parseInt(amountPart.replace(/[^\d]/g, ''), 10) || 0;
    
    const newTrans = {
      id: 3000 + transactions.length + 1,
      userIdentifier: userMap.phone,
      amount: amountVal,
      cardHolderName: namePart,
      description: `ثبت رسید متنی کارت به کارت: واریزی ${amountVal.toLocaleString('fa-IR')} تومان توسط ${namePart}`,
      type: 'credit',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    transactions.push(newTrans);
    saveDatabase();
    
    await reply(
      `✅ **اطلاعات رسید متنی شما ثبت شد!**\n\n` +
      `🆔 شناسه پیگیری: #${newTrans.id}\n` +
      `💰 مبلغ اعلامی: ${amountVal.toLocaleString('fa-IR')} تومان\n` +
      `👤 نام پرداخت کننده: ${namePart}\n\n` +
      `سند واریزی شما جهت بررسی و تطبیق حساب برای امور مالی ارسال شد. به محض فعال‌سازی موجودی، به شما اطلاع‌رسانی می‌شود.`,
      getUserKeyboard(isAdmin)
    );
    
    const adminMsg = `💸 **رسید متنی جدید جهت تایید کارت به کارت!**\n\n👤 فرستنده (تلفن): ${userMap.phone}\n💰 مبلغ: ${amountVal.toLocaleString('fa-IR')} تومان\n💳 واریزکننده: ${namePart}\n🆔 شناسه: #${newTrans.id}\n\nوارد پنل مدیریت شده و پس از اعتبارسنجی تایید نمایید.`;
    if (settings.adminTelegramChatId && settings.telegramToken) {
      botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: settings.adminTelegramChatId, text: adminMsg });
    }
    if (settings.adminBaleChatId && settings.baleToken) {
      botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: settings.adminBaleChatId, text: adminMsg });
    }
    return;
  }

  // --- Wallet Query & Top-up Instructions ---
  if (text === '💰 موجودی و شارژ حساب' || text === '/wallet') {
    const userObj = users.find(u => u.phone === userMap.phone);
    const balance = userObj?.walletBalance || 0;
    
    const walletText = 
      `💳 **بخش مدیریت مالی و کیف پول شما** 💳\n\n` +
      `👤 حساب کاربری: **${userMap.phone}**\n` +
      `💰 موجودی فعلی: **${balance.toLocaleString('fa-IR')} تومان**\n\n` +
      `💡 جهت شارژ کیف پول، روش مورد نظر خود را انتخاب نمایید:`;

    const topupButtons = [
      [{ text: `💳 شارژ آنلاین (درگاه)`, callback_data: `start_topup_online` }],
      [{ text: `🏦 شارژ کارت به کارت`, callback_data: `start_topup_card` }]
    ];
    
    await reply(walletText, { inline_keyboard: topupButtons });
    return;
  }

  // Check 3: User selection is '🔑 دریافت کد دو مرحله‌ای ورود'
  if (text === '🔑 دریافت کد دو مرحله‌ای ورود' || text === '/otp') {
    const tokenOtp = Math.floor(1000 + Math.random() * 9000).toString();
    otps[userMap.phone] = tokenOtp;
    await reply(
      `🔑 **کد تایید دو مرحله‌ای ورود به سایت دیجیتال استور**\n\n` +
      `کد تایید شما: \`${tokenOtp}\`\n\n` +
      `این کد تا حداکثر ۲ دقیقه دیگر اعتبار دارد.\nشما می‌توانید این کد را در فیلد ورود با شماره موبایل سایت وارد نمایید.`,
      getUserKeyboard(isAdmin)
    );
    return;
  }

  // Check 4: User selection is '💬 ارتباط با پشتیبانی'
  if (text === '💬 ارتباط با پشتیبانی' || text === '/support') {
    await reply(
      `💬 **بخش گفتگوی مستقیم با پشتیبانی**\n\n` +
      `لطفاً در پیام بعدی، سوال، پیشنهاد یا هر پرسشی که دارید را بنویسید.\n` +
      `پیام شما مستقیماً به تیکت‌های پنل مدیریت فرستاده شده و به محض پاسخ کارشناس، جواب آن را همین‌جا به صورت زنده دریافت خواهید کرد.`,
      getUserKeyboard(isAdmin)
    );
    return;
  }

  // Check 5: Active Details Collection Sequence
  if (userCheckoutStates[chat.id]) {
    const state = userCheckoutStates[chat.id];

    // Handle Amount Input for Topup
    if (state.pendingTopupType) {
        const amount = parseInt(text.replace(/[^0-9]/g, ''), 10);
        if (isNaN(amount) || amount <= 0) {
            await reply("❌ مبلغ وارد شده نامعتبر است. لطفاً مبلغ را به صورت عدد به تومان وارد کنید:");
            return;
        }

        if (state.pendingTopupType === 'online') {
            await reply(
                `💳 **شارژ آنلاین**\n\n` +
                `مبلغ: ${amount.toLocaleString('fa-IR')} تومان\n` +
                `جهت انجام پرداخت، به درگاه بانکی زیر مراجعه کنید:\n` +
                `${settings.onlinePaymentUrl || 'آدرس پرداخت تعریف نشده'}\n\n` +
                `پس از پرداخت موفقیت‌آمیز، در صورت تنظیم درگاه، حساب شما اتومات شارژ می‌شود.`
            );
            const simulationButtons = [
                [{ text: `✅ [شبیه‌ساز] پرداخت موفق`, callback_data: `topuponline_${amount}` }]
            ];
            await reply("یا برای شبیه‌سازی تایید پرداخت:", { inline_keyboard: simulationButtons });
        } else {
            await reply(
                `🏦 **شارژ کارت به کارت**\n\n` +
                `مبلغ: ${amount.toLocaleString('fa-IR')} تومان\n` +
                `لطفاً به کارت زیر واریز کنید:\n` +
                `${settings.cardNo || 'شماره کارت تعریف نشده'}\n\n` +
                `پس از واریز، تصویر رسید را ارسال کنید تا ادمین تایید کند.`
            );
            state.pendingTopupAmount = amount;
        }
        return;
    }

    if (state.orderId) {
        const orderId = state.orderId;
        
        if (text === 'لغو' || text === 'انصراف' || text === 'منصرف شدم') {
        delete userCheckoutStates[chat.id];
        await reply("❌ ثبت جزئیات متوقف شد. فاکتور شما ثبت شده است و بدون توضیحات باقی ماند. به منوی اصلی بازگشتیم.", getUserKeyboard(isAdmin));
        return;
        }

        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
        orders[orderIndex].additionalDetails = (orders[orderIndex].additionalDetails || '') + ` | توضیحات خریدار: ${text}`;
        saveDatabase();
        }
        delete userCheckoutStates[chat.id];
        
        await reply(
        `✅ **توضیحات شما برای سفارش #${orderId} با موفقیت ثبت شد.**\n\n` +
        `سفارش شما در اسرع وقت انجام خواهد شد. ممنون از اعتماد شما!`,
        getUserKeyboard(isAdmin)
        );
        return;
    }
  }

  // --- Start Topup Flows ---
  if (text === 'start_topup_online' || text === 'start_topup_card') {
    const type = text === 'start_topup_online' ? 'online' : 'card';
    userCheckoutStates[chat.id] = { pendingTopupType: type };
    await reply(`لطفاً مبلغ مورد نظر خود را به تومان وارد کنید:`);
    return;
  }
  
  // Check: Topup action from inline keyboard (Callback queries for finalize)
  if (text.startsWith('topuponline_')) {
    if (!settings.onlinePaymentUrl || settings.onlinePaymentUrl.trim() === '') {
      await reply("❌ درگاه پرداخت آنلاین در حال حاضر غیرفعال می‌باشد.\nلطفاً از روش پرداخت کارت به کارت استفاده نمایید.");
      return;
    }

    const amount = parseInt(text.split('_')[1], 10);
    const userObj = users.find(u => u.phone === userMap.phone);
    if (userObj) {
      userObj.walletBalance = (userObj.walletBalance || 0) + amount;
      
      const newTrans = {
        id: 3000 + transactions.length + 1,
        userIdentifier: userMap.phone,
        amount: amount,
        description: `افزایش اعتبار آنلاین (شبیه‌ساز درگاه)`,
        type: 'credit' as const,
        status: 'approved' as const,
        createdAt: new Date().toISOString()
      };
      transactions.push(newTrans);
      saveDatabase();
      
      await reply(
        `✅ پرداخت آنلاین با موفقیت تأیید شد و مبلغ ${amount.toLocaleString('fa-IR')} تومان به کیف پول شما اضافه گردید.\n` +
        `اکنون می‌توانید خرید خود را ثبت کنید.`,
        getUserKeyboard(isAdmin)
      );
    }
    return;
  }

  if (text.startsWith('topupcard_')) {
    const amount = parseInt(text.split('_')[1], 10);
    userCheckoutStates[chat.id] = { pendingTopupAmount: amount };
    await reply(
      `🏦 **درخواست شارژ حساب از طریق کارت به کارت**\n\n` +
      `لطفاً مبلغ **${amount.toLocaleString('fa-IR')} تومان** را به شماره کارت زیر واریز نمایید:\n\n` +
      `💳 شماره کارت: \`${settings.cardNo || 'مشخص نشده'}\`\n` +
      `👤 بنام: **${settings.cardHolder || 'مشخص نشده'}**\n` +
      `🏦 بانک: *${settings.cardBank || 'مشخص نشده'}*\n\n` +
      `ثبت موقت درخواست شارژ انجام شد. لطفاً **تصویر رسید بانکی** خود را همینجا ارسال (آپلود) کنید.`
    );
    return;
  }

  if (text.startsWith('approve_trans_')) {
    const transId = parseInt(text.split('_')[2], 10);
    const trans = transactions.find(t => t.id === transId);
    if (!trans) {
       await reply('❌ تراکنش یافت نشد.');
       return;
    }
    if (trans.status !== 'pending') {
       await reply('⚠️ این تراکنش قبلاً تعیین وضعیت شده است.');
       return;
    }
    
    trans.status = 'approved';
    const user = users.find(u => u.phone === trans.userIdentifier);
    if (user) {
      user.walletBalance = (user.walletBalance || 0) + trans.amount;
    }
    saveDatabase();
    
    await reply(`✅ تراکنش #${trans.id} تایید شد و مبلغ ${trans.amount} به کیف پول کاربر اضافه گردید.`);
    
    const botUser = botUsers.find(b => b.phone === trans.userIdentifier);
    if (botUser) {
      const userMsg = `✅ **تایید افزایش اعتبار!**\n\nمبلغ **${trans.amount.toLocaleString('fa-IR')} تومان** با موفقیت توسط مدیریت تایید و به کیف پول شما واریز شد.\n\n💳 موجودی جدید شما: **${user?.walletBalance.toLocaleString('fa-IR')} تومان**`;
      if (botUser.telegramChatId) botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: botUser.telegramChatId, text: userMsg });
      if (botUser.baleChatId) botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: botUser.baleChatId, text: userMsg });
    }
    return;
  }
  
  if (text.startsWith('reject_trans_')) {
    const transId = parseInt(text.split('_')[2], 10);
    const trans = transactions.find(t => t.id === transId);
    if (!trans) {
       await reply('❌ تراکنش یافت نشد.');
       return;
    }
    if (trans.status !== 'pending') {
       await reply('⚠️ این تراکنش قبلاً تعیین وضعیت شده است.');
       return;
    }
    
    trans.status = 'rejected';
    saveDatabase();
    
    await reply(`❌ تراکنش #${trans.id} رد شد.`);
    
    const botUser = botUsers.find(b => b.phone === trans.userIdentifier);
    if (botUser) {
      const userMsg = `❌ **رد درخواست افزایش اعتبار**\n\nدرخواست شارژ حساب شما به مبلغ **${trans.amount.toLocaleString('fa-IR')} تومان** توسط مدیریت رد شد. در صورت هرگونه سوال با پشتیبانی در ارتباط باشید.`;
      if (botUser.telegramChatId) botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: botUser.telegramChatId, text: userMsg });
      if (botUser.baleChatId) botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: botUser.baleChatId, text: userMsg });
    }
    return;
  }

  // Check 5.5: Explicit Variations callback query selection
  if (text.startsWith('buyvar_')) {
    const parts = text.split('_');
    const prodId = parseInt(parts[1], 10);
    const varId = parts[2];
    
    const prod = products.find(p => p.id === prodId && p.active !== false);
    if (prod && prod.variations) {
      const selectedVar = prod.variations.find((v: any) => String(v.id) === String(varId));
      if (selectedVar) {
        
        const userObj = users.find(u => u.phone === userMap.phone);
        const balance = userObj?.walletBalance || 0;
        
        const priceInt = parsePrice(selectedVar.price);
        const priceStr = `${priceInt.toLocaleString('fa-IR')} تومان`;
        
        if (balance < priceInt) {
          const missingAmount = priceInt - balance;
          const topupInlineKeyboard = [
            [{ text: `💳 شارژ آنلاین (${missingAmount.toLocaleString('fa-IR')})`, callback_data: `topuponline_${missingAmount}` }],
            [{ text: `🏦 رویت اطلاعات کارت به کارت`, callback_data: `topupcard_${missingAmount}` }]
          ];
          await reply(
            `❌ **موجودی کیف پول برای این خرید کافی نیست!** ❌\n\n` +
            `📦 فاکتور انتخابی: **${prod.title} (پکیج ${selectedVar.duration})**\n` +
            `💰 مبلغ فاکتور: **${priceStr}**\n` +
            `💳 موجودی فعلی: **${balance.toLocaleString('fa-IR')} تومان**\n` +
            `🔹 **میزان کسری مجودی: ${missingAmount.toLocaleString('fa-IR')} تومان**\n\n` +
            `💡 لطفاً از طریق یکی از دکمه‌های زیر، موجودی خود را تأمین کنید:`,
            { inline_keyboard: topupInlineKeyboard }
          );
          return;
        }

        // Deduct and register order
        if (userObj) {
            userObj.walletBalance = balance - priceInt;
        }
        
        const orderDesc = `${selectedVar.duration} (${selectedVar.provider} - ${selectedVar.type})`;

        const newTrans = {
          id: 3000 + transactions.length + 1,
          userIdentifier: userMap.phone,
          amount: priceInt,
          description: `خرید ربات: پکیج ${selectedVar.duration} محصول ${prod.title}`,
          type: 'debit',
          createdAt: new Date().toISOString()
        };
        transactions.push(newTrans);

        const newOrder = {
          id: 1000 + orders.length + 1,
          productId: prod.id,
          productTitle: prod.title,
          productType: prod.type,
          userIdentifier: userMap.phone,
          price: priceStr,
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
          additionalDetails: `پکیج: ${orderDesc}`
        };
        orders.push(newOrder);
        saveDatabase();

        // Ask for details AFTER purchase
        userCheckoutStates[chat.id] = { orderId: newOrder.id };
        
        await reply(
          `🎉 **خرید شما با موفقیت تکمیل شد!**\n\n` +
          `✅ مبلغ **${priceStr}** از کیف پول دیجیتال کسر شد.\n` +
          `💳 مانده حساب جدید شما: **${userObj?.walletBalance.toLocaleString('fa-IR')} تومان**\n` +
          `🆔 فاکتور پیگیری: #${newOrder.id}\n\n` +
          `📝 **آیا توضیحات یا آدرس ایمیلی برای ثبت اکانت دارید؟**\n` +
          `لطفاً در قالب یک پیام برای ما ارسال کنید تا روی سفارش شما ثبت شود. (یا برای رد کردن کلمه لغو را بفرستید)`,
          getUserKeyboard(isAdmin)
        );

        // Notify administrator
        const adminMsg = `🟢 **سفارش جدید ربات!**\n\n📦 ${prod.title}\n👥 ${orderDesc}\n👤 کاربر: ${userMap.phone}\n💰 ${priceStr}`;
        if (settings.adminTelegramChatId && settings.telegramToken) {
          botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: settings.adminTelegramChatId, text: adminMsg });
        }
        if (settings.adminBaleChatId && settings.baleToken) {
          botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: settings.adminBaleChatId, text: adminMsg });
        }
        return;
      }
    }
  }

  // Check 6: Check if user input is an ID of a product or a text like "سفارش 2"
  let possibleProductId: number | null = null;
  const matchNum = text.replace(/[^0-9]/g, '');
  if (text.startsWith('buy_') || text.startsWith('سفارش') || text.startsWith('خرید') || text.startsWith('ID')) {
    const matchVal = text.match(/\d+/);
    if (matchVal) possibleProductId = parseInt(matchVal[0], 10);
  } else if (/^\d+$/.test(matchNum)) {
    possibleProductId = parseInt(matchNum, 10);
  }

  if (possibleProductId) {
    const prod = products.find(p => p.id === possibleProductId && p.active !== false);
    if (prod) {
      if (prod.variations && prod.variations.length > 0) {
        // Show variations as inline keyboard options for quick package selection
        const inline_keyboard = prod.variations.map((v: any) => [
          { text: `🛍️ ${v.duration} (${v.price.toLocaleString('fa-IR')} تومان)`, callback_data: `buyvar_${prod.id}_${v.id}` }
        ]);
        
        await reply(
          `🛒 **محصول "${prod.title}" دارای تعرفه‌ها و مدت‌زمان‌های متفاوت است:**\n\n` +
          `لطفاً پکیج فرعی مدنظر خود را از طریق دکمه‌های زیر انتخاب نمائید:`,
          { inline_keyboard }
        );
        return;
      }

      const priceInt = parsePrice(prod.price);
      const priceStr = `${priceInt.toLocaleString('fa-IR')} تومان`;
      
      const userObj = users.find(u => u.phone === userMap.phone);
      const balance = userObj?.walletBalance || 0;
      
      if (balance < priceInt) {
        const missingAmount = priceInt - balance;
        const topupInlineKeyboard = [
          [{ text: `💳 شارژ آنلاین (${missingAmount.toLocaleString('fa-IR')})`, callback_data: `topuponline_${missingAmount}` }],
          [{ text: `🏦 رویت اطلاعات کارت به کارت`, callback_data: `topupcard_${missingAmount}` }]
        ];
        await reply(
          `❌ **موجودی کیف پول برای این خرید کافی نیست!** ❌\n\n` +
          `📦 فاکتور انتخابی: **${prod.title}**\n` +
          `💰 مبلغ فاکتور: **${priceStr}**\n` +
          `💳 موجودی فعلی: **${balance.toLocaleString('fa-IR')} تومان**\n` +
          `🔹 **میزان کسری مجودی: ${missingAmount.toLocaleString('fa-IR')} تومان**\n\n` +
          `💡 لطفاً از طریق یکی از دکمه‌های زیر، موجودی خود را تأمین کنید:`,
          { inline_keyboard: topupInlineKeyboard }
        );
        return;
      }

      // Sufficient funds: deduct and register order
      if (userObj) {
        userObj.walletBalance = balance - priceInt;
      }

      const newTrans = {
        id: 3000 + transactions.length + 1,
        userIdentifier: userMap.phone,
        amount: priceInt,
        description: `خرید ربات: محصول ${prod.title}`,
        type: 'debit',
        createdAt: new Date().toISOString()
      };
      transactions.push(newTrans);

      const newOrder = {
        id: 1000 + orders.length + 1,
        productId: prod.id,
        productTitle: prod.title,
        productType: prod.type,
        userIdentifier: userMap.phone,
        price: priceStr,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        additionalDetails: `خرید بدون پکیج انتخابی`
      };
      orders.push(newOrder);
      saveDatabase();

      // Ask for details AFTER purchase
      userCheckoutStates[chat.id] = { orderId: newOrder.id };
      
      await reply(
        `🎉 **خرید شما با موفقیت تکمیل شد!**\n\n` +
        `✅ مبلغ **${priceStr}** از کیف پول دیجیتال کسر شد.\n` +
        `💳 مانده حساب جدید شما: **${userObj?.walletBalance.toLocaleString('fa-IR')} تومان**\n` +
        `🆔 فاکتور پیگیری: #${newOrder.id}\n\n` +
        `📝 **آیا توضیحات یا آدرس ایمیلی برای دریافت اکانت در ارتباط با این سفارش دارید؟**\n` +
        `لطفاً در پیام بعدی اطلاعات تکمیلی را بفرستید.`,
        getUserKeyboard(isAdmin)
      );

      // Notify administrator via bot using separate chat IDs
      const adminMsg = `🟢 **سفارش جدید ربات!**\n\n📦 محصول: ${prod.title}\n👤 کاربر (تلفن): ${userMap.phone}\n💰 مبلغ: ${priceStr}`;
      
      if (settings.adminTelegramChatId && settings.telegramToken) {
        botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: settings.adminTelegramChatId, text: adminMsg });
      }
      if (settings.adminBaleChatId && settings.baleToken) {
        botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: settings.adminBaleChatId, text: adminMsg });
      }
      return;
    }
  }

  // Check 7: Default fallback (General Support Chat Sync)
  // If user says something else, record as chat sync to admin console!
  let chatObj = chats.find(c => c.userId === userMap.phone);
  if (!chatObj) {
    chatObj = { id: Date.now(), userId: userMap.phone, messages: [] };
    chats.push(chatObj);
  }
  chatObj.messages.push({ sender: 'user', text });
  saveDatabase();

  await reply(
    `📩 پیام شما با موفقیت ثبت و به بخش تیکت‌های پشتیبانی فرستاده شد. کارشناسان ما به زودی پاسخ خود را ارسال می‌کنند.`,
    getUserKeyboard(isAdmin)
  );

  // Notify admins
  const adminSyncMsg = `💬 **پیام پشتیبانی جدید از کاربر (${userMap.phone}):**\n\n"${text}"`;
  if (settings.adminTelegramChatId && settings.telegramToken) {
    botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: settings.adminTelegramChatId, text: adminSyncMsg });
  }
  if (settings.adminBaleChatId && settings.baleToken) {
    botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: settings.adminBaleChatId, text: adminSyncMsg });
  }
}

// Start active background loops
pollTelegram();
pollBale();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.APP_PORT || process.env.PORT || '3000', 10);

  app.use(express.json());

  // --- API Routes: Public Config ---
  app.get('/api/config', (req, res) => {
    res.json({ 
      enableMobileLogin: settings.enableMobileLogin,
      socialInstagram: settings.socialInstagram,
      socialTelegram: settings.socialTelegram,
      socialWhatsapp: settings.socialWhatsapp,
      socialBale: settings.socialBale,
      socialX: settings.socialX,
      registrationMethod: settings.registrationMethod,
      contactPhone: settings.contactPhone,
      contactEmail: settings.contactEmail,
      contactAddress: settings.contactAddress,
      heroVideoUrl: settings.heroVideoUrl,
      siteLogoUrl: settings.siteLogoUrl
    });
  });

  // --- API Routes: Groups ---
  app.get('/api/groups', (req, res) => res.json(groups));
  app.post('/api/groups', (req, res) => {
    const newGroup = { 
      id: Date.now(), 
      title: req.body.title, 
      image: req.body.image || '', 
      active: req.body.active !== false 
    };
    groups.push(newGroup);
    saveDatabase();
    res.json({ success: true, group: newGroup });
  });
  app.put('/api/groups/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = groups.findIndex(g => g.id === id);
    if (index !== -1) {
      groups[index] = { ...groups[index], ...req.body };
      saveDatabase();
      res.json({ success: true, group: groups[index] });
    } else {
      res.status(404).json({ success: false, message: 'گروه پیدا نشد' });
    }
  });
  app.delete('/api/groups/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = groups.findIndex(g => g.id === id);
    if (index !== -1) {
      const deleted = groups.splice(index, 1);
      saveDatabase();
      res.json({ success: true, group: deleted[0] });
    } else {
      res.status(404).json({ success: false, message: 'گروه پیدا نشد' });
    }
  });

  // --- API Routes: SubGroups ---
  app.get('/api/subgroups', (req, res) => res.json(subGroups));
  app.post('/api/subgroups', (req, res) => {
    const newSubGroup = { 
      id: Date.now(), 
      groupId: parseInt(req.body.groupId, 10), 
      title: req.body.title, 
      image: req.body.image || '', 
      active: req.body.active !== false 
    };
    subGroups.push(newSubGroup);
    saveDatabase();
    res.json({ success: true, subGroup: newSubGroup });
  });
  app.put('/api/subgroups/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = subGroups.findIndex(s => s.id === id);
    if (index !== -1) {
      subGroups[index] = { ...subGroups[index], ...req.body };
      if (req.body.groupId !== undefined) {
        subGroups[index].groupId = parseInt(req.body.groupId, 10);
      }
      saveDatabase();
      res.json({ success: true, subGroup: subGroups[index] });
    } else {
      res.status(404).json({ success: false, message: 'زیرمجموعه پیدا نشد' });
    }
  });
  app.delete('/api/subgroups/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = subGroups.findIndex(s => s.id === id);
    if (index !== -1) {
      const deleted = subGroups.splice(index, 1);
      saveDatabase();
      res.json({ success: true, subGroup: deleted[0] });
    } else {
      res.status(404).json({ success: false, message: 'زیرمجموعه پیدا نشد' });
    }
  });

  // --- API Routes: Products ---
  app.get('/api/products', (req, res) => res.json(products));
  app.post('/api/products', (req, res) => {
    const newProduct = { id: Date.now(), active: true, ...req.body };
    products.push(newProduct);
    saveDatabase();
    res.json({ success: true, product: newProduct });
  });
  app.put('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...req.body };
      saveDatabase();
      res.json({ success: true, product: products[index] });
    } else {
      res.status(404).json({ success: false, message: 'محصول پیدا نشد' });
    }
  });
  app.delete('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      const deleted = products.splice(index, 1);
      saveDatabase();
      res.json({ success: true, product: deleted[0] });
    } else {
      res.status(404).json({ success: false, message: 'محصول پیدا نشد' });
    }
  });

  // --- API Routes: Users / Auth ---
  app.post('/api/auth/register', (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'نام و نام خانوادگی الزامی است' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'کلمه عبور الزامی است' });
    }

    if (settings.registrationMethod === 'email_only') {
      if (!email) {
        return res.status(400).json({ success: false, message: 'در حال حاضر ثبت‌نام فقط با آدرس ایمیل امکان‌پذیر است.' });
      }
    } else if (settings.registrationMethod === 'phone_only') {
      if (!phone) {
        return res.status(400).json({ success: false, message: 'در حال حاضر ثبت‌نام فقط با شماره موبایل امکان‌پذیر است.' });
      }
    } else {
      if (!email && !phone) {
        return res.status(400).json({ success: false, message: 'وارد کردن حداقل یکی از موارد ایمیل یا شماره موبایل الزامی است' });
      }
    }

    if (email) {
      const existingEmail = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'کاربری با این ایمیل قبلاً ثبت نام کرده است' });
      }
    }
    if (phone) {
      const existingPhone = users.find(u => u.phone && u.phone === phone);
      if (existingPhone) {
        return res.status(400).json({ success: false, message: 'کاربری با این شماره موبایل قبلاً ثبت نام کرده است' });
      }
    }

    const newUser = {
      id: Date.now(),
      name,
      email: email || '',
      phone: phone || '',
      password,
      role: 'user',
      createdAt: new Date()
    };

    users.push(newUser);
    saveDatabase();

    res.json({ success: true, message: 'ثبت‌نام با موفقیت انجام شد!', user: newUser });
  });

  app.post('/api/auth/check-duplicate', (req, res) => {
    const { email, phone } = req.body;
    if (email) {
      const existingEmail = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase().trim());
      if (existingEmail) {
        return res.json({ exists: true, message: 'کاربری با این ایمیل قبلاً ثبت نام کرده است' });
      }
    }
    if (phone) {
      const existingPhone = users.find(u => u.phone && u.phone === phone.trim());
      if (existingPhone) {
        return res.json({ exists: true, message: 'کاربری با این شماره موبایل قبلاً ثبت نام کرده است' });
      }
    }
    return res.json({ exists: false });
  });

  app.post('/api/auth/forgot-password/send', async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'وارد کردن ایمیل یا شماره موبایل الزامی است' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanIdentifier) ||
      (u.phone && u.phone === cleanIdentifier)
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'کاربری با این مشخصات یافت نشد' });
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    otps[cleanIdentifier] = token;

    // Send code
    const isEmail = cleanIdentifier.includes('@');
    if (isEmail) {
      if (settings.smtpHost && settings.smtpUser && settings.smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: parseInt(settings.smtpPort, 10) || 587,
            secure: parseInt(settings.smtpPort, 10) === 465,
            auth: {
              user: settings.smtpUser,
              pass: settings.smtpPass,
            },
          });
          await transporter.sendMail({
            from: `"Digital Store" <${settings.smtpUser}>`,
            to: cleanIdentifier,
            subject: 'کد بازیابی کلمه عبور دیجیتال استور',
            text: `کد تایید بازیابی عبور شما: ${token}`,
            html: `<p>کد تایید بازیابی عبور شما: <strong>${token}</strong></p>`
          });
          console.log(`Reset OTP sent to email ${cleanIdentifier} via SMTP.`);
        } catch (err: any) {
          console.error('SMTP Reset Error:', err.message);
        }
      } else {
        console.log(`Mock Reset OTP for email ${cleanIdentifier}: ${token}`);
      }
    } else {
      // Send via active bots if phone is mapped
      const userMap = botUsers.find(u => u.phone === cleanIdentifier);
      if (userMap) {
        const otpMsg = `🔑 کد تایید بازیابی عبور در دیجیتال استور:\n\nکد بازیابی شما: ${token}`;
        if (userMap.telegramChatId && settings.telegramToken) {
          await botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', {
            chat_id: userMap.telegramChatId,
            text: otpMsg
          });
        }
        if (userMap.baleChatId && settings.baleToken) {
          await botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', {
            chat_id: userMap.baleChatId,
            text: otpMsg
          });
        }
      } else {
        console.log(`Mock Reset OTP for phone ${cleanIdentifier}: ${token}`);
      }
    }

    res.json({ success: true, message: 'کد بازیابی ارسال شد' });
  });

  app.post('/api/auth/forgot-password/verify-reset', (req, res) => {
    const { identifier, code, newPassword } = req.body;
    if (!identifier || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'وارد کردن تمامی فیلدها الزامی است' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    if (otps[cleanIdentifier] !== code) {
      return res.status(401).json({ success: false, message: 'کد وارد شده نامعتبر است' });
    }

    const user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanIdentifier) ||
      (u.phone && u.phone === cleanIdentifier)
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'کاربر مورد نظر یافت نشد' });
    }

    // Reset password
    user.password = newPassword;
    saveDatabase();
    delete otps[cleanIdentifier];

    res.json({ success: true, message: 'کلمه عبور شما با موفقیت بروزرسانی شد!' });
  });

  app.post('/api/auth/login-with-password', (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'مشخصات ورود و کلمه عبور الزامی است' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanIdentifier) ||
      (u.phone && u.phone === cleanIdentifier)
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'کاربری با این مشخصات یافت نشد' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'کلمه عبور وارد شده نادرست است' });
    }

    res.json({ success: true, token: `user-token-${user.id}`, user });
  });

  app.post('/api/auth/email/send', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'ایمیل الزامی است' });

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    otps[email] = token;

    if (settings.smtpHost && settings.smtpUser && settings.smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: settings.smtpHost,
          port: parseInt(settings.smtpPort, 10) || 587,
          secure: parseInt(settings.smtpPort, 10) === 465,
          auth: {
            user: settings.smtpUser,
            pass: settings.smtpPass,
          },
        });
        await transporter.sendMail({
          from: `"Digital Store" <${settings.smtpUser}>`,
          to: email,
          subject: 'کد تایید ورود به دیجیتال استور',
          text: `کد تایید شما: ${token}`,
          html: `<p>کد تایید شما: <strong>${token}</strong></p>`
        });
        console.log(`OTP sent to ${email} via SMTP.`);
      } catch (err: any) {
        console.error('SMTP Error:', err.message);
      }
    } else {
      console.log(`Mock OTP for ${email}: ${token}`);
    }

    res.json({ success: true, message: 'کد ارسال شد' });
  });

  app.post('/api/auth/email/verify', (req, res) => {
    const { email, code } = req.body;
    if (!email || !code || otps[email] !== code) {
      return res.status(401).json({ success: false, message: 'کد نامعتبر است' });
    }

    delete otps[email];

    let user = users.find(u => u.email === email);
    if (!user) {
      user = { id: Date.now(), email, role: 'user', createdAt: new Date() };
      users.push(user);
      saveDatabase();
    }
    
    res.json({ success: true, token: `user-token-${user.id}`, user });
  });

  app.post('/api/auth/phone/send', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'شماره موبایل الزامی است' });

    if (!settings.enableMobileLogin) {
      return res.status(403).json({ success: false, message: 'ورود با شماره موبایل فعلا غیرفعال است.' });
    }

    const token = Math.floor(1000 + Math.random() * 9000).toString();
    otps[phone] = token;

    // Send code via active bots if user is mapped
    const userMap = botUsers.find(u => u.phone === phone);
    let sentPlatforms: string[] = [];

    if (userMap) {
      const otpMsg = `🔑 کد تایید ورود به سایت دیجیتال استور:\n\nکد تایید شما: ${token}\nاین کد تا ۲ دقیقه دیگر اعتبار دارد.`;
      
      if (userMap.telegramChatId && settings.telegramToken) {
        const ok = await botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', {
          chat_id: userMap.telegramChatId,
          text: otpMsg
        });
        if (ok) sentPlatforms.push('تلگرام');
      }

      if (userMap.baleChatId && settings.baleToken) {
        const ok = await botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', {
          chat_id: userMap.baleChatId,
          text: otpMsg
        });
        if (ok) sentPlatforms.push('بله');
      }
    }

    console.log(`[BOT] OTP for ${phone}: ${token}`);

    if (sentPlatforms.length > 0) {
      res.json({ 
        success: true, 
        message: `کد تایید با موفقیت به ربات ${sentPlatforms.join(' و ')} شما ارسال شد.` 
      });
    } else {
      res.json({ 
        success: true, 
        message: `کد تولید شد (برای تست آفلاین: ${token}). توجه: شماره شما جهت ارسال زنده باید ابتدا در ربات تلگرام یا بله ثبت شده باشد.` 
      });
    }
  });

  app.post('/api/auth/phone/verify', (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code || otps[phone] !== code) {
      return res.status(401).json({ success: false, message: 'کد نامعتبر است' });
    }

    delete otps[phone];

    let user = users.find(u => u.phone === phone);
    if (!user) {
      user = { id: Date.now(), phone, role: 'user', createdAt: new Date() };
      users.push(user);
      saveDatabase();
    }
    res.json({ success: true, token: `user-token-${user.id}`, user, accountType: 'phone' });
  });

  // --- API Routes: Orders & Checkout ---
  app.get('/api/orders', (req, res) => res.json(orders));
  app.get('/api/orders/user/:userIdentifier', (req, res) => {
    const user = req.params.userIdentifier;
    const userOrders = orders.filter(o => o.userIdentifier === user);
    res.json(userOrders);
  });
  
  app.post('/api/checkout', (req, res) => {
    const { productId, userIdentifier, additionalDetails, paymentMethod, variationId } = req.body;
    const prod = products.find(p => p.id === parseInt(productId, 10));
    if (!prod) {
      return res.status(404).json({ success: false, message: 'محصول پیدا نشد' });
    }

    let selectedVar: any = null;
    if (variationId && prod.variations) {
      selectedVar = prod.variations.find((v: any) => String(v.id) === String(variationId));
    }

    const priceNum = selectedVar ? Number(selectedVar.price) : parsePrice(prod.price);
    const resolvedPriceStr = selectedVar ? `${selectedVar.price.toLocaleString('fa-IR')} تومان` : prod.price;
    let walletDeducted = false;

    if (paymentMethod === 'wallet') {
      const cleanId = userIdentifier.trim().toLowerCase();
      let user = users.find(u => 
        (u.email && u.email.toLowerCase() === cleanId) || 
        (u.phone && u.phone === cleanId) ||
        (u.name && u.name.toLowerCase() === cleanId)
      );

      if (!user) {
        user = {
          id: Date.now(),
          name: 'کاربر گرامی',
          email: userIdentifier.includes('@') ? userIdentifier : '',
          phone: !userIdentifier.includes('@') ? userIdentifier : '',
          walletBalance: userIdentifier.trim().toLowerCase() === 'meh732@gmail.com' ? 500000 : 0,
          role: 'user',
          createdAt: new Date()
        };
        users.push(user);
      }

      if (user.walletBalance === undefined) {
        user.walletBalance = user.email === 'meh732@gmail.com' ? 500000 : 0;
      }

      if (user.walletBalance < priceNum) {
        return res.status(400).json({ 
          success: false, 
          requireTopUp: true, 
          message: `اعتبار کیف پول کافی نیست. هزینه سفارش ${priceNum.toLocaleString('fa-IR')} تومان است و اعتبار شما ${user.walletBalance.toLocaleString('fa-IR')} تومان می‌باشد.` 
        });
      }

      // Deduct balance and create transaction
      user.walletBalance -= priceNum;
      walletDeducted = true;

      const newTrans = {
        id: 3000 + transactions.length + 1,
        userIdentifier,
        amount: priceNum,
        description: `خرید مستقیم محصول "${prod.title}" ${selectedVar ? `(پکیج ${selectedVar.duration})` : ''} با کیف پول`,
        type: 'debit',
        createdAt: new Date().toISOString()
      };
      transactions.push(newTrans);
    }

    const finalDetails = selectedVar 
      ? `پکیج انتخابی: ${selectedVar.duration} (مدت ${selectedVar.provider} - نوع ${selectedVar.type}) | ${additionalDetails || ''}`
      : (additionalDetails || '');

    const newOrder = {
      id: 1000 + orders.length + 1,
      productId: prod.id,
      productTitle: prod.title,
      productType: prod.type,
      userIdentifier,
      price: resolvedPriceStr,
      status: walletDeducted ? 'completed' : 'pending',
      createdAt: new Date().toISOString(),
      additionalDetails: finalDetails
    };
    orders.push(newOrder);
    saveDatabase();

    // Notify administrators via separate message bots
    const adminMsg = `🔔 سفارش جدید ثبت شد!\n\n📦 محصول: ${prod.title}\n👥 خریدار: ${userIdentifier}\n💰 مبلغ: ${resolvedPriceStr}\n💳 روش پرداخت: ${paymentMethod === 'wallet' ? 'کیف پول (پرداخت موفق)' : 'کارت به کارت (دستی)'}\n📝 جزئیات: ${newOrder.additionalDetails}`;
    
    if (settings.adminTelegramChatId && settings.telegramToken) {
      botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: settings.adminTelegramChatId, text: adminMsg });
    }
    if (settings.adminBaleChatId && settings.baleToken) {
      botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: settings.adminBaleChatId, text: adminMsg });
    }
    // Fallback to legacy adminIdNumber
    if (settings.adminIdNumber && settings.adminIdNumber !== settings.adminTelegramChatId && settings.adminIdNumber !== settings.adminBaleChatId) {
      if (settings.telegramToken) {
        botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: settings.adminIdNumber, text: adminMsg });
      }
      if (settings.baleToken) {
        botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: settings.adminIdNumber, text: adminMsg });
      }
    }

    res.json({ success: true, message: walletDeducted ? 'خرید با موفقیت از محل اعتبار کیف پول انجام شد' : 'سفارش با موفقیت ثبت شد', order: newOrder });
  });

  // --- API Routes: User Profile ---
  app.get('/api/profile', (req, res) => {
    const userIdentifier = req.query.userIdentifier as string;
    if (!userIdentifier) return res.status(400).json({ success: false, message: 'شناسه کاربر الزامی است' });
    
    const cleanId = userIdentifier.trim().toLowerCase();
    let user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanId) || 
      (u.phone && u.phone === cleanId) ||
      (u.name && u.name.toLowerCase() === cleanId)
    );
    
    if (!user) {
      user = {
        id: Date.now(),
        name: 'کاربر گرامی',
        email: userIdentifier.includes('@') ? userIdentifier : '',
        phone: !userIdentifier.includes('@') ? userIdentifier : '',
        address: '',
        telegramUsername: '',
        walletBalance: userIdentifier.trim().toLowerCase() === 'meh732@gmail.com' ? 500000 : 0
      };
    }
    
    if (user.walletBalance === undefined) {
      user.walletBalance = user.email === 'meh732@gmail.com' ? 500000 : 0;
    }
    if (!user.address) user.address = '';
    if (!user.telegramUsername) user.telegramUsername = '';
    
    res.json({ success: true, profile: user });
  });

  app.post('/api/profile/update', (req, res) => {
    const { currentIdentifier, name, email, phone, password, address, telegramUsername } = req.body;
    if (!currentIdentifier) return res.status(400).json({ success: false, message: 'شناسه فعلی معتبر نیست' });
    
    const cleanId = currentIdentifier.trim().toLowerCase();
    let index = users.findIndex(u => 
      (u.email && u.email.toLowerCase() === cleanId) || 
      (u.phone && u.phone === cleanId) ||
      (u.name && u.name.toLowerCase() === cleanId)
    );
    
    if (index === -1) {
      const newUser = {
        id: Date.now(),
        name: name || 'کاربر جدید',
        email: email || '',
        phone: phone || '',
        password: password || '',
        address: address || '',
        telegramUsername: telegramUsername || '',
        walletBalance: (email && email.toLowerCase() === 'meh732@gmail.com') ? 500000 : 0,
        role: 'user',
        createdAt: new Date()
      };
      users.push(newUser);
      saveDatabase();
      return res.json({ success: true, message: 'پروفایل با موفقیت ایجاد و ذخیره شد', profile: newUser });
    }
    
    const existingUser = users[index];
    existingUser.name = name || existingUser.name;
    existingUser.email = email !== undefined ? email : existingUser.email;
    existingUser.phone = phone !== undefined ? phone : existingUser.phone;
    if (password) existingUser.password = password;
    existingUser.address = address !== undefined ? address : existingUser.address;
    existingUser.telegramUsername = telegramUsername !== undefined ? telegramUsername : existingUser.telegramUsername;
    
    saveDatabase();
    res.json({ success: true, message: 'مشخصات مراجع با موفقیت بروزرسانی شد', profile: existingUser });
  });

  // --- API Routes: Wallet ---
  app.get('/api/wallet/transactions', (req, res) => {
    const userIdentifier = req.query.userIdentifier as string;
    if (!userIdentifier) return res.status(400).json({ success: false, message: 'شناسه کاربر الزامی است' });
    
    const cleanId = userIdentifier.trim().toLowerCase();
    const userTrans = transactions.filter(t => t.userIdentifier.trim().toLowerCase() === cleanId);
    res.json({ success: true, transactions: userTrans });
  });

  app.post('/api/wallet/topup', (req, res) => {
    const { userIdentifier, amount, cardHolderName } = req.body;
    const buyAmt = parseInt(amount, 10);
    if (!userIdentifier || isNaN(buyAmt) || buyAmt <= 0) {
      return res.status(400).json({ success: false, message: 'مبلغ نامعتبر است' });
    }
    
    const cleanId = userIdentifier.trim().toLowerCase();
    let user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanId) || 
      (u.phone && u.phone === cleanId) ||
      (u.name && u.name.toLowerCase() === cleanId)
    );
    
    if (!user) {
      user = {
        id: Date.now(),
        name: 'کاربر گرامی',
        email: userIdentifier.includes('@') ? userIdentifier : '',
        phone: !userIdentifier.includes('@') ? userIdentifier : '',
        walletBalance: 0,
        role: 'user',
        createdAt: new Date()
      };
      users.push(user);
    }
    
    if (user.walletBalance === undefined) {
      user.walletBalance = user.email === 'meh732@gmail.com' ? 500000 : 0;
    }
    
    user.walletBalance += buyAmt;
    
    const newTrans = {
      id: 3000 + transactions.length + 1,
      userIdentifier,
      amount: buyAmt,
      description: `افزایش اعتبار کیف پول${cardHolderName ? ` (توسط کارت ${cardHolderName})` : ''}`,
      type: 'credit',
      createdAt: new Date().toISOString()
    };
    
    transactions.push(newTrans);
    saveDatabase();
    
    res.json({ success: true, message: 'کیف پول شما با موفقیت شارژ شد!', walletBalance: user.walletBalance, transaction: newTrans });
  });

  app.post('/api/wallet/request-topup', (req, res) => {
    const { userIdentifier, amount, cardHolderName, receiptImage } = req.body;
    const reqAmt = parseInt(amount, 10);
    if (!userIdentifier || isNaN(reqAmt) || reqAmt <= 0) {
      return res.status(400).json({ success: false, message: 'مبلغ درخواست شده نامعتبر است' });
    }

    const newTrans = {
      id: 3000 + transactions.length + 1,
      userIdentifier,
      amount: reqAmt,
      cardHolderName: cardHolderName || '',
      description: `درخواست افزایش اعتبار کارت به کارت (${reqAmt.toLocaleString('fa-IR')} تومان)`,
      type: 'credit',
      status: 'pending',
      receiptImage: receiptImage || '',
      createdAt: new Date().toISOString()
    };
    transactions.push(newTrans);
    saveDatabase();

    res.json({ success: true, message: 'درخواست افزایش اعتبار با موفقیت ثبت شد و در انتظار تایید مدیریت است.', transaction: newTrans });
  });

  app.get('/api/admin/transactions', (req, res) => {
    res.json(transactions);
  });

  app.post('/api/admin/transactions/:id/approve', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const trans = transactions.find(t => t.id === id);
    if (!trans) {
      return res.status(404).json({ success: false, message: 'تراکنش یافت نشد' });
    }

    if (trans.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'این تراکنش قبلاً بررسی شده است' });
    }

    trans.status = 'approved';
    trans.description = `افزایش اعتبار کارت به کارت (تایید شده توسط ادمین)`;

    const cleanId = trans.userIdentifier.trim().toLowerCase();
    let user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanId) || 
      (u.phone && u.phone === cleanId) ||
      (u.name && u.name.toLowerCase() === cleanId)
    );

    if (!user) {
      user = {
        id: Date.now(),
        name: 'کاربر گرامی',
        email: cleanId.includes('@') ? cleanId : '',
        phone: !cleanId.includes('@') ? cleanId : '',
        walletBalance: 0,
        role: 'user',
        createdAt: new Date()
      };
      users.push(user);
    }

    if (user.walletBalance === undefined) {
      user.walletBalance = 0;
    }

    user.walletBalance += trans.amount;
    saveDatabase();

    // Notify user if bot mappings exist
    const botUser = botUsers.find(u => u.phone === user.phone);
    if (botUser) {
      const userMsg = `✅ **تایید افزایش اعتبار!**\n\nمبلغ **${trans.amount.toLocaleString('fa-IR')} تومان** با موفقیت توسط مدیریت تایید و به کیف پول شما واریز شد.\n\n💳 موجودی جدید شما: **${user.walletBalance.toLocaleString('fa-IR')} تومان**`;
      if (botUser.telegramChatId && settings.telegramToken) {
        botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: botUser.telegramChatId, text: userMsg });
      }
      if (botUser.baleChatId && settings.baleToken) {
        botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: botUser.baleChatId, text: userMsg });
      }
    }

    res.json({ success: true, message: 'تراکنش تایید شد و حساب کاربر شارژ گردید.', walletBalance: user.walletBalance, transaction: trans });
  });

  app.post('/api/admin/transactions/:id/reject', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const trans = transactions.find(t => t.id === id);
    if (!trans) {
      return res.status(404).json({ success: false, message: 'تراکنش یافت نشد' });
    }

    if (trans.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'این تراکنش قبلاً بررسی شده است' });
    }

    trans.status = 'rejected';
    trans.description = `رد درخواست افزایش اعتبار کارت به کارت`;
    saveDatabase();

    const botUser = botUsers.find(u => u.phone === trans.userIdentifier);
    if (botUser) {
      const userMsg = `❌ **رد درخواست افزایش اعتبار**\n\nدرخواست شارژ حساب شما به مبلغ **${trans.amount.toLocaleString('fa-IR')} تومان** توسط مدیریت رد شد. در صورت هرگونه سوال با پشتیبانی در ارتباط باشید.`;
      if (botUser.telegramChatId && settings.telegramToken) {
        botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: botUser.telegramChatId, text: userMsg });
      }
      if (botUser.baleChatId && settings.baleToken) {
        botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: botUser.baleChatId, text: userMsg });
      }
    }

    res.json({ success: true, message: 'درخواست افزایش اعتبار رد شد.', transaction: trans });
  });

  // --- API Routes: Support Tickets ---
  app.get('/api/tickets', (req, res) => {
    const userIdentifier = req.query.userIdentifier as string;
    if (!userIdentifier) return res.status(400).json({ success: false, message: 'شناسه کاربر الزامی است' });
    
    const cleanId = userIdentifier.trim().toLowerCase();
    const userTickets = tickets.filter(t => t.userIdentifier.trim().toLowerCase() === cleanId);
    res.json({ success: true, tickets: userTickets });
  });

  app.post('/api/tickets', (req, res) => {
    const { userIdentifier, title, body, priority } = req.body;
    if (!userIdentifier || !title || !body) {
      return res.status(400).json({ success: false, message: 'اطلاعات تیکت ناقص است' });
    }
    
    const cleanId = userIdentifier.trim().toLowerCase();
    const newTicket = {
      id: 4000 + tickets.length + 1,
      userIdentifier,
      title,
      body,
      status: 'open',
      priority: priority || 'medium',
      createdAt: new Date().toISOString(),
      replies: [
         { sender: 'user', text: body, createdAt: new Date().toISOString() },
         { sender: 'admin', text: 'سلام کاربر عزیز. تیکت شما دریافت شد و به کارشناس مربوطه ارجاع گردید. ما سریعاً جزییات را بررسی کرده و همینجا پاسخ می‌دهیم.', createdAt: new Date().toISOString() }
      ]
    };
    
    tickets.push(newTicket);
    saveDatabase();
    
    // Notify admin
    const ticketNotifyMsg = `🎫 **تیکت پشتیبانی جدید در سایت!**\n\n👤 فرستنده: ${userIdentifier}\n🏷️ موضوع: ${title}\n🚨 اولویت: ${priority || 'high'}\n📝 متن تیکت: "${body}"`;
    if (settings.adminTelegramChatId && settings.telegramToken) {
      botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: settings.adminTelegramChatId, text: ticketNotifyMsg }).catch(err => console.error(err));
    }
    if (settings.adminBaleChatId && settings.baleToken) {
      botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: settings.adminBaleChatId, text: ticketNotifyMsg }).catch(err => console.error(err));
    }
    
    res.json({ success: true, message: 'تیکت با موفقیت ثبت شد', ticket: newTicket });
  });

  app.post('/api/tickets/:id/reply', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { sender, text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'متن پاسخ خالی است' });
    
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return res.status(404).json({ success: false, message: 'تیکت یافت نشد' });
    
    const reply = {
      sender: sender || 'user',
      text,
      createdAt: new Date().toISOString()
    };
    
    ticket.replies.push(reply);
    ticket.status = sender === 'admin' ? 'answered' : 'user-replied';
    
    saveDatabase();
    
    // Auto smart response simulation
    if (sender === 'user' || !sender) {
      setTimeout(() => {
        ticket.replies.push({
          sender: 'admin',
          text: 'پیام دریافت شد. دپارتمان بخش فنی در حال کار روی پاسخ یا انجام درخواست شماست. نتیجه نهایی به زودی در همین صفحه درج میگردد.',
          createdAt: new Date().toISOString()
        });
        ticket.status = 'answered';
        saveDatabase();
      }, 1500);
    }
    
    res.json({ success: true, ticket });
  });

  app.put('/api/orders/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...req.body };
      saveDatabase();

      // Trigger interactive notify user via Bot
      const order = orders[index];
      const normalizedIdentifier = order.userIdentifier.replace(/\D/g, '');
      const userMap = botUsers.find(u => u.phone === order.userIdentifier || u.phone === normalizedIdentifier);
      if (userMap) {
        const statusText = req.body.status === 'completed' ? 'تکمیل و فعال شد ✅' : req.body.status === 'canceled' ? 'لغو شد ❌' : 'در انتظار اقدام ⏳';
        const userMsg = `📢 وضعیت سفارش "${order.productTitle}" تغییر کرد.\n\nکد سفارش: #${order.id}\nوضعیت جدید: ${statusText}`;
        if (userMap.telegramChatId && settings.telegramToken) {
          botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: userMap.telegramChatId, text: userMsg });
        }
        if (userMap.baleChatId && settings.baleToken) {
          botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: userMap.baleChatId, text: userMsg });
        }
      }

      res.json({ success: true, order: orders[index] });
    } else {
      res.status(404).json({ success: false, message: 'سفارش پیدا نشد' });
    }
  });

  app.delete('/api/orders/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      const deleted = orders.splice(index, 1);
      saveDatabase();
      res.json({ success: true, order: deleted[0] });
    } else {
      res.status(404).json({ success: false, message: 'سفارش پیدا نشد' });
    }
  });

  // --- API Routes: Chat ---
  app.get('/api/chat/:userId', (req, res) => {
    const chat = chats.find(c => c.userId === req.params.userId) || { id: Date.now(), userId: req.params.userId, messages: [] };
    res.json(chat);
  });
  app.post('/api/chat/:userId', (req, res) => {
    let chat = chats.find(c => c.userId === req.params.userId);
    if (!chat) {
      chat = { id: Date.now(), userId: req.params.userId, messages: [] };
      chats.push(chat);
    }
    chat.messages.push({ sender: req.body.sender, text: req.body.text });
    saveDatabase();

    // If customer sends a chat message, alert administrators instantly
    if (req.body.sender === 'user') {
      const adminChatAlertMsg = `💬 **تیکت/پیام پشتیبانی جدید در سایت!**\n\n👤 کاربر: ${req.params.userId}\n✉️ متن پیام: "${req.body.text}"\n\n💡 جهت پاسخگویی به پنل مدیریت سایت مراجعه کنید.`;
      if (settings.adminTelegramChatId && settings.telegramToken) {
        botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: settings.adminTelegramChatId, text: adminChatAlertMsg }).catch(err => console.error(err));
      }
      if (settings.adminBaleChatId && settings.baleToken) {
        botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: settings.adminBaleChatId, text: adminChatAlertMsg }).catch(err => console.error(err));
      }
    }

    // If admin replies, forward the reply to user's Telegram or Bale bot dynamically!
    if (req.body.sender === 'admin') {
      const cleanPhone = req.params.userId.replace(/\D/g, '');
      const userMap = botUsers.find(u => u.phone === req.params.userId || u.phone === cleanPhone);
      if (userMap) {
        const supportReplyMsg = `💬 **پاسخ جدید پشتیبانی از طرف مدیریت:**\n\n"${req.body.text}"`;
        if (userMap.telegramChatId && settings.telegramToken) {
          botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: userMap.telegramChatId, text: supportReplyMsg });
        }
        if (userMap.baleChatId && settings.baleToken) {
          botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: userMap.baleChatId, text: supportReplyMsg });
        }
      }
    }

    res.json(chat);
  });

  // --- API Routes: Settings / Backup ---
  app.get('/api/admin/settings', (req, res) => {
    res.json(settings);
  });
  app.post('/api/admin/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    saveDatabase();
    res.json({ success: true, settings });
  });
  app.get('/api/admin/backup', (req, res) => {
    const backupData = { products, orders, users, chats, settings, botUsers, timestamp: new Date() };
    res.json({ success: true, backup: backupData });
  });

  // --- API Routes: Bots Webhook Mock ---
  app.post('/api/bot/telegram/:token', (req, res) => {
    console.log('Telegram Webhook Hook called.');
    res.sendStatus(200);
  });
  app.post('/api/bot/bale/:token', (req, res) => {
    console.log('Bale Webhook Hook called.');
    res.sendStatus(200);
  });

  // --- API Routes: Admin Auth ---
  app.post('/api/admin/auth', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || '1234';
    if (username === adminUser && password === adminPass) {
      res.json({ success: true, token: 'fake-jwt-token', role: 'main_admin' });
    } else {
      res.status(401).json({ success: false, message: 'اطلاعات نادرست است' });
    }
  });

  // --- Vite development middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
