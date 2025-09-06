export interface OfflineRequest {
  userId: string;
  endpoint: string;
  method: string;
  data: any;
  timestamp: Date;
  retries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}