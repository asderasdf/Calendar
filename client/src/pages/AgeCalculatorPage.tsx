import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { toArabicNumerals } from '@/lib/dateUtils';

interface AgeResult {
  gregorianYears: number;
  gregorianMonths: number;
  gregorianDays: number;
  hijriYears: number;
  hijriMonths: number;
  hijriDays: number;
}

export default function AgeCalculatorPage() {
  const [birthDate, setBirthDate] = useState<string>('');
  const [ageResult, setAgeResult] = useState<AgeResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const calculateAge = async () => {
    if (!birthDate) {
      toast({
        title: 'أدخل تاريخ الميلاد',
        description: 'يرجى إدخال تاريخ ميلادك',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
    const response = await fetch(
  `https://cleander-project-server.onrender.com/api/age-calculator?birthDate=${birthDate}`,
  { credentials: 'include' }
);


      if (!response.ok) {
        throw new Error('خطأ في حساب العمر');
      }

      const data = await response.json();
      setAgeResult(data);
    } catch (error) {
      toast({
        title: 'خطأ',
        description:
          error instanceof Error ? error.message : 'خطأ في حساب العمر',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 text-center">حساب العمر</h1>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">أدخل تاريخ ميلادك</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="birthDate" className="text-sm font-medium">
              تاريخ الميلاد (ميلادي)
            </label>
            <input
              type="date"
              id="birthDate"
              className="border rounded-md p-2 text-right"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <Button
            onClick={calculateAge}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'جاري الحساب...' : 'احسب العمر'}
          </Button>

          {ageResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-bold text-lg mb-2 text-center">
                نتيجة حساب العمر
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="border-l p-2">
                  <h4 className="font-semibold text-center">
                    التقويم الميلادي
                  </h4>
                  <p className="text-center">
                    {toArabicNumerals(ageResult.gregorianYears)} سنة،{' '}
                    {toArabicNumerals(ageResult.gregorianMonths)} شهر،{' '}
                    {toArabicNumerals(ageResult.gregorianDays)} يوم
                  </p>
                </div>

                <div className="p-2">
                  <h4 className="font-semibold text-center">التقويم الهجري</h4>
                  <p className="text-center">
                    {toArabicNumerals(ageResult.hijriYears)} سنة،{' '}
                    {toArabicNumerals(ageResult.hijriMonths)} شهر،{' '}
                    {toArabicNumerals(ageResult.hijriDays)} يوم
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
