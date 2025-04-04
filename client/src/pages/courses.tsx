import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Course } from '@shared/schema';

const CoursesPage = () => {
  const { user } = useAuth();
  const [courseDetailsOpen, setCourseDetailsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Fetch courses based on user role
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: [user?.role === 'lecturer' ? `/api/courses?lecturerId=${user?.id}` : '/api/courses'],
    enabled: !!user,
  });
  
  // Function to view course details
  const viewCourseDetails = (course: Course) => {
    setSelectedCourse(course);
    setCourseDetailsOpen(true);
  };
  
  // Function to format the semester display
  const formatSemester = (semester: string, academicYear: string) => {
    return `${semester} ${academicYear}`;
  };
  
  // Different layout for student view
  if (user?.role === 'student') {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">My Courses</h1>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-sm text-neutral-600 mb-1">{course.code}</div>
                      {course.name}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600 line-clamp-2">{course.description || 'No description available'}</p>
                </CardContent>
                <CardFooter className="border-t bg-neutral-50 p-2 justify-between">
                  <span className="text-xs text-neutral-500">
                    {formatSemester(course.semester || 'Current Semester', course.academicYear || '2023-2024')}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => viewCourseDetails(course)}>
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            {courses.length === 0 && (
              <div className="col-span-full text-center py-12">
                <span className="material-icons text-4xl text-neutral-300 mb-2">school</span>
                <p className="text-neutral-600">You are not enrolled in any courses</p>
              </div>
            )}
          </div>
        )}
        
        {/* Course details dialog */}
        <Dialog open={courseDetailsOpen} onOpenChange={setCourseDetailsOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedCourse?.name}</DialogTitle>
              <DialogDescription>
                {selectedCourse?.code} • {formatSemester(selectedCourse?.semester || 'Current Semester', selectedCourse?.academicYear || '2023-2024')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Description</h3>
                <p className="text-sm">{selectedCourse?.description || 'No description available'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Lecturer</h3>
                <p className="text-sm">Dr. John Doe</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Schedule</h3>
                <div className="text-sm space-y-1">
                  <p>Monday: 10:00 AM - 12:00 PM (Lecture Hall A)</p>
                  <p>Wednesday: 2:00 PM - 4:00 PM (Lab 102)</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Materials</h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <span className="material-icons text-sm mr-2">description</span>
                    Course Syllabus
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <span className="material-icons text-sm mr-2">menu_book</span>
                    Reference Textbook
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  // Layout for lecturer and admin
  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Course Management</h1>
        
        {user?.role === 'admin' && (
          <Button>
            <span className="material-icons text-sm mr-2">add</span>
            Add New Course
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Courses</TabsTrigger>
          <TabsTrigger value="archived">Archived Courses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Courses</CardTitle>
              <CardDescription>
                Courses currently offered in the academic year
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Course Name</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Lecturer</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.length > 0 ? (
                        courses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell className="font-mono">{course.code}</TableCell>
                            <TableCell className="font-medium">{course.name}</TableCell>
                            <TableCell>{formatSemester(course.semester || 'Current', course.academicYear || '2023-2024')}</TableCell>
                            <TableCell>Dr. John Doe</TableCell>
                            <TableCell>32</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => viewCourseDetails(course)}
                                >
                                  <span className="material-icons text-sm">visibility</span>
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                >
                                  <span className="material-icons text-sm">edit</span>
                                </Button>
                                
                                {user?.role === 'admin' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <span className="material-icons text-sm">delete</span>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-neutral-500">
                            No active courses found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="archived">
          <Card>
            <CardHeader>
              <CardTitle>Archived Courses</CardTitle>
              <CardDescription>
                Past courses from previous academic years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-neutral-500">
                <span className="material-icons text-4xl mb-2">inventory_2</span>
                <p>No archived courses found</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Course details dialog */}
      <Dialog open={courseDetailsOpen} onOpenChange={setCourseDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCourse?.name}</DialogTitle>
            <DialogDescription>
              {selectedCourse?.code} • {formatSemester(selectedCourse?.semester || 'Current Semester', selectedCourse?.academicYear || '2023-2024')}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Description</h3>
                <p className="text-sm">{selectedCourse?.description || 'No description available'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Course Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-neutral-500">Semester</p>
                    <p>{selectedCourse?.semester || 'Current'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Academic Year</p>
                    <p>{selectedCourse?.academicYear || '2023-2024'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Credits</p>
                    <p>3</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Department</p>
                    <p>Computer Science</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="students">
              <div className="h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>ST12345</TableCell>
                      <TableCell>Jane Smith</TableCell>
                      <TableCell>85%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>ST12346</TableCell>
                      <TableCell>John Doe</TableCell>
                      <TableCell>92%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>ST12347</TableCell>
                      <TableCell>Alice Johnson</TableCell>
                      <TableCell>78%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="sessions">
              <div className="h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Oct 2, 2023</TableCell>
                      <TableCell>Introduction to Variables</TableCell>
                      <TableCell>28/32</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Oct 4, 2023</TableCell>
                      <TableCell>Control Structures</TableCell>
                      <TableCell>30/32</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Oct 9, 2023</TableCell>
                      <TableCell>Functions and Methods</TableCell>
                      <TableCell>26/32</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoursesPage;
