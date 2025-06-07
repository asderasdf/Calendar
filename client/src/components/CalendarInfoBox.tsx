import { useState, useEffect } from 'react';
import { MapPin, Share2 } from 'lucide-react';
import { CalendarDate } from '@/lib/api';
import { toArabicNumerals } from '@/lib/dateUtils';
import axios from 'axios';

interface CalendarInfoBoxProps {
  todayDate: CalendarDate | null | undefined;
}

const CalendarInfoBox: React.FC<CalendarInfoBoxProps> = ({ todayDate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  const [weatherData, setWeatherData] = useState({
    city: 'مكة',
    temperature: 38,
    weatherCondition: 'مشمس',
    loading: true,
    error: false,
  });

  const [locationData, setLocationData] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    city: 'مكة',
    loading: true,
    error: false,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const response = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=ar`
            );

            const city =
              response.data.address.city ||
              response.data.address.town ||
              response.data.address.village ||
              response.data.address.county ||
              'مكة';

            setLocationData({
              latitude,
              longitude,
              city,
              loading: false,
              error: false,
            });

            setWeatherData({
              city,
              temperature: 38, // Replace with real API if needed
              weatherCondition: 'مشمس',
              loading: false,
              error: false,
            });
          } catch (error) {
            console.error('خطأ في الحصول على بيانات الموقع:', error);
            setLocationData((prev) => ({
              ...prev,
              loading: false,
              error: true,
            }));
          }
        },
        (error) => {
          console.error('خطأ في تحديد الموقع:', error);

          if (error.code === 1) {
            alert(
              'تم رفض الإذن بالوصول إلى الموقع. يرجى السماح به لتحديد المدينة بدقة.'
            );
          }

          setLocationData((prev) => ({
            ...prev,
            loading: false,
            error: true,
          }));
        }
      );
    } else {
      console.error('الجيولوكيشن غير مدعوم في هذا المتصفح');
      setLocationData((prev) => ({
        ...prev,
        loading: false,
        error: true,
      }));
    }
  }, []);

  if (!todayDate) return null;

  const gregorianDate = `${todayDate.gregorianDay} ${todayDate.gregorianMonthName} (أيار) ${todayDate.gregorianYear}`;
  const hijriDate = `${todayDate.weekDayName} ${todayDate.hijriDay} ${
    todayDate.hijriMonthName
  } (${toArabicNumerals(11)}) ${todayDate.hijriYear}`;

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const prayerTimes = {
    fajr: { hour: 4, minute: 14 },
    dhuhr: { hour: 12, minute: 10 },
    asr: { hour: 15, minute: 30 },
    maghrib: { hour: 18, minute: 45 },
    isha: { hour: 20, minute: 0 },
  };

  const getNextPrayer = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const prayerTimesInMinutes = {
      fajr: prayerTimes.fajr.hour * 60 + prayerTimes.fajr.minute,
      dhuhr: prayerTimes.dhuhr.hour * 60 + prayerTimes.dhuhr.minute,
      asr: prayerTimes.asr.hour * 60 + prayerTimes.asr.minute,
      maghrib: prayerTimes.maghrib.hour * 60 + prayerTimes.maghrib.minute,
      isha: prayerTimes.isha.hour * 60 + prayerTimes.isha.minute,
    };

    let nextPrayer = '';
    let remainingTime = 0;
    let nextPrayerTimeFormatted = '';

    if (currentTimeInMinutes < prayerTimesInMinutes.fajr) {
      nextPrayer = 'الفجر';
      remainingTime = prayerTimesInMinutes.fajr - currentTimeInMinutes;
      nextPrayerTimeFormatted = `${prayerTimes.fajr.hour}:${String(
        prayerTimes.fajr.minute
      ).padStart(2, '0')} AM`;
    } else if (currentTimeInMinutes < prayerTimesInMinutes.dhuhr) {
      nextPrayer = 'الظهر';
      remainingTime = prayerTimesInMinutes.dhuhr - currentTimeInMinutes;
      nextPrayerTimeFormatted = `${prayerTimes.dhuhr.hour}:${String(
        prayerTimes.dhuhr.minute
      ).padStart(2, '0')} PM`;
    } else if (currentTimeInMinutes < prayerTimesInMinutes.asr) {
      nextPrayer = 'العصر';
      remainingTime = prayerTimesInMinutes.asr - currentTimeInMinutes;
      nextPrayerTimeFormatted = `${prayerTimes.asr.hour - 12}:${String(
        prayerTimes.asr.minute
      ).padStart(2, '0')} PM`;
    } else if (currentTimeInMinutes < prayerTimesInMinutes.maghrib) {
      nextPrayer = 'المغرب';
      remainingTime = prayerTimesInMinutes.maghrib - currentTimeInMinutes;
      nextPrayerTimeFormatted = `${prayerTimes.maghrib.hour - 12}:${String(
        prayerTimes.maghrib.minute
      ).padStart(2, '0')} PM`;
    } else if (currentTimeInMinutes < prayerTimesInMinutes.isha) {
      nextPrayer = 'العشاء';
      remainingTime = prayerTimesInMinutes.isha - currentTimeInMinutes;
      nextPrayerTimeFormatted = `${prayerTimes.isha.hour - 12}:${String(
        prayerTimes.isha.minute
      ).padStart(2, '0')} PM`;
    } else {
      nextPrayer = 'الفجر';
      remainingTime =
        24 * 60 - currentTimeInMinutes + prayerTimesInMinutes.fajr;
      nextPrayerTimeFormatted = `${prayerTimes.fajr.hour}:${String(
        prayerTimes.fajr.minute
      ).padStart(2, '0')} AM`;
    }

    const remainingHours = Math.floor(remainingTime / 60);
    const remainingMinutes = remainingTime % 60;

    return {
      name: nextPrayer,
      remainingTimeFormatted: `${String(remainingHours).padStart(
        2,
        '0'
      )}:${String(remainingMinutes).padStart(2, '0')}`,
      nextPrayerTimeFormatted,
    };
  };

  const arabicTime = () => {
    let hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${toArabicNumerals(hours)}:${toArabicNumerals(minutes)} ${ampm}`;
  };

  const nextPrayerInfo = getNextPrayer();
  const arabicTemperature = toArabicNumerals(weatherData.temperature);

  return (
    <div className="bg-sky-50 p-5 rounded-xl mb-4 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <div className="text-gray-800 font-medium text-sm">
          {gregorianDate} (٠)
        </div>
        <Share2 className="h-5 w-5 text-gray-500" />
        <div className="text-gray-800 font-bold text-right text-lg">
          {hijriDate} -
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center">
        <div className="text-gray-800 font-bold text-xl">
          <div>الحرارة : {arabicTemperature}م</div>
          <div>الطقس : {weatherData.weatherCondition}</div>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-md">
            <MapPin className="h-6 w-6 text-green-600 ml-2" />
            <span
              className={`font-bold text-lg ${
                locationData.error ? 'text-red-600' : 'text-green-800'
              }`}
            >
              {locationData.error
                ? 'تعذر تحديد الموقع'
                : locationData.loading
                ? 'جارٍ التحميل...'
                : locationData.city}
            </span>
          </div>
          {locationData.error && (
            <button
              onClick={() => window.location.reload()}
              className="mt-1 text-sm text-blue-600 underline"
            >
              إعادة المحاولة
            </button>
          )}
        </div>

        <div className="text-gray-800 font-bold text-center text-2xl ml-4">
          <div>{arabicTime()}</div>
        </div>

        <div className="p-4 rounded-lg border-2 border-gray-200">
          <div className="text-sm font-medium text-center">الصلاة التالية</div>
          <div className="text-sm text-center">
            متبقي على {nextPrayerInfo.name}
          </div>
          <div className="text-3xl font-bold text-center text-green-600">
            {nextPrayerInfo.remainingTimeFormatted}
          </div>
          <div className="text-xs text-center text-gray-500">
            {nextPrayerInfo.nextPrayerTimeFormatted}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarInfoBox;
