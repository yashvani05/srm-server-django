import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';

export type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type Size = 'sm' | 'md';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
}

const variants: Record<Variant, string> = {
  primary: 'bg-sky-300 text-sky-950 shadow-sm hover:bg-sky-400 focus-visible:ring-sky-500',
  secondary: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus-visible:ring-gray-500',
  danger: 'bg-accent-600 text-white hover:bg-accent-700 focus-visible:ring-accent-600',
  ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
};

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {loading && <Spinner />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
