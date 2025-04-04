import StatsCard from '@/components/ui/stats-card';
import { Stats } from '@/types';
import { useQuery } from '@tanstack/react-query';

interface StatsOverviewProps {
  role: string;
}

const StatsOverview = ({ role }: StatsOverviewProps) => {
  // Fetch stats based on user role
  // This would typically come from an API endpoint
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      // In a real app, this would fetch from the API
      // For the demo, return mock data
      return {
        totalStudents: 4256,
        activeCourses: 186,
        averageAttendance: '84%',
        upcomingExams: 24
      };
    }
  });
  
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200 h-24 animate-pulse">
            <div className="bg-gray-200 h-4 w-1/2 mb-2 rounded"></div>
            <div className="bg-gray-200 h-6 w-1/4 rounded"></div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Students Card */}
      <StatsCard
        title="Total Students"
        value={stats.totalStudents.toLocaleString()}
        trend={{
          value: '3.2%',
          isPositive: true,
          label: 'from last semester'
        }}
        icon={<span className="material-icons">people</span>}
        iconColor="text-primary-500"
        iconBgColor="bg-primary-100"
      />
      
      {/* Courses Card */}
      <StatsCard
        title="Active Courses"
        value={stats.activeCourses}
        trend={{
          value: '5.1%',
          isPositive: true,
          label: 'from last semester'
        }}
        icon={<span className="material-icons">menu_book</span>}
        iconColor="text-secondary-accent"
        iconBgColor="bg-secondary-100"
      />
      
      {/* Attendance Card */}
      <StatsCard
        title="Average Attendance"
        value={stats.averageAttendance}
        trend={{
          value: '1.5%',
          isPositive: false,
          label: 'from last month'
        }}
        icon={<span className="material-icons">fact_check</span>}
        iconColor="text-success"
        iconBgColor="bg-success bg-opacity-20"
      />
      
      {/* Exam Card */}
      <StatsCard
        title="Upcoming Exams"
        value={stats.upcomingExams}
        trend={{
          value: 'Next in 5 days',
          isPositive: true,
          label: ''
        }}
        icon={<span className="material-icons">assignment</span>}
        iconColor="text-warning"
        iconBgColor="bg-warning bg-opacity-20"
      />
    </div>
  );
};

export default StatsOverview;
