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
import { ArrowLeft, FileText } from "lucide-react";

// نموذج شروط الاستخدام
const termsFormSchema = z.object({
  content: z.string().min(1, { message: "محتوى شروط الاستخدام مطلوب" }),
});

type TermsFormValues = z.infer<typeof termsFormSchema>;

type SystemSettings = {
  id?: number;
  termsOfService?: string;
  lastUpdated?: string;
};

export default function AdminTermsPage() {
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

  // نموذج شروط الاستخدام
  const form = useForm<TermsFormValues>({
    resolver: zodResolver(termsFormSchema),
    defaultValues: {
      content: "",
    },
  });

  // تحديث النموذج عند استلام البيانات
  useEffect(() => {
    if (settings) {
      form.reset({
        content: settings.termsOfService || "",
      });
    }
  }, [settings, form]);

  // استدعاء لتحديث شروط الاستخدام
  const updateTermsMutation = useMutation({
    mutationFn: async (data: TermsFormValues) => {
      const res = await apiRequest("POST", "/api/admin/terms-of-service", {
        content: data.content,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث شروط الاستخدام بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تحديث شروط الاستخدام",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // تقديم النموذج
  const onSubmit = (values: TermsFormValues) => {
    updateTermsMutation.mutate(values);
  };

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">شروط الاستخدام</h1>
          <p className="text-gray-500">تحرير شروط استخدام التطبيق</p>
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
            حدث خطأ أثناء تحميل شروط الاستخدام. يرجى المحاولة مرة أخرى.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="ml-2 h-5 w-5" />
              تحرير شروط الاستخدام
            </CardTitle>
            <CardDescription>
              تحديث شروط الاستخدام التي يجب على المستخدمين الموافقة عليها. يمكنك استخدام تنسيق النص العادي.
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
                      <FormLabel>محتوى شروط الاستخدام</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أدخل محتوى شروط الاستخدام هنا..."
                          className="min-h-[400px] font-sans"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        هذا المحتوى سيظهر في صفحة شروط الاستخدام المتاحة للمستخدمين
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
                      window.open("/terms", "_blank");
                    }}
                  >
                    معاينة شروط الاستخدام
                  </Button>
                  
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={updateTermsMutation.isPending || !form.formState.isDirty}
                  >
                    {updateTermsMutation.isPending ? "جاري الحفظ..." : "حفظ شروط الاستخدام"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <Alert className="bg-blue-50 border-blue-200">
          <FileText className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">تلميحات حول شروط الاستخدام</AlertTitle>
          <AlertDescription className="text-blue-700">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>حدد بوضوح الخدمات المقدمة والقيود المفروضة على استخدامها</li>
              <li>وضح مسؤوليات المستخدمين عند استخدام التطبيق</li>
              <li>اشرح السلوك المحظور وعواقبه</li>
              <li>حدد سياسة إنهاء الخدمة وإغلاق الحسابات</li>
              <li>أشر إلى كيفية تعديل شروط الاستخدام والإخطار بها</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}