import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileQuestion, LucideIcon } from 'lucide-react';
import Link from 'next/link';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'secondary' | 'outline';
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction | React.ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!Icon) return null;

    if (React.isValidElement(Icon)) {
      return Icon;
    }

    const IconComponent = Icon as LucideIcon;
    return <IconComponent className="h-8 w-8 text-indigo-400" />;
  };

  const renderAction = () => {
    if (!action) return null;

    if (React.isValidElement(action)) {
      return action;
    }

    const actionConfig = action as EmptyStateAction;
    const ActionIcon = actionConfig.icon;

    const buttonContent = (
      <>
        {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
        {actionConfig.label}
      </>
    );

    if (actionConfig.href) {
      return (
        <Button
          variant={actionConfig.variant || 'default'}
          asChild
          className="mt-2"
        >
          <Link href={actionConfig.href}>{buttonContent}</Link>
        </Button>
      );
    }

    return (
      <Button
        variant={actionConfig.variant || 'default'}
        onClick={actionConfig.onClick}
        className="mt-2"
      >
        {buttonContent}
      </Button>
    );
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center text-center overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl transition-all duration-300',
        compact ? 'p-6 sm:p-8' : 'p-8 sm:p-14',
        className
      )}
      {...props}
    >
      {/* Soft decorative background radial glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Icon badge */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-inner shadow-white/5">
        {renderIcon()}
      </div>

      {/* Content */}
      <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm text-gray-400 leading-relaxed text-balance">
          {description}
        </p>
      )}

      {/* Optional action */}
      {action && <div className="mt-6 flex items-center gap-3">{renderAction()}</div>}
    </div>
  );
}
