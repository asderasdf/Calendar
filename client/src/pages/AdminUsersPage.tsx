import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Lock, Unlock, X, Eye, Mail, Key, UserCog, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { convertDate } from "@/lib/api";

type User = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
  accountLocked?: boolean;
  lockReason?: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [lockReason, setLockReason] = useState<string>("");
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [hijriDates, setHijriDates] = useState<Record<number, string>>({});

  // استعلام لجلب قائمة المستخدمين
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    refetchOnMount: true,
  });

  // استدعاء لقفل حساب المستخدم
  const lockUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason?: string }) => {
      const res = await apiRequest("POST", `/api/admin/user/${userId}/lock`, { reason });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم قفل الحساب",
        description: "تم قفل حساب المستخدم بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowLockDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في قفل الحساب",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // استدعاء لفتح قفل حساب المستخدم
  const unlockUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/user/${userId}/unlock`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم فتح الحساب",
        description: "تم فتح قفل حساب المستخدم بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في فتح قفل الحساب",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // التأكد من أن المستخدم مدير
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);

  // التعامل مع طلب قفل الحساب
  const handleLockAccount = () => {
    if (selectedUserId) {
      lockUserMutation.mutate({
        userId: selectedUserId,
        reason: lockReason || undefined,
      });
    }
  };

  // تنسيق التاريخ بالهجري
  const formatGregorianDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMMM yyyy", { locale: ar });
    } catch (error) {
      console.error('خطأ في تنسيق التاريخ:', error);
      return "تاريخ غير صالح";
    }
  };
  
  // تحويل تاريخ التسجيل لكل مستخدم إلى هجري
  useEffect(() => {
    if (users && users.length > 0) {
      const loadHijriDates = async () => {
        const newHijriDates: Record<number, string> = {};
        
        for (const user of users) {
          try {
            // استخدام تاريخ التسجيل الفعلي لكل مستخدم
            const date = new Date(user.createdAt);
            
            // تأكد من أن التاريخ صالح
            if (isNaN(date.getTime())) {
              // إذا كان التاريخ غير صالح، استخدم تاريخ اليوم
              const today = new Date();
              const todayHijri = await convertDate({
                day: today.getDate(),
                month: today.getMonth() + 1,
                year: today.getFullYear()
              });
              
              newHijriDates[user.id] = `${todayHijri.hijriDay} ${todayHijri.hijriMonthName} ${todayHijri.hijriYear}`;
              continue;
            }
            
            const gregDay = date.getDate();
            const gregMonth = date.getMonth() + 1;
            const gregYear = date.getFullYear();
            
            const hijriDate = await convertDate({
              day: gregDay,
              month: gregMonth,
              year: gregYear
            });
            
            newHijriDates[user.id] = `${hijriDate.hijriDay} ${hijriDate.hijriMonthName} ${hijriDate.hijriYear}`;
          } catch (error) {
            console.error(`خطأ في تحويل التاريخ للمستخدم ${user.id}:`, error);
            newHijriDates[user.id] = formatGregorianDate(user.createdAt);
          }
        }
        
        setHijriDates(newHijriDates);
      };
      
      loadHijriDates();
    }
  }, [users]);

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
          <p className="text-gray-500">عرض وإدارة حسابات المستخدمين</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للوحة الإدارة
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCog className="ml-2 h-5 w-5" />
            قائمة المستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center p-4 text-destructive">
              حدث خطأ أثناء تحميل بيانات المستخدمين. يرجى المحاولة مرة أخرى.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الصلاحيات</TableHead>
                    <TableHead>حالة التفعيل</TableHead>
                    <TableHead>حالة الحساب</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell dir="ltr" className="text-right">{user.email}</TableCell>
                      <TableCell className="flex items-center">
                        <CalendarIcon className="ml-1.5 h-3.5 w-3.5 text-gray-500" />
                        {hijriDates[user.id] || formatGregorianDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge className="bg-yellow-500">مدير</Badge>
                        ) : (
                          <Badge variant="secondary">مستخدم</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.emailVerified ? (
                          <Badge className="bg-green-500">مفعل</Badge>
                        ) : (
                          <Badge variant="destructive">غير مفعل</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.accountLocked ? (
                          <Badge variant="destructive" className="flex items-center">
                            <Lock className="ml-1 h-3 w-3" />
                            مقفل
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center text-green-500 border-green-500">
                            <Unlock className="ml-1 h-3 w-3" />
                            مفتوح
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="icon"
                            asChild
                            title="عرض مناسبات المستخدم"
                          >
                            <Link href={`/admin/user/${user.id}/events`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            asChild
                            title="تعديل بيانات المستخدم"
                          >
                            <Link href={`/admin/user/${user.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>

                          {user.accountLocked ? (
                            <Button
                              variant="outline"
                              size="icon"
                              title="فتح قفل الحساب"
                              onClick={() => unlockUserMutation.mutate(user.id)}
                              disabled={unlockUserMutation.isPending}
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="icon"
                              title="قفل الحساب"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setLockReason("");
                                setShowLockDialog(true);
                              }}
                              disabled={lockUserMutation.isPending}
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* حوار قفل الحساب */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent className="rtl">
          <DialogHeader>
            <DialogTitle>قفل حساب المستخدم</DialogTitle>
            <DialogDescription>
              أدخل سبب قفل حساب المستخدم. هذا الإجراء سيمنع المستخدم من تسجيل الدخول.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="lock-reason" className="text-sm font-medium">
                سبب القفل (اختياري)
              </label>
              <textarea
                id="lock-reason"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="أدخل سبب قفل الحساب هنا..."
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="ml-2"
              onClick={() => setShowLockDialog(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleLockAccount}
              className="bg-destructive hover:bg-destructive/90"
              disabled={lockUserMutation.isPending}
            >
              {lockUserMutation.isPending ? "جاري القفل..." : "قفل الحساب"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}