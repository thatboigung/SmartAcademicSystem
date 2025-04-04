import { useLocation, Link } from 'wouter';
import { useState, useRef, useEffect } from 'react';
import { QRScannerModal } from './qr-scanner-modal';
import { useAuth } from '@/lib/auth';
import { Menu, X } from 'lucide-react';

const MobileNav = () => {
  const [location] = useLocation();
  const [showScanner, setShowScanner] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const sideMenuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const handleScan = (data: string) => {
    console.log('Scanned:', data);
    // Process the scanned data
    setShowScanner(false);
  };

  // Navigation items with roles
  const navItems = [
    {
      name: 'Dashboard',
      icon: 'dashboard',
      href: '/dashboard',
      roles: ['student', 'lecturer', 'admin'],
    },
    {
      name: 'Channels',
      icon: 'chat',
      href: '/channels',
      roles: ['student', 'lecturer', 'admin'],
    },
    {
      name: 'Schedule',
      icon: 'calendar_today',
      href: '/schedule',
      roles: ['student', 'lecturer', 'admin'],
    },
    {
      name: 'Attendance',
      icon: 'fact_check',
      href: '/attendance',
      roles: ['student', 'lecturer', 'admin'],
    },
    {
      name: 'Courses',
      icon: 'menu_book',
      href: '/courses',
      roles: ['student', 'lecturer', 'admin'],
    },
    {
      name: 'Exams',
      icon: 'assignment',
      href: '/exams',
      roles: ['student', 'lecturer', 'admin'],
    },
    {
      name: 'Students',
      icon: 'people',
      href: '/students',
      roles: ['admin', 'lecturer'],
    },
  ];
  
  // Filter navItems based on user role
  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sideMenuRef.current && !sideMenuRef.current.contains(event.target as Node)) {
        setIsSideMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isSideMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSideMenuOpen]);
  
  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsSideMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-20 bg-white p-2 rounded-md shadow-md"
      >
        <Menu className="h-6 w-6 text-primary-600" />
      </button>

      {/* Side Menu Overlay */}
      <div 
        className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ${
          isSideMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`} 
      />

      {/* Side Menu */}
      <div 
        ref={sideMenuRef}
        className={`md:hidden fixed top-0 left-0 h-full w-3/4 max-w-xs bg-white z-40 transition-transform duration-300 transform shadow-lg ${
          isSideMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : '--'}
            </div>
            <div>
              <p className="font-medium">{user ? `${user.firstName} ${user.lastName}` : 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || ''}</p>
            </div>
          </div>
          <button onClick={() => setIsSideMenuOpen(false)}>
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        
        <nav className="py-4">
          <div className="px-4 mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Menu</p>
          </div>
          <div className="space-y-1">
            {filteredNavItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                onClick={() => setIsSideMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 ${
                  location === item.href 
                    ? "bg-primary-50 text-primary-600 border-r-4 border-primary-500" 
                    : "text-gray-600"
                }`}
              >
                <span className="material-icons text-sm">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Floating QR Code Scanner Button */}
      <button 
        onClick={() => setShowScanner(true)}
        className="md:hidden fixed right-5 bottom-5 bg-primary-500 text-white rounded-full p-4 shadow-lg z-20"
      >
        <span className="material-icons">qr_code_scanner</span>
      </button>
      
      <QRScannerModal 
        isOpen={showScanner} 
        onScan={handleScan} 
        onClose={() => setShowScanner(false)} 
      />
    </>
  );
};

export default MobileNav;
