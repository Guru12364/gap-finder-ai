import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-indigo-500/30 bg-indigo-500/15 text-indigo-300 shadow-sm shadow-indigo-500/10',
        secondary:
          'border-white/10 bg-white/10 text-gray-200',
        destructive:
          'border-red-500/30 bg-red-500/15 text-red-300',
        outline:
          'border-white/20 bg-transparent text-gray-300',
        success:
          'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
        warning:
          'border-amber-500/30 bg-amber-500/15 text-amber-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
