import { z } from 'zod';

export const insertUserSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين'),
  isAdmin: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  verificationToken: z.string().optional(),
  accountLocked: z.boolean().optional(),
  lockReason: z.string().optional(),
});

export interface User {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
  emailVerified: boolean;
  lastLogin?: string;
  accountLocked: boolean;
  lockReason?: string;
}

export interface InsertUser {
  email: string;
  password: string;
  name: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
  verificationToken?: string;
  accountLocked?: boolean;
  lockReason?: string;
}

export interface Event {
  id: number;
  userId: number;
  title: string;
  description?: string;
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  gregorianDay: number;
  gregorianMonth: number;
  gregorianYear: number;
  eventTime?: string;
  createdAt: string;
}

export interface InsertEvent {
  userId: number;
  title: string;
  description?: string;
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  gregorianDay: number;
  gregorianMonth: number;
  gregorianYear: number;
  eventTime?: string;
}

export interface SystemSettings {
  id: number;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  privacyPolicy?: string;
  termsOfService?: string;
  lastUpdated: string;
  updatedBy?: number;
}

export interface InsertSystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  privacyPolicy?: string;
  termsOfService?: string;
  updatedBy?: number;
}
