export interface EmailAddress {
  id: string;
  address: string;
  createdAt: string;
  isActive: boolean;
}

export interface Email {
  id: string;
  from: string;
  subject?: string;
  body: string;
  receivedAt: string;
  s3Key: string;
}

export interface S3Object {
  Key: string;
  LastModified: Date;
  Size: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
