import React from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  rightSlot,
  children,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-slate-800 dark:text-slate-200"
        >
          {label}
          {required && <span className="ml-1 text-rose-600 dark:text-rose-400">*</span>}
        </label>
        {rightSlot && <div className="text-xs text-slate-500 dark:text-slate-400">{rightSlot}</div>}
      </div>
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, className = '', ...props }, ref) => {
    const borderClass = hasError
      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
      : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20';

    return (
      <input
        ref={ref}
        className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800 ${borderClass} ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError = false, className = '', ...props }, ref) => {
    const borderClass = hasError
      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
      : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20';

    return (
      <textarea
        ref={ref}
        className={`w-full rounded-xl border bg-white p-3.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800 ${borderClass} ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: ReadonlyArray<SelectOption>;
  hasError?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  options,
  hasError = false,
  className = '',
  ...props
}) => {
  const borderClass = hasError
    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
    : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20';

  return (
    <select
      className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 ${borderClass} ${className}`}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export interface RangeSliderProps {
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  id,
  min,
  max,
  step,
  value,
  disabled = false,
  onChange,
}) => {
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600 disabled:cursor-not-allowed dark:bg-slate-800"
    />
  );
};

export interface CheckboxFieldProps {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  id,
  checked,
  disabled = false,
  onChange,
  label,
}) => {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 rounded-xl border p-4 transition-colors cursor-pointer ${
        checked
          ? 'border-indigo-600/60 bg-indigo-50/50 dark:border-indigo-500/50 dark:bg-indigo-950/25'
          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
      />
      <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        {label}
      </span>
    </label>
  );
};

export interface HiddenFileInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  accept: string;
  onFileSelect: (file: File) => void;
}

export const HiddenFileInput: React.FC<HiddenFileInputProps> = ({
  inputRef,
  accept,
  onFileSelect,
}) => {
  return (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          onFileSelect(file);
        }
        e.target.value = '';
      }}
    />
  );
};

