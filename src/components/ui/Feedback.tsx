import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { Button } from './Button';

export type AlertVariant = 'error' | 'warning' | 'info' | 'success';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  actionSlot?: React.ReactNode;
}

const ALERT_STYLES: Record<
  AlertVariant,
  { container: string; icon: LucideIcon; iconColor: string }
> = {
  error: {
    container:
      'border-rose-200 bg-rose-50/90 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200',
    icon: AlertCircle,
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  warning: {
    container:
      'border-amber-200 bg-amber-50/90 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200',
    icon: TriangleAlert,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    container:
      'border-slate-200 bg-slate-100/80 text-slate-800 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200',
    icon: Info,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  success: {
    container:
      'border-emerald-200 bg-emerald-50/90 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  onClose,
  actionSlot,
}) => {
  const style = ALERT_STYLES[variant];
  const IconComp = style.icon;

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${style.container}`}
    >
      <div className="flex items-start gap-3">
        <IconComp className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconColor}`} aria-hidden="true" />
        <div className="space-y-1">
          {title && <p className="font-semibold">{title}</p>}
          <p className="text-xs leading-relaxed opacity-95">{message}</p>
          {actionSlot && <div className="pt-2">{actionSlot}</div>}
        </div>
      </div>
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          icon={X}
          iconOnly
          aria-label="Tutup pesan"
          onClick={onClose}
        />
      )}
    </div>
  );
};

export interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h2
              id="modal-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={X}
            iconOnly
            aria-label="Tutup dialog"
            onClick={onClose}
          />
        </div>

        <div className="py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" icon={X} onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            icon={Check}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{message}</p>
    </Modal>
  );
};

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionButton?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionButton,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {actionButton && <div className="mt-5">{actionButton}</div>}
    </div>
  );
};
