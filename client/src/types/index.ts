import { User, Course, Session, Exam, Activity } from "@shared/schema";

// Auth context types
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

// Extended type for the Activity with additional data for display
export interface ActivityWithDetails extends Activity {
  user?: {
    firstName: string;
    lastName: string;
  };
  formattedTime?: string;
}

// Extended type for the Event with combined Session & Exam data
export interface Event {
  id: number;
  title: string;
  type: 'session' | 'exam';
  date: Date;
  duration: number;
  location?: string;
  courseId: number;
  courseName?: string;
  color?: string;
}

// Type for QR Code scanning
export interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  isOpen: boolean;
}

// Type for the stats on dashboard
export interface Stats {
  totalStudents: number;
  activeCourses: number;
  averageAttendance: string;
  upcomingExams: number;
}

// Type for the quick access tools on dashboard
export interface Tool {
  id: string;
  name: string;
  icon: string;
  link: string;
  color: string;
  backgroundColor: string;
}

// Type for sidebar navigation items
export interface NavItem {
  name: string;
  icon: string;
  href: string;
  roles: string[];
}
