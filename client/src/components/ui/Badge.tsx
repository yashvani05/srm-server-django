import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type BadgeTone = 'neutral' | 'blue' | 'amber' | 'green' | 'red' | 'dark' | 'outline';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-700 ring-gray-200',
  blue: 'bg-blue-50 text-blue-800 ring-blue-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  green: 'bg-green-50 text-green-800 ring-green-200',
  red: 'bg-accent-50 text-accent-700 ring-red-200',
  dark: 'bg-accent-600 text-white ring-accent-600',
  outline: 'bg-white text-gray-800 ring-gray-400',
};

const dots: Record<BadgeTone, string> = {
  neutral: 'bg-gray-400',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  green: 'bg-green-600',
  red: 'bg-accent-600',
  dark: 'bg-white',
  outline: 'bg-gray-800',
};

export function Badge({ tone = 'neutral', dot = true, children }: { tone?: BadgeTone; dot?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide ring-1 ring-inset',
        tones[tone],
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dots[tone])} aria-hidden="true" />}
      {children}
    </span>
  );
}
