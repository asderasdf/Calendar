import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Settings, Users, ShieldAlert, FileText, Clock, AlertTriangle, ArrowLeft } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  if (!user || !user.isAdmin) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>خطأ في الوصول</AlertTitle>
          <AlertDescription>
            لا يمكنك الوصول إلى لوحة الإدارة. هذه الصفحة متاحة للمدراء فقط.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/">العودة إلى الصفحة الرئيسية</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">لوحة الإدارة</h1>
          <p className="text-gray-500">مرحباً {user.name}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للتقويم
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* بطاقة إدارة المستخدمين */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Users className="ml-2 h-6 w-6" />
              إدارة المستخدمين
            </CardTitle>
            <CardDescription>إدارة حسابات المستخدمين وصلاحياتهم</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">عرض وتعديل وحذف المستخدمين، وتغيير الصلاحيات وحالة التفعيل</p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/admin/users">إدارة المستخدمين</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* بطاقة إعدادات النظام */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Settings className="ml-2 h-6 w-6" />
              إعدادات النظام
            </CardTitle>
            <CardDescription>ضبط إعدادات النظام الرئيسية</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">تعديل الإعدادات العامة للنظام والميزات المتاحة</p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/admin/settings">إعدادات النظام</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* بطاقة وضع الصيانة */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <AlertTriangle className="ml-2 h-6 w-6" />
              وضع الصيانة
            </CardTitle>
            <CardDescription>إدارة وضع الصيانة للموقع</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">تفعيل أو تعطيل وضع الصيانة وتعديل رسالة الصيانة</p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/admin/maintenance">وضع الصيانة</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* بطاقة سياسة الخصوصية */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <ShieldAlert className="ml-2 h-6 w-6" />
              سياسة الخصوصية
            </CardTitle>
            <CardDescription>تحرير سياسة الخصوصية للتطبيق</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">تعديل محتوى سياسة الخصوصية المعروضة للمستخدمين</p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/admin/privacy">تحرير سياسة الخصوصية</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* بطاقة شروط الاستخدام */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <FileText className="ml-2 h-6 w-6" />
              شروط الاستخدام
            </CardTitle>
            <CardDescription>تحرير شروط استخدام التطبيق</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">تعديل محتوى شروط الاستخدام المعروضة للمستخدمين</p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/admin/terms">تحرير شروط الاستخدام</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* بطاقة سجل الأحداث */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Clock className="ml-2 h-6 w-6" />
              مناسبات المستخدمين
            </CardTitle>
            <CardDescription>استعراض مناسبات المستخدمين</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">الاطلاع على جميع المناسبات المضافة من قبل المستخدمين</p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/admin/events">سجل المناسبات</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}