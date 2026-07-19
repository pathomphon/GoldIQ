import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppEnvironment } from '../../../../config/environment.schema';
import type {
  AlertNotificationPort,
  AlertNotificationResult,
} from '../../domain/alert-notification.port';

@Injectable()
export class MessagingAlertNotificationAdapter implements AlertNotificationPort {
  private readonly telegramBotToken?: string;
  private readonly telegramChatId?: string;
  private readonly lineAccessToken?: string;
  private readonly lineUserId?: string;

  constructor(config: ConfigService<AppEnvironment, true>) {
    this.telegramBotToken = config.get('notifications.telegramBotToken', { infer: true });
    this.telegramChatId = config.get('notifications.telegramChatId', { infer: true });
    this.lineAccessToken = config.get('notifications.lineAccessToken', { infer: true });
    this.lineUserId = config.get('notifications.lineUserId', { infer: true });
  }

  async send(message: string): Promise<AlertNotificationResult> {
    const deliveries: {
      readonly provider: 'Telegram' | 'LINE';
      readonly send: () => Promise<AlertNotificationResult>;
    }[] = [];

    if (this.telegramBotToken && this.telegramChatId) {
      deliveries.push({
        provider: 'Telegram',
        send: () => this.sendTelegram(message),
      });
    }
    if (this.lineAccessToken && this.lineUserId) {
      deliveries.push({
        provider: 'LINE',
        send: () => this.sendLine(message),
      });
    }
    if (deliveries.length === 0) {
      return { status: 'SKIPPED', error: null };
    }

    const results = await Promise.all(
      deliveries.map(async ({ provider, send }) => {
        try {
          return await send();
        } catch (error: unknown) {
          return {
            status: 'FAILED' as const,
            error: `${provider}: ${
              error instanceof Error ? error.message : 'Notification request failed'
            }`,
          };
        }
      }),
    );
    const errors = results.flatMap((result) =>
      result.status === 'FAILED' ? [result.error ?? 'Notification request failed'] : [],
    );

    if (errors.length > 0) {
      return {
        status: 'FAILED',
        error: errors.join('; '),
      };
    }
    return { status: 'SENT', error: null };
  }

  private async sendTelegram(message: string): Promise<AlertNotificationResult> {
    const response = await fetch(
      `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: this.telegramChatId, text: message }),
        signal: AbortSignal.timeout(5_000),
      },
    );
    return response.ok
      ? { status: 'SENT', error: null }
      : { status: 'FAILED', error: `Telegram HTTP ${response.status}` };
  }

  private async sendLine(message: string): Promise<AlertNotificationResult> {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.lineAccessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        to: this.lineUserId,
        messages: [{ type: 'text', text: message }],
      }),
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok
      ? { status: 'SENT', error: null }
      : { status: 'FAILED', error: `LINE HTTP ${response.status}` };
  }
}
