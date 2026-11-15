import React, { useState } from 'react';
import {
  Clock,
  Download,
  History,
  Play,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { DEFAULT_PAGE_SIZE } from '../constants/voice.constants';
import type {
  PagedParams,
  PagedResult,
  SortOrder,
  TtsGenerationResult,
} from '../types/voice.types';
import {
  base64ToUint8Array,
  formatDuration,
  formatIndonesianDateTime,
  pcmToWavBlob,
} from '../utils/audio';
import { AudioPlayerCard } from './audio/AudioPlayerCard';
import {
  SortHeaderButton,
  TablePagination,
  TableToolbar,
} from './data-table/DataListControls';
import { Button } from './ui/Button';
import { ConfirmDialog, EmptyState } from './ui/Feedback';

export interface HistoryTabProps {
  queryHistory: (params: PagedParams) => PagedResult<TtsGenerationResult>;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onRefresh: () => void;
  onNavigateToTts: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  queryHistory,
  onDeleteItem,
  onClearAll,
  onRefresh,
  onNavigateToTts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [activePlayingItem, setActivePlayingItem] =
    useState<TtsGenerationResult | null>(null);
  const [deletingItem, setDeletingItem] = useState<TtsGenerationResult | null>(
    null
  );
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const pagedHistory = queryHistory({
    q: searchQuery,
    sort: sortColumn,
    order: sortOrder,
    page,
    pageSize,
  });

  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colKey);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleQuickDownload = (
    item: TtsGenerationResult,
    ext: 'wav' | 'mp3'
  ) => {
    const bytes = base64ToUint8Array(item.audioBase64);
    const wavBlob = pcmToWavBlob(bytes);
    const outBlob =
      ext === 'mp3' ? new Blob([wavBlob], { type: 'audio/mpeg' }) : wavBlob;
    const url = URL.createObjectURL(outBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `voicestudio-${item.id}.${ext}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Riwayat Sintesis Audio
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daftar hasil pembuatan suara sebelumnya yang tersimpan di penyimpanan browser Anda (localStorage).
          </p>
        </div>

        {pagedHistory.total > 0 && (
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setConfirmClearAll(true)}
          >
            Bersihkan Semua Riwayat
          </Button>
        )}
      </div>

      {activePlayingItem && (
        <AudioPlayerCard
          title={`Memutar Riwayat — ${activePlayingItem.voiceName}`}
          subtitle={`${formatIndonesianDateTime(activePlayingItem.createdAt)} · ${activePlayingItem.language === 'id-ID' ? 'Bahasa Indonesia' : 'Bahasa Inggris'} · Kecepatan ${activePlayingItem.speed.toFixed(2)}x`}
          audioBase64={activePlayingItem.audioBase64}
          durationHintSeconds={activePlayingItem.durationSeconds}
          fileNamePrefix={`riwayat-${activePlayingItem.voiceId}`}
          autoPlay
        />
      )}

      <TableToolbar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Cari isi teks naskah, nama suara, atau gaya bicara..."
        onReset={() => {
          setSearchQuery('');
          setSortColumn('createdAt');
          setSortOrder('desc');
          setPage(1);
        }}
        onRefresh={onRefresh}
        rightSlot={
          <div className="flex flex-wrap items-center gap-1">
            <SortHeaderButton
              label="Waktu"
              columnKey="createdAt"
              activeSort={sortColumn}
              activeOrder={sortOrder}
              onSort={handleSort}
            />
            <SortHeaderButton
              label="Suara"
              columnKey="voiceName"
              activeSort={sortColumn}
              activeOrder={sortOrder}
              onSort={handleSort}
            />
            <SortHeaderButton
              label="Durasi"
              columnKey="durationSeconds"
              activeSort={sortColumn}
              activeOrder={sortOrder}
              onSort={handleSort}
            />
            <SortHeaderButton
              label="Teks"
              columnKey="text"
              activeSort={sortColumn}
              activeOrder={sortOrder}
              onSort={handleSort}
            />
          </div>
        }
      />

      {pagedHistory.data.length === 0 ? (
        <EmptyState
          icon={History}
          title="Belum Ada Riwayat Audio"
          description="Hasil audio yang Anda buat di halaman Buat Suara akan otomatis tercatat di sini untuk diputar ulang atau diunduh kapan saja."
          actionButton={
            <Button
              variant="primary"
              icon={Sparkles}
              onClick={onNavigateToTts}
            >
              Buat Suara Sekarang
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {pagedHistory.data.map((item) => {
            const isCurrentlySelected = activePlayingItem?.id === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-5 transition-colors ${
                  isCurrentlySelected
                    ? 'border-indigo-600 bg-indigo-50/30 dark:border-indigo-500 dark:bg-indigo-950/25'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.voiceName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {item.language === 'id-ID' ? 'Indonesia' : 'Inggris'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatDuration(item.durationSeconds)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {item.speed.toFixed(2)}x
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {formatIndonesianDateTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="line-clamp-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                      "{item.text}"
                    </p>

                    {item.styleInstruction && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Gaya bicara: {item.styleInstruction}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      variant={isCurrentlySelected ? 'primary' : 'secondary'}
                      size="sm"
                      icon={Play}
                      onClick={() => setActivePlayingItem(item)}
                    >
                      Putar Ulang
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Download}
                      onClick={() => handleQuickDownload(item, 'wav')}
                    >
                      WAV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Download}
                      onClick={() => handleQuickDownload(item, 'mp3')}
                    >
                      MP3
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      iconOnly
                      aria-label="Hapus riwayat ini"
                      onClick={() => setDeletingItem(item)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={pagedHistory.total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="Hapus Item Riwayat?"
        message="Audio ini akan dihapus dari riwayat browser Anda. Lanjutkan?"
        confirmLabel="Ya, Hapus"
        onConfirm={() => {
          if (deletingItem) {
            if (activePlayingItem?.id === deletingItem.id) {
              setActivePlayingItem(null);
            }
            onDeleteItem(deletingItem.id);
            setDeletingItem(null);
          }
        }}
        onCancel={() => setDeletingItem(null)}
      />

      <ConfirmDialog
        open={confirmClearAll}
        title="Bersihkan Seluruh Riwayat?"
        message="Semua rekaman hasil Text-to-Speech di tab Riwayat akan dihapus secara permanen dari browser Anda."
        confirmLabel="Ya, Bersihkan Semua"
        onConfirm={() => {
          setActivePlayingItem(null);
          onClearAll();
          setConfirmClearAll(false);
        }}
        onCancel={() => setConfirmClearAll(false)}
      />
    </div>
  );
};
