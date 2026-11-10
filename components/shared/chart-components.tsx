'use client';

import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

// CHART_COLORS constant
export const CHART_COLORS = {
  indigo: '#818cf8',
  purple: '#a78bfa',
  cyan: '#22d3ee',
  red: '#ef4444',
  yellow: '#f59e0b',
  green: '#22c55e',
  gray: '#6b7280',
  gridStroke: '#1e293b',
  textFill: '#94a3b8',
} as const;

export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string | number;
  valueFormatter?: (value: number | string) => string;
  className?: string;
}

// CustomTooltip - glass card styled tooltip for all charts
export function CustomTooltip({
  active,
  payload,
  label,
  valueFormatter,
  className,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-navy-950/95 p-3 shadow-2xl backdrop-blur-xl transition-all',
        className
      )}
    >
      {label !== undefined && label !== null && (
        <div className="mb-2 border-b border-white/[0.08] pb-1 text-xs font-semibold text-gray-300">
          {label}
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const formattedValue = valueFormatter
            ? valueFormatter(entry.value ?? '')
            : typeof entry.value === 'number'
            ? entry.name?.toLowerCase().includes('accuracy') ||
              entry.name?.toLowerCase().includes('rate')
              ? `${Math.round(entry.value)}%`
              : entry.value.toLocaleString()
            : entry.value;

          return (
            <div
              key={`item-${index}`}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color || CHART_COLORS.indigo }}
                />
                <span className="font-medium text-gray-400">
                  {entry.name || 'Value'}:
                </span>
              </div>
              <span className="font-semibold text-white">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ChartContainer - wraps ResponsiveContainer with consistent sizing
export function ChartContainer({
  children,
  height = 300,
  className,
}: {
  children: React.ReactNode;
  height?: number | string;
  className?: string;
}) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}
