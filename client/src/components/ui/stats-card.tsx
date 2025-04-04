import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  icon: ReactNode;
  iconColor: string;
  iconBgColor: string;
}

const StatsCard = ({ title, value, trend, icon, iconColor, iconBgColor }: StatsCardProps) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-neutral-600 text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-neutral-800">{value}</h3>
        </div>
        <div className={`w-10 h-10 ${iconBgColor} rounded-full flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`${trend.isPositive ? 'text-success' : 'text-error'} flex items-center`}>
            <span className="material-icons text-sm">
              {trend.isPositive ? 'arrow_upward' : 'arrow_downward'}
            </span> 
            {trend.value}
          </span>
          <span className="ml-2 text-neutral-600">{trend.label}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
