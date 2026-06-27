import { settings } from '../db/db';
import { botRequest } from './botService';
import { handleBotUpdate } from './botHandler';

let telegramOffset = 0;
let baleOffset = 0;

let isTelegramCommandsSet = false;
let isBaleCommandsSet = false;

const botCommands = {
  commands: [
    { command: 'start', description: 'شروع و منوی اصلی' },
    { command: 'shop', description: 'لیست محصولات و خدمات' },
    { command: 'wallet', description: 'موجودی و شارژ حساب' },
    { command: 'orders', description: 'پیگیری سفارشات من' },
    { command: 'otp', description: 'دریافت کد ورود سایت' },
    { command: 'support', description: 'ارتباط با پشتیبانی' }
  ]
};

export async function pollTelegram() {
  if (!settings.telegramToken) {
    setTimeout(pollTelegram, 4000);
    return;
  }
  
  if (!isTelegramCommandsSet) {
    isTelegramCommandsSet = true;
    botRequest('https://api.telegram.org', settings.telegramToken, 'setMyCommands', botCommands).catch(() => {});
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

export async function pollBale() {
  if (!settings.baleToken) {
    setTimeout(pollBale, 4000);
    return;
  }

  if (!isBaleCommandsSet) {
    isBaleCommandsSet = true;
    botRequest('https://tapi.bale.ai', settings.baleToken, 'setMyCommands', botCommands).catch(() => {});
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
