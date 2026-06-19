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

  // Handle Shared Contact
  if (contact && contact.phone_number) {
    let rawPhone = contact.phone_number;
    let phone = rawPhone.replace(/\D/g, '');
    if (phone.startsWith('98')) {
      phone = '0' + phone.substring(2);
    } else if (!phone.startsWith('0')) {
      phone = '0' + phone;
    }

    let userMap = botUsers.find(u => u.phone === phone);
    if (!userMap) {
      userMap = { phone };
      botUsers.push(userMap);
    }
    if (platform === 'telegram') {
      userMap.telegramChatId = chat.id;
    } else {
      userMap.baleChatId = chat.id;
    }

    saveDatabase();

    await reply(`✅ شماره تلفن شما (${phone}) با موفقیت به سیستم متمرکز دیجیتال استور متصل شد.\n\nاز این پس تمامی کدهای یکبار مصرف ورود به سایت بلافاصله در همین چت برای شما فرستاده می‌شود.`);
    return;
  }

  // Handle Text inputs
  if (text === '/start' || text.toLowerCase() === 'سلام') {
    await reply(
      `سلام! به ربات پشتیبانی و احراز هویت هوشمند دیجیتال استور خوش آمدید. 👋\n\nبرای همگام‌سازی سریع حساب و دریافت لحظه‌ای کدهای تایید در پیام‌رسان ${platformName}، لطفا شماره تلفن ۱۱ رقمی خود را تایپ کنید (مثلاً: 09123456789) یا دکمه زیر را جهت ارسال شماره فشار دهید:`,
      {
        keyboard: [
          [{ text: "ارسال شماره موبایل 📱", request_contact: true }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    );
    return;
  }

  // Handle Raw Phone typing (e.g. 09123456789)
  const phoneRegex = /^(09\d{9})$/;
  const match = text.match(phoneRegex);
  if (match) {
    const phone = match[1];
    let userMap = botUsers.find(u => u.phone === phone);
    if (!userMap) {
      userMap = { phone };
      botUsers.push(userMap);
    }
    if (platform === 'telegram') {
      userMap.telegramChatId = chat.id;
    } else {
      userMap.baleChatId = chat.id;
    }

    saveDatabase();

    await reply(`✅ شماره تلفن شما (${phone}) با موفقیت ارزیابی و ثبت شد.\nاکنون می‌توانید در سایت درخواست ارسال کد تایید با شماره موبایل بدهید.`);
    return;
  }

  // Help fallback info
  await reply(`پیام شما دریافت شد. جهت فعالسازی ورود با شماره، لطفا شماره تلفن خود را ارسال کنید یا دکمه اشتراک‌گذاری شماره را بزنید.\nشناسه چت شما: ${chat.id}`);
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

    // Notify administrators via message bots if telegramToken or baleToken is set
    if (settings.adminIdNumber) {
      const adminMsg = `🔔 سفارش جدید ثبت شد!\n\n📦 محصول: ${prod.title}\n👥 خریدار: ${userIdentifier}\n💰 مبلغ: ${prod.price}\n📝 جزئیات: ${newOrder.additionalDetails}`;
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
