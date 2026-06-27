import { 
  settings, products, orders, users, transactions, botUsers, chats, saveDatabase, 
  adminModeOverride, userCheckoutStates, otps, formatPriceToman, parsePrice 
} from '../db/db';
import { botRequest, isUserMemberOfChannel, sendBotDocument } from './botService';

export async function handleBotUpdate(platform: 'telegram' | 'bale', update: any) {
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
      [{ text: "🔐 فعال/غیرفعال‌سازی لاگین موبایل" }, { text: "👤 سوییچ به پنل کاربری" }],
      [{ text: "💳 تغییر درگاه آنلاین" }, { text: "💳 تغییر کارت‌به‌کارت" }]
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
      const channelUsername = String(targetChannel).replace('@', '');
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
        const cleanNum = String(str).replace(/[^\d]/g, '');
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

    if (text === "💳 تغییر درگاه آنلاین") {
      settings.onlinePaymentEnabled = !settings.onlinePaymentEnabled;
      saveDatabase();
      await reply(`✅ درگاه آنلاین: ${settings.onlinePaymentEnabled ? 'فعال' : 'غیرفعال'}`, adminKeyboard);
      return;
    }
    if (text === "💳 تغییر کارت‌به‌کارت") {
      settings.cardPaymentEnabled = !settings.cardPaymentEnabled;
      saveDatabase();
      await reply(`✅ کارت به کارت: ${settings.cardPaymentEnabled ? 'فعال' : 'غیرفعال'}`, adminKeyboard);
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
    if (text.startsWith('admin_order_') || text.startsWith('approve_order_') || text.startsWith('reject_order_') || text.startsWith('admin_prod_') || text.startsWith('admin_toggle_')) {
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
    
    const adminInlineKeyboard = [
      [
        { text: '✅ تایید', callback_data: `approve_trans_${newTrans.id}` },
        { text: '❌ رد', callback_data: `reject_trans_${newTrans.id}` }
      ]
    ];

    if (settings.adminTelegramChatId && settings.telegramToken) {
      await botRequest('https://api.telegram.org', settings.telegramToken, 'sendPhoto', { 
        chat_id: settings.adminTelegramChatId, 
        photo: fileId,
        caption: adminMsg,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: adminInlineKeyboard } 
      });
    }
    if (settings.adminBaleChatId && settings.baleToken) {
      await botRequest('https://tapi.bale.ai', settings.baleToken, 'sendPhoto', { 
        chat_id: settings.adminBaleChatId, 
        photo: fileId, 
        caption: adminMsg,
        reply_markup: { inline_keyboard: adminInlineKeyboard }
      });
    }
    return;
  }

  // --- Start Topup Flow ---
  if (text === '💰 موجودی و شارژ حساب' || text === '/wallet') {
    const userObj = users.find(u => u.phone === userMap.phone);
    const balance = userObj?.walletBalance || 0;
    
    const walletText = 
      `💳 **بخش مدیریت مالی و کیف پول شما** 💳\n\n` +
      `👤 حساب کاربری: **${userMap.phone}**\n` +
      `💰 موجودی فعلی: **${balance.toLocaleString('fa-IR')} تومان**\n\n` +
      `💡 جهت شارژ کیف پول، روش مورد نظر خود را انتخاب نمایید:`;

    const topupButtons: any[] = [];
    if (settings.onlinePaymentEnabled && settings.onlinePaymentUrl) {
      topupButtons.push([{ text: `💳 شارژ آنلاین (درگاه زرین‌پال)`, callback_data: `start_topup_online` }]);
    }
    if (settings.cardPaymentEnabled) {
      topupButtons.push([{ text: `🏦 شارژ کارت به کارت (واریز دستی)`, callback_data: `start_topup_card` }]);
    }

    if (topupButtons.length === 0) {
      await reply(
        `💳 **بخش مدیریت مالی و کیف پول شما** 💳\n\n` +
        `👤 حساب کاربری: **${userMap.phone}**\n` +
        `💰 موجودی فعلی: **${balance.toLocaleString('fa-IR')} تومان**\n\n` +
        `⚠️ تمامی روش‌های افزایش اعتبار کیف پول موقتاً توسط مدیریت غیرفعال شده‌اند.`
      );
      return;
    }
    
    await reply(walletText, { inline_keyboard: topupButtons });
    return;
  }

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

  if (text === '💬 ارتباط با پشتیبانی' || text === '/support') {
    await reply(
      `💬 **بخش گفتگوی مستقیم با پشتیبانی**\n\n` +
      `لطفاً در پیام بعدی، سوال، پیشنهاد یا هر پرسشی که دارید را بنویسید.\n` +
      `پیام شما مستقیماً به تیکت‌های پنل مدیریت فرستاده شده و به محض پاسخ کارشناس، جواب آن را همین‌جا به صورت زنده دریافت خواهید کرد.`,
      getUserKeyboard(isAdmin)
    );
    return;
  }

  // Checkout states collection
  if (userCheckoutStates[chat.id]) {
    const state = userCheckoutStates[chat.id];

    if (state.pendingTopupType) {
        const amount = parseInt(text.replace(/[^0-9]/g, ''), 10);
        if (isNaN(amount) || amount <= 0) {
            await reply("❌ مبلغ وارد شده نامعتبر است. لطفاً مبلغ را به صورت عدد به تومان وارد کنید:");
            return;
        }

        if (state.pendingTopupType === 'online') {
            await reply(
                `💳 **درخواست شارژ آنلاین حساب**\n\n` +
                `💰 مبلغ درخواستی: **${amount.toLocaleString('fa-IR')} تومان**\n\n` +
                `🔗 جهت تکمیل فرآیند پرداخت و شارژ آنی حساب، لطفا روی لینک زیر کلیک کرده و عملیات را در درگاه بانکی به پایان برسانید:\n\n` +
                `${settings.onlinePaymentUrl || '⚠️ لینک پرداخت در تنظیمات تعریف نشده است.'}\n\n` +
                `پس از پرداخت موفق، موجودی شما به‌صورت خودکار در سیستم بروزرسانی خواهد شد.`,
                getUserKeyboard(isAdmin)
            );
            delete userCheckoutStates[chat.id];
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
            await reply("❌ ثبت جزئیات متوقف شد.", getUserKeyboard(isAdmin));
            return;
        }
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.additionalDetails = (order.additionalDetails || '') + ` | توضیحات خریدار: ${text}`;
            saveDatabase();
        }
        delete userCheckoutStates[chat.id];
        await reply(`✅ توضیحات شما برای سفارش #${orderId} با موفقیت ثبت شد.`, getUserKeyboard(isAdmin));
        return;
    }
  }

  if (text === 'start_topup_online' || text === 'start_topup_card') {
    const type = text === 'start_topup_online' ? 'online' : 'card';
    if (type === 'online') {
      if (!settings.onlinePaymentEnabled || !settings.onlinePaymentUrl) {
        await reply(`⚠️ روش پرداخت آنلاین غیرفعال است یا آدرس درگاه در تنظیمات توسط مدیریت تعریف نشده است.`);
        return;
      }
    } else {
      if (!settings.cardPaymentEnabled) {
        await reply(`⚠️ روش پرداخت کارت به کارت موقتاً توسط مدیریت غیرفعال شده است.`);
        return;
      }
    }
    userCheckoutStates[chat.id] = { pendingTopupType: type };
    await reply(`لطفاً مبلغ مورد نظر خود را به تومان وارد کنید:`);
    return;
  }

  // --- Callback Handlers for Topup and Purchases ---
  if (text.startsWith('approve_trans_')) {
    const transId = parseInt(text.split('_')[2], 10);
    const trans = transactions.find(t => t.id === transId);
    if (trans && trans.status === 'pending') {
      trans.status = 'approved';
      const user = users.find(u => u.phone === trans.userIdentifier);
      if (user) { user.walletBalance = (user.walletBalance || 0) + trans.amount; }
      saveDatabase();
      await reply(`✅ تراکنش #${trans.id} تایید شد.`);
      const botUser = botUsers.find(b => b.phone === trans.userIdentifier);
      if (botUser) {
        const userMsg = `✅ مبلغ **${trans.amount.toLocaleString('fa-IR')} تومان** به کیف پول شما واریز شد.`;
        if (botUser.telegramChatId) botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: botUser.telegramChatId, text: userMsg });
        if (botUser.baleChatId) botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: botUser.baleChatId, text: userMsg });
      }
    }
    return;
  }

  if (text.startsWith('buy_')) {
      const prodId = parseInt(text.split('_')[1], 10);
      const prod = products.find(p => p.id === prodId && p.active !== false);
      if (prod) {
          const priceInt = parsePrice(prod.price);
          const userObj = users.find(u => u.phone === userMap.phone);
          const balance = userObj?.walletBalance || 0;

          if (balance < priceInt) {
            const missing = priceInt - balance;
            await reply(`❌ موجودی کافی نیست. کسری: ${missing.toLocaleString('fa-IR')} تومان.`, {
                inline_keyboard: [[{ text: '💳 شارژ حساب', callback_data: '💰 موجودی و شارژ حساب' }]]
            });
            return;
          }

          if (userObj) userObj.walletBalance = balance - priceInt;

          const newOrder = {
              id: 1000 + orders.length + 1,
              productId: prod.id,
              productTitle: prod.title,
              productType: prod.type,
              userIdentifier: userMap.phone,
              price: prod.price,
              status: 'pending' as const,
              createdAt: new Date().toISOString()
          };
          orders.push(newOrder);
          saveDatabase();

          userCheckoutStates[chat.id] = { orderId: newOrder.id };
          await reply(`🎉 خرید "${prod.title}" با موفقیت انجام شد.\n\nتوضیحات تکمیلی دارید؟ بنویسید:`, getUserKeyboard(isAdmin));
          
          const adminMsg = `🟢 سفارش جدید!\n📦 ${prod.title}\n👤 خریدار: ${userMap.phone}`;
          if (settings.adminTelegramChatId) botRequest('https://api.telegram.org', settings.telegramToken, 'sendMessage', { chat_id: settings.adminTelegramChatId, text: adminMsg });
          if (settings.adminBaleChatId) botRequest('https://tapi.bale.ai', settings.baleToken, 'sendMessage', { chat_id: settings.adminBaleChatId, text: adminMsg });
      }
      return;
  }

  // --- Default Fallback (Chat Sync) ---
  let chatObj = chats.find(c => String(c.userId) === String(userMap.phone));
  if (!chatObj) {
    chatObj = { id: Date.now(), userId: userMap.phone, messages: [] };
    chats.push(chatObj);
  }
  chatObj.messages.push({ sender: 'user', text, createdAt: new Date().toISOString() });
  saveDatabase();

  await reply(`پیام شما دریافت و برای پشتیبانی ارسال شد.`, getUserKeyboard(isAdmin));
}
