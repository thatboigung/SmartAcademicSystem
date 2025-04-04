import { Tool } from '@/types';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';

const QuickAccessTools = () => {
  const { user } = useAuth();
  
  // Define the tools based on user role
  const allTools: Tool[] = [
    {
      id: 'scan-qr',
      name: 'Scan QR Code',
      icon: 'qr_code_scanner',
      link: '/scan-qr',
      color: 'text-primary-500',
      backgroundColor: 'bg-primary-100'
    },
    {
      id: 'attendance',
      name: 'Take Attendance',
      icon: 'fact_check',
      link: '/attendance',
      color: 'text-success',
      backgroundColor: 'bg-success bg-opacity-20'
    },
    {
      id: 'verify-eligibility',
      name: 'Verify Eligibility',
      icon: 'verified',
      link: '/exams',
      color: 'text-warning',
      backgroundColor: 'bg-warning bg-opacity-20'
    },
    {
      id: 'courses',
      name: 'Manage Courses',
      icon: 'menu_book',
      link: '/courses',
      color: 'text-secondary-accent',
      backgroundColor: 'bg-secondary-100'
    },
    {
      id: 'reports',
      name: 'Generate Reports',
      icon: 'bar_chart',
      link: '/reports',
      color: 'text-info',
      backgroundColor: 'bg-info bg-opacity-20'
    },
    {
      id: 'students',
      name: 'Manage Students',
      icon: 'people',
      link: '/students',
      color: 'text-neutral-700',
      backgroundColor: 'bg-neutral-200'
    }
  ];
  
  // Filter tools based on user role
  const tools = allTools.filter(tool => {
    if (!user) return false;
    
    switch (tool.id) {
      case 'attendance':
      case 'verify-eligibility':
        return user.role === 'admin' || user.role === 'lecturer';
      case 'students':
      case 'reports':
        return user.role === 'admin' || user.role === 'lecturer';
      default:
        return true;
    }
  });
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div className="border-b border-neutral-200 p-4">
        <h2 className="font-semibold text-lg">Quick Access Tools</h2>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="flex space-x-4 md:space-x-8 min-w-max">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.link}
              className="flex flex-col items-center justify-center p-4 hover:bg-neutral-50 rounded-lg transition-colors duration-150"
            >
              <div className={`w-12 h-12 ${tool.backgroundColor} rounded-full flex items-center justify-center ${tool.color} mb-2`}>
                <span className="material-icons">{tool.icon}</span>
              </div>
              <span className="text-sm font-medium text-neutral-800">{tool.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickAccessTools;
