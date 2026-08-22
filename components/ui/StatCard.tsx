import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  iconBg?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'positive',
  icon,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
}) => {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 md:p-6 shadow-[0_4px_12px_rgba(51,51,51,0.04)] hover:shadow-[0_8px_16px_rgba(51,51,51,0.08)] transition-all flex flex-col justify-between">
      <div className="flex justify-between items-start mb-3">
        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[11px] font-medium">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <div>
        <div className="font-headline-lg text-headline-lg text-on-surface mb-1 font-bold">{value}</div>
        {change && (
          <div className="flex items-center gap-1 font-label-md text-label-md text-xs">
            {changeType === 'positive' && (
              <span className="text-tertiary-container flex items-center gap-0.5 font-semibold">
                <span className="material-symbols-outlined text-[16px]">trending_up</span> {change}
              </span>
            )}
            {changeType === 'negative' && (
              <span className="text-error flex items-center gap-0.5 font-semibold">
                <span className="material-symbols-outlined text-[16px]">trending_down</span> {change}
              </span>
            )}
            {changeType === 'neutral' && (
              <span className="text-on-surface-variant flex items-center gap-0.5 font-medium">
                <span className="material-symbols-outlined text-[16px]">horizontal_rule</span> {change}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
