import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { ActivityWithDetails } from '@/types';
import { Button } from '@/components/ui/button';

interface RecentActivityProps {
  limit?: number;
}

const RecentActivity = ({ limit = 5 }: RecentActivityProps) => {
  const { data: activities, isLoading } = useQuery<ActivityWithDetails[]>({
    queryKey: [`/api/activities?limit=${limit}`],
    queryFn: async () => {
      // In a real app, we would fetch from the API
      // For the demo, return mock data
      return [
        {
          id: 1,
          userId: 2,
          action: 'Attendance Recorded',
          details: 'Recorded attendance for CS101 Introduction to Programming',
          timestamp: new Date(),
          user: { firstName: 'Sarah', lastName: 'Johnson' },
          formattedTime: 'Today, 09:32 AM'
        },
        {
          id: 2,
          userId: 3,
          action: 'Exam Verification',
          details: 'Verified 23 students for MATH202 Final Exam',
          timestamp: new Date(Date.now() - 3600000),
          user: { firstName: 'David', lastName: 'Wilson' },
          formattedTime: 'Today, 08:15 AM'
        },
        {
          id: 3,
          userId: 4,
          action: 'Course Materials',
          details: 'Uploaded new materials for PHYS101',
          timestamp: new Date(Date.now() - 86400000),
          user: { firstName: 'Michael', lastName: 'Brown' },
          formattedTime: 'Yesterday, 04:48 PM'
        },
        {
          id: 4,
          userId: 1,
          action: 'System',
          details: 'Exam schedule for Fall 2023 has been published',
          timestamp: new Date(Date.now() - 86400000 - 3600000),
          user: { firstName: 'System', lastName: '' },
          formattedTime: 'Yesterday, 02:30 PM'
        },
        {
          id: 5,
          userId: 1,
          action: 'System',
          details: 'Detected 15 students with low attendance in ENG201',
          timestamp: new Date(Date.now() - 86400000 - 7200000),
          user: { firstName: 'System', lastName: '' },
          formattedTime: 'Yesterday, 11:20 AM'
        }
      ];
    }
  });
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="border-b border-neutral-200 p-4">
          <h2 className="font-semibold text-lg">Recent Activity</h2>
        </div>
        <div className="p-4">
          <ul className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <li key={i} className="flex items-start space-x-3 p-2 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  
  const getIconForActivity = (action: string) => {
    switch (action.toLowerCase()) {
      case 'attendance recorded':
        return {
          icon: 'person',
          bgColor: 'bg-primary-200',
          textColor: 'text-primary-700'
        };
      case 'exam verification':
        return {
          icon: 'check_circle',
          bgColor: 'bg-success bg-opacity-20',
          textColor: 'text-success'
        };
      case 'course materials':
        return {
          icon: 'upload_file',
          bgColor: 'bg-secondary-100',
          textColor: 'text-secondary-accent'
        };
      case 'system':
        return {
          icon: 'warning',
          bgColor: 'bg-error bg-opacity-20',
          textColor: 'text-error'
        };
      default:
        return {
          icon: 'event',
          bgColor: 'bg-warning bg-opacity-20',
          textColor: 'text-warning'
        };
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
      <div className="border-b border-neutral-200 p-4">
        <h2 className="font-semibold text-lg">Recent Activity</h2>
      </div>
      <div className="p-4 max-h-96 overflow-y-auto">
        <ul className="space-y-4">
          {activities?.map((activity) => {
            const { icon, bgColor, textColor } = getIconForActivity(activity.action);
            return (
              <li key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-neutral-50 rounded-md">
                <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center ${textColor} flex-shrink-0`}>
                  <span className="material-icons text-sm">{icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neutral-800">
                    <span className="font-medium">
                      {activity.user?.firstName} {activity.user?.lastName}
                    </span>{' '}
                    {activity.details}
                  </p>
                  <p className="text-xs text-neutral-500">{activity.formattedTime}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="border-t border-neutral-200 p-3 text-center">
        <Button variant="link" className="text-primary-500 text-sm font-medium">
          View all activity
        </Button>
      </div>
    </div>
  );
};

export default RecentActivity;
