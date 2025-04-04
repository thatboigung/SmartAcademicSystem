import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';
import { Link } from 'wouter';

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const WelcomeCard = () => {
  const { user } = useAuth();
  const currentDate = formatDate(new Date());
  
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-800">
            Welcome back, {user?.firstName || 'User'}!
          </h2>
          <p className="text-neutral-600">{currentDate}</p>
        </div>
        <div className="mt-3 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center space-x-1">
                <span className="material-icons text-sm">add</span>
                <span>Quick Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/scan-qr" className="cursor-pointer">Scan QR Code</Link>
              </DropdownMenuItem>
              {(user?.role === 'lecturer' || user?.role === 'admin') && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/attendance" className="cursor-pointer">Take Attendance</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/exams" className="cursor-pointer">Verify Exam Eligibility</Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href="/schedule" className="cursor-pointer">View Schedule</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
