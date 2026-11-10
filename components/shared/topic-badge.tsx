import * as React from 'react';
import { cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import type { TopicStatus } from '@/types';

export interface TopicBadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  status: TopicStatus | string;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

const dotSizes = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

const dotColors: Record<string, string> = {
  weak: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]',
  medium: 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]',
  strong: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]',
  not_assessed: 'bg-gray-400',
};

export function TopicBadge({
  status,
  showDot = true,
  size = 'md',
  className,
  ...props
}: TopicBadgeProps) {
  const colorClass = getStatusColor(status);
  const label = getStatusLabel(status);
  const dotColorClass = dotColors[status] || 'bg-gray-400';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium select-none transition-colors duration-200',
        sizeClasses[size],
        colorClass,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn('shrink-0 rounded-full', dotSizes[size], dotColorClass)}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </div>
  );
}
