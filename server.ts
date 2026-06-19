import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import crypto from 'crypto';
import os from 'os';

// --- IP & Base URL auto-detection ---
let detectedServerIP = '127.0.0.1';

function isValidIP(ip: string): boolean {
  if (!ip) return false;
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

async function autoDetectPublicIP() {
  const providers = [
    'https://api.ipify.org',
    'https://ifconfig.me/ip',
    'https://icanhazip.com',
    'https://ipinfo.io/ip'
  ];

  for (const url of providers) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
         const ip = (await res.text()).trim();
         if (ip && isValidIP(ip)) {
           detectedServerIP = ip;
           return ip;
         }
      }
    } catch (e) {
      // ignore and try next
    }
  }

  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          detectedServerIP = iface.address;
          return iface.address;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return detectedServerIP;
}

function getBaseUrl(): string {
  if (process.env.PUBLIC_URL && process.env.PUBLIC_URL !== 'MY_APP_URL') {
    return process.env.PUBLIC_URL.trim();
  }
  
  if (process.env.DOMAIN_NAME && process.env.DOMAIN_NAME.trim() !== '') {
    const domain = process.env.DOMAIN_NAME.trim();
    const cleanDomain = domain.replace(/^(https?:\/\/)?/, '');
    const useSSL = process.env.INSTALL_SSL === 'y' || process.env.INSTALL_SSL === 'Y' || process.env.INSTALL_SSL === 'true';
    return `${useSSL ? 'https' : 'http'}://${cleanDomain}`;
  }
  
  const port = process.env.APP_PORT || process.env.PORT || 3000;
  
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.trim();
  }

  return `http://${detectedServerIP}:${port}`;
}

// --- System Types ---
interface Product {
  id: number;
  type: 'account' | 'service';
  category: string;
  title: string;
  desc: string;
  price: string;
  icon: string;
  image?: string;
  details?: string;
  isAvailable?: boolean;
}

interface Order {
  id: number;
  productId: number;
  productTitle: string;
  productPrice: string;
  userId: string;
  status: 'pending' | 'completed' | 'canceled';
  createdAt: string;
  details?: string;
  deliveredContent?: string;
}

interface ChatMessage {
  sender: 'user' | 'admin';
  text: string;
  createdAt: string;
}

interface Chat {
  id: number;
  userId: string;
  messages: ChatMessage[];
  updatedAt: string;
}

// --- Hard Storage Location ---
const DATA_FILE = path.join(process.cwd(), 'data.json');

// --- Default Data Structures ---
let products: Product[] = [
  { id: 1, type: 'account', category: 'apple', title: 'اپل آیدی اختصاصی', desc: 'با ایمیل دلخواه شما', price: '۳۵۰,۰۰۰ تومان', icon: 'Apple', isAvailable: true },
  { id: 2, type: 'account', category: 'ai', title: 'اکانت ChatGPT Plus', desc: 'دسترسی ۳۰ روزه به GPT-4', price: '۱,۴۵۰,۰۰۰ تومان', icon: 'Bot', isAvailable: true },
  { id: 3, type: 'account', category: 'ai', title: 'اکانت Midjourney', desc: 'اشتراک استاندارد', price: '۱,۸۰۰,۰۰۰ تومان', icon: 'Palette', isAvailable: true },
  { id: 4, type: 'service', category: 'web', title: 'طراحی سایت شرکتی/فروشگاهی', desc: 'مدرن، ریسپانسیو و سئو شده', price: 'از ۱۰,۰۰۰,۰۰۰ تومان', icon: 'Globe', isAvailable: true },
  { id: 5, type: 'service', category: 'bot', title: 'طراحی ربات تلگرام و بله', desc: 'فروشگاهی، پشتیبانی، مدیریت گروه', price: 'از ۳,۰۰۰,۰۰۰ تومان', icon: 'MessageCircle', isAvailable: true },
  { id: 6, type: 'service', category: 'app', title: 'ساخت اپلیکیشن اندروید', desc: 'نیتیو و کراس‌پلتفرم', price: 'از ۱۵,۰۰۰,۰۰۰ تومان', icon: 'Smartphone', isAvailable: true },
];

let users: any[] = [];
let chats: Chat[] = [
  { 
    id: 1, 
    userId: 'user@example.com', 
    messages: [
      { sender: 'user', text: 'سلام، برای ربات تلگرام نیاز به مشاوره دارم.', createdAt: new Date().toISOString() }, 
      { sender: 'admin', text: 'سلام! در خدمتیم. چه امکانی مد نظرتون هست؟', createdAt: new Date().toISOString() }
    ],
    updatedAt: new Date().toISOString()
  }
];

let orders: Order[] = [
  { id: 1024, productId: 1, productTitle: 'اپل آیدی اختصاصی', productPrice: '۳۵۰,۰۰۰ تومان', userId: 'user@example.com', status: 'pending', createdAt: new Date().toISOString(), details: 'پک اشانتیون دارد' }
];

let settings = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  baleToken: '',
  adminIdNumber: process.env.MAIN_ADMIN_ID || '',
  subAdminIds: '', // comma separated admin numeric IDs
  smtpHost: '',
  smtpPort: '',
  smtpUser: '',
  smtpPass: '',
  enableMobileLogin: true,
  // Backup-specific settings
  backupAutoEnabled: false,
  backupScheduleHour: 2,
  backupScheduleMinute: 0,
  backupPassword: '',
  backupSendTelegram: true,
  backupSendBale: true
};

// --- Storage Controls ---
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
      if (fileData.trim()) {
        const parsed = JSON.parse(fileData);
        if (parsed.products) products = parsed.products;
        if (parsed.users) users = parsed.users;
        if (parsed.chats) chats = parsed.chats;
        if (parsed.orders) orders = parsed.orders;
        if (parsed.settings) settings = { ...settings, ...parsed.settings };
        console.log(`[DATABASE] Data loaded successfully from data.json. Total items: ${products.length} products, ${orders.length} orders.`);
      }
    } else {
      saveData();
    }
  } catch (err) {
    console.error('[DATABASE] Error reading data.json. Using defaults.', err);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ products, users, chats, orders, settings }, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DATABASE] Error saving data.json.', err);
  }
}

// Initial pull
loadData();

// --- Auth Temp Space ---
const otps: Record<string, string> = {};

// --- Bot Objects ---
let telegramBot: TelegramBot | null = null;
let baleInterval: NodeJS.Timeout | null = null;

function isAdmin(chatId: number | string): boolean {
  const mainId = settings.adminIdNumber.toString().trim();
  const subIds = settings.subAdminIds.split(',').map(s => s.trim()).filter(Boolean);
  const chatIdStr = chatId.toString().trim();
  return chatIdStr === mainId || subIds.includes(chatIdStr);
}

// Admin message broadcaster
function notifyAdmins(text: string) {
  // Telegram notification
  if (telegramBot && settings.telegramToken) {
    const mainId = settings.adminIdNumber.trim();
    if (mainId) {
      telegramBot.sendMessage(mainId, text, { parse_mode: 'HTML' }).catch(() => {});
    }
    const subIds = settings.subAdminIds.split(',').map(s => s.trim()).filter(Boolean);
    subIds.forEach(id => {
      telegramBot!.sendMessage(id, text, { parse_mode: 'HTML' }).catch(() => {});
    });
  }

  // Bale notification
  if (settings.baleToken) {
    const mainId = settings.adminIdNumber.trim();
    if (mainId) {
      sendBaleMessage(mainId, text);
    }
    const subIds = settings.subAdminIds.split(',').map(s => s.trim()).filter(Boolean);
    subIds.forEach(id => {
      sendBaleMessage(id, text);
    });
  }
}

// --- Cryptography and Automated Backup System Helpers ---
function encryptData(text: string, pass: string): string {
  if (!pass) return text;
  // Create a robust 256-bit key from password
  const hash = crypto.createHash('sha256').update(pass).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', hash, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Return iv + ":" + encrypted
  return iv.toString('hex') + ':' + encrypted;
}

function decryptData(text: string, pass: string): string {
  try {
    if (!pass) return text;
    const parts = text.split(':');
    if (parts.length !== 2) return text; // Not encrypted
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const hash = crypto.createHash('sha256').update(pass).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', hash, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    throw new Error('گذرواژه وارد شده نامعتبر است یا ساختار فایل مخدوش است.');
  }
}

async function sendTelegramDocument(chatId: any, content: string, filename: string) {
  try {
    if (telegramBot && settings.telegramToken) {
      const formData = new FormData();
      formData.append('chat_id', String(chatId));
      const label = settings.backupPassword ? 'فایل پشتیبان حفاظت‌شده دیجیتال استور (رمزنگاری AES-256)' : 'فایل پشتیبان دیجیتال استور';
      formData.append('caption', `📦 ${label}\n⏰ زمان ارسال: ${new Date().toLocaleTimeString('fa-IR')}`);
      
      const blob = new Blob([content], { type: 'application/json' });
      formData.append('document', blob, filename);

      const res = await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendDocument`, {
        method: 'POST',
        body: formData
      });
      return await res.json();
    }
  } catch (err) {
    console.error('[BACKUP] Telegram sendDocument failed:', err);
  }
}

async function sendBaleDocument(chatId: any, content: string, filename: string) {
  try {
    if (settings.baleToken) {
      const formData = new FormData();
      formData.append('chat_id', String(chatId));
      const label = settings.backupPassword ? 'فایل پشتیبان حفاظت‌شده دیجیتال استور (رمزنگاری AES-256)' : 'فایل پشتیبان دیجیتال استور';
      formData.append('caption', `📦 ${label}\n⏰ زمان ارسال: ${new Date().toLocaleTimeString('fa-IR')}`);
      
      const blob = new Blob([content], { type: 'application/json' });
      formData.append('document', blob, filename);

      const res = await fetch(`https://tapi.bale.ai/bot${settings.baleToken}/sendDocument`, {
        method: 'POST',
        body: formData
      });
      return await res.json();
    }
  } catch (err) {
    console.error('[BACKUP] Bale sendDocument failed:', err);
  }
}

async function executeBackup() {
  const backupObj = {
    products,
    users,
    chats,
    orders,
    settings,
    timestamp: new Date().toISOString()
  };
  
  const jsonString = JSON.stringify(backupObj, null, 2);
  const isEncrypted = !!settings.backupPassword;
  const content = isEncrypted ? encryptData(jsonString, settings.backupPassword) : jsonString;
  const filename = isEncrypted ? `backup-secure-${Date.now()}.enc` : `backup-${Date.now()}.json`;

  const label = isEncrypted 
    ? `🔐 <b>پشتیبان‌گیری خودکار رمزگذاری شده</b>\n\n🔑 فایل با پسورد حفاظتی شما رمزنگاری AES-256 شده است.`
    : `📦 <b>پشتیبان‌گیری خودکار استاندارد</b>\n\n⚠️ فاقد رمز عبور است.`;

  const msgText = `${label}\n📅 تاریخ: <code>${new Date().toLocaleDateString('fa-IR')}</code>\n⏰ ساعت: <code>${new Date().toLocaleTimeString('fa-IR')}</code>\n📁 نام فایل اصلی: <code>${filename}</code>`;

  // 1. Send text description
  notifyAdmins(msgText);

  // 2. Deliver document to Telegram if enabled
  if (settings.backupSendTelegram && settings.telegramToken) {
    const mainId = settings.adminIdNumber.trim();
    if (mainId) {
      await sendTelegramDocument(mainId, content, filename);
    }
    const subIds = settings.subAdminIds.split(',').map(s => s.trim()).filter(Boolean);
    for (const id of subIds) {
      await sendTelegramDocument(id, content, filename);
    }
  }

  // 3. Deliver document to Bale if enabled
  if (settings.backupSendBale && settings.baleToken) {
    const mainId = settings.adminIdNumber.trim();
    if (mainId) {
      await sendBaleDocument(mainId, content, filename);
    }
    const subIds = settings.subAdminIds.split(',').map(s => s.trim()).filter(Boolean);
    for (const id of subIds) {
      await sendBaleDocument(id, content, filename);
    }
  }

  console.log(`[BACKUP] Auto-backup executed successfully and transmitted to bots.`);
}

let lastBackupDate: string = '';

function startAutomaticBackupScheduler() {
  console.log(`[BACKUP] Scheduler thread loaded. Monitoring ticks.`);
  setInterval(async () => {
    try {
      if (!settings.backupAutoEnabled) return;
      
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayString = now.toDateString();
      
      if (currentHour === Number(settings.backupScheduleHour) && 
          currentMinute === Number(settings.backupScheduleMinute) && 
          lastBackupDate !== todayString) {
        
        lastBackupDate = todayString;
        console.log(`[BACKUP] Triggering scheduled auto-backup at ${currentHour}:${currentMinute}...`);
        await executeBackup();
      }
    } catch (err) {
      console.error('[BACKUP] Error inside scheduler:', err);
    }
  }, 60000); // Ticks every 60 seconds
}

// --- Telegram Bot Loop ---
function initTelegramBot() {
  if (telegramBot) {
    try {
      telegramBot.stopPolling();
    } catch (e) {}
    telegramBot = null;
  }
  
  if (settings.telegramToken) {
    try {
      telegramBot = new TelegramBot(settings.telegramToken, { polling: true });
      
      // Silence and log polling and general errors so censored networks (like Iran) do not crash the express server process
      telegramBot.on('polling_error', (error: any) => {
        console.warn(`[BOT-WARNING] Telegram polling error (commonly due to server network limitations or censorship):`, error.message || error);
      });
      telegramBot.on('error', (error: any) => {
        console.error(`[BOT-ERROR] Telegram general error:`, error.message || error);
      });

      console.log(`[BOT] Telegram Bot initialized successfully.`);
      
      telegramBot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const adminRole = isAdmin(chatId) ? "👑 شما به عنوان مدیر شناخته شدید.\n" : "";
        const baseWebUrl = getBaseUrl();
        
        const opts = {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛒 محصولات و سرویس‌ها', callback_data: 'products' }],
              [{ text: '📦 پیگیری سفارشات من', callback_data: 'track_orders' }],
              [{ text: '💬 پشتیبانی آنلاین', callback_data: 'support' }],
              isAdmin(chatId) ? [{ text: '🔑 پنل وب ادمین', url: `${baseWebUrl}/admin` }] : []
            ].filter(row => row.length > 0)
          }
        };
        
        telegramBot!.sendMessage(chatId, `سلام و درود! به دیجیتال استور خوش آمدید. 🛍️ ✨\n\n${adminRole}برای خرید یا پیگیری درخواست ارسالی خود، از دکمه‌های شیشه‌ای زیر استفاده نمایید:`, opts);
      });

      // Regular text messaging for dynamic order tracker
      telegramBot.on('message', (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text?.trim();
        if (!text || text.startsWith('/')) return;

        // Custom direct keyword order tracking
        if (text.includes('@') || text.match(/^09\d{9}$/)) {
          const matchedOrders = orders.filter(o => o.userId === text);
          if (matchedOrders.length === 0) {
            telegramBot!.sendMessage(chatId, `❌ هیچ سفارش فعالی برای شناسه "${text}" ثبت نشده است.`);
          } else {
            let res = `📦 لیست سفارشات یافت شده برای <code>${text}</code>:\n\n`;
            matchedOrders.forEach((o, i) => {
              const statusSymbol = o.status === 'completed' ? '✅ تحویل شده (موفق)' : o.status === 'canceled' ? '❌ لغو شده' : '⏳ در حال بررسی و تحویل';
              res += `${i + 1}. سفارش <b>#${o.id}</b>\n🎁 محصول: ${o.productTitle}\n💳 مبلغ: ${o.productPrice}\nوضعیت سفارش: ${statusSymbol}\n📅 تاریخ ثبت: ${new Date(o.createdAt).toLocaleDateString('fa-IR')}\n`;
              if (o.deliveredContent) {
                res += `🔑 اطلاعات لایسنس / نحوه تحویل:\n<blockquote>${o.deliveredContent}</blockquote>\n`;
              }
              res += `----------------------------\n`;
            });
            telegramBot!.sendMessage(chatId, res, { parse_mode: 'HTML' });
          }
        }
      });

      telegramBot.on('callback_query', (query) => {
        const chatId = query.message?.chat.id;
        const data = query.data;
        if (!chatId || !data) return;

        if (data === 'products') {
          const available = products.filter(p => p.isAvailable !== false);
          if (available.length === 0) {
             telegramBot!.sendMessage(chatId, 'کالایی در حال حاضر ثبت نشده است.');
          } else {
             const kb = available.map(p => ([{ text: `🛒 ${p.title} (${p.price})`, callback_data: `view_p_${p.id}` }]));
             kb.push([{ text: '🔙 بازگشت به منوی اصلی', callback_data: 'main_menu' }]);
             telegramBot!.sendMessage(chatId, '📦 منوی محصولات آنلاین:\nلطفا جهت مشاهده جزییات یا خرید کلیک کنید:', {
                reply_markup: { inline_keyboard: kb }
             });
          }
        }

        if (query.data && query.data.startsWith('view_p_')) {
          const pId = query.data.split('_')[2];
          const pr = products.find(p => String(p.id) === pId);
          if (pr) {
             const baseWebUrl = getBaseUrl();
             const text = `<b>💎 ${pr.title}</b>\n\n📌 توضیحات: ${pr.desc}\n💰 قیمت کالا: ${pr.price}\n🔹 نوع خدمت: ${pr.type === 'account' ? 'تحویل اکانت' : 'خدمات ساخت و مشاوره'}`;
             telegramBot!.sendMessage(chatId, text, {
                parse_mode: 'HTML',
                reply_markup: {
                   inline_keyboard: [
                      [{ text: '🌐 سفارش سریع در سایت', url: `${baseWebUrl}` }],
                      [{ text: '🔙 لیست خدمات', callback_data: 'products' }]
                   ]
                }
             });
          }
        }

        if (data === 'track_orders') {
           telegramBot!.sendMessage(chatId, '🔑 جهت پیگیری سفارش صادر شده، لطفاً <b>ایمیل یا شماره موبایل ثبتی</b> خود را بفرستید.\nمثال: <code>example@gmail.com</code>', { parse_mode: 'HTML' });
        }

        if (data === 'support') {
           telegramBot!.sendMessage(chatId, '💬 پشتیبانی دیجیتال استور:\nلطفاً تیکت یا پیام خود را در داشبورد وب‌سایت ارسال فرمایید یا مستقیماً موضوع را با ادمین‌ها مطرح کنید.');
        }

        if (data === 'main_menu') {
           const opts = {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🛒 محصولات و سرویس‌ها', callback_data: 'products' }],
                  [{ text: '📦 پیگیری سفارشات من', callback_data: 'track_orders' }],
                  [{ text: '💬 پشتیبانی آنلاین', callback_data: 'support' }]
                ]
              }
           };
           telegramBot!.sendMessage(chatId, 'به منوی اصلی بازگشتید:', opts);
        }

        telegramBot!.answerCallbackQuery(query.id);
      });
      
    } catch (err) {
      console.error('[BOT-TELEGRAM] Failed to boot Telegram bot:', err);
    }
  }
}

// --- Bale Custom Poller ---
// Direct interaction loop for Bale using HTTP polling to make sure it doesn't fail
async function initBaleBot() {
  if (baleInterval) {
    clearInterval(baleInterval);
    baleInterval = null;
  }

  if (settings.baleToken) {
    console.log(`[BOT] Bale custom polling activated for token: ${settings.baleToken.substring(0, 8)}...`);
    let lastUpdateId = 0;

    baleInterval = setInterval(async () => {
      try {
        const res = await fetch(`https://tapi.bale.ai/bot${settings.baleToken}/getUpdates?offset=${lastUpdateId + 1}&limit=10&timeout=2`);
        if (!res.ok) return;
        const body: any = await res.json();
        
        if (body.ok && body.result && Array.isArray(body.result)) {
          for (const update of body.result) {
            lastUpdateId = update.update_id;
            const msg = update.message;
            const callback = update.callback_query;

            // Handle standard chat message
            if (msg && msg.text) {
              const chatId = msg.chat.id;
              const text = msg.text.trim();

              if (text.startsWith('/start')) {
                const adminRole = isAdmin(chatId) ? "👑 شما مدیر اصلی هستید.\n" : "";
                const baseWebUrl = getBaseUrl();
                await sendBaleMessage(chatId, `سلام! به ربات بله دیجیتال استور خوش آمدید. 🛍️\n\n${adminRole}لطفا برای سفارش دهی یا پیگیری خرید خود اقدام کنید:`, [
                  [{ text: '🛒 محصولات و خدمات', callback_data: 'products' }],
                  [{ text: '📦 پیگیری سفارشات', callback_data: 'orders' }],
                  [{ text: '💬 پشتیبانی', callback_data: 'support' }]
                ]);
              } else if (text.includes('@') || text.match(/^09\d{9}$/)) {
                // Return orders of matches
                const matchedOrders = orders.filter(o => o.userId === text);
                if (matchedOrders.length === 0) {
                  await sendBaleMessage(chatId, `❌ سفارشی برای شماره/ایمیل "${text}" ثبت نشده است.`);
                } else {
                  let reply = `📦 وضعیت سفارشات شما در بله:\n\n`;
                  matchedOrders.forEach((o, index) => {
                     const statusLabel = o.status === 'completed' ? '✅ تحویل شده' : o.status === 'canceled' ? '❌ لغو شده' : '⏳ در انتظار تایید ادمین';
                     reply += `${index+1}. سفارش #${o.id}\n📁 محصول: ${o.productTitle}\nقیمت: ${o.productPrice}\nوضعیت: ${statusLabel}\n`;
                     if (o.deliveredContent) {
                        reply += `📦 جزئیات تحویل: ${o.deliveredContent}\n`;
                     }
                     reply += `----------------\n`;
                  });
                  await sendBaleMessage(chatId, reply);
                }
              } else {
                await sendBaleMessage(chatId, `پیام دریافت شد. جهت دریافت لیست سفارشات خود، ایمیل یا موبایل خود را تایپ و ارسال فرمایید.`);
              }
            }

            // Handle glass menu callbacks
            if (callback) {
              const chatId = callback.message?.chat.id;
              const callbackData = callback.data;
              if (chatId && callbackData) {
                if (callbackData === 'products') {
                  const available = products.filter(p => p.isAvailable !== false);
                  const kb = available.map(p => ([{ text: `🛒 ${p.title} (${p.price})`, callback_data: `buy_${p.id}` }]));
                  kb.push([{ text: '🔙 بازگشت', callback_data: 'main_menu' }]);
                  await sendBaleMessage(chatId, '📦 لیست محصولات فروشگاه دیجیتال:', kb);
                } else if (callbackData === 'main_menu') {
                  await sendBaleMessage(chatId, 'منوی اصلی ربات:', [
                    [{ text: '🛒 محصولات و خدمات', callback_data: 'products' }],
                    [{ text: '📦 پیگیری سفارشات', callback_data: 'orders' }],
                    [{ text: '💬 پشتیبانی', callback_data: 'support' }]
                  ]);
                } else if (callbackData === 'orders') {
                  await sendBaleMessage(chatId, '🔑 جهت پیگیری آسان خرید، لطفاً ایمیل یا موبایل ثبت شده خود را ارسال فرمایید:');
                } else if (callbackData === 'support') {
                  await sendBaleMessage(chatId, '💬 پشتیبانی ادمین:\nجهت مشاوره با ادمین یا ثبت قرارداد در سایت اقدام فرمایید.');
                } else if (callbackData.startsWith('buy_')) {
                  const pId = callbackData.split('_')[1];
                  const p = products.find(x => String(x.id) === pId);
                  if (p) {
                    const baseWebUrl = getBaseUrl();
                    await sendBaleMessage(chatId, `💎 *${p.title}*\n💵 قیمت: ${p.price}\n📝 ${p.desc}\n\nجهت سفارش سریع به وب‌سایت زیر مراجعه کنید:\n${baseWebUrl}`);
                  }
                }
              }

              // Answer callback
              await fetch(`https://tapi.bale.ai/bot${settings.baleToken}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: callback.id })
              }).catch(() => {});
            }
          }
        }
      } catch (err) {
        // Ignored
      }
    }, 2500);
  }
}

async function sendBaleMessage(chatId: any, text: string, replyMarkup?: any) {
  try {
    await fetch(`https://tapi.bale.ai/bot${settings.baleToken}/sendMessage`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          reply_markup: replyMarkup ? { inline_keyboard: replyMarkup } : undefined
       })
    });
  } catch (err) {}
}

// Start both on server load
initTelegramBot();
initBaleBot();

// --- Main Server Function ---
async function startServer() {
  const app = express();
  
  // Robust production detection that works both on local dev environment and real Linux servers (including PM2)
  const argvPath = process.argv[1] || '';
  const isProd = process.env.NODE_ENV === 'production' || 
                 argvPath.includes('dist') || 
                 argvPath.endsWith('.cjs') || 
                 (typeof __filename !== 'undefined' && (__filename.includes('dist') || __filename.endsWith('.cjs'))) ||
                 !fs.existsSync(path.join(process.cwd(), 'server.ts')) ||
                 fs.existsSync(path.join(process.cwd(), 'dist/index.html'));
  
  const PORT = Number(process.env.APP_PORT || process.env.PORT || 3000);

  app.use(express.json());

  // --- API Routes: Public Config ---
  app.get('/api/config', (req, res) => {
    res.json({ enableMobileLogin: settings.enableMobileLogin });
  });

  // --- API Routes: Products (Public & Admin CRUD) ---
  app.get('/api/products', (req, res) => {
    res.json(products);
  });

  app.post('/api/admin/products', (req, res) => {
    const { type, category, title, desc, price, icon, image, details, isAvailable } = req.body;
    const newProduct: Product = {
      id: Date.now(),
      type: type || 'account',
      category: category || 'general',
      title: title || 'کالای جدید',
      desc: desc || '',
      price: price || 'توافقی',
      icon: icon || 'Bot',
      image: image || '',
      details: details || '',
      isAvailable: isAvailable !== false
    };
    products.push(newProduct);
    saveData();
    res.json({ success: true, product: newProduct });
  });

  app.put('/api/admin/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ success: false, message: 'کالا یافت نشد' });
    
    products[index] = { ...products[index], ...req.body };
    saveData();
    res.json({ success: true, product: products[index] });
  });

  app.delete('/api/admin/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    products = products.filter(p => p.id !== id);
    saveData();
    res.json({ success: true });
  });

  // --- API Routes: Orders (Public submission & Admin actions) ---
  app.get('/api/orders', (req, res) => {
    const { userId } = req.query;
    if (userId) {
      const userOrders = orders.filter(o => o.userId === userId);
      return res.json(userOrders);
    }
    res.json(orders);
  });

  app.post('/api/orders', (req, res) => {
    const { productId, userId, details } = req.body;
    const prod = products.find(p => p.id === productId);
    if (!prod) return res.status(404).json({ success: false, message: 'محصول یافت نشد' });

    const newOrder: Order = {
      id: Math.floor(10000 + Math.random() * 90000), // Unique order number
      productId,
      productTitle: prod.title,
      productPrice: prod.price,
      userId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      details
    };
    
    orders.unshift(newOrder);
    saveData();

    // Alert Telegram / Bale bot admins of brand new orders!
    notifyAdmins(`📥 <b>درخواست خرید جدید ثبت شد!</b>\n\n📌 شماره سفارش: <code>#${newOrder.id}</code>\n📦 محصول: <b>${newOrder.productTitle}</b>\n💳 قیمت کالا: ${newOrder.productPrice}\n👤 خریدار: <code>${newOrder.userId}</code>\n✍️ توضیحات سفارش دهنده:\n<blockquote>${newOrder.details || 'بدون توضیحات اضافی'}</blockquote>`);

    res.json({ success: true, order: newOrder });
  });

  app.put('/api/admin/orders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return res.status(404).json({ success: false, message: 'سفارش یافت نشد' });

    orders[index] = { ...orders[index], ...req.body };
    saveData();

    // Notify user can check their status inside user panel or bot
    res.json({ success: true, order: orders[index] });
  });

  app.delete('/api/admin/orders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    orders = orders.filter(o => o.id !== id);
    saveData();
    res.json({ success: true });
  });

  // --- API Routes: Users / Auth OTP ---
  app.post('/api/auth/email/send', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'ایمیل الزامی است' });

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    otps[email] = token;

    if (settings.smtpHost && settings.smtpUser && settings.smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: settings.smtpHost,
          port: parseInt(settings.smtpPort) || 587,
          secure: parseInt(settings.smtpPort) === 465,
          auth: {
            user: settings.smtpUser,
            pass: settings.smtpPass,
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        await transporter.sendMail({
          from: `"ديجيتال استور" <${settings.smtpUser}>`,
          to: email,
          subject: 'کد تایید ورود به پنل دیجیتال استور',
          text: `کد تایید شما: ${token}`,
          html: `<div style="direction: rtl; font-family: Tahoma; text-align: right; padding: 20px;">
                   <h2>کد تایید ورود جهت ورود به پنل کاربری:</h2>
                   <p style="font-size: 18px; color: #4f46e5; font-weight: bold; padding: 10px; background: #f3f4f6; text-align: center; display: inline-block; border-radius: 8px;">${token}</p>
                 </div>`
        });
        console.log(`[SMTP] OTP sent to ${email} successfully.`);
      } catch (err: any) {
        console.error('[SMTP-ERROR] SMTP Failed to transmit:', err.message);
      }
    } else {
      console.log(`[MOCK-OTP] For Email: ${email} -> CODE: ${token}`);
    }

    res.json({ success: true, message: 'کد با موفقیت ارسال شد.' });
  });

  app.post('/api/auth/email/verify', (req, res) => {
    const { email, code } = req.body;
    if (!email || !code || otps[email] !== code) {
      return res.status(401).json({ success: false, message: 'کد وارد شده نامعتبر یا منقضی است.' });
    }

    delete otps[email];

    let user = users.find(u => u.email === email);
    if (!user) {
      user = { id: Date.now(), email, role: 'user', createdAt: new Date().toISOString() };
      users.push(user);
    }
    saveData();
    
    res.json({ success: true, token: `user-token-${user.id}`, user });
  });

  app.post('/api/auth/phone/send', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'شماره موبایل الزامی است' });

    if (!settings.enableMobileLogin) {
      return res.status(403).json({ success: false, message: 'ورود با شماره موبایل فعلا غیرفعال است.' });
    }

    const token = Math.floor(1000 + Math.random() * 9000).toString();
    otps[phone] = token;

    // Send the user verification check as bot notification as well
    notifyAdmins(`🔑 <b>کد تایید جدید درخواست شد:</b>\n\n📱 شماره تلفن: <code>${phone}</code>\n🔢 کد تأیید: <code>${token}</code>\n(کاربر گرامی در صورتی که شماره شماست کافیست این کد را در فیلد سایت درج کنید)`);

    console.log(`[PHONE-OTP] OTP for ${phone}: ${token}`);
    res.json({ success: true, message: 'کد به تلگرام و بله شما ارسال شد (در صورت لاگین در ربات)' });
  });

  app.post('/api/auth/phone/verify', (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code || otps[phone] !== code) {
      return res.status(401).json({ success: false, message: 'کد نامعتبر است' });
    }

    delete otps[phone];

    let user = users.find(u => u.phone === phone);
    if (!user) {
      user = { id: Date.now(), phone, role: 'user', createdAt: new Date().toISOString() };
      users.push(user);
    }
    saveData();
    res.json({ success: true, token: `user-token-${user.id}`, user, accountType: 'phone' });
  });

  // --- API Routes: Support Chat & Tickets ---
  app.get('/api/chat/:userId', (req, res) => {
    const userChat = chats.find(c => c.userId === req.params.userId) || { id: Date.now(), userId: req.params.userId, messages: [], updatedAt: new Date().toISOString() };
    res.json(userChat);
  });

  app.post('/api/chat/:userId', (req, res) => {
    const { sender, text } = req.body;
    let userChat = chats.find(c => c.userId === req.params.userId);
    if (!userChat) {
      userChat = { id: Date.now(), userId: req.params.userId, messages: [], updatedAt: new Date().toISOString() };
      chats.push(userChat);
    }
    
    const newMsg = { sender, text, createdAt: new Date().toISOString() };
    userChat.messages.push(newMsg);
    userChat.updatedAt = new Date().toISOString();
    saveData();
    
    // If sent by user, send alert message to administrators!
    if (sender === 'user') {
       notifyAdmins(`💬 <b>پیام پشتیبانی دریافتی جدید:</b>\n\n👤 فرستنده: <code>${req.params.userId}</code>\n✉️ متن پیام:\n<blockquote>${text}</blockquote>`);
    }

    res.json(userChat);
  });

  app.get('/api/admin/chats', (req, res) => {
    res.json(chats);
  });

  // --- API Routes: Admin Settings ---
  app.get('/api/admin/settings', (req, res) => {
    res.json(settings);
  });

  app.post('/api/admin/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    saveData();
    // Dynamically restart bot listeners instantly using new tokens!
    initTelegramBot();
    initBaleBot();
    res.json({ success: true, settings });
  });

  app.get('/api/admin/backup', (req, res) => {
    const { password } = req.query;
    const backupObj = { products, users, chats, orders, settings, timestamp: new Date().toISOString() };
    const jsonString = JSON.stringify(backupObj, null, 2);
    
    if (password) {
      try {
        const encrypted = encryptData(jsonString, String(password));
        return res.json({ success: true, encrypted: true, data: encrypted });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }
    res.json({ success: true, encrypted: false, backup: backupObj });
  });

  app.post('/api/admin/backup/send-now', async (req, res) => {
    try {
      await executeBackup();
      res.json({ success: true, message: 'بکاپ با موفقیت تهیه و به بات‌های ادمین فرستاده شد.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'خطا در ارسال بکاپ: ' + err.message });
    }
  });

  app.post('/api/admin/restore', (req, res) => {
    try {
      const { data, password } = req.body;
      if (!data) return res.status(400).json({ success: false, message: 'فایل پشتیبان معتبری دریافت نشده است.' });

      let jsonString = data;
      // If of encrypted style and password exists, let's decrypt
      if (data.toString().includes(':') && !data.toString().trim().startsWith('{')) {
        if (!password) {
          return res.status(405).json({ success: false, message: 'این فایل بکاپ رمزنگاری شده است. لطفاً رمز عبور صحیح بکاپ را وارد کنید.' });
        }
        jsonString = decryptData(data.toString(), password);
      }

      const parsed = JSON.parse(jsonString);
      if (parsed.products) products = parsed.products;
      if (parsed.users) users = parsed.users;
      if (parsed.chats) chats = parsed.chats;
      if (parsed.orders) orders = parsed.orders;
      if (parsed.settings) {
        settings = { ...settings, ...parsed.settings };
      }
      
      saveData();
      res.json({ success: true, message: 'بازیابی کامل اطلاعات با موفقیت به پایان رسید.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: 'خطا در پردازش فایل بکاپ: ' + err.message });
    }
  });

  app.post('/api/admin/auth', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || '1234';
    if (username === adminUser && password === adminPass) {
      res.json({ success: true, token: 'validated-admin-token', role: 'main_admin' });
    } else {
      res.status(401).json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است.' });
    }
  });

  // --- Vite development middleware ---
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // If running compiled bundle from dist/ folder, __dirname points directly to dist/
    // Otherwise fallback to process.cwd() / 'dist'
    const distPath = __dirname.includes('dist') ? __dirname : path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  startAutomaticBackupScheduler();

  app.listen(PORT, '0.0.0.0', async () => {
    await autoDetectPublicIP();
    console.log(`[SERVER] Fullstack Server running on ${getBaseUrl()}`);
  });
}

startServer();
