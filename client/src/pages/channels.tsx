import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Bell } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Announcement } from '@shared/schema';

const ChannelsPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch all announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['/api/announcements'],
    queryFn: async () => {
      const res = await fetch('/api/announcements');
      if (!res.ok) throw new Error('Failed to fetch announcements');
      return res.json();
    },
  });

  // Fetch courses for filtering
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
  });

  // Filter announcements based on current tab and search term
  const filteredAnnouncements = announcements.filter((announcement: Announcement) => {
    // First apply channel filter
    if (activeFilter === 'school-events' && !announcement.isGlobal) {
      return false;
    }
    
    if (activeFilter === 'courses' && !announcement.courseId) {
      return false;
    }
    
    if (activeFilter === 'program-students' && (announcement.isGlobal || !announcement.courseId)) {
      // This would need more complex filtering based on program, using courseId as proxy for now
      return false;
    }
    
    // Then apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        announcement.title.toLowerCase().includes(searchLower) ||
        announcement.content.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Get course name for an announcement
  const getCourseName = (courseId: number) => {
    const course = courses.find((c: any) => c.id === courseId);
    return course ? course.name : 'Unknown Course';
  };

  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Channels</h1>
          <p className="text-muted-foreground">
            Stay updated with announcements and communications
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveFilter}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="school-events">School Events</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="program-students">Program Students</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {renderAnnouncementsList(filteredAnnouncements, getCourseName, isLoading)}
        </TabsContent>
        
        <TabsContent value="school-events" className="space-y-4">
          {renderAnnouncementsList(filteredAnnouncements, getCourseName, isLoading)}
        </TabsContent>
        
        <TabsContent value="courses" className="space-y-4">
          {renderAnnouncementsList(filteredAnnouncements, getCourseName, isLoading)}
        </TabsContent>
        
        <TabsContent value="program-students" className="space-y-4">
          {renderAnnouncementsList(filteredAnnouncements, getCourseName, isLoading)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const renderAnnouncementsList = (announcements: Announcement[], getCourseName: (id: number) => string, isLoading: boolean) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-10">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No announcements found</h3>
        <p className="text-muted-foreground">Check back later for updates</p>
      </div>
    );
  }

  return announcements.map((announcement: any) => (
    <Card key={announcement.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{announcement.title}</CardTitle>
            {announcement.courseId && (
              <CardDescription>
                {getCourseName(announcement.courseId)}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {announcement.isPinned && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                Pinned
              </Badge>
            )}
            {announcement.isGlobal && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                School-wide
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{announcement.content}</p>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground pt-2">
        <span>Posted {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}</span>
        {announcement.expiresAt && (
          <span>Expires {formatDistanceToNow(new Date(announcement.expiresAt), { addSuffix: true })}</span>
        )}
      </CardFooter>
    </Card>
  ));
};

export default ChannelsPage;