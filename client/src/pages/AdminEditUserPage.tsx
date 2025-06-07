import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, User, Mail, Key, Shield, Calendar } from "lucide-react";

// نموذج تعديل بيانات المستخدم
const userFormSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يحتوي الاسم على حرفين على الأقل" }),
  email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صحيح" }),
  isAdmin: z.boolean().default(false),
  emailVerified: z.boolean().default(false)
});

// نموذج تغيير كلمة المرور
const passwordFormSchema = z.object({
  newPassword: z.string().min(8, { message: "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل" })
});

type UserFormValues = z.infer<typeof userFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

type User = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: string;
};

export default function AdminEditUserPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id);

  // التأكد من أن المستخدم مدير
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);

  // استعلام لجلب بيانات المستخدم
  const { 
    data: userData, 
    isLoading, 
    error 
  } = useQuery<User>({
    queryKey: [`/api/admin/user/${userId}`],
    enabled: !isNaN(userId),
  });

  // نموذج تعديل بيانات المستخدم
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      isAdmin: false,
      emailVerified: false
    }
  });

  // نموذج تغيير كلمة المرور
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: ""
    }
  });

  // تحديث النموذج عند استلام بيانات المستخدم
  useEffect(() => {
    if (userData) {
      userForm.reset({
        name: userData.name,
        email: userData.email,
        isAdmin: userData.isAdmin,
        emailVerified: userData.emailVerified
      });
    }
  }, [userData, userForm]);

  // استدعاء لتحديث بيانات المستخدم
  const updateUserMutation = useMutation({
    mutationFn: async (userData: UserFormValues) => {
      const res = await apiRequest("PATCH", `/api/admin/user/${userId}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات المستخدم بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/user/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تحديث البيانات",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // استدعاء لتغيير كلمة المرور
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("POST", `/api/admin/user/${userId}/reset-password`, {
        newPassword: data.newPassword
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تغيير كلمة المرور",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      passwordForm.reset({ newPassword: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تغيير كلمة المرور",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // تقديم نموذج تعديل بيانات المستخدم
  const onUserSubmit = (values: UserFormValues) => {
    updateUserMutation.mutate(values);
  };

  // تقديم نموذج تغيير كلمة المرور
  const onPasswordSubmit = (values: PasswordFormValues) => {
    resetPasswordMutation.mutate(values);
  };

  if (!user || !user.isAdmin) {
    return null;
  }

  if (isNaN(userId)) {
    return (
      <div className="container mx-auto py-8 rtl">
        <Alert variant="destructive">
          <AlertTitle>معرف مستخدم غير صالح</AlertTitle>
          <AlertDescription>
            لا يمكن العثور على المستخدم. يرجى التحقق من المعرف.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/admin/users">العودة لقائمة المستخدمين</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">تعديل بيانات المستخدم</h1>
          <p className="text-gray-500">
            {userData ? userData.name : "جاري التحميل..."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/users">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة لقائمة المستخدمين
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>خطأ في تحميل البيانات</AlertTitle>
          <AlertDescription>
            حدث خطأ أثناء تحميل بيانات المستخدم. يرجى المحاولة مرة أخرى.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile">البيانات الشخصية</TabsTrigger>
            <TabsTrigger value="password">كلمة المرور</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="ml-2 h-5 w-5" />
                  تعديل البيانات الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-6">
                    <FormField
                      control={userForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم</FormLabel>
                          <FormControl>
                            <div className="flex items-center border rounded-md overflow-hidden">
                              <div className="bg-muted px-3 py-2 border-l">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <Input placeholder="اسم المستخدم" className="border-0" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={userForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <div className="flex items-center border rounded-md overflow-hidden">
                              <div className="bg-muted px-3 py-2 border-l">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <Input dir="ltr" placeholder="example@example.com" className="border-0" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={userForm.control}
                        name="isAdmin"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-x-reverse rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="flex items-center">
                                <Shield className="ml-1 h-4 w-4" />
                                صلاحيات المدير
                              </FormLabel>
                              <FormDescription>
                                منح المستخدم صلاحيات الوصول للوحة الإدارة
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={userForm.control}
                        name="emailVerified"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-x-reverse rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="flex items-center">
                                <Mail className="ml-1 h-4 w-4" />
                                تفعيل البريد الإلكتروني
                              </FormLabel>
                              <FormDescription>
                                تأكيد صحة البريد الإلكتروني للمستخدم يدوياً
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={updateUserMutation.isPending || !userForm.formState.isDirty}
                    >
                      {updateUserMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="ml-2 h-5 w-5" />
                  تغيير كلمة المرور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور الجديدة</FormLabel>
                          <FormControl>
                            <div className="flex items-center border rounded-md overflow-hidden">
                              <div className="bg-muted px-3 py-2 border-l">
                                <Key className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <Input 
                                type="password" 
                                placeholder="كلمة المرور الجديدة" 
                                className="border-0" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                          <FormDescription>
                            يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={resetPasswordMutation.isPending || !passwordForm.formState.isDirty}
                    >
                      {resetPasswordMutation.isPending ? "جاري التغيير..." : "تغيير كلمة المرور"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}