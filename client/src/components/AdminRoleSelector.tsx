import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield, User } from 'lucide-react';

interface AdminRoleSelectorProps {
  isOpen: boolean;
  userName: string;
  onRoleSelect: (role: 'admin' | 'user') => void;
}

export function AdminRoleSelector({
  isOpen,
  userName,
  onRoleSelect,
}: AdminRoleSelectorProps) {
  const [open, setOpen] = useState(isOpen);
  const [location] = useLocation();

  // مزامنة الحالة عند تغيير isOpen من الخارج
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  // إذا كان المستخدم بالفعل في صفحة المدير، لا نعرض النافذة
  useEffect(() => {
    if (location.startsWith('/admin')) {
      setOpen(false);
    }
  }, [location]);

  const handleRoleSelect = (role: 'admin' | 'user') => {
    setOpen(false);
    onRoleSelect(role);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            اختيار نوع الدخول
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            مرحباً {userName}، بصفتك مديرًا في النظام، يمكنك الدخول بأحد
            الصلاحيات التالية:
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <Card className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-center">
                <Shield className="h-16 w-16 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <h3 className="text-xl font-bold mb-2">دخول كمدير</h3>
              <CardDescription className="text-center">
                للوصول إلى لوحة التحكم وإدارة المستخدمين والإعدادات
              </CardDescription>
              <Button
                className="mt-4 w-full"
                onClick={() => handleRoleSelect('admin')}
              >
                الدخول كمدير
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-center">
                <User className="h-16 w-16 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <h3 className="text-xl font-bold mb-2">دخول كمستخدم</h3>
              <CardDescription className="text-center">
                للوصول إلى التقويم ومناسباتك الشخصية كمستخدم عادي
              </CardDescription>
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => handleRoleSelect('user')}
              >
                الدخول كمستخدم
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
