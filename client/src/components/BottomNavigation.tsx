import { Link, useLocation } from 'wouter';

interface BottomNavigationProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onChangeTab
}) => {
  const [location, navigate] = useLocation();

  const handleTabClick = (tab: string, path: string) => {
    onChangeTab(tab);
    navigate(path);
  };

  return (
    <nav className="bg-white border-t fixed bottom-0 w-full">
      <div className="grid grid-cols-4 text-center text-sm">
        <div 
          className={`bottom-nav-item ${activeTab === 'age-calculator' ? 'active' : ''}`}
          onClick={() => handleTabClick('age-calculator', '/age-calculator')}
        >
          <i className="fas fa-birthday-cake"></i>
          <span>حساب العمر</span>
        </div>
        <div 
          className={`bottom-nav-item ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => handleTabClick('events', '/events')}
        >
          <i className="far fa-calendar-check"></i>
          <span>مناسبات</span>
        </div>
        <div 
          className={`bottom-nav-item ${activeTab === 'converter' ? 'active' : ''}`}
          onClick={() => handleTabClick('converter', '/converter')}
        >
          <i className="fas fa-exchange-alt"></i>
          <span>محول</span>
        </div>
        <div 
          className={`bottom-nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => handleTabClick('calendar', '/calendar')}
        >
          <i className="far fa-calendar"></i>
          <span>التقويم</span>
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
