import CalendarApp from "@/components/CalendarApp";
import { Helmet } from "react-helmet";

const CalendarPage = () => {
  return (
    <>
      <Helmet>
        <title>التقويم الهجري والميلادي | تقويم أم القرى</title>
        <meta name="description" content="عرض التقويم الهجري والميلادي المتزامن مع تقويم أم القرى الرسمي" />
      </Helmet>
      <CalendarApp />
    </>
  );
};

export default CalendarPage;
