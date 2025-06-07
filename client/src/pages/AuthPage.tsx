import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Redirect } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema, registerSchema, useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { AdminRoleSelector } from '@/components/AdminRoleSelector';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, AlertTriangle } from "lucide-react";

// مخطط استعادة كلمة المرور
const forgotPasswordSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح")
});

// مخطط إعادة تعيين كلمة المرور
const resetPasswordSchema = z.object({
  password: z.string().min(8, "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"]
});

// حالات صفحة استعادة كلمة المرور
type ForgotPasswordState = 'form' | 'success' | 'reset-form' | 'reset-success';

const AuthPage = () => {
  const [showRoleSelector, setShowRoleSelector] = useState(false);
const [userName, setUserName] = useState('');

  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [forgotPasswordState, setForgotPasswordState] = useState<ForgotPasswordState>('form');
  const [resetToken, setResetToken] = useState<string>('');
  const { toast } = useToast();
  
  

  // Form for login
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Form for registration
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
       isAdmin: false,
    },
  });
  
  // Form for forgot password
  const forgotPasswordForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  
  // Form for reset password
  const resetPasswordForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  
  // تحقق من رمز إعادة التعيين في URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset');
    
    if (token) {
      // تحقق من صلاحية الرمز
      const verifyToken = async () => {
        try {
          const res = await apiRequest('POST', '/api/verify-reset-token', { token });
          if (res.ok) {
            // الرمز صالح، انتقل إلى نموذج إعادة التعيين
            setResetToken(token);
            setActiveTab('forgot-password');
            setForgotPasswordState('reset-form');
          } else {
            // الرمز غير صالح
            toast({
              title: "رمز غير صالح",
              description: "رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.",
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "خطأ",
            description: "حدث خطأ أثناء التحقق من الرمز. يرجى المحاولة مرة أخرى.",
            variant: "destructive",
          });
        }
      };
      
      verifyToken();
    }
  }, [toast, setResetToken, setActiveTab, setForgotPasswordState]);

  // Handle login submission
  const onLoginSubmit = (values: any) => {
  loginMutation.mutate(values, {
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: "تعذر تسجيل الدخول. تحقق من بياناتك.",
        variant: "destructive"
      });
    }, 
    onSuccess: (response: any) => {
      setUserName(response.user?.name || '');
      setShowRoleSelector(true);
    }
  });
};

const handleRoleChoice = (role: 'admin' | 'user') => {
  setShowRoleSelector(false);

  if (role === 'admin') {
    window.location.href = '/admin/dashboard';
  } else {
    window.location.href = '/home'; // عدّل الرابط حسب الحاجة
  }
};

  // Handle registration submission
  const onRegisterSubmit = (values: any) => {
     const isAdminFromName = values.name.trim().toLowerCase() === 'admin';
    registerMutation.mutate({
    name: values.name,
    email: values.email,
    password: values.password,
     isAdmin: isAdminFromName, 
  });
  };

  // If user is already logged in, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <>
      <Helmet>
        <title>تسجيل الدخول | تقويم أم القرى</title>
        <meta
          name="description"
          content="صفحة تسجيل الدخول وإنشاء حساب جديد في تطبيق تقويم أم القرى"
        />
      </Helmet>

      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Login/Register Form */}
        <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">
                تقويم أم القرى
              </CardTitle>
              <CardDescription>
                سجل دخولك أو أنشئ حسابًا جديدًا للاستفادة من كافة المميزات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="login"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
                  <TabsTrigger value="forgot-password">استعادة كلمة المرور</TabsTrigger>
                </TabsList>

                {/* Login Form */}
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="أدخل بريدك الإلكتروني"
                                type="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="أدخل كلمة المرور"
                                type="password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-4">
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              جارٍ التسجيل...
                            </>
                          ) : (
                            "تسجيل الدخول"
                          )}
                        </Button>
                        <div className="text-center">
                          <Button
                            type="button"
                            variant="link"
                            className="p-0 text-sm text-primary hover:underline"
                            onClick={() => setActiveTab("forgot-password")}
                          >
                            نسيت كلمة المرور؟
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
{showRoleSelector && (
  <AdminRoleSelector
    isOpen={showRoleSelector}
    userName={userName}
    onRoleSelect={handleRoleChoice}
  />
)}

                {/* Register Form */}
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="أدخل اسمك"
                                type="text"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="أدخل بريدك الإلكتروني"
                                type="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="أدخل كلمة المرور"
                                type="password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            جارٍ إنشاء الحساب...
                          </>
                        ) : (
                          "إنشاء حساب"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                {/* Forgot Password Form */}
                <TabsContent value="forgot-password">
                  {forgotPasswordState === 'form' && (
                    <Form {...forgotPasswordForm}>
                      <form
                        onSubmit={forgotPasswordForm.handleSubmit(async (values) => {
                          try {
                            const res = await apiRequest('POST', '/api/forgot-password', values);
                            if (res.ok) {
                              setForgotPasswordState('success');
                            } else {
                              const data = await res.json();
                              toast({
                                title: "خطأ",
                                description: data.message || "حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "خطأ",
                              description: "حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.",
                              variant: "destructive",
                            });
                          }
                        })}
                        className="space-y-4"
                      >
                        <div className="text-center mb-4">
                          <h2 className="text-lg font-medium">استعادة كلمة المرور</h2>
                          <p className="text-sm text-muted-foreground">
                            أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور
                          </p>
                        </div>
                        <FormField
                          control={forgotPasswordForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>البريد الإلكتروني</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="أدخل بريدك الإلكتروني"
                                  type="email"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="space-y-3">
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={forgotPasswordForm.formState.isSubmitting}
                          >
                            {forgotPasswordForm.formState.isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                جارِ الإرسال...
                              </>
                            ) : (
                              "إرسال رابط استعادة كلمة المرور"
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setActiveTab("login")}
                          >
                            العودة إلى تسجيل الدخول
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                  
                  {forgotPasswordState === 'success' && (
                    <div className="text-center py-6 space-y-4">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 2L11 13"></path><path d="M22 2L15 22 11 13 2 9 22 2z"></path></svg>
                      </div>
                      <h2 className="text-xl font-medium">تم إرسال بريد الاستعادة</h2>
                      <p className="text-muted-foreground">
                        لقد أرسلنا رابط استعادة كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من بريدك الإلكتروني واتباع التعليمات لإعادة تعيين كلمة المرور الخاصة بك.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab("login")}
                      >
                        العودة إلى تسجيل الدخول
                      </Button>
                    </div>
                  )}
                  
                  {forgotPasswordState === 'reset-form' && (
                    <Form {...resetPasswordForm}>
                      <form
                        onSubmit={resetPasswordForm.handleSubmit(async (values) => {
                          try {
                            const res = await apiRequest('POST', '/api/reset-password', {
                              token: resetToken,
                              newPassword: values.password
                            });
                            
                            if (res.ok) {
                              setForgotPasswordState('reset-success');
                            } else {
                              const data = await res.json();
                              toast({
                                title: "خطأ",
                                description: data.message || "حدث خطأ أثناء إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "خطأ",
                              description: "حدث خطأ أثناء إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.",
                              variant: "destructive",
                            });
                          }
                        })}
                        className="space-y-4"
                      >
                        <div className="text-center mb-4">
                          <h2 className="text-lg font-medium">إعادة تعيين كلمة المرور</h2>
                          <p className="text-sm text-muted-foreground">
                            أدخل كلمة المرور الجديدة
                          </p>
                        </div>
                        <FormField
                          control={resetPasswordForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>كلمة المرور الجديدة</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="كلمة المرور الجديدة"
                                  type="password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={resetPasswordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تأكيد كلمة المرور</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="تأكيد كلمة المرور"
                                  type="password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={resetPasswordForm.formState.isSubmitting}
                        >
                          {resetPasswordForm.formState.isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              جارِ إعادة تعيين كلمة المرور...
                            </>
                          ) : (
                            "تغيير كلمة المرور"
                          )}
                        </Button>
                      </form>
                    </Form>
                  )}
                  
                  {forgotPasswordState === 'reset-success' && (
                    <div className="text-center py-6 space-y-4">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <h2 className="text-xl font-medium">تم تغيير كلمة المرور</h2>
                      <p className="text-muted-foreground">
                        تم تغيير كلمة المرور الخاصة بك بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.
                      </p>
                      <Button 
                        variant="default" 
                        className="mt-4"
                        onClick={() => {
                          setActiveTab("login");
                          setForgotPasswordState('form');
                        }}
                      >
                        تسجيل الدخول
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
              <div>
                جميع الحقوق محفوظة &copy; {new Date().getFullYear()} تقويم أم القرى
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Hero Section */}
        <div className="hidden md:flex md:w-1/2 bg-primary p-6 text-white items-center justify-center">
          <div className="max-w-lg text-center">
            <h1 className="text-4xl font-bold mb-6">تقويم أم القرى</h1>
            <p className="text-xl mb-8">
              التقويم الهجري والميلادي المتزامن مع تقويم أم القرى الرسمي
            </p>
            <div className="space-y-4 text-right">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <div>
                  <h3 className="font-bold">تقويم هجري وميلادي</h3>
                  <p className="text-sm opacity-90">
                    عرض وتحويل التواريخ بين التقويمين الهجري والميلادي
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <i className="fas fa-sync-alt"></i>
                </div>
                <div>
                  <h3 className="font-bold">تحويل التواريخ</h3>
                  <p className="text-sm opacity-90">
                    تحويل بين التقويمين في الاتجاهين بدقة عالية
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <i className="fas fa-user"></i>
                </div>
                <div>
                  <h3 className="font-bold">حساب شخصي</h3>
                  <p className="text-sm opacity-90">
                    إنشاء وإدارة المناسبات الشخصية الخاصة بك
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* مربع حوار التحقق من البريد الإلكتروني */}
      
    </>
  );
};

export default AuthPage;
