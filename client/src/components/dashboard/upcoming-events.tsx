import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Event } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const UpcomingEvents = () => {
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    queryFn: async () => {
      // In a real app, we would fetch from the API
      // For the demo, return mock data
      return [
        {
          id: 1,
          title: 'Faculty Meeting',
          type: 'session',
          date: new Date(Date.now() + 86400000 * 2), // 2 days from now
          duration: 90,
          location: 'Admin Building, Room 301',
          courseId: 0,
          color: 'border-primary-500'
        },
        {
          id: 2,
          title: 'Midterm Exam Preparations',
          type: 'session',
          date: new Date(Date.now() + 86400000 * 3), // 3 days from now
          duration: 180,
          location: 'Science Building, Room 105',
          courseId: 1,
          color: 'border-secondary-accent'
        },
        {
          id: 3,
          title: 'CS101 Final Project Deadline',
          type: 'session',
          date: new Date(Date.now() + 86400000 * 8), // 8 days from now
          duration: 0,
          courseId: 2,
          color: 'border-warning'
        },
        {
          id: 4,
          title: 'Workshop: Digital Learning Tools',
          type: 'session',
          date: new Date(Date.now() + 86400000 * 10), // 10 days from now
          duration: 120,
          location: 'Library, Conference Room B',
          courseId: 0,
          color: 'border-info'
        }
      ];
    }
  });
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="border-b border-neutral-200 p-4">
          <h2 className="font-semibold text-lg">Upcoming Events</h2>
        </div>
        <div className="p-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="mb-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
      <div className="border-b border-neutral-200 p-4 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Upcoming Events</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-neutral-500 hover:text-primary-500">
              <span className="material-icons">more_vert</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View all events</DropdownMenuItem>
            <DropdownMenuItem>Add new event</DropdownMenuItem>
            <DropdownMenuItem>Export calendar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {events?.map((event) => (
            <div key={event.id} className={`border-l-4 ${event.color} pl-3 py-1`}>
              <p className="text-sm font-medium text-neutral-800">{event.title}</p>
              <p className="text-xs text-neutral-600 flex items-center">
                <span className="material-icons text-xs mr-1">calendar_today</span>{' '}
                {format(event.date, 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-neutral-600 flex items-center">
                <span className="material-icons text-xs mr-1">schedule</span>{' '}
                {event.duration
                  ? `${format(event.date, 'h:mm a')} - ${format(
                      new Date(event.date.getTime() + event.duration * 60000),
                      'h:mm a'
                    )}`
                  : format(event.date, 'h:mm a')}
              </p>
              {event.location && (
                <p className="text-xs text-neutral-600 flex items-center">
                  <span className="material-icons text-xs mr-1">place</span> {event.location}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-neutral-200 p-3 text-center">
        <Button variant="link" className="text-primary-500 text-sm font-medium">
          View full calendar
        </Button>
      </div>
    </div>
  );
};

export default UpcomingEvents;
