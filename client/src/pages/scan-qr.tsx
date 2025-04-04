import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { QRCodeSVG } from 'qrcode.react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { QRScannerModal } from '@/components/ui/qr-scanner-modal';
import ExamEligibilityModal from '@/components/ui/exam-eligibility-modal';

const ScanQRPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedUser, setScannedUser] = useState<any | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  
  // Generate QR code token for the current user
  const { data: tokenData, isLoading: tokenLoading, refetch: refetchToken } = useQuery<{ token: string }>({
    queryKey: ['/api/qrcode'],
    enabled: !!user,
  });
  
  // Effect to refresh the QR code periodically
  useEffect(() => {
    if (tokenData) {
      setQrToken(tokenData.token);
    }
    
    // Refresh the token every 4 minutes (tokens expire after 5 minutes)
    const intervalId = setInterval(() => {
      refetchToken();
    }, 4 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [tokenData, refetchToken]);
  
  // Handle QR code scanning (for lecturers and admins)
  const verifyQrCode = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest('POST', '/api/qrcode/verify', { token });
      return response.json();
    },
    onSuccess: (data) => {
      setScannedUser(data);
      setScanSuccess(true);
      // Show the eligibility modal with the student's details
      setShowEligibilityModal(true);
      toast({
        title: 'QR code verified',
        description: `Verified ${data.firstName} ${data.lastName}`,
      });
    },
    onError: (error) => {
      setScanSuccess(false);
      toast({
        title: 'QR code verification failed',
        description: error instanceof Error ? error.message : 'Invalid or expired QR code',
        variant: 'destructive',
      });
    },
  });
  
  const handleScan = (data: string) => {
    verifyQrCode.mutate(data);
    setShowScanner(false);
  };
  
  // Generate QR code using the library
  const generateQRSvg = (data: string) => {
    return (
      <QRCodeSVG 
        value={data}
        size={300}
        bgColor={"#ffffff"}
        fgColor={"#3F51B5"}
        level={"L"}
        className="w-full h-full"
      />
    );
  };
  
  // Student view - shows their QR code
  if (user?.role === 'student') {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>My QR Code</CardTitle>
            <CardDescription>
              Show this QR code to your lecturer to record attendance or verify exam eligibility
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-2">
            <div className="w-64 h-64 border-2 border-dashed border-neutral-300 rounded-md p-3">
              {tokenLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
              ) : qrToken ? (
                generateQRSvg(qrToken)
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-neutral-500">Failed to generate QR code</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-2 text-center">
            <p className="text-sm text-neutral-600">
              <span className="font-medium">{user.firstName} {user.lastName}</span>
              <br />
              Student ID: {user.studentId}
            </p>
            <p className="text-xs text-neutral-500">
              QR code refreshes automatically every 5 minutes for security
            </p>
            <Button variant="outline" size="sm" onClick={() => refetchToken()}>
              <span className="material-icons text-sm mr-2">refresh</span>
              Refresh QR
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Lecturer and admin view - can scan QR codes
  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">QR Code Scanner</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scan Student QR Code</CardTitle>
            <CardDescription>
              Scan a student's QR code to verify their identity, record attendance, or check exam eligibility
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="aspect-square bg-neutral-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 mb-4 w-64 h-64">
              {scanSuccess ? (
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-success bg-opacity-20 rounded-full flex items-center justify-center text-success mx-auto mb-2">
                    <span className="material-icons">check_circle</span>
                  </div>
                  <p className="font-medium">{scannedUser?.firstName} {scannedUser?.lastName}</p>
                  <p className="text-sm text-neutral-600">ID: {scannedUser?.studentId || 'N/A'}</p>
                  <p className="text-xs text-success mt-2">Successfully verified</p>
                </div>
              ) : (
                <div className="text-center p-4">
                  <span className="material-icons text-5xl text-neutral-400 mb-2">qr_code_scanner</span>
                  <p className="text-sm text-neutral-600">Press the button below to scan a QR code</p>
                </div>
              )}
            </div>
            
            <Button onClick={() => setShowScanner(true)} className="w-full max-w-xs">
              <span className="material-icons text-sm mr-2">qr_code_scanner</span>
              Scan QR Code
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>What You Can Do</CardTitle>
            <CardDescription>
              QR code scanning can be used for multiple purposes in the academic management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 flex-shrink-0">
                  <span className="material-icons text-sm">fact_check</span>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Take Attendance</h3>
                  <p className="text-sm text-neutral-600">
                    Quickly record student attendance for classes and events by scanning their QR code
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-warning bg-opacity-20 flex items-center justify-center text-warning flex-shrink-0">
                  <span className="material-icons text-sm">verified</span>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Verify Exam Eligibility</h3>
                  <p className="text-sm text-neutral-600">
                    Check if a student meets the attendance requirements to sit for an exam
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-info bg-opacity-20 flex items-center justify-center text-info flex-shrink-0">
                  <span className="material-icons text-sm">badge</span>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Verify Student Identity</h3>
                  <p className="text-sm text-neutral-600">
                    Confirm a student's identity for administrative purposes or during exams
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showScanner}
        onScan={handleScan}
        onClose={() => setShowScanner(false)}
      />
      
      {/* Exam Eligibility Modal */}
      {scannedUser && (
        <ExamEligibilityModal
          isOpen={showEligibilityModal}
          onClose={() => setShowEligibilityModal(false)}
          studentId={scannedUser.id}
          studentName={`${scannedUser.firstName} ${scannedUser.lastName}`}
          studentIdNumber={scannedUser.studentId || ''}
        />
      )}
    </div>
  );
};

export default ScanQRPage;
