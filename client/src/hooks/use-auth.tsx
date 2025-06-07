import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { insertUserSchema } from '@shared/schema.client';
import type { InsertUser, User } from '@shared/schema.client';

import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { AdminRoleSelector } from '@/components/AdminRoleSelector';

type AuthContextType = {
  user: Omit<User, 'password'> | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
  isAdmin: boolean;
};

// Create login schema based on user schema
const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف'),
});

// Create register schema based on user schema
const registerSchema = insertUserSchema
  .pick({
    email: true,
    password: true,
    name: true,
    isAdmin: z.boolean().optional(), 
  })
  .extend({
    password: z.string().min(6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف'),
    name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين'),
  });

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<Omit<User, 'password'> | null>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  // تحقق مما إذا كان يجب إظهار نافذة اختيار الدور
  useEffect(() => {
    // تحقق إذا كان المستخدم قد سجل الدخول للتو
    if (user && user.isAdmin) {
      // نتحقق من URL لمعرفة ما إذا كان المستخدم في صفحة auth أو الصفحة الرئيسية فقط
      const currentPath = window.location.pathname;
      // نظهر نافذة الاختيار فقط إذا كان المستخدم في صفحة المصادقة أو الصفحة الرئيسية
      if (currentPath === '/' || currentPath === '/auth') {
        setShowRoleSelector(true);
      } else {
        setShowRoleSelector(false);
      }
    } else {
      setShowRoleSelector(false);
    }
  }, [user]);

  const isAdmin = user?.isAdmin || false;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest('POST', '/api/login', credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['/api/user'], user);
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: `مرحبًا ${user.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'فشل تسجيل الدخول',
        description: error.message || 'حدث خطأ أثناء تسجيل الدخول',
        variant: 'destructive',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest('POST', '/api/register', userData);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['/api/user'], user);
      toast({
        title: 'تم التسجيل بنجاح',
        description: `مرحبًا ${user.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'فشل التسجيل',
        description: error.message || 'حدث خطأ أثناء التسجيل',
        variant: 'destructive',
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      toast({
        title: 'تم تسجيل الخروج بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'فشل تسجيل الخروج',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        isAdmin,
      }}
    >
      {user && showRoleSelector && (
        <AdminRoleSelector isOpen={true} userName={user.name} />
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { loginSchema, registerSchema };
