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
  enableMobileLogin: true
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
      console.log('Database loaded successfully from database.json');
    }
  } catch (err) {
    console.error('Error loading database.json:', err);
  }
}

function saveDatabase() {
  try {
    const data = { products, orders, users, chats, settings, botUsers };
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
  const message = update.message || update.edited_message;
  if (!message) return;

  const chat = message.chat;
  if (!chat || !chat.id) return;

  const text = message.text ? message.text.trim() : '';
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
      shopMsg += `📥 **سفارش آسان**: عدد \`${p.id}\` یا بنویسید: \`سفارش ${p.id}\`\n`;
      shopMsg += `------------------------------------\n`;
    });
    shopMsg += `\n💡 جهت سفارش سریع هر یک از محصولات فوق، کافیست کد شناسه محصول (مثلاً: *${activeProducts[0].id}* یا عدد خالی) را ارسال نمایید.`;
    
    await reply(shopMsg, getUserKeyboard(isAdmin));
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
  if (text.startsWith('سفارش') || text.startsWith('خرید') || text.startsWith('ID')) {
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
    const { productId, userIdentifier, additionalDetails } = req.body;
    const prod = products.find(p => p.id === parseInt(productId, 10));
    if (!prod) {
      return res.status(404).json({ success: false, message: 'محصول پیدا نشد' });
    }
    const newOrder = {
      id: 1000 + orders.length + 1,
      productId: prod.id,
      productTitle: prod.title,
      productType: prod.type,
      userIdentifier,
      price: prod.price,
      status: 'pending',
      createdAt: new Date().toISOString(),
      additionalDetails: additionalDetails || ''
    };
    orders.push(newOrder);
    saveDatabase();

    // Notify administrators via separate message bots
    const adminMsg = `🔔 سفارش جدید ثبت شد!\n\n📦 محصول: ${prod.title}\n👥 خریدار: ${userIdentifier}\n💰 مبلغ: ${prod.price}\n📝 جزئیات: ${newOrder.additionalDetails}`;
    
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

    res.json({ success: true, message: 'سفارش با موفقیت ثبت شد', order: newOrder });
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
