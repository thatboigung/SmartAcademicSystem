import { useLocation, Link } from 'wouter';
import { useState } from 'react';
import { QRScannerModal } from './qr-scanner-modal';

const MobileNav = () => {
  const [location] = useLocation();
  const [showScanner, setShowScanner] = useState(false);
  
  const handleScan = (data: string) => {
    console.log('Scanned:', data);
    // Process the scanned data
    setShowScanner(false);
  };
  
  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around items-center py-2 z-10">
        <Link 
          href="/dashboard" 
          className={`flex flex-col items-center px-3 py-1 ${location === '/dashboard' ? 'text-primary-500' : 'text-neutral-600'}`}
        >
          <span className="material-icons text-sm">dashboard</span>
          <span className="text-xs">Dashboard</span>
        </Link>
        
        <Link 
          href="/schedule" 
          className={`flex flex-col items-center px-3 py-1 ${location === '/schedule' ? 'text-primary-500' : 'text-neutral-600'}`}
        >
          <span className="material-icons text-sm">calendar_today</span>
          <span className="text-xs">Schedule</span>
        </Link>
        
        <Link 
          href="/attendance" 
          className={`flex flex-col items-center px-3 py-1 ${location === '/attendance' ? 'text-primary-500' : 'text-neutral-600'}`}
        >
          <span className="material-icons text-sm">fact_check</span>
          <span className="text-xs">Attendance</span>
        </Link>
        
        {/* QR Code Scanner Button */}
        <button 
          onClick={() => setShowScanner(true)}
          className="flex flex-col items-center px-3 py-1 text-neutral-600"
        >
          <div className="bg-primary-500 text-white rounded-full p-2 -mt-5 shadow-md">
            <span className="material-icons">qr_code_scanner</span>
          </div>
        </button>
        
        <Link 
          href="/courses" 
          className={`flex flex-col items-center px-3 py-1 ${location === '/courses' ? 'text-primary-500' : 'text-neutral-600'}`}
        >
          <span className="material-icons text-sm">menu_book</span>
          <span className="text-xs">Courses</span>
        </Link>
      </nav>
      
      <QRScannerModal 
        isOpen={showScanner} 
        onScan={handleScan} 
        onClose={() => setShowScanner(false)} 
      />
    </>
  );
};

export default MobileNav;
