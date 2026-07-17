export const ALERT_NOTIFICATION_PORT = Symbol('ALERT_NOTIFICATION_PORT');

export interface AlertNotificationResult {
  readonly status: 'SENT' | 'SKIPPED' | 'FAILED';
  readonly error: string | null;
}

export interface AlertNotificationPort {
  send(message: string): Promise<AlertNotificationResult>;
}
