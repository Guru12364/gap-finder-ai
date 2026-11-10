import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorClassName?: string;
  size?: 'sm' | 'default' | 'lg';
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indicatorClassName, size = 'default', ...props }, ref) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

    const heightClasses = {
      sm: 'h-1.5',
      default: 'h-2.5',
      lg: 'h-4',
    };

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-white/10 backdrop-blur-sm',
          heightClasses[size],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full flex-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-500 ease-out',
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
