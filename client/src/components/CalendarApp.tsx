import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import CalendarInfoBox from './CalendarInfoBox';
import { CalendarDate, CalendarMonth } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const CalendarApp = () => {
  const [isHijri, setIsHijri] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const [currentView, setCurrentView] = useState<{
    year: number;
    month: number;
    isHijri: boolean;
  }>({
    year: 0,
    month: 0,
    isHijri: true,
  });
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch the current date from the API
  const {
    data: todayData,
    isLoading: todayLoading,
    error: todayError,
  } = useQuery<CalendarDate>({
    queryKey: ['/api/calendar/today'],
    staleTime: 1000 * 60 * 60 * 24, // Refresh once per day
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/calendar/today`);
      if (!response.ok) {
        throw new Error('خطأ في جلب التاريخ الحالي');
      }
      return response.json() as Promise<CalendarDate>;
    },
  });

  // Set initial calendar view based on current date
  useEffect(() => {
    if (todayData) {
      setCurrentView({
        year: isHijri ? todayData.hijriYear : todayData.gregorianYear,
        month: isHijri ? todayData.hijriMonth : todayData.gregorianMonth,
        isHijri,
      });

      if (!selectedDate) {
        setSelectedDate(todayData);
      }
    }
  }, [todayData, isHijri]);

  // Fetch calendar month data
  const {
    data: calendarData,
    isLoading: calendarLoading,
    error: calendarError,
  } = useQuery<CalendarMonth>({
    queryKey: [
      '/api/calendar/month',
      currentView.year,
      currentView.month,
      currentView.isHijri,
    ],
    enabled: currentView.year !== 0 && currentView.month !== 0,
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/calendar/month?year=${currentView.year}&month=${
          currentView.month
        }&calendar=${currentView.isHijri ? 'hijri' : 'gregorian'}`
      );
      if (!response.ok) {
        throw new Error('خطأ في جلب بيانات الشهر');
      }
      return response.json() as Promise<CalendarMonth>;
    },
  });

  // Toggle between Hijri and Gregorian calendars
  const handleToggleCalendarType = () => {
    const newIsHijri = !isHijri;
    setIsHijri(newIsHijri);

    if (selectedDate) {
      setCurrentView({
        year: newIsHijri ? selectedDate.hijriYear : selectedDate.gregorianYear,
        month: newIsHijri
          ? selectedDate.hijriMonth
          : selectedDate.gregorianMonth,
        isHijri: newIsHijri,
      });
    }
  };

  // Navigate to the next month
  const handleNavigateNextMonth = () => {
    let newMonth = currentView.month + 1;
    let newYear = currentView.year;

    if (newMonth > (isHijri ? 12 : 12)) {
      newMonth = 1;
      newYear += 1;
    }

    setCurrentView({
      year: newYear,
      month: newMonth,
      isHijri,
    });
  };

  // Navigate to the previous month
  const handleNavigatePrevMonth = () => {
    let newMonth = currentView.month - 1;
    let newYear = currentView.year;

    if (newMonth < 1) {
      newMonth = isHijri ? 12 : 12;
      newYear -= 1;
    }

    setCurrentView({
      year: newYear,
      month: newMonth,
      isHijri,
    });
  };

  // التحقق مما إذا كان التاريخ سابقاً للتاريخ الحالي
  const isPastDate = (date: CalendarDate): boolean => {
    if (!todayData) return false;

    const today = todayData;

    if (date.hijriYear < today.hijriYear) return true;
    if (
      date.hijriYear === today.hijriYear &&
      date.hijriMonth < today.hijriMonth
    )
      return true;
    if (
      date.hijriYear === today.hijriYear &&
      date.hijriMonth === today.hijriMonth &&
      date.hijriDay < today.hijriDay
    )
      return true;

    return false;
  };

  // Handle date selection
  const handleSelectDate = (date: CalendarDate) => {
    setSelectedDate(date);

    if (isPastDate(date)) {
      toast({
        title: 'لا يمكن إضافة مناسبة',
        description: 'لا يمكن إضافة مناسبات في تاريخ سابق لليوم الحالي',
        variant: 'destructive',
      });
    } else {
      setLocation(
        `/add-event?day=${date.hijriDay}&month=${date.hijriMonth}&year=${date.hijriYear}`
      );
    }
  };

  // Handle add event button click
  const handleAddEvent = () => {
    if (selectedDate && !isPastDate(selectedDate)) {
      setLocation(
        `/add-event?day=${selectedDate.hijriDay}&month=${selectedDate.hijriMonth}&year=${selectedDate.hijriYear}`
      );
    } else {
      toast({
        title: 'حدد تاريخاً صالحاً',
        description: 'يرجى تحديد تاريخ لا يقل عن التاريخ الحالي',
        variant: 'destructive',
      });
    }
  };

  if (todayLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Skeleton className="h-12 w-40 mb-6" />
        <Skeleton className="h-[400px] w-full max-w-md" />
      </div>
    );
  }

  if (todayError || calendarError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-destructive text-xl mb-4">
          حدث خطأ أثناء تحميل التقويم
        </div>
        <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-4 pt-4">
        <CalendarInfoBox todayDate={todayData} />
      </div>

      <CalendarHeader
        isHijri={isHijri}
        currentMonth={currentView.month}
        currentYear={currentView.year}
        onToggleCalendarType={handleToggleCalendarType}
        onNavigateNextMonth={handleNavigateNextMonth}
        onNavigatePrevMonth={handleNavigatePrevMonth}
      />

      {calendarLoading ? (
        <div className="flex-1 bg-white p-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <CalendarGrid
          calendarData={calendarData}
          selectedDate={selectedDate}
          todayDate={todayData || null}
          onSelectDate={handleSelectDate}
          isHijri={isHijri}
        />
      )}

      <div className="fixed bottom-20 left-6">
        <button
          className="bg-primary text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
          onClick={handleAddEvent}
        >
          <i className="fas fa-plus text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default CalendarApp;
