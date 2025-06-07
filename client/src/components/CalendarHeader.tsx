import { formatMonthYear } from '@/lib/dateUtils';

interface CalendarHeaderProps {
  isHijri: boolean;
  currentMonth: number;
  currentYear: number;
  onToggleCalendarType: () => void;
  onNavigateNextMonth: () => void;
  onNavigatePrevMonth: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  isHijri,
  currentMonth,
  currentYear,
  onToggleCalendarType,
  onNavigateNextMonth,
  onNavigatePrevMonth
}) => {
  const monthYearText = formatMonthYear(currentMonth, currentYear, isHijri);
  
  return (
    <header className="bg-white p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <button 
          className="bg-gray-100 rounded-md px-4 py-2 flex items-center space-x-2"
          onClick={onToggleCalendarType}
        >
          <span className="ml-2">{isHijri ? 'هجري' : 'ميلادي'}</span>
          <i className="fas fa-sync-alt"></i>
        </button>
        
        <h1 className="text-xl font-bold">{monthYearText}</h1>
        
        <div className="flex space-x-2 space-x-reverse">
          <button className="p-2" onClick={onNavigateNextMonth}>
            <i className="fas fa-chevron-right"></i>
          </button>
          <button className="p-2" onClick={onNavigatePrevMonth}>
            <i className="fas fa-chevron-left"></i>
          </button>
        </div>
      </div>
      
      {/* Calendar Days Header */}
      <div className="grid grid-cols-7 text-center border-b pb-3 pt-1">
        <div className="text-primary font-medium text-sm">الأحد</div>
        <div className="text-primary font-medium text-sm">الإثنين</div>
        <div className="text-primary font-medium text-sm">الثلاثاء</div>
        <div className="text-primary font-medium text-sm">الأربعاء</div>
        <div className="text-primary font-medium text-sm">الخميس</div>
        <div className="text-primary font-medium text-sm">الجمعة</div>
        <div className="text-primary font-medium text-sm">السبت</div>
      </div>
    </header>
  );
};

export default CalendarHeader;
