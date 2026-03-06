import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  badge?: string;
  badgeColor?: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
}

const badgeColors = {
  green: 'bg-success/10 text-success',
  blue: 'bg-info/10 text-info',
  yellow: 'bg-warning/10 text-warning',
  red: 'bg-destructive/10 text-destructive',
  purple: 'bg-chart-purple/10 text-chart-purple',
};

const StatCard = ({ icon, value, label, badge, badgeColor = 'green' }: StatCardProps) => {
  return (
    <div className="stat-card">
      <div className="flex justify-center mb-3">
        {icon}
      </div>
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">{label}</div>
      {badge && (
        <span className={`status-badge ${badgeColors[badgeColor]}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {badge}
        </span>
      )}
    </div>
  );
};

export default StatCard;
