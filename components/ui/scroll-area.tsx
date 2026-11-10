import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ScrollAreaProps
  extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'both';
  maxHeight?: string | number;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      className,
      children,
      orientation = 'vertical',
      maxHeight,
      style,
      ...props
    },
    ref
  ) => {
    const overflowClasses = {
      vertical: 'overflow-y-auto overflow-x-hidden',
      horizontal: 'overflow-x-auto overflow-y-hidden',
      both: 'overflow-auto',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative scrollbar-thin',
          overflowClasses[orientation],
          className
        )}
        style={{
          maxHeight: maxHeight !== undefined ? maxHeight : undefined,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
