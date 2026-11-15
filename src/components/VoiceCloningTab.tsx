import React, { useRef, useState } from 'react';
import {
  Check,
  Mic,
  Pencil,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Volume2,
  Wand2,
  X,
} from 'lucide-react';
import {
  DEFAULT_PAGE_SIZE,
  ETHICAL_CONSENT_STATEMENT,
  MIN_SAMPLE_DURATION_SECONDS,
  RECORDING_READING_SCRIPT,
} from '../constants/voice.constants';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import type {
  CloneVoiceInput,
  PagedParams,
  PagedResult,
  ProviderConfig,
  SortOrder,
  SupportedLanguage,
  VoiceOption,
} from '../types/voice.types';
import { formatDuration, formatIndonesianDateTime } from '../utils/audio';
import {
  SortHeaderButton,
  TablePagination,
  TableToolbar,
} from './data-table/DataListControls';
import { Button } from './ui/Button';
import { Alert, ConfirmDialog, EmptyState, Modal } from './ui/Feedback';
import { CheckboxField, FormField, HiddenFileInput, Input } from './ui/FormControls';

export interface VoiceCloningTabProps {
  providerConfig: ProviderConfig;
  isCloning: boolean;
  cloneError: string | null;
  onClearCloneError: () => void;
  onCreateClonedVoice: (input: CloneVoiceInput) => Promise<VoiceOption | null>;
  queryCustomVoices: (params: PagedParams) => PagedResult<VoiceOption>;
  onRenameVoice: (voiceId: string, newName: string) => boolean;
  onDeleteVoice: (voiceId: string) => void;
  onUseVoiceInTts: (voiceId: string) => void;
  previewingVoiceId: string | null;
  onPreviewVoice: (voice: VoiceOption, language: SupportedLanguage) => void;
  onOpenProviderSettings: () => void;
  onRefreshVoices: () => void;
}

export const VoiceCloningTab: React.FC<VoiceCloningTabProps> = ({
  providerConfig,
  isCloning,
  cloneError,
  onClearCloneError,
  onCreateClonedVoice,
  queryCustomVoices,
  onRenameVoice,
  onDeleteVoice,
  onUseVoiceInTts,
  previewingVoiceId,
  onPreviewVoice,
  onOpenProviderSettings,
  onRefreshVoices,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    isRecording,
    recordingSeconds,
    liveWaveform,
    sample,
    startRecording,
    stopRecording,
    handleFileUpload,
    loadStudioDemoSample,
    clearSample,
  } = useAudioRecorder();

  const [voiceName, setVoiceName] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // State Tabel / Daftar "Suara Saya"
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // State Modal Ganti Nama & Konfirmasi Hapus
  const [editingVoice, setEditingVoice] = useState<VoiceOption | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingVoice, setDeletingVoice] = useState<VoiceOption | null>(null);

  const pagedVoices = queryCustomVoices({
    q: searchQuery,
    sort: sortColumn,
    order: sortOrder,
    page,
    pageSize,
  });

  const isSampleValid =
    Boolean(sample.blob) &&
    sample.durationSeconds >= MIN_SAMPLE_DURATION_SECONDS &&
    !sample.validationError;

  const canSubmitClone =
    !isCloning &&
    !isRecording &&
    voiceName.trim().length >= 2 &&
    isSampleValid &&
    consentAccepted;

  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colKey);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleSubmitClone = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!sample.blob) {
      setFormError('Silakan unggah file sampel suara atau rekam dari mikrofon terlebih dahulu.');
      return;
    }

    const created = await onCreateClonedVoice({
      name: voiceName,
      description: voiceDescription,
      sampleBlob: sample.blob,
      sampleFileName: sample.fileName,
      sampleDurationSeconds: sample.durationSeconds,
      consentAccepted,
    });

    if (created) {
      setVoiceName('');
      setVoiceDescription('');
      setConsentAccepted(false);
      clearSample();
    }
  };

  const activeProviderLabel =
    providerConfig.activeProvider === 'elevenlabs'
      ? 'ElevenLabs API (Instant Voice Cloning)'
      : 'Studio Acoustic Cloner (Mesin Hibrida Bawaan)';

  return (
    <div className="space-y-10">
      {/* Bagian Atas: Form Pembuatan Suara Kustom & Perekam Sampel */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        <div className="space-y-6 lg:col-span-7">
          {(cloneError || formError || sample.validationError) && (
            <Alert
              variant="error"
              title="Perhatian Validasi Kloning Suara"
              message={formError ?? sample.validationError ?? cloneError ?? ''}
              onClose={() => {
                setFormError(null);
                onClearCloneError();
              }}
            />
          )}

          {/* Informasi Penyedia VoiceProvider & Privasi */}
          <Alert
            variant="info"
            title={`Penyedia Aktif: ${activeProviderLabel}`}
            message="Sampel suara Anda hanya dikirim ke penyedia VoiceProvider yang Anda pilih untuk membuat profil kloning suara dan tidak pernah dibagikan ke pihak ketiga lainnya."
            actionSlot={
              <Button
                variant="outline"
                size="sm"
                icon={Settings}
                onClick={onOpenProviderSettings}
              >
                Atur Penyedia & API Key
              </Button>
            }
          />

          <form
            onSubmit={handleSubmitClone}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-6"
            noValidate
          >
            <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                1. Sampel Rekaman Suara (Minimal 30 Detik)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Unggah file audio (WAV, MP3, M4A maks. 10 MB) atau rekam langsung melalui mikrofon Anda.
              </p>
            </div>

            {/* Kontrol Unggah File / Rekam Mikrofon / Sampel Studio */}
            <div className="flex flex-wrap items-center gap-3">
              <HiddenFileInput
                inputRef={fileInputRef}
                accept=".wav,.mp3,.m4a,audio/wav,audio/mpeg,audio/mp4,audio/x-m4a"
                onFileSelect={(file) => void handleFileUpload(file)}
              />

              <Button
                variant="outline"
                icon={Upload}
                disabled={isRecording || isCloning}
                onClick={() => fileInputRef.current?.click()}
              >
                Unggah File (WAV/MP3/M4A)
              </Button>

              {!isRecording ? (
                <Button
                  variant="primary"
                  icon={Mic}
                  disabled={isCloning}
                  onClick={() => void startRecording()}
                >
                  Rekam dari Mikrofon
                </Button>
              ) : (
                <Button
                  variant="danger"
                  icon={Square}
                  onClick={stopRecording}
                >
                  Hentikan Rekaman ({formatDuration(recordingSeconds)})
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                icon={Wand2}
                disabled={isRecording || isCloning}
                onClick={() => void loadStudioDemoSample()}
              >
                Muat Sampel Studio (32 dtk)
              </Button>
            </div>

            {/* Visualisasi Gelombang Suara saat Merekam */}
            {isRecording && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900/50 dark:bg-rose-950/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-rose-900 dark:text-rose-200">
                  <span>Sedang merekam suara dari mikrofon...</span>
                  <span className="font-mono tabular-nums">
                    {formatDuration(recordingSeconds)} / target min. 00:30
                  </span>
                </div>
                <div className="flex h-12 items-end gap-1 rounded-lg bg-white/80 px-3 py-2 dark:bg-slate-900/80">
                  {liveWaveform.map((bar, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${Math.round(bar * 100)}%` }}
                      className="flex-1 rounded-full bg-rose-600 transition-transform duration-75 dark:bg-rose-400"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pratinjau Audio Sampel Sebelum Dikirim */}
            {sample.blob && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Sampel Terpilih: {sample.fileName}
                    </p>
                    <p className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      Durasi: {sample.durationSeconds.toFixed(1)} detik · Ukuran:{' '}
                      {(sample.sizeBytes / 1024).toFixed(1)} KB ·{' '}
                      {isSampleValid ? (
                        <span className="font-sans font-medium text-emerald-600 dark:text-emerald-400">
                          Memenuhi syarat (≥ 30 dtk)
                        </span>
                      ) : (
                        <span className="font-sans font-medium text-amber-600 dark:text-amber-400">
                          Kurang dari 30 detik
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={clearSample}
                  >
                    Hapus Sampel
                  </Button>
                </div>

                {sample.previewUrl && (
                  <audio
                    controls
                    src={sample.previewUrl}
                    className="h-10 w-full rounded-lg"
                  />
                )}
              </div>
            )}

            <div className="border-t border-slate-200 pt-5 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                2. Identitas & Persetujuan Suara Kustom
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Nama Suara Kustom"
                  htmlFor="clone-voice-name"
                  required
                  hint="Contoh: Suara Narasi Aris"
                >
                  <Input
                    id="clone-voice-name"
                    value={voiceName}
                    disabled={isCloning}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="Masukkan nama suara..."
                  />
                </FormField>

                <FormField
                  label="Catatan Karakter (Opsional)"
                  htmlFor="clone-voice-desc"
                  hint="Contoh: Nada hangat untuk buku audio"
                >
                  <Input
                    id="clone-voice-desc"
                    value={voiceDescription}
                    disabled={isCloning}
                    onChange={(e) => setVoiceDescription(e.target.value)}
                    placeholder="Deskripsi singkat..."
                  />
                </FormField>
              </div>

              {/* Checkbox Persetujuan Wajib */}
              <div className="pt-2">
                <CheckboxField
                  id="ethical-consent-checkbox"
                  checked={consentAccepted}
                  disabled={isCloning}
                  onChange={setConsentAccepted}
                  label={ETHICAL_CONSENT_STATEMENT}
                />
              </div>

              <div className="flex items-center justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  icon={Sparkles}
                  loading={isCloning}
                  disabled={!canSubmitClone}
                  className="w-full sm:w-auto"
                >
                  {isCloning ? 'Memproses Kloning Suara...' : 'Buat Suara Kustom'}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Panduan Kualitas Rekaman & Naskah Bacaan 30 Detik */}
        <aside className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3.5 dark:border-slate-800">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Panduan Kualitas Rekaman
              </h3>
            </div>

            <ul className="space-y-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-900 dark:text-slate-100">1. Durasi Minimal 30 Detik:</strong>{' '}
                Pastikan rekaman berisi suara berbicara aktif minimal 30 detik agar model menangkap intonasi secara utuh.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-slate-100">2. Ruangan Tenang & Bebas Gema:</strong>{' '}
                Rekam di ruangan tertutup tanpa suara kipas angin, kendaraan, atau gema dinding yang berlebihan.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-slate-100">3. Tanpa Musik Latar:</strong>{' '}
                Sampel hanya boleh berisi satu suara pembicara tunggal tanpa iringan instrumen atau efek suara.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-slate-100">4. Jarak Mikrofon Konsisten:</strong>{' '}
                Pertahankan jarak sekitar 15–20 cm dari mikrofon dengan kecepatan bicara yang alami.
              </li>
            </ul>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60 space-y-2">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Contoh Naskah Bacaan (±32 Detik):
              </p>
              <p className="text-xs leading-relaxed italic text-slate-600 dark:text-slate-400">
                "{RECORDING_READING_SCRIPT}"
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Bagian Bawah: Daftar "Suara Saya" */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Daftar Suara Saya
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kelola suara hasil kloning Anda, dengarkan pratinjau, atau gunakan langsung di halaman Buat Suara.
            </p>
          </div>
        </div>

        <TableToolbar
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setPage(1);
          }}
          searchPlaceholder="Cari nama atau deskripsi suara kustom..."
          onReset={() => {
            setSearchQuery('');
            setSortColumn('createdAt');
            setSortOrder('desc');
            setPage(1);
          }}
          onRefresh={onRefreshVoices}
          rightSlot={
            <div className="flex items-center gap-1">
              <SortHeaderButton
                label="Nama"
                columnKey="name"
                activeSort={sortColumn}
                activeOrder={sortOrder}
                onSort={handleSort}
              />
              <SortHeaderButton
                label="Durasi Sampel"
                columnKey="sampleDurationSeconds"
                activeSort={sortColumn}
                activeOrder={sortOrder}
                onSort={handleSort}
              />
              <SortHeaderButton
                label="Waktu Dibuat"
                columnKey="createdAt"
                activeSort={sortColumn}
                activeOrder={sortOrder}
                onSort={handleSort}
              />
            </div>
          }
        />

        {pagedVoices.data.length === 0 ? (
          <EmptyState
            icon={Mic}
            title="Belum Ada Suara Kustom"
            description="Suara kustom yang Anda buat dari sampel rekaman akan muncul di sini dan siap dipilih di halaman Buat Suara."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pagedVoices.data.map((voice) => {
              const isPreviewing = previewingVoiceId === voice.id;
              return (
                <div
                  key={voice.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {voice.name}
                      </h3>
                      <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        Sampel {voice.sampleDurationSeconds ?? 30} dtk
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {voice.characterDescription}
                    </p>
                    {voice.createdAt && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Dibuat pada {formatIndonesianDateTime(voice.createdAt)}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Check}
                        onClick={() => onUseVoiceInTts(voice.id)}
                      >
                        Pakai di TTS
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={isPreviewing ? Square : Volume2}
                        onClick={() => onPreviewVoice(voice, 'id-ID')}
                      >
                        {isPreviewing ? 'Berhenti' : 'Pratinjau'}
                      </Button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Pencil}
                        onClick={() => {
                          setEditingVoice(voice);
                          setRenameValue(voice.name);
                        }}
                      >
                        Ganti Nama
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => setDeletingVoice(voice)}
                      >
                        Hapus
                      </Button>
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
          total={pagedVoices.total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>

      {/* Modal Ganti Nama Suara */}
      <Modal
        open={Boolean(editingVoice)}
        title="Ganti Nama Suara Kustom"
        description="Perubahan nama akan langsung diperbarui pada daftar suara Anda."
        onClose={() => setEditingVoice(null)}
        footer={
          <>
            <Button
              variant="secondary"
              icon={X}
              onClick={() => setEditingVoice(null)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              icon={Save}
              onClick={() => {
                if (!editingVoice) return;
                const ok = onRenameVoice(editingVoice.id, renameValue);
                if (ok) {
                  setEditingVoice(null);
                }
              }}
            >
              Simpan Nama
            </Button>
          </>
        }
      >
        <FormField label="Nama Suara Baru" htmlFor="rename-voice-input" required>
          <Input
            id="rename-voice-input"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Masukkan nama suara..."
          />
        </FormField>
      </Modal>

      {/* Dialog Konfirmasi Hapus Suara Kustom */}
      <ConfirmDialog
        open={Boolean(deletingVoice)}
        title="Hapus Suara Kustom?"
        message={`Apakah Anda yakin ingin menghapus suara kustom "${deletingVoice?.name ?? ''}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Suara"
        onConfirm={() => {
          if (deletingVoice) {
            onDeleteVoice(deletingVoice.id);
            setDeletingVoice(null);
          }
        }}
        onCancel={() => setDeletingVoice(null)}
      />
    </div>
  );
};
