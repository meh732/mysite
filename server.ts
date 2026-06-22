import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';

// Import modular components
import {
  groups, subGroups, products, orders, users, chats, settings, botUsers, tickets, transactions,
  loadDatabase, saveDatabase, formatPriceToman, parsePrice, otps
} from './src/db/db';
import { botRequest } from './src/bot/botService';
import { pollTelegram, pollBale } from './src/bot/botPolling';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.APP_PORT || process.env.PORT || '3000', 10);

  app.use(express.json());

  // Load database on start
  loadDatabase();

  // --- API Routes: Public Config ---
  app.get('/api/config', (req, res) => {
    res.json({
      siteName: 'دیجیتال استور',
      social: {
        instagram: settings.socialInstagram,
        telegram: settings.socialTelegram,
        whatsapp: settings.socialWhatsapp,
        bale: settings.socialBale,
        x: settings.socialX,
      },
      contact: {
        phone: settings.contactPhone,
        email: settings.contactEmail,
        address: settings.contactAddress
      },
      heroVideoUrl: settings.heroVideoUrl,
      payment: {
        onlineEnabled: settings.onlinePaymentEnabled,
        cardEnabled: settings.cardPaymentEnabled,
        cardNo: settings.cardNo,
        cardHolder: settings.cardHolder,
        cardBank: settings.cardBank
      },
      enableMobileLogin: settings.enableMobileLogin,
      siteLogoUrl: settings.siteLogoUrl
    });
  });

  // --- API Routes: Groups & Categories ---
  app.get('/api/groups', (req, res) => res.json(groups));
  app.post('/api/groups', (req, res) => {
    const newGroup = { id: Date.now(), active: true, ...req.body };
    groups.push(newGroup);
    saveDatabase();
    res.json({ success: true, group: newGroup });
  });
  app.get('/api/subgroups', (req, res) => res.json(subGroups));
  app.post('/api/subgroups', (req, res) => {
    const newSubGroup = { id: Date.now(), active: true, ...req.body, groupId: parseInt(req.body.groupId, 10) };
    subGroups.push(newSubGroup);
    saveDatabase();
    res.json({ success: true, subGroup: newSubGroup });
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

  // --- API Routes: Users / Auth ---
  app.post('/api/auth/register', (req, res) => {
    const { name, email, phone, password } = req.body;
    const cleanEmail = email?.toLowerCase().trim();
    if (cleanEmail && users.find(u => u.email?.toLowerCase() === cleanEmail)) {
        return res.status(400).json({ success: false, message: 'ایمیل تکراری است' });
    }
    const newUser: any = { id: Date.now(), name, email: cleanEmail, phone, password, role: 'user', walletBalance: 0, status: 'active', createdAt: new Date().toISOString() };
    users.push(newUser);
    saveDatabase();
    res.json({ success: true, user: newUser });
  });

  app.post('/api/auth/login-with-password', (req, res) => {
    const { identifier, password } = req.body;
    const cleanId = identifier.trim().toLowerCase();
    const user = users.find(u => (u.email?.toLowerCase() === cleanId || u.phone === cleanId) && u.password === password);
    if (user) {
      res.json({ success: true, token: `user-token-${user.id}`, user });
    } else {
      res.status(401).json({ success: false, message: 'اطلاعات نادرست است' });
    }
  });

  app.post('/api/auth/phone/send', async (req, res) => {
    const { phone } = req.body;
    if (!settings.enableMobileLogin) return res.status(403).json({ success: false, message: 'غیرفعال' });
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    otps[phone] = code;
    
    // Attempt bot send
    const userMap = botUsers.find(u => u.phone === phone);
    if (userMap) {
      const msg = `🔑 کد ورود شما: ${code}`;
      if (userMap.telegramChatId && settings.telegramToken) botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: userMap.telegramChatId, text: msg });
      if (userMap.baleChatId && settings.baleToken) botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: userMap.baleChatId, text: msg });
    }
    res.json({ success: true, message: 'کد ارسال شد' });
  });

  app.post('/api/auth/phone/verify', (req, res) => {
    const { phone, code } = req.body;
    if (otps[phone] === code) {
      delete otps[phone];
      let user = users.find(u => u.phone === phone);
      if (!user) {
        user = { id: Date.now(), phone, role: 'user', walletBalance: 0, status: 'active', createdAt: new Date().toISOString() };
        users.push(user);
        saveDatabase();
      }
      res.json({ success: true, token: `user-token-${user.id}`, user });
    } else {
      res.status(401).json({ success: false, message: 'کد نامعتبر' });
    }
  });

  // --- API Routes: Checkout & Orders ---
  app.post('/api/checkout', (req, res) => {
    const { productId, userIdentifier, additionalDetails, paymentMethod } = req.body;
    const prod = products.find(p => p.id === parseInt(productId, 10));
    if (!prod) return res.status(404).json({ message: 'Not found' });

    const newOrder = {
      id: 1000 + orders.length + 1,
      productId: prod.id,
      productTitle: prod.title,
      productType: prod.type,
      userIdentifier,
      price: prod.price,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      additionalDetails
    };
    orders.push(newOrder);
    saveDatabase();

    // Admin notify
    const adminMsg = `🔔 سفارش جدید: ${prod.title}\n👤 کاربر: ${userIdentifier}`;
    if (settings.adminTelegramChatId) botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: settings.adminTelegramChatId, text: adminMsg });
    if (settings.adminBaleChatId) botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: settings.adminBaleChatId, text: adminMsg });

    res.json({ success: true, order: newOrder });
  });

  app.get('/api/orders/user/:userIdentifier', (req, res) => {
    res.json(orders.filter(o => o.userIdentifier === req.params.userIdentifier));
  });

  // --- API Routes: Profile & Wallet ---
  app.get('/api/profile', (req, res) => {
    const user = users.find(u => u.email === req.query.userIdentifier || u.phone === req.query.userIdentifier);
    res.json({ success: true, profile: user || { walletBalance: 0 } });
  });

  app.get('/api/wallet/transactions', (req, res) => {
    res.json({ success: true, transactions: transactions.filter(t => t.userIdentifier === req.query.userIdentifier) });
  });

  // --- API Routes: Admin Panel ---
  app.get('/api/admin/settings', (req, res) => res.json(settings));
  app.post('/api/admin/settings', (req, res) => {
    Object.assign(settings, req.body);
    saveDatabase();
    res.json({ success: true, settings });
  });

  app.get('/api/admin/backup', (req, res) => {
    res.json({ success: true, backup: { products, orders, users, chats, settings, botUsers } });
  });

  app.post('/api/admin/auth', (req, res) => {
    const { username, password } = req.body;
    if (username === (process.env.ADMIN_USERNAME || 'admin') && password === (process.env.ADMIN_PASSWORD || '1234')) {
      res.json({ success: true, token: 'admin-token', role: 'main_admin' });
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  });

  // --- Vite / Static Files ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Start bot polling loops
    pollTelegram();
    pollBale();
  });
}

startServer();
