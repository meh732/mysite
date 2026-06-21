import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import fs from 'fs';

// --- Mock Database ---
let products = [
  { id: 1, type: 'account', category: 'apple', title: 'اپل آیدی اختصاصی', desc: 'با ایمیل دلخواه شما', price: '۳۵۰,۰۰۰ تومان', icon: 'Apple', active: true },
  { id: 2, type: 'account', category: 'ai', title: 'اکانت ChatGPT Plus', desc: 'دسترسی ۳۰ روزه به GPT-4', price: '۱,۴۵۰,۰۰۰ تومان', icon: 'Bot', active: true },
  { id: 3, type: 'account', category: 'ai', title: 'اکانت Midjourney', desc: 'اشتراک استاندارد', price: '۱,۸۰۰,۰۰۰ تومان', icon: 'Palette', active: true },
  { id: 4, type: 'service', category: 'web', title: 'طراحی سایت شرکتی/فروشگاهی', desc: 'مدرن، ریسپانسیو و سئو شده', price: 'از ۱۰,۰۰۰,۰۰۰ تومان', icon: 'Globe', active: true },
  { id: 5, type: 'service', category: 'bot', title: 'طراحی ربات تلگرام و بله', desc: 'فروشگاهی، پشتیبانی، مدیریت گروه', price: 'از ۳,۰۰۰,۰۰۰ تومان', icon: 'MessageCircle', active: true },
  { id: 6, type: 'service', category: 'app', title: 'ساخت اپلیکیشن اندروید', desc: 'نیتیو و کراس‌پلتفرم', price: 'از ۱۵,۰۰۰,۰۰۰ تومان', icon: 'Smartphone', active: true },
];

let orders = [
  { id: 1001, productId: 5, productTitle: 'طراحی ربات تلگرام و بله', productType: 'service', userIdentifier: 'meh732@gmail.com', price: 'از ۳,۰۰۰,۰۰۰ تومان', status: 'pending', createdAt: new Date().toISOString(), additionalDetails: 'نیاز به ربات پیشرفته فروشگاهی داریم' }
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
  baleJoinChannel: ''
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
      if (data.products) products = data.products;
      if (data.orders) orders = data.orders;
      if (data.users) users = data.users;
      if (data.chats) chats = data.chats;
      if (data.settings) settings = data.settings;
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
    const data = { products, orders, users, chats, settings, botUsers, tickets, transactions };
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
const userCheckoutStates: Record<string, { productId: number }> = {};
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
      botRequest(apiHost, token, 'answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text: 'در حال پردازش...'
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
      [{ text: "🔐 فعال/غیرفعال‌سازی لاگین موبایل" }, { text: "👤 سوییچ به پنل کاربری" }]
    ],
    resize_keyboard: true
  };

  const getUserKeyboard = (isAdminUser: boolean) => {
    const kb = [
      [{ text: "🛒 لیست محصولات و خدمات" }, { text: "📦 پیگیری سفارشات من" }],
      [{ text: "🔑 دریافت کد دو مرحله‌ای ورود" }, { text: "💬 ارتباط با پشتیبانی" }]
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

    // Admin general support command / interactive guide
    await reply(
      `مدیر گرامی، دستور "${text}" شناسایی نشد.\n\nلطفاً از دکمه‌های ناوبری زیر سیستم استفاده کنید:`,
      adminKeyboard
    );
    return;
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

  // Check 5: Active Checkout Sequence Confirmation (if already selected a product)
  if (userCheckoutStates[chat.id]) {
    const checkoutStateObj = userCheckoutStates[chat.id];
    
    if (text === 'لغو' || text === 'انصراف' || text === 'منصرف شدم') {
      delete userCheckoutStates[chat.id];
      await reply("❌ روند معامله آنلاین لغو شد. به منوی اصلی بازگشتیم.", getUserKeyboard(isAdmin));
      return;
    }

    const prod = products.find(p => p.id === checkoutStateObj.productId && p.active !== false);
    if (prod) {
      const newOrder = {
        id: 1000 + orders.length + 1,
        productId: prod.id,
        productTitle: prod.title,
        productType: prod.type,
        userIdentifier: userMap.phone,
        price: prod.price,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        additionalDetails: text
      };
      orders.push(newOrder);
      saveDatabase();
      delete userCheckoutStates[chat.id];

      await reply(
        `🎉 **سفارش شما با موفقیت ثبت شد!**\n\n` +
        `🆔 شماره سفارش شما: #${newOrder.id}\n` +
        `📦 محصول: **${prod.title}**\n` +
        `💰 مبلغ فاکتور: ${prod.price}\n` +
        `📝 نیازمندی یا توضیحات ثبت شده: ${text}\n\n` +
        `⏳ سفارش شما در دست بررسی کارشناسان قرار دارد. هرگونه تغییر در وضعیت سفارش فورا از طریق همین چت برای شما مخابره می‌شود.`,
        getUserKeyboard(isAdmin)
      );

      // Notify administrator via bot using separate chat IDs
      const adminMsg = `🔔 **سفارش جدید از چت بات ${platformName}!**\n\n📦 محصول: ${prod.title}\n👤 خریدار (تلفن): ${userMap.phone}\n💰 مبلغ: ${prod.price}\n📝 جزئیات: ${text}\n\nبه پنل مدیریت وب‌سایت مراجعه کنید.`;
      
      if (settings.adminTelegramChatId && settings.telegramToken) {
        botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: settings.adminTelegramChatId, text: adminMsg });
      }
      if (settings.adminBaleChatId && settings.baleToken) {
        botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: settings.adminBaleChatId, text: adminMsg });
      }
      return;
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
      userCheckoutStates[chat.id] = { productId: prod.id };
      await reply(
        `🛒 **شما درخواست خرید "${prod.title}" را دارید**\n\n` +
        `💰 مبلغ: *${prod.price}*\n\n` +
        `📝 لطفاً مشخصات یا اطلاعات تماس تکمیلی خود را در پیام بعدی بفرستید.\n` +
        `پس از ارسال پیام بعدی، فاکتور شما نهایی گشته و کد سفارش دریافت خواهید کرد.\n\n` +
        `❌ جهت انصراف کلمه **لغو** را بنویسید.`
      );
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
    res.json({ enableMobileLogin: settings.enableMobileLogin });
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
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'وارد کردن حداقل یکی از موارد ایمیل یا شماره موبایل الزامی است' });
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
    const { productId, userIdentifier, additionalDetails, paymentMethod } = req.body;
    const prod = products.find(p => p.id === parseInt(productId, 10));
    if (!prod) {
      return res.status(404).json({ success: false, message: 'محصول پیدا نشد' });
    }

    // Helper to parse price string to number
    const parsePrice = (priceStr: string): number => {
      if (!priceStr) return 0;
      let clean = priceStr
        .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
        .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
      clean = clean.replace(/\D/g, '');
      const num = parseInt(clean, 10);
      return isNaN(num) ? 0 : num;
    };

    const priceNum = parsePrice(prod.price);
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
        description: `خرید مستقیم محصول "${prod.title}" با کیف پول`,
        type: 'debit',
        createdAt: new Date().toISOString()
      };
      transactions.push(newTrans);
    }

    const newOrder = {
      id: 1000 + orders.length + 1,
      productId: prod.id,
      productTitle: prod.title,
      productType: prod.type,
      userIdentifier,
      price: prod.price,
      status: walletDeducted ? 'completed' : 'pending',
      createdAt: new Date().toISOString(),
      additionalDetails: additionalDetails || ''
    };
    orders.push(newOrder);
    saveDatabase();

    // Notify administrators via separate message bots
    const adminMsg = `🔔 سفارش جدید ثبت شد!\n\n📦 محصول: ${prod.title}\n👥 خریدار: ${userIdentifier}\n💰 مبلغ: ${prod.price}\n💳 روش پرداخت: ${paymentMethod === 'wallet' ? 'کیف پول (پرداخت موفق)' : 'کارت به کارت (دستی)'}\n📝 جزئیات: ${newOrder.additionalDetails}`;
    
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
