import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Exam, ExamEligibility } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle, FileX, Loader2, Calendar, Clock } from "lucide-react";
import { format } from 'date-fns';

interface ExamEligibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  studentName?: string;
  studentIdNumber?: string;
}

const ExamEligibilityModal = ({
  isOpen,
  onClose,
  studentId,
  studentName = 'Student',
  studentIdNumber = 'Unknown',
}: ExamEligibilityModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  // Fetch today's exams
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get all exams for today
  const { data: todayExams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['/api/exams/today'],
    queryFn: async () => {
      const res = await fetch('/api/exams/today');
      if (!res.ok) throw new Error('Failed to fetch today\'s exams');
      return res.json();
    },
    enabled: isOpen,
  });

  // Get all student's eligibility records
  const { data: eligibility = [], isLoading: eligibilityLoading } = useQuery({
    queryKey: [`/api/eligibility?studentId=${studentId}`],
    queryFn: async () => {
      const res = await fetch(`/api/eligibility?studentId=${studentId}`);
      if (!res.ok) throw new Error('Failed to fetch eligibility data');
      return res.json();
    },
    enabled: isOpen && !!studentId,
  });

  // Get all exams for this student (past and future)
  const { data: studentExams = [], isLoading: studentExamsLoading } = useQuery({
    queryKey: [`/api/exams/student/${studentId}`],
    queryFn: async () => {
      const res = await fetch(`/api/exams/student/${studentId}`);
      if (!res.ok) throw new Error('Failed to fetch student exams');
      return res.json();
    },
    enabled: isOpen && !!studentId,
  });

  // Mark attendance for an exam
  const markExamAttendance = useMutation({
    mutationFn: async (data: { studentId: number; examId: number }) => {
      const res = await apiRequest('POST', '/api/exams/attendance', {
        ...data,
        present: true,
        markedById: user?.id,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Attendance marked',
        description: `Successfully marked exam attendance for ${studentName}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/exams/student/${studentId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Error marking attendance',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Handle mark attendance
  const handleMarkAttendance = (examId: number) => {
    markExamAttendance.mutate({ studentId, examId });
  };

  // Find today's exams the student is eligible for
  const eligibleExams = todayExams.filter((exam: Exam) => {
    const eligibilityRecord = eligibility.find((e: ExamEligibility) => e.examId === exam.id);
    return eligibilityRecord && eligibilityRecord.eligible;
  });

  // Check if a student is registered for an exam
  const isRegisteredForExam = (examId: number) => {
    return studentExams.some((exam: any) => 
      exam.id === examId && exam.attendance && exam.attendance.present
    );
  };

  // Format exam time
  const formatExamTime = (exam: Exam) => {
    const examDate = new Date(exam.date);
    const startTime = format(examDate, 'h:mm a');
    const endTime = format(new Date(examDate.getTime() + exam.duration * 60000), 'h:mm a');
    return `${startTime} - ${endTime}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Exam Eligibility Check</span>
            {eligibilityLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
          <DialogDescription>
            Verifying exam eligibility and registration for {studentName} ({studentIdNumber})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Today's exams section */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
              Today's Exams
            </h3>
            
            {examsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : eligibleExams.length === 0 ? (
              <Card className="bg-muted/40">
                <CardContent className="pt-6 text-center">
                  <FileX className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p>No exams scheduled for today or student not eligible</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {eligibleExams.map((exam: Exam) => {
                  const isRegistered = isRegisteredForExam(exam.id);
                  
                  return (
                    <Card key={exam.id} className={isRegistered ? "border-success/40 bg-success/5" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{exam.title}</CardTitle>
                          {isRegistered ? (
                            <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                              Registered
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                              Eligible
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                            {formatExamTime(exam)}
                          </div>
                          <div className="mt-1">
                            Location: {exam.location || 'Not specified'}
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-2">
                        {isRegistered ? (
                          <Button variant="ghost" className="w-full" disabled>
                            <Check className="mr-2 h-4 w-4" />
                            Already Registered
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            className="w-full"
                            onClick={() => handleMarkAttendance(exam.id)}
                            disabled={markExamAttendance.isPending}
                          >
                            {markExamAttendance.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-2 h-4 w-4" />
                            )}
                            Mark Attendance
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Other upcoming exams section */}
          <div>
            <h3 className="text-lg font-medium mb-3">Other Upcoming Exams</h3>
            
            {studentExamsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : studentExams.filter((exam: Exam) => new Date(exam.date) > today).length === 0 ? (
              <Card className="bg-muted/40">
                <CardContent className="pt-6 text-center">
                  <FileX className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p>No upcoming exams for this student</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentExams
                  .filter((exam: Exam) => new Date(exam.date) > today)
                  .sort((a: Exam, b: Exam) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 4) // Show only next 4 upcoming exams
                  .map((exam: Exam) => (
                    <Card key={exam.id} className="bg-muted/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">{exam.title}</CardTitle>
                        <CardDescription>
                          <div>{format(new Date(exam.date), 'MMMM d, yyyy')}</div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                            {formatExamTime(exam)}
                          </div>
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button variant="secondary" onClick={onClose} className="flex-1">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExamEligibilityModal;