import type { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppEnvironment } from '../../../../config/environment.schema';
import { MessagingAlertNotificationAdapter } from './messaging-alert-notification.adapter';

function createAdapter(
  notifications: AppEnvironment['notifications'],
): MessagingAlertNotificationAdapter {
  const values: Record<string, string | undefined> = {
    'notifications.telegramBotToken': notifications.telegramBotToken,
    'notifications.telegramChatId': notifications.telegramChatId,
    'notifications.lineAccessToken': notifications.lineAccessToken,
    'notifications.lineUserId': notifications.lineUserId,
  };
  const config = {
    get: vi.fn((key: string) => values[key]),
  } as unknown as ConfigService<AppEnvironment, true>;

  return new MessagingAlertNotificationAdapter(config);
}

describe('MessagingAlertNotificationAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fans out an alert to Telegram and LINE when both are configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    const adapter = createAdapter({
      telegramBotToken: 'telegram-token',
      telegramChatId: 'telegram-chat',
      lineAccessToken: 'line-token',
      lineUserId: 'line-user',
    });

    await expect(adapter.send('ทดสอบ GoldIQ')).resolves.toEqual({
      status: 'SENT',
      error: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/bottelegram-token/sendMessage',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.line.me/v2/bot/message/push',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('reports a partial delivery failure after attempting every configured provider', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: false, status: 401 });
    vi.stubGlobal('fetch', fetchMock);
    const adapter = createAdapter({
      telegramBotToken: 'telegram-token',
      telegramChatId: 'telegram-chat',
      lineAccessToken: 'line-token',
      lineUserId: 'line-user',
    });

    await expect(adapter.send('alert')).resolves.toEqual({
      status: 'FAILED',
      error: 'LINE HTTP 401',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('skips delivery when no provider is fully configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const adapter = createAdapter({});

    await expect(adapter.send('alert')).resolves.toEqual({
      status: 'SKIPPED',
      error: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
