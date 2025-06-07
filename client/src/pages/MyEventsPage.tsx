import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MyEventsPage = () => {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  
  const { data: myEvents, isLoading } = useQuery({
    queryKey: ['/api/my-events'],
  });

  return (
    <>
      <Helmet>
        <title>مناسباتي | تقويم أم القرى</title>
        <meta name="description" content="إدارة المناسبات والأحداث الشخصية على تقويم أم القرى" />
      </Helmet>

      <div className="min-h-screen bg-secondary p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">مناسباتي</h1>
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <i className="fas fa-plus ml-2"></i>
                إضافة مناسبة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>إضافة مناسبة جديدة</DialogTitle>
                <DialogDescription>
                  أضف المناسبات والذكريات الخاصة بك إلى التقويم.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="event-title">عنوان المناسبة</Label>
                  <Input id="event-title" placeholder="أدخل عنوان المناسبة" />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="event-date">التاريخ</Label>
                  <Input id="event-date" type="date" />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="event-time">الوقت</Label>
                  <Input id="event-time" type="time" />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="event-description">الوصف</Label>
                  <Textarea id="event-description" placeholder="وصف المناسبة..." />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={() => setIsAddEventOpen(false)}>حفظ المناسبة</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="mb-4">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-4 w-1/3" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <i className="far fa-calendar-alt text-5xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-medium mb-2">لم تضف أي مناسبات بعد</h3>
            <p className="text-gray-500 mb-6">أضف مناسباتك الخاصة لتظهر هنا</p>
            <Button
              onClick={() => setIsAddEventOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <i className="fas fa-plus ml-2"></i>
              إضافة مناسبة جديدة
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default MyEventsPage;
