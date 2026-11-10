import * as React from 'react';
import { BookOpen, FileText, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SourceCitationProps
  extends React.HTMLAttributes<HTMLDivElement> {
  documentName: string;
  page?: number | string;
  section?: string;
  excerpt?: string;
  onClick?: () => void;
  expandable?: boolean;
}

export function SourceCitation({
  documentName,
  page,
  section,
  excerpt,
  onClick,
  expandable = false,
  className,
  ...props
}: SourceCitationProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const isClickable = Boolean(onClick || (expandable && excerpt));

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick();
    } else if (expandable && excerpt) {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }}
      className={cn(
        'group relative overflow-hidden rounded-r-xl rounded-l-sm border border-l-2 border-white/[0.06] border-l-indigo-500 bg-white/[0.03] p-3 sm:p-3.5 backdrop-blur-xl transition-all duration-200',
        isClickable && 'cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.12] hover:border-l-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <span className="truncate text-xs font-semibold text-gray-200 group-hover:text-white transition-colors">
            {documentName}
          </span>
        </div>

        {/* Badges for Page and Section */}
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-gray-400">
          {page !== undefined && (
            <span className="inline-flex items-center rounded bg-white/5 px-1.5 py-0.5 font-medium border border-white/5">
              p. {page}
            </span>
          )}
          {section && (
            <span className="hidden sm:inline-flex items-center rounded bg-white/5 px-1.5 py-0.5 font-medium border border-white/5 truncate max-w-[120px]">
              {section}
            </span>
          )}
          {expandable && excerpt && (
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 text-gray-400 transition-transform duration-200',
                isExpanded && 'rotate-90 text-indigo-400'
              )}
            />
          )}
        </div>
      </div>

      {section && (
        <div className="sm:hidden mt-1.5 text-[11px] text-gray-400 truncate">
          Sec: {section}
        </div>
      )}

      {excerpt && (
        <blockquote
          className={cn(
            'mt-2.5 border-l border-white/10 pl-2.5 text-xs text-gray-400 italic leading-relaxed transition-all',
            !isExpanded && !expandable && 'line-clamp-2',
            expandable && !isExpanded && 'line-clamp-2'
          )}
        >
          &ldquo;{excerpt}&rdquo;
        </blockquote>
      )}
    </div>
  );
}
