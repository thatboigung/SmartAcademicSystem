import { useState, useRef, useEffect } from 'react';
import { QRScannerProps } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const QRScannerModal = ({ isOpen, onScan, onClose, onError }: QRScannerProps) => {
  const [input, setInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);
  
  const startCamera = async () => {
    try {
      setScanning(true);
      if (!videoRef.current) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      
      // Start scanning for QR codes
      requestAnimationFrame(scanQRCode);
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (onError) onError(error as Error);
      setScanning(false);
    }
  };
  
  const stopCamera = () => {
    setScanning(false);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };
  
  const scanQRCode = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0) {
      // Video not ready yet, try again soon
      requestAnimationFrame(scanQRCode);
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // In a real app, would use a QR code detection library here
    // For this demo, we'll simulate scanning by waiting a few seconds
    setTimeout(() => {
      // Simulate a successful scan with a token value
      if (scanning) {
        const mockToken = 'mock-qr-token-' + Math.random().toString(36).substring(2, 10);
        onScan(mockToken);
      }
    }, 3000);
    
    // Continue scanning
    requestAnimationFrame(scanQRCode);
  };
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    
    onScan(input);
    setInput('');
  };
  
  const handleClose = () => {
    stopCamera();
    if (onClose) onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Student QR Code</DialogTitle>
          <DialogDescription>
            Position the QR code within the frame for scanning
          </DialogDescription>
        </DialogHeader>
        
        <div className="aspect-square bg-neutral-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 mb-4 overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          <div className="border-2 border-primary-500 rounded-lg w-3/4 h-3/4 relative flex items-center justify-center z-10">
            <div className="w-full h-0.5 bg-primary-500 bg-opacity-50 absolute animate-pulse"></div>
            <div className="h-full w-0.5 bg-primary-500 bg-opacity-50 absolute animate-pulse"></div>
          </div>
        </div>
        
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <p className="text-neutral-700 font-medium">Or enter student ID manually:</p>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Student ID"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Verify</Button>
          </div>
        </form>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
