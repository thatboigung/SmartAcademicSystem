import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { useAuth } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Event } from '@/types';

const Schedule = () => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewType, setViewType] = useState<'week' | 'list'>('week');
  const [filter, setFilter] = useState<'all' | 'sessions' | 'exams'>('all');
  
  // Fetch combined events (sessions and exams)
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    queryFn: async () => {
      // In a real app, this would fetch from the server
      // For the demo, return mock data
      const today = new Date();
      
      return [
        // Sessions
        {
          id: 1,
          title: 'CS101: Introduction to Programming',
          type: 'session',
          date: addDays(today, 0),
          duration: 90,
          location: 'Building A, Room 101',
          courseId: 1,
          courseName: 'Introduction to Programming',
          color: 'bg-primary-500'
        },
        {
          id: 2,
          title: 'MATH202: Advanced Calculus',
          type: 'session',
          date: addDays(today, 1),
          duration: 120,
          location: 'Building B, Room 203',
          courseId: 2,
          courseName: 'Advanced Calculus',
          color: 'bg-secondary-500'
        },
        {
          id: 3,
          title: 'PHYS101: Physics I Laboratory',
          type: 'session',
          date: addDays(today, 2),
          duration: 180,
          location: 'Science Building, Lab 3',
          courseId: 3,
          courseName: 'Physics I',
          color: 'bg-error'
        },
        {
          id: 4,
          title: 'ENG201: Academic Writing',
          type: 'session',
          date: addDays(today, 3),
          duration: 90,
          location: 'Building C, Room 105',
          courseId: 4,
          courseName: 'Academic Writing',
          color: 'bg-info'
        },
        // Exams
        {
          id: 5,
          title: 'CS101: Midterm Exam',
          type: 'exam',
          date: addDays(today, 5),
          duration: 120,
          location: 'Examination Hall 1',
          courseId: 1,
          courseName: 'Introduction to Programming',
          color: 'bg-warning'
        },
        {
          id: 6,
          title: 'MATH202: Quiz',
          type: 'exam',
          date: addDays(today, 2),
          duration: 60,
          location: 'Building B, Room 203',
          courseId: 2,
          courseName: 'Advanced Calculus',
          color: 'bg-warning'
        }
      ];
    }
  });
  
  // Filter events based on the selected filter
  const filteredEvents = events?.filter(event => {
    if (filter === 'all') return true;
    return event.type === filter;
  });
  
  // Get events for the current week
  const currentWeekEvents = filteredEvents?.filter(event => {
    const eventDate = new Date(event.date);
    const weekEnd = addDays(currentWeek, 6);
    return eventDate >= currentWeek && eventDate <= weekEnd;
  });
  
  // Navigate to previous week
  const prevWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };
  
  // Navigate to next week
  const nextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };
  
  // Format the current week for display
  const formatWeekRange = () => {
    const weekEnd = addDays(currentWeek, 6);
    return `${format(currentWeek, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  };
  
  // Format the time for display
  const formatEventTime = (event: Event) => {
    const startTime = format(new Date(event.date), 'h:mm a');
    if (event.duration) {
      const endTime = format(
        new Date(new Date(event.date).getTime() + event.duration * 60000),
        'h:mm a'
      );
      return `${startTime} - ${endTime}`;
    }
    return startTime;
  };
  
  // Generate an array of days for the week view
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  
  // Check if an event falls on a specific day
  const getEventsForDay = (day: Date) => {
    return currentWeekEvents?.filter(event => 
      isSameDay(new Date(event.date), day)
    ).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };
  
  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Academic Schedule</h1>
        
        <div className="flex flex-wrap gap-2">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="sessions">Classes Only</SelectItem>
              <SelectItem value="exams">Exams Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={viewType} onValueChange={(value: any) => setViewType(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="list">List View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Schedule</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={prevWeek}>
              <span className="material-icons text-sm">chevron_left</span>
            </Button>
            <span className="text-sm font-medium">{formatWeekRange()}</span>
            <Button variant="outline" size="sm" onClick={nextWeek}>
              <span className="material-icons text-sm">chevron_right</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : viewType === 'week' ? (
            // Week View
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, i) => (
                <div key={i} className="min-h-[20rem]">
                  <div className={`text-center p-2 ${
                    isSameDay(day, new Date()) ? 'bg-primary-100 text-primary-700 font-bold rounded-t' : ''
                  }`}>
                    <p className="text-sm font-medium">{format(day, 'EEEE')}</p>
                    <p className="text-xs">{format(day, 'MMM d')}</p>
                  </div>
                  <div className="border h-full rounded-b p-1">
                    {getEventsForDay(day)?.map(event => (
                      <div 
                        key={event.id} 
                        className={`mb-1 p-2 rounded text-white ${event.color} ${
                          event.type === 'exam' ? 'border-l-4 border-l-warning' : ''
                        }`}
                      >
                        <p className="text-xs font-bold truncate">{formatEventTime(event)}</p>
                        <p className="text-xs truncate">{event.title}</p>
                        {event.location && <p className="text-xs truncate">{event.location}</p>}
                      </div>
                    ))}
                    
                    {(!getEventsForDay(day) || getEventsForDay(day)?.length === 0) && (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-xs text-neutral-400">No events</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List View
            <div className="space-y-3">
              {filteredEvents?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No events found</p>
                </div>
              ) : (
                filteredEvents?.map(event => (
                  <div 
                    key={event.id} 
                    className="flex border rounded p-3 hover:bg-neutral-50 transition"
                  >
                    <div className={`w-2 rounded-full self-stretch ${event.color}`}></div>
                    <div className="ml-3 flex-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <h3 className="font-medium">{event.title}</h3>
                          <p className="text-sm text-neutral-600">{event.courseName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            event.type === 'exam' ? 'bg-warning bg-opacity-20 text-warning' : 'bg-primary-100 text-primary-700'
                          }`}>
                            {event.type === 'exam' ? 'Exam' : 'Class'}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {format(new Date(event.date), 'E, MMM d')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-neutral-600">
                        <span className="flex items-center">
                          <span className="material-icons text-xs mr-1">schedule</span>
                          {formatEventTime(event)}
                        </span>
                        {event.location && (
                          <span className="flex items-center">
                            <span className="material-icons text-xs mr-1">place</span>
                            {event.location}
                          </span>
                        )}
                        <span className="flex items-center">
                          <span className="material-icons text-xs mr-1">timelapse</span>
                          {event.duration} minutes
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedule;
