import { useState } from 'react';
import { useLocation, useParams, useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowRight, Share2, Pencil, Trash2 } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toArabicNumerals } from '@/lib/dateUtils';
import { useCategories } from '@/context/CategoryContext';

export default function EventDetailsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const params = useParams();
  const eventId = params.id;
  const [selectedNotification, setSelectedNotification] = useState<string>('none');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Получаем категории
  const { categories } = useCategories();
  
  // Загружаем данные о событии
  const { data: event, isLoading } = useQuery<any>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });
  
  // حذف المناسبة
  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('فشل حذف المناسبة');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المناسبة بنجاح",
      });
      navigate('/events');
    },
    onError: (error: Error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-lg">المناسبة غير موجودة</p>
        <Button 
          onClick={() => navigate('/events')}
          className="mt-4"
        >
          العودة للمناسبات
        </Button>
      </div>
    );
  }
  
  const category = categories.find(c => c.id === event.category);
  
  // وظيفة لتغيير نوع التنبيه
  const handleNotificationChange = (value: string) => {
    setSelectedNotification(value);
    
    // عرض رسالة تأكيد
    toast({
      title: "تم تحديث إعدادات التنبيه",
      description: getNotificationDescription(value),
    });
  };
  
  // وظيفة لإرجاع وصف التنبيه
  const getNotificationDescription = (type: string): string => {
    switch (type) {
      case 'sms':
        return 'سيتم تنبيهك عبر رسالة SMS قبل موعد المناسبة';
      case 'whatsapp':
        return 'سيتم تنبيهك عبر الواتساب قبل موعد المناسبة';
      case 'email':
        return 'سيتم تنبيهك عبر بريدك الإلكتروني قبل موعد المناسبة';
      default:
        return 'تم إيقاف التنبيهات لهذه المناسبة';
    }
  };
  
  // وظيفة لمشاركة المناسبة عبر وسائل التواصل الاجتماعي
  const handleShareEvent = () => {
    // إنشاء نص المشاركة
    const shareText = `
${event.title}
التاريخ الهجري: ${event.date.hijri.formatted}
التاريخ الميلادي: ${event.date.gregorian.formatted}
${event.time ? `الوقت: ${event.time}` : ''}
متبقي: ${toArabicNumerals(event.days)} يوم
${event.notes ? `ملاحظات: ${event.notes}` : ''}

تقويم أم القرى: https://www.ummulqura.org.sa/
    `.trim();
    
    // نسخ النص إلى الحافظة
    navigator.clipboard.writeText(shareText).then(() => {
      toast({
        title: "تم نسخ تفاصيل المناسبة",
        description: "يمكنك الآن مشاركتها على وسائل التواصل الاجتماعي",
      });
    }).catch(err => {
      toast({
        title: "حدث خطأ",
        description: "تعذر نسخ التفاصيل إلى الحافظة",
        variant: "destructive",
      });
    });
  };
  
  return (
    <div className="container mx-auto p-4 mb-16 max-w-md" dir="rtl">
      <div className="mb-4">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => navigate('/events')}
        >
          <ArrowRight className="h-4 w-4" />
          العودة للمناسبات
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2 pt-6">
          <div className="bg-blue-50 rounded-lg px-6 py-4 border border-blue-100">
            <CardTitle className="text-2xl font-bold text-center text-blue-700">{event.title}</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* تاريخ المناسبة الهجري والميلادي */}
          <div className="space-y-2">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-lg mb-1 text-primary font-bold">
                {`${toArabicNumerals(event.date.hijri.day)} ${event.date.hijri.formatted.split(' ')[1]} ${toArabicNumerals(event.date.hijri.year)}`}
              </p>
              <p className="text-sm text-gray-500 border-t border-gray-200 pt-2 mt-1">
                {`${toArabicNumerals(event.date.gregorian.day)} ${event.date.gregorian.formatted.split(' ')[1]} ${toArabicNumerals(event.date.gregorian.year)}`}
              </p>
            </div>
            
            <div className="bg-primary/10 p-4 rounded-lg text-center">
              <p className="text-lg font-bold text-primary">
                متبقي {toArabicNumerals(event.days)} يوم
              </p>
            </div>
            
            {/* ملاحظات المناسبة */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 text-center">
                {event.notes ? event.notes : "لا توجد ملاحظات"}
              </p>
            </div>
          </div>
          
          {/* خيارات التنبيه */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-right">إعدادات التنبيه</h3>
            
            <RadioGroup 
              defaultValue="none" 
              onValueChange={handleNotificationChange}
              className="space-y-2"
            >
              <div className="flex justify-end items-center">
                <Label htmlFor="none" className="cursor-pointer w-28 text-right ml-16">
                  لا تنبيه
                </Label>
                <RadioGroupItem value="none" id="none" />
              </div>
              
              <div className="flex justify-end items-center">
                <Label htmlFor="email" className="cursor-pointer w-28 text-right ml-16">
                  <span>بريدك الإلكتروني</span>
                </Label>
                <RadioGroupItem value="email" id="email" />
              </div>
              
              <div className="flex justify-end items-center">
                <Label htmlFor="whatsapp" className="cursor-pointer w-28 text-right ml-16">
                  <span>الواتساب</span>
                </Label>
                <RadioGroupItem value="whatsapp" id="whatsapp" />
              </div>
              
              <div className="flex justify-end items-center">
                <Label htmlFor="sms" className="cursor-pointer w-28 text-right ml-16">
                  <span>رسالة SMS</span>
                </Label>
                <RadioGroupItem value="sms" id="sms" />
              </div>
            </RadioGroup>
          </div>
          
          {/* أزرار المشاركة والتحرير والحذف */}
          <div className="mt-6 flex justify-between gap-2">
            <Button
              onClick={() => navigate(`/events/edit/${eventId}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 flex-1"
            >
              <Pencil className="h-4 w-4" />
              <span>تعديل</span>
            </Button>
            
            <Button
              onClick={handleShareEvent}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 flex-1"
            >
              <Share2 className="h-4 w-4" />
              <span>مشاركة</span>
            </Button>
            
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 flex-1"
            >
              <Trash2 className="h-4 w-4" />
              <span>حذف</span>
            </Button>
          </div>
          
          {/* حوار تأكيد الحذف */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className="font-sans" dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم حذف هذه المناسبة نهائياً ولا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse space-x-2 space-x-reverse">
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => deleteEventMutation.mutate()}
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
