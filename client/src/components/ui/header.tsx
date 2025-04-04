import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

const Header = ({ onToggleMobileMenu }: HeaderProps) => {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [notifications, setNotifications] = useState<{ id: number; message: string }[]>([
    { id: 1, message: 'New course materials uploaded' },
    { id: 2, message: 'Upcoming exam next week' },
  ]);

  if (!user) return null;

  // Get the page title based on current location
  const getPageTitle = () => {
    const path = location.split('/')[1];
    switch (path) {
      case 'dashboard':
        return 'Dashboard';
      case 'schedule':
        return 'Schedule';
      case 'attendance':
        return 'Attendance';
      case 'courses':
        return 'Courses';
      case 'exams':
        return 'Exams';
      case 'students':
        return 'Students';
      case 'faculty':
        return 'Faculty';
      case 'reports':
        return 'Reports';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const userInitials = `${user.firstName[0]}${user.lastName[0]}`;

  return (
    <header className="bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden text-neutral-600 hover:text-primary-500 focus:outline-none"
        onClick={onToggleMobileMenu}
      >
        <span className="material-icons">menu</span>
      </button>
      
      <h1 className="text-xl font-bold text-primary-500 hidden md:block">{getPageTitle()}</h1>
      
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-neutral-600 hover:text-primary-500 focus:outline-none relative">
              <span className="material-icons">notifications</span>
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="py-2">
                  {notification.message}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary-500">
              View all
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Search */}
        <button className="text-neutral-600 hover:text-primary-500 focus:outline-none">
          <span className="material-icons">search</span>
        </button>
        
        {/* User Menu (Mobile only) */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold">
                <span>{userInitials}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-500">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
