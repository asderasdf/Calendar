import { CalendarDate, CalendarMonth } from '@/lib/api';
import { toArabicNumerals } from '@/lib/dateUtils';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useCategories } from '@/context/CategoryContext';
import { useToast } from '@/hooks/use-toast';

interface CalendarGridProps {
  calendarData: CalendarMonth | undefined;
  selectedDate: CalendarDate | null;
  todayDate: CalendarDate | null;
  onSelectDate: (date: CalendarDate) => void;
  isHijri: boolean;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  calendarData,
  selectedDate,
  todayDate,
  onSelectDate,
  isHijri,
}) => {
  const [location, setLocation] = useLocation();
  const { categories } = useCategories();
  const { toast } = useToast();

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ['/api/events'],
  });

  const getCategoryColor = (categoryId: string) => {
    if (categoryId === 'all') return '#8b5cf6';
    const category = categories.find((c) => c.id === categoryId);
    return category?.color || '#8b5cf6';
  };

  if (!calendarData || !calendarData.dates || calendarData.dates.length === 0) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <p className="text-lg">لا توجد بيانات متاحة للشهر الحالي</p>
      </div>
    );
  }

  const weeks: CalendarDate[][] = [];
  let currentWeek: CalendarDate[] = [];
  const firstDayOfMonth = calendarData.dates[0];

  // ✅ Fix weekday calculation
  const dateObj = new Date(
    firstDayOfMonth.gregorianYear,
    firstDayOfMonth.gregorianMonth - 1,
    firstDayOfMonth.gregorianDay
  );
  const startingWeekDay = dateObj.getDay(); // 0 = Sunday

  for (let i = 0; i < startingWeekDay; i++) {
    currentWeek.push({} as CalendarDate);
  }

  calendarData.dates.forEach((date, index) => {
    currentWeek.push(date);
    if (
      (startingWeekDay + index + 1) % 7 === 0 ||
      index === calendarData.dates.length - 1
    ) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0 && currentWeek.length < 7) {
    const remainingDays = 7 - currentWeek.length;
    for (let i = 0; i < remainingDays; i++) {
      currentWeek.push({} as CalendarDate);
    }
    weeks.push([...currentWeek]);
  }

  const isSelectedDate = (date: CalendarDate): boolean => {
    if (!selectedDate || !date) return false;
    const dateKey = isHijri
      ? `${date.hijriYear}-${date.hijriMonth}-${date.hijriDay}`
      : `${date.gregorianYear}-${date.gregorianMonth}-${date.gregorianDay}`;
    const selectedKey = isHijri
      ? `${selectedDate.hijriYear}-${selectedDate.hijriMonth}-${selectedDate.hijriDay}`
      : `${selectedDate.gregorianYear}-${selectedDate.gregorianMonth}-${selectedDate.gregorianDay}`;
    return dateKey === selectedKey;
  };

  const isTodayDate = (date: CalendarDate): boolean => {
    if (!todayDate || !date) return false;
    return isHijri
      ? date.hijriYear === todayDate.hijriYear &&
          date.hijriMonth === todayDate.hijriMonth &&
          date.hijriDay === todayDate.hijriDay
      : date.gregorianYear === todayDate.gregorianYear &&
          date.gregorianMonth === todayDate.gregorianMonth &&
          date.gregorianDay === todayDate.gregorianDay;
  };

  const findEventForDate = (date: CalendarDate) => {
    if (!events || events.length === 0 || !date) return null;

    return events.find((event) => {
      if (!event.date) return false;

      if (isHijri) {
        return (
          event.date.hijri &&
          event.date.hijri.day === date.hijriDay &&
          event.date.hijri.month === date.hijriMonth &&
          event.date.hijri.year === date.hijriYear
        );
      } else {
        return (
          event.date.gregorian &&
          event.date.gregorian.day === date.gregorianDay &&
          event.date.gregorian.month === date.gregorianMonth &&
          event.date.gregorian.year === date.gregorianYear
        );
      }
    });
  };

  const handleEventClick = (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocation(`/events/${event.id}`);
    console.log('Navigate to event details:', event.id);
  };

  return (
    <div className="flex-1 bg-white p-2">
      {weeks.map((week, weekIndex) => (
        <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-1 mb-1">
          {week.map((day, dayIndex) => {
            if (!day.hijriDay) {
              return (
                <div
                  key={`empty-${weekIndex}-${dayIndex}`}
                  className="calendar-cell p-1 border-r inactive-day h-20"
                ></div>
              );
            }

            const isSelected = isSelectedDate(day);
            const isToday = isTodayDate(day);
            const event = findEventForDate(day);

            return (
              <div
                key={`day-${day.hijriYear}-${day.hijriMonth}-${day.hijriDay}`}
                className={`calendar-cell p-2 border-r relative overflow-hidden flex flex-col h-20 ${
                  isSelected ? 'selected-date' : ''
                } ${isToday ? 'today' : ''} ${event ? 'has-event' : ''}`}
                onClick={() => {
                  if (event) {
                    toast({
                      title: 'لا يمكن إضافة مناسبة جديدة',
                      description: `هذا اليوم يحتوي بالفعل على مناسبة "${event.title}"`,
                      variant: 'destructive',
                    });
                    return;
                  }
                  onSelectDate(day);
                }}
              >
                <div
                  className={`text-xs text-left absolute top-2 left-2 font-normal ${
                    isToday ? 'text-primary' : 'text-gray-400'
                  }`}
                >
                  {isHijri
                    ? toArabicNumerals(day.gregorianDay)
                    : toArabicNumerals(day.hijriDay)}
                </div>

                <div className="flex-grow flex items-center justify-center">
                  <div
                    className={`font-bold text-2xl ${
                      isToday ? 'text-primary today-number' : 'day-number'
                    }`}
                  >
                    {isHijri
                      ? toArabicNumerals(day.hijriDay)
                      : toArabicNumerals(day.gregorianDay)}
                  </div>
                </div>

                {event && (
                  <div
                    style={{
                      backgroundColor: getCategoryColor(event.category),
                    }}
                    className="text-white text-xs py-1 px-2 absolute bottom-0 right-0 w-full cursor-pointer text-center font-medium"
                    onClick={(e) => handleEventClick(event, e)}
                  >
                    {event.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default CalendarGrid;
