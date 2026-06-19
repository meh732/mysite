import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';

// --- Mock Database ---
let products = [
  { id: 1, type: 'account', category: 'apple', title: 'اپل آیدی اختصاصی', desc: 'با ایمیل دلخواه شما', price: '۳۵۰,۰۰۰ تومان', icon: 'Apple' },
  { id: 2, type: 'account', category: 'ai', title: 'اکانت ChatGPT Plus', desc: 'دسترسی ۳۰ روزه به GPT-4', price: '۱,۴۵۰,۰۰۰ تومان', icon: 'Bot' },
  { id: 3, type: 'account', category: 'ai', title: 'اکانت Midjourney', desc: 'اشتراک استاندارد', price: '۱,۸۰۰,۰۰۰ تومان', icon: 'Palette' },
  { id: 4, type: 'service', category: 'web', title: 'طراحی سایت شرکتی/فروشگاهی', desc: 'مدرن، ریسپانسیو و سئو شده', price: 'از ۱۰,۰۰۰,۰۰۰ تومان', icon: 'Globe' },
  { id: 5, type: 'service', category: 'bot', title: 'طراحی ربات تلگرام و بله', desc: 'فروشگاهی، پشتیبانی، مدیریت گروه', price: 'از ۳,۰۰۰,۰۰۰ تومان', icon: 'MessageCircle' },
  { id: 6, type: 'service', category: 'app', title: 'ساخت اپلیکیشن اندروید', desc: 'نیتیو و کراس‌پلتفرم', price: 'از ۱۵,۰۰۰,۰۰۰ تومان', icon: 'Smartphone' },
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

// Temp store for OTPs
const otps: Record<string, string> = {};

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
    const newProduct = { id: Date.now(), ...req.body };
    products.push(newProduct);
    res.json({ success: true, product: newProduct });
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
          port: parseInt(settings.smtpPort) || 587,
          secure: parseInt(settings.smtpPort) === 465,
          auth: {
            user: settings.smtpUser,
            pass: settings.smtpPass,
          },
        });
        await transporter.sendMail({
          from: `"Digital Store" <${settings.smtpUser}>`,
          to: email,
          subject: 'کد تایید ورود',
          text: `کد تایید شما: ${token}`,
          html: `<p>کد تایید شما: <strong>${token}</strong></p>`
        });
        console.log(`OTP sent to ${email} via SMTP.`);
      } catch (err: any) {
        console.error('SMTP Error:', err.message);
        // Fallback or just inform
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
    }
    
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

    // Simulate sending OTP to Telegram & Bale bots
    console.log(`[BOT] OTP for ${phone}: ${token}`);
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
      user = { id: Date.now(), phone, role: 'user', createdAt: new Date() };
      users.push(user);
    }
    res.json({ success: true, token: `user-token-${user.id}`, user, accountType: 'phone' });
  });

  app.post('/api/checkout', (req, res) => {
    res.json({ success: true, message: 'سفارش با موفقیت ثبت شد' });
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
    res.json(chat);
  });

  // --- API Routes: Settings / Backup ---
  app.get('/api/admin/settings', (req, res) => {
    res.json(settings);
  });
  app.post('/api/admin/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    res.json({ success: true, settings });
  });
  app.get('/api/admin/backup', (req, res) => {
    const backupData = { products, users, chats, settings, timestamp: new Date() };
    res.json({ success: true, backup: backupData });
  });

  // --- API Routes: Bots Mock ---
  // A real webhook would extract phone/id and register/login the user
  app.post('/api/bot/telegram/:token', (req, res) => {
    console.log('Telegram Hook called. Syncing User...');
    // Simulated sync: users.push(...)
    res.sendStatus(200);
  });
  app.post('/api/bot/bale/:token', (req, res) => {
    console.log('Bale Hook called. Syncing User...');
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
