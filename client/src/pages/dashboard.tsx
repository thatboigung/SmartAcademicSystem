import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import WelcomeCard from '@/components/dashboard/welcome-card';
import StatsOverview from '@/components/dashboard/stats-overview';
import RecentActivity from '@/components/dashboard/recent-activity';
import UpcomingEvents from '@/components/dashboard/upcoming-events';
import QuickAccessTools from '@/components/dashboard/quick-access-tools';

const Dashboard = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex-1 p-4 md:p-6">
        <div className="h-32 flex items-center justify-center bg-white rounded-lg shadow-sm border border-neutral-200">
          <p className="text-lg text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="space-y-6">
        {/* Welcome message and date */}
        <WelcomeCard />
        
        {/* Stats overview cards */}
        <StatsOverview role={user.role} />
        
        {/* Activity and events section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentActivity limit={5} />
          <UpcomingEvents />
        </div>
        
        {/* Quick access tools */}
        <QuickAccessTools />
      </div>
    </div>
  );
};

export default Dashboard;
