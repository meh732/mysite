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
