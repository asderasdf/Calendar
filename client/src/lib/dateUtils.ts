// Utility functions for date formatting and conversion
// This provides a client-side fallback when API is not available

// Helper to convert western numerals to Arabic numerals
export const toArabicNumerals = (num?: number): string => {
  if (typeof num !== 'number' || isNaN(num)) return '';
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/[0-9]/g, (w) => arabicNumerals[+w]);
};


// Convert Gregorian date to Hijri (approximate algorithm for fallback)
export const gregorianToHijri = (gregorianDate: Date): { year: number; month: number; day: number } => {
  const gregorianYear = gregorianDate.getFullYear();
  const gregorianMonth = gregorianDate.getMonth() + 1;
  const gregorianDay = gregorianDate.getDate();

  // Approximate conversion formula (30-year cycle Hijri, 31-year cycle Gregorian)
  let jd = 
    Math.floor((gregorianYear + 8791) * 365.25) +
    Math.floor(((gregorianMonth - 1) * 30.6 + gregorianDay)) - 10632;
  
  let L = Math.floor(jd - 1948440 + 10632);
  let n = Math.floor((L-1) / 10631);
  L = L - 10631 * n + 354;
  
  let j = Math.floor((10985 - L) / 5316) * Math.floor((50 * L) / 17719) + 
          Math.floor(L / 5670) * Math.floor((43 * L) / 15238);
  
  L = L - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - 
      Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  
  let hijriMonth = Math.floor((24 * L) / 709);
  let hijriDay = L - Math.floor((709 * hijriMonth) / 24);
  let hijriYear = 30 * n + j - 30;

  return { year: hijriYear, month: hijriMonth, day: hijriDay };
};

// Helper function to get Arabic names of Hijri months
export const getHijriMonthName = (month: number): string => {
  const hijriMonths = [
    'محرم',
    'صفر',
    'ربيع الأول',
    'ربيع الثاني',
    'جمادى الأولى',
    'جمادى الآخرة',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذو القعدة',
    'ذو الحجة'
  ];
  return hijriMonths[month - 1];
};

// Helper function to get Arabic names of Gregorian months
export const getGregorianMonthName = (month: number): string => {
  const gregorianMonths = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر'
  ];
  return gregorianMonths[month - 1];
};

// Helper function to get Arabic day names
export const getArabicDayName = (day: number): string => {
  const weekDays = [
    'الأحد',
    'الإثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت'
  ];
  // Adjusting for Arabic week starting with Sunday (0)
  return weekDays[day];
};

// Format date for display (month and year)
export const formatMonthYear = (
  month: number,
  year: number,
  isHijri: boolean
): string => {
  const monthName = isHijri
    ? getHijriMonthName(month)
    : getGregorianMonthName(month);
  
  return `${monthName} ${toArabicNumerals(year)}`;
};

// Check if a date is today
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};
