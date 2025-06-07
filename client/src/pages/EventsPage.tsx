import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toArabicNumerals } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';
import {
  PlusCircle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  AlertTriangle,
  Filter,
  ArrowLeft,
  Sun,
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useCategories } from '@/context/CategoryContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EventCategory {
  id: string;
  name: string;
  default?: boolean;
}

interface EventDate {
  day: number;
  month: number;
  year: number;
  formatted: string;
}

interface Event {
  id: number;
  title: string;
  days: number;
  daysRemaining: number;
  date: {
    hijri: EventDate;
    gregorian: EventDate;
  };
  time: string;
  category: string;
  notes?: string;
}

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<number>(2); // 1: المناسبات المنتهية، 2: المناسبات النشطة
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { categories: categoriesWithColors, getCategory } = useCategories();

  // Fetch categories
  const { data: categories } = useQuery<EventCategory[]>({
    queryKey: ['/api/categories'],
    enabled: true,
  });

  // Fetch events
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events', selectedCategory],
    queryFn: async () => {
      const category =
        selectedCategory !== 'all' ? selectedCategory : undefined;
      const response = await fetch(
        `https://cleander-project-server.onrender.com/api/events`,
        {
    credentials: 'include',
  }
      );
      if (!response.ok) {
        throw new Error('فشل في جلب المناسبات');
      }
      return response.json();
    },
    enabled: true,
  });

  // Delete all events mutation
  const deleteAllEventsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/events');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف جميع المناسبات بنجاح',
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message || 'لم نتمكن من حذف المناسبات',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteAllEvents = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAllEvents = () => {
    deleteAllEventsMutation.mutate();
  };
  const filteredEvents =
    events?.filter(
      (event) =>
        (selectedCategory === 'all' || event.category === selectedCategory) &&
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

 const activeEvents = filteredEvents.filter((event) => event.daysRemaining > 0);
const pastEvents = filteredEvents.filter((event) => event.daysRemaining <= 0);

  return (
    <div className="container max-w-md mx-auto p-4 mb-24 text-right">
      {/* Dialog للتأكيد قبل الحذف */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="text-right">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              تأكيد حذف المناسبات
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف جميع المناسبات؟ لا يمكن التراجع عن هذا
              الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row-reverse justify-start gap-2">
            <AlertDialogAction
              onClick={confirmDeleteAllEvents}
              className="bg-red-600 hover:bg-red-700"
            >
              نعم، حذف الكل
            </AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          className="text-green-700 border-green-700 rounded-lg text-sm px-4"
          onClick={() => setLocation('/categories')}
        >
          الأقسام
        </Button>
        <h1 className="text-2xl font-bold">المناسبات</h1>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg"
          onClick={() => setLocation('/calendar')}
        >
          <Calendar className="h-5 w-5" />
        </Button>
      </header>

      {/* Search bar */}
      <div className="relative mb-4">
        <Input
          type="text"
          placeholder="بحث في المناسبات..."
          className="w-full pr-10 text-right"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Filter className="absolute top-2.5 right-3 h-5 w-5 text-gray-400" />
      </div>

      {/* Dropdown for categories */}
      <div className="mb-5">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full text-right border-gray-300 rounded-lg">
            <SelectValue placeholder="جميع الأقسام" />
          </SelectTrigger>
          <SelectContent position="item-aligned" align="end">
            {categories?.map((cat) => {
              // طريقة أبسط لتحديد ألوان الفئات
              let dotColorClass = '';

              if (cat.id === '1') dotColorClass = 'bg-green-500';
              else if (cat.id === '2') dotColorClass = 'bg-purple-500';
              else if (cat.id === '3') dotColorClass = 'bg-red-500';
              else if (cat.id === '4') dotColorClass = 'bg-orange-500';
              else if (cat.id === '5') dotColorClass = 'bg-teal-500';

              return (
                <SelectItem
                  key={cat.id}
                  value={cat.id}
                  className="text-right flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    {cat.id !== 'all' && (
                      <div
                        className={`w-3 h-3 rounded-full ${dotColorClass}`}
                      ></div>
                    )}
                    <span>{cat.name}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div
          className={`flex items-center justify-center gap-2 py-3 rounded-lg cursor-pointer order-1 ${
            activeTab === 1 ? 'bg-blue-100 shadow-sm' : 'bg-white border'
          }`}
          onClick={() => setActiveTab(1)}
        >
          <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            {toArabicNumerals(pastEvents.length)}
          </span>
          <span className="font-medium">المناسبات المنتهية</span>
        </div>
        <div
          className={`flex items-center justify-center gap-2 py-3 rounded-lg cursor-pointer order-0 ${
            activeTab === 2 ? 'bg-green-100 shadow-sm' : 'bg-white border'
          }`}
          onClick={() => setActiveTab(2)}
        >
          <span className="font-medium">المناسبات النشطة</span>
          <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            {toArabicNumerals(activeEvents.length)}
          </span>
        </div>
      </div>

      {/* Events list */}
      <div>
        {isLoading ? (
          <div className="flex justify-center p-8">جاري التحميل...</div>
        ) : activeTab === 2 ? (
          // Active events
          activeEvents.length > 0 ? (
            activeEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              لا توجد مناسبات نشطة
            </div>
          )
        ) : // Past events
        pastEvents.length > 0 ? (
          pastEvents.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            لا توجد مناسبات منتهية
          </div>
        )}
      </div>

      {/* Add Event Button */}
      <div className="fixed bottom-20 left-4">
        <Button
          className="h-14 w-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center p-0"
          onClick={() => setLocation('/add-event')}
        >
          <PlusCircle className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  // Get category to determine colors
  const { getCategory } = useCategories();
  const [, setLocation] = useLocation();
  const category = getCategory(event.category);

  // Default color if category not found
  const color = category?.color || 'blue';

  // Color mapping
  const colorMap: Record<
    string,
    {
      border: string;
      bg: string;
      text: string;
      lightBg: string;
      tagBg: string;
      tagText: string;
    }
  > = {
    blue: {
      border: 'border-blue-600',
      bg: 'bg-blue-600',
      lightBg: 'bg-blue-50',
      text: 'text-white',
      tagBg: 'bg-blue-50',
      tagText: 'text-blue-600',
    },
    green: {
      border: 'border-green-600',
      bg: 'bg-green-600',
      lightBg: 'bg-green-50',
      text: 'text-white',
      tagBg: 'bg-green-50',
      tagText: 'text-green-600',
    },
    purple: {
      border: 'border-purple-600',
      bg: 'bg-purple-600',
      lightBg: 'bg-purple-50',
      text: 'text-white',
      tagBg: 'bg-purple-50',
      tagText: 'text-purple-600',
    },
    red: {
      border: 'border-red-600',
      bg: 'bg-red-600',
      lightBg: 'bg-red-50',
      text: 'text-white',
      tagBg: 'bg-red-50',
      tagText: 'text-red-600',
    },
    orange: {
      border: 'border-orange-600',
      bg: 'bg-orange-600',
      lightBg: 'bg-orange-50',
      text: 'text-white',
      tagBg: 'bg-orange-50',
      tagText: 'text-orange-600',
    },
    teal: {
      border: 'border-teal-600',
      bg: 'bg-teal-600',
      lightBg: 'bg-teal-50',
      text: 'text-white',
      tagBg: 'bg-teal-50',
      tagText: 'text-teal-600',
    },
  };

  const styles = colorMap[color] || colorMap['blue'];
  const isPastEvent = event.daysRemaining <= 0;


  // عرض مختلف للمناسبات المنتهية (مع دائرة مطفية)
  if (isPastEvent) {
    return (
      <div
        className={`mb-4 bg-white rounded-lg shadow-sm overflow-hidden border-r-[6px] border-gray-300 cursor-pointer hover:shadow-md transition-shadow`}
        onClick={() => setLocation(`/events/${event.id}`)}
      >
        <div className="flex flex-row-reverse">
          <div className="bg-gray-100 text-gray-500 flex flex-col items-center justify-center p-3 min-w-[80px]">
            <span className="text-xs font-medium mb-1">قبل</span>
            <span className="text-xl font-bold">
              {toArabicNumerals(Math.abs(event.daysRemaining))}
            </span>
            <span className="text-xs font-medium">يوم</span>
          </div>

          <div className="flex-1 p-3 ml-2 text-right">
            <div className="flex justify-between mb-1 items-start">
              <span className="text-xs py-0.5 px-2 rounded-full bg-gray-100 text-gray-500">
                {category?.name || 'غير مصنف'}
              </span>
              <h3 className="text-md font-bold text-gray-500">{event.title}</h3>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-col gap-1 text-gray-500 text-xs">
                <div className="flex gap-2 justify-end">
                  <div className="flex items-center">
                    <span>{event.time}</span>
                    <Clock className="h-3 w-3 mr-1" />
                  </div>
                  <div className="flex items-center">
                    <span>{event.date.gregorian.formatted}</span>
                    <Sun className="h-3 w-3 mr-1" />
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <span>{event.date.hijri.formatted}</span>
                  <Calendar className="h-3 w-3 mr-1" />
                </div>
              </div>
              {event.notes && (
                <div className="text-xs text-gray-500 text-right mt-1 line-clamp-1">
                  {event.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // العرض الأساسي للمناسبات النشطة مع دائرة أكثر وضوحاً
  return (
    <div
      className={`mb-4 bg-white rounded-lg shadow overflow-hidden border-r-[6px] ${styles.border} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => setLocation(`/events/${event.id}`)}
    >
      <div className="flex flex-row-reverse">
        <div
          className={`${styles.bg} ${styles.text} flex flex-col items-center justify-center p-4 min-w-[85px]`}
        >
          <span className="text-xs font-medium mb-1">متبقي</span>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-2xl font-bold">
              {toArabicNumerals(event.daysRemaining)}
            </span>
          </div>
          <span className="text-xs font-medium mt-1">يوم</span>
        </div>

        <div className="flex-1 p-3 ml-2 text-right">
          <div className="flex justify-between mb-1 items-start">
            <span
              className={`text-xs py-0.5 px-2 rounded-full ${styles.tagBg} ${styles.tagText}`}
            >
              {category?.name || 'غير مصنف'}
            </span>
            <h3 className="text-md font-bold">{event.title}</h3>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-1 text-gray-500 text-xs">
              <div className="flex gap-2 justify-end">
                <div className="flex items-center">
                  <span>{event.time}</span>
                  <Clock className="h-3 w-3 mr-1" />
                </div>
                <div className="flex items-center">
                  <span>{event.date.gregorian.formatted}</span>
                  <Sun className="h-3 w-3 mr-1" />
                </div>
              </div>
              <div className="flex items-center justify-end">
                <span>{event.date.hijri.formatted}</span>
                <Calendar className="h-3 w-3 mr-1" />
              </div>
            </div>
            {event.notes && (
              <div className="text-xs text-gray-600 text-right mt-1 line-clamp-1">
                {event.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
