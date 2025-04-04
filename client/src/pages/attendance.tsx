import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QRScannerModal } from '@/components/ui/qr-scanner-modal';
import { useToast } from '@/hooks/use-toast';

const AttendancePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [studentId, setStudentId] = useState('');

  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: [user?.role === 'lecturer' ? `/api/courses?lecturerId=${user?.id}` : '/api/courses'],
    enabled: !!user,
  });

  // Fetch sessions for selected course
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: [`/api/sessions?courseId=${selectedCourse}`],
    enabled: !!selectedCourse,
  });

  // Fetch attendance records for selected session
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery({
    queryKey: [`/api/attendance?sessionId=${selectedSession}`],
    enabled: !!selectedSession,
  });

  // Mutation to record attendance
  const recordAttendance = useMutation({
    mutationFn: async (data: { studentId: number; sessionId: number; present: boolean; markedById: number }) => {
      const response = await apiRequest('POST', '/api/attendance', data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch attendance data
      queryClient.invalidateQueries({ queryKey: [`/api/attendance?sessionId=${selectedSession}`] });
      toast({
        title: 'Attendance recorded',
        description: 'The student attendance has been successfully recorded.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error recording attendance',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Handle QR code scanning
  const handleScan = async (data: string) => {
    if (!selectedSession || !user) {
      toast({
        title: 'Error',
        description: 'Please select a session first',
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
      
      // Record attendance for the student
      recordAttendance.mutate({
        studentId: student.id,
        sessionId: selectedSession,
        present: true,
        markedById: user.id,
      });
      
      setShowScanner(false);
    } catch (error) {
      toast({
        title: 'Error scanning QR code',
        description: error instanceof Error ? error.message : 'Invalid or expired QR code',
        variant: 'destructive',
      });
    }
  };

  // Handle manual student ID entry
  const handleManualEntry = () => {
    if (!selectedSession || !user || !studentId) {
      toast({
        title: 'Error',
        description: 'Please select a session and enter a student ID',
        variant: 'destructive',
      });
      return;
    }

    // In a real app, would verify the student ID exists
    // For this demo, assuming the ID is valid and corresponds to a student with ID 3
    recordAttendance.mutate({
      studentId: 3, // This would normally come from looking up the student by ID
      sessionId: selectedSession,
      present: true,
      markedById: user.id,
    });
    
    setStudentId('');
  };

  // Layout for the student view
  if (user?.role === 'student') {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">My Attendance</h1>
        
        <div className="space-y-6">
          {coursesLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (
            courses?.map((course: any) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle>{course.code}: {course.name}</CardTitle>
                  <CardDescription>
                    Semester: {course.semester}, {course.academicYear}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600">
                        Attendance Rate: <span className="font-semibold text-primary-600">85%</span>
                      </p>
                      <p className="text-sm text-neutral-600">
                        Classes Attended: <span className="font-semibold">17 of 20</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        85 >= 75 ? 'bg-success' : 85 >= 60 ? 'bg-warning' : 'bg-error'
                      }`}></span>
                      <span className="text-sm font-medium">
                        {85 >= 75 ? 'Good Standing' : 85 >= 60 ? 'Warning' : 'Critical'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // Layout for lecturer and admin view
  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Attendance Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2"
            disabled={!selectedSession}
          >
            <span className="material-icons text-sm">qr_code_scanner</span>
            Scan QR Code
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filters */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Select Class</CardTitle>
            <CardDescription>Choose a course and session to take attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Course</label>
              <Select
                onValueChange={(value) => {
                  setSelectedCourse(Number(value));
                  setSelectedSession(null);
                }}
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
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Session</label>
              <Select
                onValueChange={(value) => setSelectedSession(Number(value))}
                disabled={!selectedCourse || sessionsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  {sessionsLoading ? (
                    <SelectItem value="loading" disabled>Loading sessions...</SelectItem>
                  ) : sessions?.length > 0 ? (
                    sessions.map((session: any) => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        {session.title} ({new Date(session.date).toLocaleDateString()})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No sessions found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter Student ID" 
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={!selectedSession}
                />
                <Button
                  onClick={handleManualEntry}
                  disabled={!selectedSession || !studentId}
                >
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Attendance List */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              {selectedSession 
                ? 'Students who have been marked present for this session' 
                : 'Select a session to view attendance records'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedSession ? (
              <div className="text-center py-8 text-neutral-500">
                <span className="material-icons text-4xl mb-2">fact_check</span>
                <p>Select a course and session to view attendance records</p>
              </div>
            ) : attendanceLoading ? (
              <div className="animate-pulse space-y-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded mb-1"></div>
                ))}
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Marked By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords?.length > 0 ? (
                      attendanceRecords.map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell>ST12345</TableCell>
                          <TableCell>Jane Smith</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              record.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {record.present ? 'Present' : 'Absent'}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(record.timestamp).toLocaleTimeString()}</TableCell>
                          <TableCell>{user?.firstName} {user?.lastName}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-neutral-500">
                          No attendance records found for this session
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
    </div>
  );
};

export default AttendancePage;
