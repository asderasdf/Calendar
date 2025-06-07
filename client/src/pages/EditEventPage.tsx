import { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Calendar, Clock as ClockIcon, Edit2, Pencil, RefreshCw, Moon, Sun, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useCategories } from '@/context/CategoryContext';
import { apiRequest } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';

// Map of Hijri month lengths based on Umm Al-Qura calendar
const hijriMonthLengths = {
  1: 30, // Muharram
  2: 29, // Safar
  3: 30, // Rabi' al-awwal
  4: 29, // Rabi' al-thani
  5: 30, // Jumada al-awwal
  6: 29, // Jumada al-thani
  7: 30, // Rajab
  8: 29, // Sha'ban
  9: 30, // Ramadan
  10: 29, // Shawwal
  11: 30, // Dhu al-Qi'dah
  12: 29  // Dhu al-Hijjah
};

// Define event form schema with dynamic validation
const eventSchema = z.object({
  title: z.string().min(2, 'العنوان يجب أن يكون على الأقل حرفين'),
  category: z.string(),
  date: z.object({
    hijriMonth: z.number().min(1, 'الشهر يجب أن يكون من 1 إلى 12').max(12, 'الشهر يجب أن يكون من 1 إلى 12'),
    hijriYear: z.number().min(1400, 'السنة يجب أن تكون بين 1400 و 1500').max(1500, 'السنة يجب أن تكون بين 1400 و 1500'),
    hijriDay: z.number()
      .min(1, 'اليوم يجب أن يكون إيجابيًا')
      .max(30, 'اليوم لا يمكن أن يتجاوز 30 في التقويم الهجري'),
  }),
  days: z.number().min(1, 'عدد الأيام يجب أن يكون على الأقل 1').max(365, 'عدد الأيام لا يمكن أن يتجاوز 365'),
  time: z.string(),
  notes: z.string().optional(),
});

// أسماء الأشهر الهجرية
function getHijriMonthName(month: number): string {
  const hijriMonthNames = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
    'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
    'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ];
  
  return hijriMonthNames[month - 1] || '';
}

// تقريب لتحويل من التاريخ الهجري إلى الميلادي (أكثر دقة)
function hijriToGregorianYear(hijriYear: number): number {
  // جدول تحويل ثابت للسنوات الحديثة للحصول على دقة أكثر
  const conversionTable: Record<number, number> = {
    1444: 2023,
    1445: 2024,
    1446: 2025,
    1447: 2026,
    1448: 2027,
    1449: 2028,
    1450: 2029,
    1451: 2030
  };
  
  // إذا كانت السنة موجودة في الجدول، نستخدم القيمة من الجدول
  if (conversionTable[hijriYear]) {
    return conversionTable[hijriYear];
  }
  
  // وإلا نستخدم تقريبًا عامًا
  return hijriYear + 579;
}

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHijri, setIsHijri] = useState(true);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // داخلي لتتبع القيم المختارة في نافذة التقويم
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(1446);
  const [maxDaysInSelectedMonth, setMaxDaysInSelectedMonth] = useState(30);
  
  const [location, setLocation] = useLocation();
  const { categories } = useCategories();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // إعداد النموذج (يجب أن يكون قبل استخدامه في useEffect)
  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      category: '',
      date: {
        hijriDay: 1,
        hijriMonth: 1,
        hijriYear: 1446,
      },
      days: 1,
      time: '12:00',
      notes: '',
    },
  });
  
  // Create mutation for updating the event
  const updateEventMutation = useMutation({
    mutationFn: async (values: z.infer<typeof eventSchema>) => {
      console.log('Submitting update with data:', values);
      // نرسل البيانات كما هي من النموذج
      const eventData = values;
      
      const response = await apiRequest('PUT', `/api/events/${eventId}`, eventData);
      console.log('Server response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'فشل في تحديث المناسبة';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم تحديث المناسبة بنجاح',
        description: 'تم تحديث المناسبة في التقويم الخاص بك',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      // توجيه المستخدم إلى صفحة المناسبات بعد التعديل
      setLocation('/events');
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في تحديث المناسبة',
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });
  
  // تحميل بيانات المناسبة
  const { data: event, isError: eventError } = useQuery<any>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId
  });
  
  // استخدام useEffect لمعالجة البيانات عند تحميلها
  useEffect(() => {
    if (event) {
      console.log('Loaded event data:', event);
      
      // تعبئة النموذج بالبيانات المستردة
      form.reset({
        title: event.title,
        category: event.category,
        date: {
          hijriDay: event.date.hijri.day,
          hijriMonth: event.date.hijri.month,
          hijriYear: event.date.hijri.year,
        },
        days: event.days,
        time: event.time || '12:00',
        notes: event.notes || '',
      });
      
      // تحديث القيم المحددة
      setSelectedDay(event.date.hijri.day);
      setSelectedMonth(event.date.hijri.month);
      setSelectedYear(event.date.hijri.year);
      
      setIsLoading(false);
    } else if (eventError || (!event && !isLoading)) {
      // في حالة حدوث خطأ أو عدم وجود البيانات وانتهاء التحميل
      toast({
        title: 'خطأ في تحميل المناسبة',
        description: 'تعذر تحميل بيانات المناسبة',
        variant: 'destructive',
      });
      setLocation('/events');
    }
  }, [event, eventError, form, setLocation, toast, isLoading]);
  
  // تحديث القيم عند فتح نافذة اختيار التاريخ
  useEffect(() => {
    if (isDateDialogOpen) {
      setSelectedMonth(form.getValues().date.hijriMonth);
      setSelectedYear(form.getValues().date.hijriYear);
    }
  }, [isDateDialogOpen, form]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof eventSchema>) => {
    try {
      setIsSubmitting(true);
      
      // التحقق من صحة عنوان المناسبة
      if (!values.title.trim()) {
        form.setError('root', { 
          type: 'manual', 
          message: 'يجب إدخال عنوان للمناسبة' 
        });
        setIsSubmitting(false);
        return;
      }
      
      // التحقق من صحة التاريخ الهجري
      const { hijriDay, hijriMonth, hijriYear } = values.date;
      
      // التحقق من عدد أيام الشهر الهجري
      const maxDaysInMonth = hijriMonthLengths[hijriMonth as keyof typeof hijriMonthLengths] || 30;
      if (hijriDay > maxDaysInMonth) {
        form.setError('root', { 
          type: 'manual', 
          message: `خطأ في التاريخ: شهر ${getHijriMonthName(hijriMonth)} لا يمكن أن يكون فيه أكثر من ${maxDaysInMonth} يوم` 
        });
        setIsSubmitting(false);
        return;
      }
      
      // إضافة حقول التاريخ الميلادي قبل إرسال البيانات
      const gregorianYear = hijriToGregorianYear(values.date.hijriYear);
      const gregorianMonth = values.date.hijriMonth % 12 || 12; // تحويل بسيط للشهر
      const gregorianDay = Math.min(values.date.hijriDay, 28); // ضمان أن اليوم لا يتجاوز عدد أيام الشهر الميلادي
      
      const formDataWithGregorianDate = {
        ...values,
        date: {
          ...values.date,
          gregorianDay,
          gregorianMonth,
          gregorianYear
        }
      };
      
      updateEventMutation.mutate(formDataWithGregorianDate);
    } catch (error: any) {
      form.setError('root', { 
        type: 'manual', 
        message: error?.message || 'حدث خطأ أثناء تحديث المناسبة. الرجاء المحاولة مرة أخرى.' 
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-4 md:py-8 px-4 flex justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 md:py-8 px-4">
      <div className="flex justify-end mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/events/${eventId}`)}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
      
      {form.formState.errors.root && (
        <div className="bg-red-50 border-2 border-red-500 text-red-800 mb-4 p-4 rounded-md shadow-md animate-pulse">
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-red-600 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-red-700">خطأ</h3>
              <p className="text-md font-medium">
                {form.formState.errors.root.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="border-blue-200 shadow-md">
        <CardHeader className="bg-blue-600 text-white">
          <CardTitle className="text-xl">تعديل المناسبة</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium mr-2 mb-2 flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-blue-600" />
                        العنوان
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="عنوان المناسبة" 
                          className="text-right text-lg border-2 border-gray-200"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium mr-2 mb-2 flex items-center gap-2">
                        <Edit2 className="h-5 w-5 text-blue-600" />
                        الفئة
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="text-right text-lg border-2 border-gray-200">
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id}
                            >
                              <span className="flex items-center gap-2">
                                <span 
                                  className="inline-block w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: category.color }}
                                ></span>
                                {category.name} 
                                {category.default && <span className="text-xs text-gray-500">(الافتراضي)</span>}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel className="text-lg font-medium flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          التاريخ
                        </FormLabel>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsHijri(!isHijri)} 
                          className="bg-white hover:bg-gray-100 text-blue-600 flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          {isHijri ? 'ميلادي' : 'هجري'}
                        </Button>
                      </div>
                      <div 
                        className="flex items-center justify-between border-2 border-gray-200 rounded-md p-3 cursor-pointer"
                        onClick={() => setIsDateDialogOpen(true)}
                      >
                        <div className="text-lg">
                          {isHijri ? (
                            <span>
                              {form.getValues().date.hijriDay} {getHijriMonthName(form.getValues().date.hijriMonth)} {form.getValues().date.hijriYear}
                            </span>
                          ) : (
                            <span>
                              {form.getValues().date.hijriDay}{' '}
                              {getHijriMonthName(form.getValues().date.hijriMonth)}{' '}
                              {form.getValues().date.hijriYear && hijriToGregorianYear(form.getValues().date.hijriYear)}
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                        >
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </Button>
                      </div>

                      {/* نافذة اختيار التاريخ */}
                      <Dialog
                        open={isDateDialogOpen}
                        onOpenChange={setIsDateDialogOpen}
                      >
                        <DialogContent className="p-0 sm:max-w-[425px]" dir="rtl">
                          <DialogTitle className="sr-only">اختيار التاريخ</DialogTitle>
                          <div className="bg-emerald-700 text-white p-4">
                            <div className="flex items-center justify-between">
                              <Pencil className="h-6 w-6" />
                              <h2 className="text-xl font-bold text-center">
                                اختيار التاريخ
                              </h2>
                            </div>
                          </div>
                          
                          <div className="bg-emerald-700 text-white p-2 flex justify-center">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setIsHijri(!isHijri)} 
                              className="bg-white hover:bg-gray-100 text-emerald-700 flex items-center gap-2"
                            >
                              <RefreshCw className="h-4 w-4" />
                              {isHijri ? 'تبديل للتقويم الميلادي' : 'تبديل للتقويم الهجري'}
                            </Button>
                          </div>
                          
                          <div className="p-6 space-y-4">
                            {/* قسم اختيار اليوم */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">اليوم</label>
                              <select 
                                value={selectedDay}
                                onChange={(e) => {
                                  const day = parseInt(e.target.value);
                                  setSelectedDay(day);
                                  form.setValue('date.hijriDay', day);
                                }}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                              >
                                {Array.from({ length: maxDaysInSelectedMonth }, (_, i) => i + 1).map((day) => (
                                  <option key={day} value={day}>{day}</option>
                                ))}
                              </select>
                            </div>
                            
                            {/* قسم اختيار الشهر */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">الشهر</label>
                              <select 
                                value={selectedMonth}
                                onChange={(e) => {
                                  const month = parseInt(e.target.value);
                                  setSelectedMonth(month);
                                  
                                  // تحديث عدد الأيام في الشهر المختار
                                  const maxDays = hijriMonthLengths[month as keyof typeof hijriMonthLengths] || 30;
                                  setMaxDaysInSelectedMonth(maxDays);
                                  
                                  // ضبط اليوم إذا كان يتجاوز عدد أيام الشهر الجديد
                                  const currentDay = form.getValues().date.hijriDay;
                                  if (currentDay > maxDays) {
                                    form.setValue('date.hijriDay', maxDays);
                                    setSelectedDay(maxDays);
                                  }
                                  
                                  form.setValue('date.hijriMonth', month);
                                }}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                              >
                                {isHijri ? (
                                  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                                    <option key={month} value={month}>{getHijriMonthName(month)}</option>
                                  ))
                                ) : (
                                  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                                    <option key={month} value={month}>{month}</option>
                                  ))
                                )}
                              </select>
                            </div>
                            
                            {/* قسم اختيار السنة */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">السنة</label>
                              <div className="flex items-center">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  onClick={() => {
                                    const newYear = selectedYear - 1;
                                    setSelectedYear(newYear);
                                    form.setValue('date.hijriYear', newYear);
                                  }}
                                  className="bg-gray-100 hover:bg-gray-200"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                                <div className="flex-1 text-center text-xl mx-4">
                                  {isHijri ? selectedYear : hijriToGregorianYear(selectedYear)}
                                </div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  onClick={() => {
                                    const newYear = selectedYear + 1;
                                    setSelectedYear(newYear);
                                    form.setValue('date.hijriYear', newYear);
                                  }}
                                  className="bg-gray-100 hover:bg-gray-200"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex justify-end pt-4">
                              <Button 
                                type="button"
                                onClick={() => {
                                  setIsDateDialogOpen(false);
                                }}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white"
                              >
                                تم
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium mr-2 mb-2 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        عدد الأيام المتبقية
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          max="365"
                          className="text-lg border-2 border-gray-200"
                          {...field}
                          onChange={e => {
                            const value = parseInt(e.target.value);
                            field.onChange(isNaN(value) ? 1 : value);
                          }}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium mr-2 mb-2 flex items-center gap-2">
                        <ClockIcon className="h-5 w-5 text-blue-600" />
                        الوقت
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          className="text-lg border-2 border-gray-200"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium mr-2 mb-2 flex items-center gap-2">
                        <Edit2 className="h-5 w-5 text-blue-600" />
                        ملاحظات إضافية (اختياري)
                      </FormLabel>
                      <FormControl>
                        <textarea 
                          {...field} 
                          placeholder="أدخل أي ملاحظات إضافية هنا..." 
                          className="flex h-32 w-full rounded-md border-2 border-gray-200 bg-background px-3 py-2 text-lg text-right shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* تم إزالة خيار الحذف التلقائي بعد انتهاء المناسبة */}
              </div>
              
              <div className="flex justify-center pt-4">
                <Button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}