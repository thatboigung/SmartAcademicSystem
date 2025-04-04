import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRScannerModal } from '@/components/ui/qr-scanner-modal';
import { useToast } from '@/hooks/use-toast';
import { Exam } from '@shared/schema';

const ExamsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showScanner, setShowScanner] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showEligibilityDialog, setShowEligibilityDialog] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  
  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: [user?.role === 'lecturer' ? `/api/courses?lecturerId=${user?.id}` : '/api/courses'],
    enabled: !!user,
  });
  
  // Fetch exams for selected course
  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: [`/api/exams?courseId=${selectedCourse}`],
    enabled: !!selectedCourse,
  });
  
  // Mutation to verify exam eligibility
  const verifyEligibility = useMutation({
    mutationFn: async ({ studentId, examId }: { studentId: number; examId: number }) => {
      const response = await apiRequest('POST', '/api/eligibility/check', { studentId, examId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.eligible ? 'Student is eligible' : 'Student is not eligible',
        description: data.eligible 
          ? 'The student meets the attendance requirements for this exam.'
          : 'The student does not meet the minimum attendance requirements.',
        variant: data.eligible ? 'default' : 'destructive',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error checking eligibility',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Handle QR code scanning
  const handleScan = async (data: string) => {
    if (!selectedExam) {
      toast({
        title: 'Error',
        description: 'Please select an exam first',
        variant: 'destructive',
      });
      setShowScanner(false);
      return;
    }

    try {
      // In a real app, would send the QR token to the server for verification
      // Here, simulating verifying the QR code and extracting student ID
      const response = await apiRequest('POST', '/api/qrcode/verify', { token: data });
      const student = await response.json();
      
      // Check eligibility
      verifyEligibility.mutate({
        studentId: student.id,
        examId: selectedExam.id,
      });
      
      setShowScanner(false);
    } catch (error) {
      toast({
        title: 'Error scanning QR code',
        description: error instanceof Error ? error.message : 'Invalid or expired QR code',
        variant: 'destructive',
      });
      setShowScanner(false);
    }
  };
  
  // Handle manual ID entry
  const handleManualVerify = () => {
    if (!selectedExam || !studentId) {
      toast({
        title: 'Error',
        description: 'Please select an exam and enter a student ID',
        variant: 'destructive',
      });
      return;
    }
    
    // For demo purposes, using a hardcoded student ID (3)
    verifyEligibility.mutate({
      studentId: 3,
      examId: selectedExam.id,
    });
    
    setStudentId('');
    setShowEligibilityDialog(false);
  };
  
  // Open eligibility dialog
  const openEligibilityCheck = (exam: Exam) => {
    setSelectedExam(exam);
    setShowEligibilityDialog(true);
  };
  
  // Student view
  if (user?.role === 'student') {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">My Exams</h1>
        
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Exams</TabsTrigger>
            <TabsTrigger value="past">Past Exams</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">CS101: Midterm Exam</CardTitle>
                  <CardDescription>Introduction to Programming</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="material-icons text-xs mr-1">calendar_today</span>
                        October 15, 2023
                      </div>
                      <div className="text-sm">
                        <span className="material-icons text-xs mr-1">schedule</span>
                        10:00 AM - 12:00 PM
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="material-icons text-xs mr-1">place</span>
                      Examination Hall 1
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm">
                        <span className="font-medium">Status:</span>
                        <span className="ml-2 px-2 py-0.5 bg-success bg-opacity-20 text-success rounded-full text-xs">
                          Eligible
                        </span>
                      </div>
                      <Button size="sm">View Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">MATH202: Final Exam</CardTitle>
                  <CardDescription>Advanced Calculus</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="material-icons text-xs mr-1">calendar_today</span>
                        December 10, 2023
                      </div>
                      <div className="text-sm">
                        <span className="material-icons text-xs mr-1">schedule</span>
                        2:00 PM - 5:00 PM
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="material-icons text-xs mr-1">place</span>
                      Examination Hall 2
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm">
                        <span className="font-medium">Status:</span>
                        <span className="ml-2 px-2 py-0.5 bg-warning bg-opacity-20 text-warning rounded-full text-xs">
                          Attendance Warning
                        </span>
                      </div>
                      <Button size="sm">View Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="past">
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Past Exams</CardTitle>
                  <CardDescription>
                    View your previous exam results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Exam</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>CS100</TableCell>
                        <TableCell>Introduction to Computing</TableCell>
                        <TableCell>May 5, 2023</TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 bg-success bg-opacity-20 text-success rounded-full text-xs">
                            Completed
                          </span>
                        </TableCell>
                        <TableCell>A</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>MATH101</TableCell>
                        <TableCell>Calculus I</TableCell>
                        <TableCell>April 28, 2023</TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 bg-success bg-opacity-20 text-success rounded-full text-xs">
                            Completed
                          </span>
                        </TableCell>
                        <TableCell>B+</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  // Lecturer and admin view
  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Exam Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2"
            disabled={!selectedExam}
          >
            <span className="material-icons text-sm">qr_code_scanner</span>
            Scan QR Code
          </Button>
          
          {user?.role === 'admin' && (
            <Button className="flex items-center gap-2">
              <span className="material-icons text-sm">add</span>
              Create Exam
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Course Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Course</CardTitle>
            <CardDescription>Choose a course to view its exams</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              onValueChange={(value) => setSelectedCourse(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {coursesLoading ? (
                  <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                ) : (
                  courses?.map((course: any) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.code}: {course.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        {/* Exams List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Exams</CardTitle>
            <CardDescription>
              {selectedCourse 
                ? 'Exams for the selected course' 
                : 'Select a course to view its exams'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedCourse ? (
              <div className="text-center py-8 text-neutral-500">
                <span className="material-icons text-4xl mb-2">assignment</span>
                <p>Select a course to view its exams</p>
              </div>
            ) : examsLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : exams?.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Min. Attendance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam: Exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.title}</TableCell>
                        <TableCell>{new Date(exam.date).toLocaleDateString()}</TableCell>
                        <TableCell>{exam.duration} minutes</TableCell>
                        <TableCell>{exam.location}</TableCell>
                        <TableCell>{exam.minimumAttendance}%</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEligibilityCheck(exam)}
                            >
                              Verify Eligibility
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <span className="material-icons text-4xl mb-2">assignment</span>
                <p>No exams found for this course</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showScanner}
        onScan={handleScan}
        onClose={() => setShowScanner(false)}
      />
      
      {/* Manual Eligibility Verification Dialog */}
      <Dialog open={showEligibilityDialog} onOpenChange={setShowEligibilityDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Exam Eligibility</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Exam:</p>
              <p className="text-sm">{selectedExam?.title}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Enter Student ID:</p>
              <Input
                placeholder="e.g., ST12345"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-neutral-600">
                Required Attendance: <span className="font-medium">{selectedExam?.minimumAttendance}%</span>
              </p>
              <Button size="sm" onClick={() => setShowScanner(true)}>
                Scan QR
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEligibilityDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualVerify} disabled={!studentId}>
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamsPage;
