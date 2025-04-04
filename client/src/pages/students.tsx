import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@shared/schema';

const StudentsPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [studentDetailsOpen, setStudentDetailsOpen] = useState(false);
  
  // Fetch students
  const { data: students = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users?role=student'],
    enabled: !!user && (user.role === 'admin' || user.role === 'lecturer'),
  });
  
  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // View student details
  const viewStudentDetails = (student: User) => {
    setSelectedStudent(student);
    setStudentDetailsOpen(true);
  };
  
  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Student Management</h1>
        
        {user?.role === 'admin' && (
          <Button>
            <span className="material-icons text-sm mr-2">add</span>
            Add New Student
          </Button>
        )}
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <span className="material-icons text-sm">search</span>
              </span>
              <Input
                className="pl-9"
                placeholder="Search by name or student ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Clear
              </Button>
              
              <Button variant="outline">
                <span className="material-icons text-sm mr-2">filter_list</span>
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Showing {filteredStudents.length} of {students.length} students
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
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.studentId || 'N/A'}</TableCell>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 bg-success bg-opacity-20 text-success rounded-full text-xs">
                            Active
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => viewStudentDetails(student)}
                            >
                              <span className="material-icons text-sm">visibility</span>
                            </Button>
                            
                            {user?.role === 'admin' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                >
                                  <span className="material-icons text-sm">edit</span>
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <span className="material-icons text-sm">delete</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-neutral-500">
                        No students found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Student Details Dialog */}
      <Dialog open={studentDetailsOpen} onOpenChange={setStudentDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Detailed information about the student
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <Tabs defaultValue="profile">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-4">
                <div className="flex items-center space-x-4 py-2">
                  <div className="w-16 h-16 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 text-xl font-bold">
                    {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                    <p className="text-sm text-neutral-600">{selectedStudent.studentId || 'No ID assigned'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500">Email</p>
                    <p>{selectedStudent.email}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Username</p>
                    <p>{selectedStudent.username}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Department</p>
                    <p>Computer Science</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Program</p>
                    <p>Bachelor of Science</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Year Level</p>
                    <p>2nd Year</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Status</p>
                    <p className="text-success">Active</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="courses">
                <div className="space-y-2 max-h-[300px] overflow-auto">
                  <div className="border p-3 rounded-md">
                    <p className="font-medium">CS101: Introduction to Programming</p>
                    <div className="flex justify-between text-sm mt-1">
                      <span>90% Attendance</span>
                      <span className="text-success">Good Standing</span>
                    </div>
                  </div>
                  
                  <div className="border p-3 rounded-md">
                    <p className="font-medium">MATH202: Advanced Calculus</p>
                    <div className="flex justify-between text-sm mt-1">
                      <span>65% Attendance</span>
                      <span className="text-warning">Warning</span>
                    </div>
                  </div>
                  
                  <div className="border p-3 rounded-md">
                    <p className="font-medium">PHYS101: Physics I</p>
                    <div className="flex justify-between text-sm mt-1">
                      <span>85% Attendance</span>
                      <span className="text-success">Good Standing</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="attendance">
                <div className="space-y-2 max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Oct 2, 2023</TableCell>
                        <TableCell>CS101</TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 bg-success bg-opacity-20 text-success rounded-full text-xs">
                            Present
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Oct 4, 2023</TableCell>
                        <TableCell>MATH202</TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 bg-error bg-opacity-20 text-error rounded-full text-xs">
                            Absent
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Oct 5, 2023</TableCell>
                        <TableCell>PHYS101</TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 bg-success bg-opacity-20 text-success rounded-full text-xs">
                            Present
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsPage;
