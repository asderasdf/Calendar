import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const ArticlesPage = () => {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['/api/articles'],
  });

  return (
    <>
      <Helmet>
        <title>المقالات | تقويم أم القرى</title>
        <meta name="description" content="مقالات عن التقويم الهجري والمناسبات الإسلامية وفق تقويم أم القرى" />
      </Helmet>

      <div className="min-h-screen bg-secondary p-4">
        <h1 className="text-2xl font-bold text-primary text-center mb-6">المقالات</h1>
        
        <ScrollArea className="h-[calc(100vh-140px)] pr-2">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <Card key={item} className="mb-4">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-4 w-1/3" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle>أهمية التقويم الهجري في الإسلام</CardTitle>
                  <CardDescription>بواسطة د. عبدالله العتيبي</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>يعتبر التقويم الهجري أساسًا مهمًا في الحياة الإسلامية، حيث يرتبط بالعبادات والمناسبات الدينية. بدأ التقويم الهجري مع هجرة النبي محمد صلى الله عليه وسلم من مكة إلى المدينة، وأصبح التقويم الرسمي للدولة الإسلامية في عهد الخليفة عمر بن الخطاب رضي الله عنه.</p>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-gray-500">٢٠ محرم ١٤٤٦</p>
                </CardFooter>
              </Card>
              
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle>تقويم أم القرى: النشأة والتطور</CardTitle>
                  <CardDescription>بواسطة أ. محمد السلمي</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>تقويم أم القرى هو التقويم الهجري الرسمي في المملكة العربية السعودية، ويعتمد على حسابات فلكية دقيقة لتحديد بدايات الأشهر القمرية. تم تأسيسه عام ١٣٧٠هـ (١٩٥٠م) وسمي بهذا الاسم نسبة إلى مكة المكرمة التي تسمى في القرآن الكريم بـ "أم القرى".</p>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-gray-500">١٥ صفر ١٤٤٦</p>
                </CardFooter>
              </Card>
              
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle>الحسابات الفلكية في تحديد بدايات الشهور القمرية</CardTitle>
                  <CardDescription>بواسطة د. سارة الزهراني</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>يعتمد تقويم أم القرى على حسابات فلكية دقيقة لتحديد بدايات الشهور القمرية، حيث يتم حساب وقت اقتران القمر بالشمس (المحاق) ثم تحديد إمكانية رؤية الهلال في مكة المكرمة. تطورت هذه الحسابات عبر السنوات لتصبح أكثر دقة في تحديد بدايات الشهور، خاصة شهر رمضان وشهر ذي الحجة.</p>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-gray-500">٥ ربيع الأول ١٤٤٦</p>
                </CardFooter>
              </Card>
              
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle>الفرق بين التقويم الهجري والتقويم الميلادي</CardTitle>
                  <CardDescription>بواسطة د. فهد العمري</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>يختلف التقويم الهجري عن التقويم الميلادي في عدة جوانب أساسية، فالتقويم الهجري يعتمد على دورة القمر (قمري) بينما يعتمد التقويم الميلادي على دورة الأرض حول الشمس (شمسي). السنة الهجرية أقصر من السنة الميلادية بحوالي ١١ يومًا، مما يجعل المناسبات الإسلامية تتنقل عبر فصول السنة الميلادية المختلفة خلال دورة مدتها ٣٣ عامًا.</p>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-gray-500">١٢ ربيع الآخر ١٤٤٦</p>
                </CardFooter>
              </Card>
            </>
          )}
        </ScrollArea>
      </div>
    </>
  );
};

export default ArticlesPage;
