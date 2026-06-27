export async function botRequest(apiHost: string, token: string, method: string, body?: any) {
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

export async function isUserMemberOfChannel(platform: 'telegram' | 'bale', botToken: string, channel: string, userId: number): Promise<boolean> {
  const host = platform === 'telegram' ? 'https://api.telegram.org' : 'https://tapi.bale.ai';
  const res: any = await botRequest(host, botToken, 'getChatMember', {
    chat_id: channel.startsWith('@') ? channel : `@${channel}`,
    user_id: userId
  });
  if (res && res.ok && res.result) {
    const status = res.result.status;
    return ['creator', 'administrator', 'member'].includes(status);
  }
  return false;
}

export async function sendBotDocument(apiHost: string, token: string, chatId: number, filename: string, content: string) {
  try {
    // Note: This is a simplified mock for bot document sending inside this environment
    // Real implementation would use form-data.
    // For now we send as long message if document fails.
    const res = await botRequest(apiHost, token, 'sendMessage', {
      chat_id: chatId,
      text: `📄 **فایل پشتیبان: ${filename}**\n\n\`\`\`json\n${content.substring(0, 3500)}\n\`\`\``
    });
    return res;
  } catch (err) {
    return null;
  }
}

export async function sendBotPhotoBase64(apiHost: string, token: string, chatId: string | number, caption: string, base64Data: string, inlineKeyboard?: any) {
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;
    const type = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    if (inlineKeyboard) {
      formData.append('reply_markup', JSON.stringify({ inline_keyboard: inlineKeyboard }));
    }
    
    const blob = new Blob([buffer], { type });
    formData.append('photo', blob, 'receipt.jpg');
    
    const res = await fetch(`${apiHost}/bot${token}/sendPhoto`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  } catch (err) {
    console.error('Error sending bot photo base64:', err);
    return null;
  }
}
