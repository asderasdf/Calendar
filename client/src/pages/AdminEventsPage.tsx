import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Search, Clock, X, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// نوع المناسبات
interface EventDate {
  day: number;
  month: number;
  year: number;
  formatted: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface Event {
  id: number;
  title: string;
  days: number;
  date: {
    hijri: EventDate;
    gregorian: EventDate;
  };
  time: string;
  category: string;
  notes?: string;
  user: User;
}

export default function AdminEventsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  // تنسيق التاريخ بالهجري
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMMM yyyy", { locale: ar });
    } catch (error) {
      console.error('خطأ في تنسيق التاريخ:', error);
      return "تاريخ غير صالح";
    }
  };

 const { data: allEvents, isLoading: isEventsLoading, error } = useQuery<Event[]>({
  queryKey: ["admin-events"],
  queryFn: async () => {
    const res = await fetch("https://cleander-project-server.onrender.com/api/admin/events", {
      method: "GET",
      credentials: "include", // إرسال الكوكي مع الطلب
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("فشل الجلب:", res.status, text);
      throw new Error("حدث خطأ أثناء جلب جميع المناسبات");
    }

    return res.json();
  },
  enabled: !!user?.isAdmin,
});

  // فلترة المناسبات حسب البحث - تضمين معلومات المستخدم في البحث
  const filteredEvents = allEvents?.filter(event => 
    event.title.includes(searchTerm) || 
    event.notes?.includes(searchTerm) ||
    event.date.hijri.formatted.includes(searchTerm) ||
    event.date.gregorian.formatted.includes(searchTerm) ||
    event.user.name.includes(searchTerm) ||
    event.user.email.includes(searchTerm)
  );

  // تقسيم المناسبات إلى نشطة ومنتهية
  const activeEvents = filteredEvents?.filter(event => event.days > 0) || [];
  const pastEvents = filteredEvents?.filter(event => event.days <= 0) || [];

  // التحقق من صلاحيات المستخدم
  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">مناسبات المستخدمين</h1>
          <p className="text-gray-500">
            عرض جميع المناسبات المضافة في النظام
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للوحة الإدارة
          </Link>
        </Button>
      </div>

      {/* بحث في المناسبات */}
      <div className="relative mb-6">
        <Input
          type="text"
          placeholder="بحث في المناسبات..."
          className="w-full pr-10 text-right"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute top-2.5 right-3 h-5 w-5 text-gray-400" />
      </div>

      {/* بطاقة الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="rounded-full bg-blue-100 p-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">إجمالي المناسبات</p>
                <h3 className="text-2xl font-bold">
                  {isEventsLoading ? <Skeleton className="h-8 w-16" /> : allEvents?.length || 0}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">المناسبات النشطة</p>
                <h3 className="text-2xl font-bold">
                  {isEventsLoading ? <Skeleton className="h-8 w-16" /> : activeEvents.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="rounded-full bg-gray-100 p-3">
                <X className="h-6 w-6 text-gray-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">المناسبات المنتهية</p>
                <h3 className="text-2xl font-bold">
                  {isEventsLoading ? <Skeleton className="h-8 w-16" /> : pastEvents.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* بطاقة المناسبات النشطة */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="ml-2 h-5 w-5 text-green-600" />
            المناسبات النشطة ({activeEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEventsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : activeEvents.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              لا توجد مناسبات نشطة حاليًا
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>التاريخ الهجري</TableHead>
                    <TableHead>التاريخ الميلادي</TableHead>
                    <TableHead>الوقت</TableHead>
                    <TableHead>الأيام المتبقية</TableHead>
                    <TableHead>القسم</TableHead>
                    <TableHead>صاحب المناسبة</TableHead>
                    <TableHead>ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{event.date.hijri.formatted}</TableCell>
                      <TableCell>{event.date.gregorian.formatted}</TableCell>
                      <TableCell>{event.time}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          {event.days} يوم
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{event.user.name}</span>
                          <span className="text-xs text-gray-500">{event.user.email}</span>
                          <span className="text-xs text-gray-400 mt-1 flex items-center">
                            <Calendar className="h-3 w-3 ml-1" />
                            <span>تسجيل: {formatDate(event.user.createdAt)}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {event.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* بطاقة المناسبات المنتهية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <X className="ml-2 h-5 w-5 text-gray-500" />
            المناسبات المنتهية ({pastEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEventsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : pastEvents.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              لا توجد مناسبات منتهية حاليًا
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>التاريخ الهجري</TableHead>
                    <TableHead>التاريخ الميلادي</TableHead>
                    <TableHead>الوقت</TableHead>
                    <TableHead>منذ</TableHead>
                    <TableHead>القسم</TableHead>
                    <TableHead>صاحب المناسبة</TableHead>
                    <TableHead>ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastEvents.map((event) => (
                    <TableRow key={event.id} className="text-gray-500">
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{event.date.hijri.formatted}</TableCell>
                      <TableCell>{event.date.gregorian.formatted}</TableCell>
                      <TableCell>{event.time}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-gray-500 border-gray-300">
                          {Math.abs(event.days)} يوم
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-gray-300 text-gray-500">{event.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{event.user.name}</span>
                          <span className="text-xs text-gray-500">{event.user.email}</span>
                          <span className="text-xs text-gray-400 mt-1 flex items-center">
                            <Calendar className="h-3 w-3 ml-1" />
                            <span>تسجيل: {formatDate(event.user.createdAt)}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {event.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
