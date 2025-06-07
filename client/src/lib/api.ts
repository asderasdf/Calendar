import axios from 'axios';

// Base API URL for Umm Al-Qura calendar
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/calendar';
// Type definitions
export interface CalendarDate {
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  gregorianDay: number;
  gregorianMonth: number;
  gregorianYear: number;
  hijriMonthName: string;
  gregorianMonthName: string;
  weekDay: number;
  weekDayName: string;
}

export interface CalendarMonth {
  hijriYear: number;
  hijriMonth: number;
  gregorianYear: number;
  gregorianMonth: number;
  dates: CalendarDate[];
  hijriMonthName: string;
  gregorianMonthName: string;
}

// API functions
export const fetchCalendarMonth = async (
  year: number,
  month: number,
  isHijri: boolean
): Promise<CalendarMonth> => {
  const response = await axios.get(`${API_BASE_URL}/month`, {
    params: {
      year,
      month,
      calendar: isHijri ? 'hijri' : 'gregorian',
    },
  });
  return response.data;
};

export const convertDate = async (date: {
  year: number;
  month: number;
  day: number;
  isHijri?: boolean;
}): Promise<CalendarDate> => {
  const response = await axios.get(`${API_BASE_URL}/convert`, {
    params: {
      year: date.year,
      month: date.month,
      day: date.day,
      from: date.isHijri ? 'hijri' : 'gregorian',
    },
  });
  return response.data;
};

export const getCurrentDate = async (): Promise<CalendarDate> => {
  const response = await axios.get(`${API_BASE_URL}/today`);
  return response.data;
};
