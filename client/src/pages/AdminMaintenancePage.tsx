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
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle } from "lucide-react";

// نموذج إعدادات الصيانة
const maintenanceFormSchema = z.object({
  enabled: z.boolean().default(false),
  message: z.string().optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

type SystemSettings = {
  id?: number;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  lastUpdated?: string;
};

export default function AdminMaintenancePage() {
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

  // نموذج إعدادات الصيانة
  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      enabled: false,
      message: "",
    },
  });

  // تحديث النموذج عند استلام البيانات
  useEffect(() => {
    if (settings) {
      form.reset({
        enabled: settings.maintenanceMode,
        message: settings.maintenanceMessage || "",
      });
    }
  }, [settings, form]);

  // استدعاء لتحديث وضع الصيانة
  const updateMaintenanceModeMutation = useMutation({
    mutationFn: async (data: MaintenanceFormValues) => {
      const res = await apiRequest("POST", "/api/admin/maintenance-mode", {
        enabled: data.enabled,
        message: data.message,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث إعدادات وضع الصيانة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تحديث الإعدادات",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // تقديم النموذج
  const onSubmit = (values: MaintenanceFormValues) => {
    updateMaintenanceModeMutation.mutate(values);
  };

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">وضع الصيانة</h1>
          <p className="text-gray-500">إدارة وضع الصيانة للموقع</p>
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
          <Skeleton className="h-48 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>خطأ في تحميل البيانات</AlertTitle>
          <AlertDescription>
            حدث خطأ أثناء تحميل إعدادات وضع الصيانة. يرجى المحاولة مرة أخرى.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="ml-2 h-5 w-5" />
              إعدادات وضع الصيانة
            </CardTitle>
            <CardDescription>
              عند تفعيل وضع الصيانة، لن يتمكن المستخدمون من الوصول إلى التطبيق وسيرون رسالة الصيانة فقط.
              المدراء سيظلون قادرين على تسجيل الدخول والوصول إلى لوحة الإدارة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">وضع الصيانة</FormLabel>
                        <FormDescription>
                          {field.value ? "وضع الصيانة مفعل حالياً" : "وضع الصيانة معطل حالياً"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رسالة الصيانة</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أدخل رسالة الصيانة التي ستظهر للمستخدمين..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        هذه الرسالة ستظهر للمستخدمين عند محاولة الوصول إلى التطبيق أثناء فترة الصيانة
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={updateMaintenanceModeMutation.isPending || !form.formState.isDirty}
                >
                  {updateMaintenanceModeMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">تذكير هام</AlertTitle>
          <AlertDescription className="text-yellow-700">
            تفعيل وضع الصيانة سيمنع جميع المستخدمين العاديين من الوصول إلى التطبيق.
            تأكد من إبلاغ المستخدمين مسبقاً بفترة الصيانة المخطط لها.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}