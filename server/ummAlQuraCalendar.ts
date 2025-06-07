// Helper functions for Umm Al-Qura calendar calculations

// Helper to get Arabic Hijri month names
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
    'ذو الحجة',
  ];
  return hijriMonths[month - 1] || '';
};

// Helper to get Arabic Gregorian month names
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
    'ديسمبر',
  ];
  return gregorianMonths[month - 1] || '';
};

// Helper to get Arabic day names
export const getArabicDayName = (day: number): string => {
  const weekDays = [
    'الأحد',
    'الإثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت',
  ];
  return weekDays[day] || '';
};

// Define known Umm Al-Qura dates for 1446 AH to provide accurate conversions
export const hijriMonthLengths: Record<number, number> = {
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
  12: 29, // Dhu al-Hijjah
};

// Known reference point based on Umm Al-Qura calendar
export const referenceDate = {
  hijri: { day: 15, month: 11, year: 1446 }, // 15 Dhu al-Qi'dah 1446
  gregorian: { day: 13, month: 5, year: 2025 }, // May 13, 2025
};

// ✅ Updated function to get Umm Al-Qura today's date using the real current date
export function getUmmAlQuraToday() {
  const today = new Date();
  const gDay = today.getDate();
  const gMonth = today.getMonth() + 1;
  const gYear = today.getFullYear();
  const weekDay = today.getDay();

  const hijriDate = estimateHijriFromGregorian(gDay, gMonth, gYear);

  return {
    hijriDay: hijriDate.day,
    hijriMonth: hijriDate.month,
    hijriYear: hijriDate.year,
    gregorianDay: gDay,
    gregorianMonth: gMonth,
    gregorianYear: gYear,
    hijriMonthName: getHijriMonthName(hijriDate.month),
    gregorianMonthName: getGregorianMonthName(gMonth),
    weekDay: weekDay,
    weekDayName: getArabicDayName(weekDay),
  };
}

// Function to estimate Gregorian date from Hijri date based on Umm Al-Qura
export function estimateGregorianFromHijri(
  hijriDay: number,
  hijriMonth: number,
  hijriYear: number
) {
  const monthsDiff =
    (hijriYear - referenceDate.hijri.year) * 12 +
    (hijriMonth - referenceDate.hijri.month);
  let daysDiff = hijriDay - referenceDate.hijri.day;

  if (monthsDiff > 0) {
    for (let m = referenceDate.hijri.month; m <= 12; m++) {
      if (m !== referenceDate.hijri.month)
        daysDiff += hijriMonthLengths[m] || 30;
    }
    for (let y = referenceDate.hijri.year + 1; y < hijriYear; y++) {
      daysDiff += 354;
    }
    for (let m = 1; m < hijriMonth; m++) {
      daysDiff += hijriMonthLengths[m] || 30;
    }
  } else if (monthsDiff < 0) {
    for (let m = referenceDate.hijri.month - 1; m >= 1; m--) {
      daysDiff -= hijriMonthLengths[m] || 30;
    }
    for (let y = referenceDate.hijri.year - 1; y >= hijriYear; y--) {
      daysDiff -= 354;
    }
    for (let m = 12; m >= hijriMonth; m--) {
      daysDiff -= hijriMonthLengths[m] || 30;
    }
  }

  const date = new Date(
    referenceDate.gregorian.year,
    referenceDate.gregorian.month - 1,
    referenceDate.gregorian.day
  );
  date.setDate(date.getDate() + daysDiff);

  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    weekDay: date.getDay(),
  };
}

// Function to estimate Hijri date from Gregorian date based on Umm Al-Qura
export function estimateHijriFromGregorian(
  gregorianDay: number,
  gregorianMonth: number,
  gregorianYear: number
) {
  const gregDate = new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
  const refDate = new Date(
    referenceDate.gregorian.year,
    referenceDate.gregorian.month - 1,
    referenceDate.gregorian.day
  );

  const daysDiff = Math.round(
    (gregDate.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let totalDays = referenceDate.hijri.day + daysDiff;
  let year = referenceDate.hijri.year;
  let month = referenceDate.hijri.month;

  while (totalDays > hijriMonthLengths[month]) {
    totalDays -= hijriMonthLengths[month];
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  while (totalDays <= 0) {
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
    totalDays += hijriMonthLengths[month];
  }

  return {
    day: totalDays,
    month,
    year,
    weekDay: gregDate.getDay(),
  };
}

// Function to validate Hijri date
export function isValidHijriDate(
  day: number,
  month: number,
  year: number
): boolean {
  if (month < 1 || month > 12) return false;
  const monthLength = hijriMonthLengths[month] || 30;
  if (day < 1 || day > monthLength) return false;
  if (year < 1400 || year > 1500) return false;
  return true;
}
