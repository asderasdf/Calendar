import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { CalendarDate, convertDate } from '@/lib/api';
import { toArabicNumerals } from '@/lib/dateUtils';

const ConverterPage = () => {
  const [activeTab, setActiveTab] = useState<
    'hijri-to-gregorian' | 'gregorian-to-hijri'
  >('hijri-to-gregorian');
  const [hijriDate, setHijriDate] = useState({ day: 1, month: 1, year: 1445 });
  const [gregorianDate, setGregorianDate] = useState({
    day: 1,
    month: 1,
    year: 2024,
  });
  const [convertedDate, setConvertedDate] = useState<CalendarDate | null>(null);

  const convertDateMutation = useMutation({
    mutationFn: async (params: {
      date: { year: number; month: number; day: number; isHijri: boolean };
    }) => {
      return await convertDate(params.date);
    },
    onSuccess: (data) => {
      console.log("✅ البيانات المحوّلة:", data);
      setConvertedDate(data);
    },
  });

  const handleConvert = () => {
  if (activeTab === 'hijri-to-gregorian') {
    convertDateMutation.mutate({
      date: { ...hijriDate, isHijri: true },
    });
  } else {
    convertDateMutation.mutate({
      date: { ...gregorianDate, isHijri: false },
    });
  }
};

  return (
    <>
      <Helmet>
        <title>محول التاريخ الهجري والميلادي | تقويم أم القرى</title>
        <meta
          name="description"
          content="تحويل بين التاريخ الهجري والميلادي وفق تقويم أم القرى الرسمي"
        />
      </Helmet>

      <div className="min-h-screen bg-secondary p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-primary text-2xl text-center">
              محول التاريخ
            </CardTitle>
            <CardDescription className="text-center">
              تحويل بين التقويم الهجري والميلادي
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              defaultValue="hijri-to-gregorian"
              className="w-full"
              onValueChange={(value) => setActiveTab(value as any)}
            >
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="hijri-to-gregorian">
                  هجري إلى ميلادي
                </TabsTrigger>
                <TabsTrigger value="gregorian-to-hijri">
                  ميلادي إلى هجري
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hijri-to-gregorian">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="hijri-day">اليوم</Label>
                      <Input
                        id="hijri-day"
                        type="number"
                        min="1"
                        max="30"
                        value={hijriDate.day}
                        onChange={(e) =>
                          setHijriDate({
                            ...hijriDate,
                            day: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="hijri-month">الشهر</Label>
                      <Input
                        id="hijri-month"
                        type="number"
                        min="1"
                        max="12"
                        value={hijriDate.month}
                        onChange={(e) =>
                          setHijriDate({
                            ...hijriDate,
                            month: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="hijri-year">السنة</Label>
                      <Input
                        id="hijri-year"
                        type="number"
                        min="1"
                        value={hijriDate.year}
                        onChange={(e) =>
                          setHijriDate({
                            ...hijriDate,
                            year: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="gregorian-to-hijri">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="gregorian-day">اليوم</Label>
                      <Input
                        id="gregorian-day"
                        type="number"
                        min="1"
                        max="31"
                        value={gregorianDate.day}
                        onChange={(e) =>
                          setGregorianDate({
                            ...gregorianDate,
                            day: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="gregorian-month">الشهر</Label>
                      <Input
                        id="gregorian-month"
                        type="number"
                        min="1"
                        max="12"
                        value={gregorianDate.month}
                        onChange={(e) =>
                          setGregorianDate({
                            ...gregorianDate,
                            month: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="gregorian-year">السنة</Label>
                      <Input
                        id="gregorian-year"
                        type="number"
                        min="1"
                        value={gregorianDate.year}
                        onChange={(e) =>
                          setGregorianDate({
                            ...gregorianDate,
                            year: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <Button
                className="w-full mt-6"
                onClick={handleConvert}
                disabled={convertDateMutation.isPending}
              >
                {convertDateMutation.isPending
                  ? 'جاري التحويل...'
                  : 'تحويل التاريخ'}
              </Button>

              {convertedDate && (
                <div className="mt-8 p-4 border rounded-md bg-secondary">
                  <h3 className="font-bold text-lg mb-2">نتيجة التحويل:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">التاريخ الهجري:</p>
                      <p className="text-lg">
                        {toArabicNumerals(convertedDate.hijriDay ?? 0)}{' '}
                        {convertedDate.hijriMonthName}{' '}
                        {toArabicNumerals(convertedDate.hijriYear ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">التاريخ الميلادي:</p>
                      <p className="text-lg">
                        {toArabicNumerals(convertedDate.gregorianDay ?? 0)}{' '}
                        {convertedDate.gregorianMonthName}{' '}
                        {toArabicNumerals(convertedDate.gregorianYear ?? 0)}
                      </p>
                    </div>
                    <div className="col-span-2 mt-2">
                      <p className="text-sm text-gray-500">اليوم:</p>
                      <p>{convertedDate.weekDayName}</p>
                    </div>
                  </div>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ConverterPage;
