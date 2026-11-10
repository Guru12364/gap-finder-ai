import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  textClassName?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
  xl: 'h-14 w-14 border-4',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export function LoadingSpinner({
  size = 'md',
  text,
  textClassName,
  fullScreen = false,
  className,
  ...props
}: LoadingSpinnerProps) {
  const content = (
    <div
      role="status"
      aria-label={text || 'Loading'}
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
      {...props}
    >
      <div className="relative flex items-center justify-center">
        {/* Ambient indigo/cyan glow backdrop */}
        <div
          className={cn(
            'absolute rounded-full bg-indigo-500/20 blur-md',
            iconSizes[size]
          )}
        />
        <Loader2
          className={cn(
            'animate-spin text-indigo-400 transition-colors',
            iconSizes[size]
          )}
        />
      </div>

      {text && (
        <p
          className={cn(
            'font-medium text-gray-300 animate-pulse text-center',
            textSizes[size],
            textClassName
          )}
        >
          {text}
        </p>
      )}
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
}
