import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon: LucideIcon;
  loading?: boolean;
  iconOnly?: boolean;
  children?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 border border-indigo-600 shadow-xs disabled:bg-slate-300 disabled:border-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:border-slate-800 dark:disabled:text-slate-600',
  secondary:
    'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:border-slate-700',
  outline:
    'bg-white text-slate-800 hover:bg-slate-50 border border-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:border-slate-700',
  danger:
    'bg-rose-600 text-white hover:bg-rose-500 border border-rose-600 shadow-xs',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 border border-transparent',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg min-h-[34px]',
  md: 'px-4 py-2 text-sm gap-2 rounded-lg min-h-[40px]',
  lg: 'px-5 py-2.5 text-sm gap-2.5 rounded-xl min-h-[44px]',
};

const ICON_ONLY_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'p-1.5 rounded-lg min-h-[34px] min-w-[34px]',
  md: 'p-2 rounded-lg min-h-[40px] min-w-[40px]',
  lg: 'p-2.5 rounded-xl min-h-[44px] min-w-[44px]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  iconOnly = false,
  disabled = false,
  className = '',
  children,
  type = 'button',
  title,
  'aria-label': ariaLabel,
  ...rest
}) => {
  const isDisabled = disabled || loading;
  const sizeClass = iconOnly ? ICON_ONLY_SIZE_CLASSES[size] : SIZE_CLASSES[size];
  const iconSizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      type={type}
      disabled={isDisabled}
      title={title ?? (typeof ariaLabel === 'string' ? ariaLabel : undefined)}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${sizeClass} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className={`${iconSizeClass} animate-spin shrink-0`} aria-hidden="true" />
      ) : (
        <Icon className={`${iconSizeClass} shrink-0`} aria-hidden="true" />
      )}
      {!iconOnly && children && <span className="truncate">{children}</span>}
    </button>
  );
};
