import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { NavItem } from '@/types';

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    icon: 'dashboard',
    href: '/dashboard',
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
  {
    name: 'Faculty',
    icon: 'school',
    href: '/faculty',
    roles: ['admin'],
  },
  {
    name: 'Reports',
    icon: 'bar_chart',
    href: '/reports',
    roles: ['admin', 'lecturer'],
  },
  {
    name: 'Settings',
    icon: 'settings',
    href: '/settings',
    roles: ['admin', 'lecturer', 'student'],
  },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const userInitials = `${user.firstName[0]}${user.lastName[0]}`;

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="hidden md:flex flex-col w-64 bg-primary-500 text-white overflow-y-auto">
      <div className="p-4 border-b border-primary-400">
        <h1 className="text-xl font-bold">SAMS</h1>
        <p className="text-sm opacity-80">Smart Academic Management</p>
      </div>
      
      {/* User Profile */}
      <div className="p-4 border-b border-primary-400 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold">
          <span>{userInitials}</span>
        </div>
        <div>
          <p className="font-medium">{`${user.firstName} ${user.lastName}`}</p>
          <p className="text-xs opacity-80 capitalize">{user.role}</p>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <p className="text-xs text-primary-200 uppercase tracking-wider mb-2">General</p>
          
          {filteredNavItems.slice(0, 5).map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2 p-2 rounded-md ${
                location === item.href 
                  ? 'bg-primary-600 text-white' 
                  : 'hover:bg-primary-600 transition-colors duration-150 text-primary-100 hover:text-white'
              } mb-1`}
            >
              <span className="material-icons text-sm">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
        
        {/* Admin specific navigation */}
        {user.role !== 'student' && (
          <div className="mt-6 space-y-1">
            <p className="text-xs text-primary-200 uppercase tracking-wider mb-2">Administration</p>
            
            {filteredNavItems.slice(5).map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 p-2 rounded-md ${
                  location === item.href 
                    ? 'bg-primary-600 text-white' 
                    : 'hover:bg-primary-600 transition-colors duration-150 text-primary-100 hover:text-white'
                } mb-1`}
              >
                <span className="material-icons text-sm">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>
      
      {/* Logout */}
      <div className="p-4 border-t border-primary-400">
        <button 
          onClick={() => logout()}
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-primary-600 transition-colors duration-150 text-primary-100 hover:text-white w-full"
        >
          <span className="material-icons text-sm">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
