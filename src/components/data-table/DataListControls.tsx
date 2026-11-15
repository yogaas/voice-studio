import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from '../../constants/voice.constants';
import type { SortOrder } from '../../types/voice.types';
import { Button } from '../ui/Button';
import { Input, SelectField } from '../ui/FormControls';

export interface TableToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  onReset: () => void;
  onRefresh: () => void;
  rightSlot?: React.ReactNode;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Cari data...',
  onReset,
  onRefresh,
  rightSlot,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="relative min-w-[240px] flex-1 max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
          aria-label={searchPlaceholder}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {rightSlot}
        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={onReset}
        >
          Reset
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={onRefresh}
        >
          Segarkan
        </Button>
      </div>
    </div>
  );
};

export interface SortButtonProps {
  label: string;
  columnKey: string;
  activeSort?: string;
  activeOrder?: SortOrder;
  onSort: (columnKey: string) => void;
}

export const SortHeaderButton: React.FC<SortButtonProps> = ({
  label,
  columnKey,
  activeSort,
  activeOrder,
  onSort,
}) => {
  const isActive = activeSort === columnKey;
  const SortIcon = !isActive
    ? ArrowUpDown
    : activeOrder === 'asc'
      ? ArrowUp
      : ArrowDown;

  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      size="sm"
      icon={SortIcon}
      onClick={() => onSort(columnKey)}
    >
      {label}
    </Button>
  );
};

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextSize: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      <div className="font-mono tabular-nums">
        Menampilkan <span className="font-semibold text-slate-900 dark:text-slate-100">{startItem}–{endItem}</span> dari{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{total}</span> data
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span>Baris:</span>
          <SelectField
            aria-label="Jumlah baris per halaman"
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            options={PAGE_SIZE_OPTIONS.map((size) => ({
              value: String(size),
              label: `${size} / hal`,
            }))}
            className="w-24 py-1 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            icon={ChevronLeft}
            iconOnly
            aria-label="Halaman sebelumnya"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          />
          <span className="px-2 font-mono tabular-nums">
            Hal {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={ChevronRight}
            iconOnly
            aria-label="Halaman berikutnya"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          />
        </div>
      </div>
    </div>
  );
};
