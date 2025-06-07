import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, ShieldAlert } from "lucide-react";

// نموذج سياسة الخصوصية
const privacyPolicyFormSchema = z.object({
  content: z.string().min(1, { message: "محتوى سياسة الخصوصية مطلوب" }),
});

type PrivacyPolicyFormValues = z.infer<typeof privacyPolicyFormSchema>;

type SystemSettings = {
  id?: number;
  privacyPolicy?: string;
  lastUpdated?: string;
};

export default function AdminPrivacyPolicyPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // التأكد من أن المستخدم مدير
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);

  // استعلام لجلب إعدادات النظام
  const { 
    data: settings, 
    isLoading, 
    error 
  } = useQuery<SystemSettings>({
    queryKey: ["/api/admin/system-settings"],
    refetchOnMount: true,
  });

  // نموذج سياسة الخصوصية
  const form = useForm<PrivacyPolicyFormValues>({
    resolver: zodResolver(privacyPolicyFormSchema),
    defaultValues: {
      content: "",
    },
  });

  // تحديث النموذج عند استلام البيانات
  useEffect(() => {
    if (settings) {
      form.reset({
        content: settings.privacyPolicy || "",
      });
    }
  }, [settings, form]);

  // استدعاء لتحديث سياسة الخصوصية
  const updatePrivacyPolicyMutation = useMutation({
    mutationFn: async (data: PrivacyPolicyFormValues) => {
      const res = await apiRequest("POST", "/api/admin/privacy-policy", {
        content: data.content,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث سياسة الخصوصية بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تحديث سياسة الخصوصية",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // تقديم النموذج
  const onSubmit = (values: PrivacyPolicyFormValues) => {
    updatePrivacyPolicyMutation.mutate(values);
  };

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">سياسة الخصوصية</h1>
          <p className="text-gray-500">تحرير سياسة الخصوصية للتطبيق</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للوحة الإدارة
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>خطأ في تحميل البيانات</AlertTitle>
          <AlertDescription>
            حدث خطأ أثناء تحميل سياسة الخصوصية. يرجى المحاولة مرة أخرى.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldAlert className="ml-2 h-5 w-5" />
              تحرير سياسة الخصوصية
            </CardTitle>
            <CardDescription>
              تحديث سياسة الخصوصية التي ستظهر للمستخدمين. يمكنك استخدام تنسيق النص العادي.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>محتوى سياسة الخصوصية</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أدخل محتوى سياسة الخصوصية هنا..."
                          className="min-h-[400px] font-sans"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        هذا المحتوى سيظهر في صفحة سياسة الخصوصية المتاحة للمستخدمين
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      window.open("/privacy", "_blank");
                    }}
                  >
                    معاينة سياسة الخصوصية
                  </Button>
                  
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={updatePrivacyPolicyMutation.isPending || !form.formState.isDirty}
                  >
                    {updatePrivacyPolicyMutation.isPending ? "جاري الحفظ..." : "حفظ سياسة الخصوصية"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <Alert className="bg-blue-50 border-blue-200">
          <ShieldAlert className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">تلميحات حول سياسة الخصوصية</AlertTitle>
          <AlertDescription className="text-blue-700">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>حدد بوضوح أنواع البيانات التي يجمعها التطبيق</li>
              <li>اشرح كيفية استخدام البيانات المجمعة</li>
              <li>وضح إجراءات حماية البيانات المتبعة</li>
              <li>أشر إلى حقوق المستخدمين فيما يتعلق ببياناتهم</li>
              <li>وضح كيفية تواصل المستخدمين في حال وجود استفسارات</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}