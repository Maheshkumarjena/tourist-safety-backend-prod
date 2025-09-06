export interface Notification {
  userId: string;
  type: 'alert' | 'advisory' | 'system' | 'safety';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
}