import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, ...rest }: ComponentProps<'div'>) {
  return <div className={cn('rounded-md border border-gray-200 bg-white', className)} {...rest} />;
}
