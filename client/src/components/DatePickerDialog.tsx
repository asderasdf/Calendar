import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hijriToGregorian } from 'hijri-converter';

interface DatePickerCalendarProps {
  initialMonth: number;
  initialYear: number;
  isHijri: boolean;
  onSelectDate: (day: number) => void;
  selectedDay?: number;
}

export default function DatePickerCalendar({
  initialMonth,
  initialYear,
  isHijri,
  onSelectDate,
  selectedDay,
}: DatePickerCalendarProps) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [selectedDate, setSelectedDate] = useState<number | undefined>(selectedDay);

  useEffect(() => {
    setSelectedDate(selectedDay);
  }, [selectedDay]);

  const monthNames = isHijri
    ? [
        'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى',
        'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال',
        'ذو القعدة', 'ذو الحجة',
      ]
    : [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
      ];

  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const hijriMonthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29]; // متوسط ثابت

  const getDaysInMonth = (month: number, year: number, isHijri: boolean) => {
    if (isHijri) return hijriMonthLengths[month - 1] || 30;
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfWeek = (month: number, year: number, isHijri: boolean): number => {
    if (isHijri) {
      const { gy, gm, gd } = hijriToGregorian(year, month, 1);
      return new Date(gy, gm - 1, gd).getDay(); // Sunday = 0
    }
    return new Date(year, month - 1, 1).getDay();
  };

  const getWeekDayForDate = (day: number, month: number, year: number, isHijri: boolean): number => {
    if (isHijri) {
      const { gy, gm, gd } = hijriToGregorian(year, month, day);
      return new Date(gy, gm - 1, gd).getDay();
    }
    return new Date(year, month - 1, day).getDay();
  };

  const daysInMonth = getDaysInMonth(month, year, isHijri);

  const generateDaysGrid = () => {
    const firstDay = getFirstDayOfWeek(month, year, isHijri);
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const daysArray = Array.from({ length: totalCells }, (_, i) => {
      const day = i - firstDay + 1;
      return day > 0 && day <= daysInMonth ? day : null;
    });
    return Array.from({ length: totalCells / 7 }, (_, i) =>
      daysArray.slice(i * 7, i * 7 + 7)
    );
  };

  const goToPreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDate(day);
    onSelectDate(day);
  };

  const weeks = generateDaysGrid();
  const selectedWeekDay = selectedDate != null
    ? getWeekDayForDate(selectedDate, month, year, isHijri)
    : null;

  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <div className="bg-emerald-700 text-white p-4">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="icon" className="text-white hover:bg-emerald-800">
            <Edit2 className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold text-center">
            {selectedDate
              ? `${dayNames[selectedWeekDay ?? 0]}, ${selectedDate} ${monthNames[month - 1]}`
              : 'اختيار التاريخ'}
          </h2>
        </div>
      </div>

      <div className="flex justify-between items-center p-3 border-b">
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-1 space-x-reverse">
          <span className="font-semibold">{monthNames[month - 1]}</span>
          <span className="font-semibold">{year}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-2">
        <div className="grid grid-cols-7 text-center mb-2">
          {dayNames.map((day, index) => (
            <div key={index} className="py-1 text-gray-500 text-sm">
              {day.slice(0, 1)}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => (
                <div key={dayIndex} className="text-center">
                  {day !== null && (
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full flex items-center justify-center 
                        ${
                          day === selectedDate
                            ? 'bg-emerald-700 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      onClick={() => handleSelectDay(day)}
                    >
                      {day}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t flex justify-between">
        <Button variant="ghost" className="text-red-500">
          الإلغاء
        </Button>
        <Button variant="ghost" className="text-emerald-700">
          حسناً
        </Button>
      </div>
    </div>
  );
}
