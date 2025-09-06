export interface MediaUpload {
  userId: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  alertId?: string;
  createdAt: Date;
}