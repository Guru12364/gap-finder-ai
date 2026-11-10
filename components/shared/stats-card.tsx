import * as React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatsCardColor = 'indigo' | 'cyan' | 'purple' | 'green' | 'amber' | 'red';

export interface StatsTrend {
  value: number | string;
  isPositive?: boolean;
  label?: string;
}

export interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon: LucideIcon | React.ReactNode;
  iconColor?: StatsCardColor;
  trend?: StatsTrend;
  description?: string;
}

const colorVariants: Record<StatsCardColor, { circle: string; icon: string }> = {
  indigo: {
    circle: 'bg-indigo-500/15 border-indigo-500/25',
    icon: 'text-indigo-400',
  },
  cyan: {
    circle: 'bg-cyan-500/15 border-cyan-500/25',
    icon: 'text-cyan-400',
  },
  purple: {
    circle: 'bg-purple-500/15 border-purple-500/25',
    icon: 'text-purple-400',
  },
  green: {
    circle: 'bg-emerald-500/15 border-emerald-500/25',
    icon: 'text-emerald-400',
  },
  amber: {
    circle: 'bg-amber-500/15 border-amber-500/25',
    icon: 'text-amber-400',
  },
  red: {
    circle: 'bg-red-500/15 border-red-500/25',
    icon: 'text-red-400',
  },
};

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconColor = 'indigo',
  trend,
  description,
  className,
  onClick,
  ...props
}: StatsCardProps) {
  const isClickable = Boolean(onClick);
  const color = colorVariants[iconColor] || colorVariants.indigo;

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    const IconComponent = Icon as LucideIcon;
    return <IconComponent className={cn('h-5 w-5', color.icon)} />;
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl shadow-lg transition-all duration-300',
        isClickable
          ? 'cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.12] hover:-translate-y-0.5'
          : 'hover:border-white/[0.1]',
        className
      )}
      {...props}
    >
      {/* Decorative subtle ambient glow in corner */}
      <div
        className={cn(
          'pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-xl transition-opacity group-hover:opacity-20',
          iconColor === 'indigo' && 'bg-indigo-500',
          iconColor === 'cyan' && 'bg-cyan-500',
          iconColor === 'purple' && 'bg-purple-500',
          iconColor === 'green' && 'bg-emerald-500',
          iconColor === 'amber' && 'bg-amber-500',
          iconColor === 'red' && 'bg-red-500'
        )}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm font-medium text-gray-400 truncate">
          {label}
        </p>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105',
            color.circle
          )}
        >
          {renderIcon()}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {value}
        </div>

        {trend && (
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              trend.isPositive === true && 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
              trend.isPositive === false && 'bg-red-500/15 text-red-400 border border-red-500/20',
              trend.isPositive === undefined && 'bg-white/10 text-gray-300 border border-white/10'
            )}
          >
            {trend.isPositive === true && <TrendingUp className="h-3 w-3" />}
            {trend.isPositive === false && <TrendingDown className="h-3 w-3" />}
            {trend.isPositive === undefined && <Minus className="h-3 w-3" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {(trend?.label || description) && (
        <p className="mt-2 text-xs text-gray-400 truncate">
          {trend?.label || description}
        </p>
      )}
    </div>
  );
}
