import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  AudioLines,
  Check,
  ChevronDown,
  FileText,
  Headphones,
  Info,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Pencil,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Square,
  Star,
} from 'lucide-react';
import {
  LANGUAGE_OPTIONS,
  MAX_TTS_CHARS,
  SAMPLE_TEXT_TEMPLATES,
  STYLE_PRESETS,
} from '../constants/voice.constants';
import type {
  SupportedLanguage,
  TtsChunkProgress,
  TtsGenerateRequest,
  TtsGenerationResult,
  VoiceOption,
} from '../types/voice.types';
import { splitTextIntoChunks } from '../utils/textChunker';
import { AudioPlayerCard } from './audio/AudioPlayerCard';
import { Alert } from './ui/Feedback';
import { FlagIcon, VoiceAvatar } from './ui/StudioGraphics';

export interface TtsStudioTabProps {
  voices: VoiceOption[];
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  isGenerating: boolean;
  progress: TtsChunkProgress | null;
  errorMessage: string | null;
  onClearError: () => void;
  latestResult: TtsGenerationResult | null;
  previewingVoiceId: string | null;
  onPreviewVoice: (voice: VoiceOption, language: SupportedLanguage) => void;
  onGenerateSpeech: (request: TtsGenerateRequest) => Promise<TtsGenerationResult | null>;
  onNavigateToCloning: () => void;
}

type VoiceCategoryFilter = 'all' | 'female' | 'male' | 'custom';

export const TtsStudioTab: React.FC<TtsStudioTabProps> = ({
  voices,
  selectedVoiceId,
  onSelectVoice,
  isGenerating,
  progress,
  errorMessage,
  onClearError,
  latestResult,
  previewingVoiceId,
  onPreviewVoice,
  onGenerateSpeech,
  onNavigateToCloning,
}) => {
  const voiceListSectionRef = useRef<HTMLDivElement | null>(null);

  const [editorSubTab, setEditorSubTab] = useState<'basic' | 'advanced'>('basic');
  const [templateIndex, setTemplateIndex] = useState<number>(0);
  const [text, setText] = useState<string>(SAMPLE_TEXT_TEMPLATES[0].text);
  const [language, setLanguage] = useState<SupportedLanguage>('id-ID');
  const [speed, setSpeed] = useState<number>(1.0);
  const [styleInstruction, setStyleInstruction] = useState<string>('');
  const [voiceFilter, setVoiceFilter] = useState<VoiceCategoryFilter>('all');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const selectedVoice =
    voices.find((v) => v.id === selectedVoiceId) ?? voices[0];

  const charCount = text.length;
  const isOverLimit = charCount > MAX_TTS_CHARS;
  const estimatedChunks = splitTextIntoChunks(text).length;

  // 3 suara utama untuk kartu pilih cepat di panel Parameter Suara
  const quickVoices = voices.slice(0, 3);

  const filteredVoices = voices.filter((voice) => {
    if (voiceFilter === 'female') {
      return voice.genderLabel.toLowerCase().includes('wanita');
    }
    if (voiceFilter === 'male') {
      return voice.genderLabel.toLowerCase().includes('pria');
    }
    if (voiceFilter === 'custom') {
      return voice.source === 'custom';
    }
    return true;
  });

  const handleCycleSampleText = () => {
    const nextIdx = (templateIndex + 1) % SAMPLE_TEXT_TEMPLATES.length;
    const tpl = SAMPLE_TEXT_TEMPLATES[nextIdx];
    setTemplateIndex(nextIdx);
    setText(tpl.text);
    setLanguage(tpl.language);
    setFieldError(null);
  };

  const handleResetForm = () => {
    setText(SAMPLE_TEXT_TEMPLATES[0].text);
    setLanguage('id-ID');
    setSpeed(1.0);
    setStyleInstruction('');
    setFieldError(null);
    onClearError();
  };

  const triggerGenerate = async () => {
    setFieldError(null);

    if (!text.trim()) {
      setFieldError('Teks naskah wajib diisi sebelum membuat suara.');
      return;
    }
    if (isOverLimit) {
      setFieldError(
        `Panjang teks melebihi batas maksimal ${MAX_TTS_CHARS.toLocaleString('id-ID')} karakter.`
      );
      return;
    }
    if (!selectedVoice) {
      setFieldError('Silakan pilih salah satu karakter suara.');
      return;
    }

    // Ganti tanda (/) menjadi koma untuk jeda alami sesuai tips
    const processedText = text.replace(/\s*\/\s*/g, ', ');

    await onGenerateSpeech({
      text: processedText,
      voice: selectedVoice,
      language,
      speed,
      styleInstruction:
        styleInstruction.trim() || 'Dengan gaya formal, ramah, dan meyakinkan',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerGenerate();
  };

  return (
    <div className="space-y-7">
      {(errorMessage || fieldError) && (
        <Alert
          variant="error"
          title="Gagal Membuat Suara"
          message={fieldError ?? errorMessage ?? ''}
          onClose={() => {
            setFieldError(null);
            onClearError();
          }}
        />
      )}

      {/* Grid Utama 2 Kolom (Kiri 7 Kolom, Kanan 5 Kolom) */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 items-start">
        {/* KOLOM KIRI: Teks & Parameter Suara */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 lg:col-span-7"
          noValidate
        >
          {/* Kartu 1: Tab Folder & Kotak Masukkan Teks */}
          <div>
            {/* Folder Tabs di Atas Kartu */}
            <div className="flex items-center gap-2 pl-2">
              <button
                type="button"
                onClick={() => setEditorSubTab('basic')}
                className={`inline-flex items-center gap-2 rounded-t-2xl px-5 py-3 text-xs font-bold transition-colors cursor-pointer ${
                  editorSubTab === 'basic'
                    ? 'bg-white text-[#4F39F6] shadow-[0_-4px_16px_-6px_rgba(79,70,229,0.12)] border-b-2 border-[#4F39F6] dark:bg-slate-900 dark:text-indigo-400'
                    : 'bg-indigo-100/60 text-slate-600 hover:bg-indigo-100 dark:bg-slate-800/70 dark:text-slate-400'
                }`}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Teks & Pengaturan</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorSubTab('advanced')}
                className={`inline-flex items-center gap-2 rounded-t-2xl px-5 py-3 text-xs font-semibold transition-colors cursor-pointer ${
                  editorSubTab === 'advanced'
                    ? 'bg-white text-[#4F39F6] shadow-[0_-4px_16px_-6px_rgba(79,70,229,0.12)] border-b-2 border-[#4F39F6] dark:bg-slate-900 dark:text-indigo-400'
                    : 'bg-indigo-100/60 text-slate-600 hover:bg-indigo-100 dark:bg-slate-800/70 dark:text-slate-400'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Pengaturan Lanjutan</span>
              </button>
            </div>

            {/* Badan Kartu Masukkan Teks */}
            <div className="rounded-3xl rounded-tl-none border border-indigo-100/80 bg-white p-6 shadow-[0_12px_36px_-12px_rgba(79,70,229,0.1)] dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="tts-textarea"
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                  <FileText className="h-4 w-4 text-[#4F39F6] dark:text-indigo-400" aria-hidden="true" />
                  <span>Masukkan Teks</span>
                </label>

                <span
                  className={`font-mono text-xs tabular-nums ${
                    isOverLimit
                      ? 'font-bold text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {charCount.toLocaleString('id-ID')} / {MAX_TTS_CHARS.toLocaleString('id-ID')} karakter
                </span>
              </div>

              <textarea
                id="tts-textarea"
                rows={5}
                value={text}
                disabled={isGenerating}
                onChange={(e) => {
                  setText(e.target.value);
                  if (fieldError) setFieldError(null);
                }}
                placeholder="Ketik atau tempelkan teks Bahasa Indonesia di sini..."
                className="w-full rounded-2xl border border-indigo-100 bg-[#FAF9FF] p-4 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors focus:border-[#4F39F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
              />

              {editorSubTab === 'advanced' && (
                <div className="rounded-2xl border border-indigo-100/80 bg-indigo-50/40 p-3.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Pemrosesan Kalimat Otomatis:
                    </span>
                    <span className="font-mono tabular-nums text-[#4F39F6] dark:text-indigo-400">
                      {estimatedChunks} segmen kalimat terdeteksi
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {SAMPLE_TEXT_TEMPLATES.map((tpl, idx) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setTemplateIndex(idx);
                          setText(tpl.text);
                          setLanguage(tpl.language);
                        }}
                        className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-[#4F39F6] hover:text-[#4F39F6] cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                  <span>
                    Tips: Gunakan tanda (/) untuk jeda atau titik (.) untuk berhenti sejenak.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCycleSampleText}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F39F6] hover:text-indigo-700 cursor-pointer dark:text-indigo-400"
                >
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  <span>Contoh teks</span>
                </button>
              </div>
            </div>
          </div>

          {/* Kartu 2: Parameter Suara */}
          <div className="rounded-3xl border border-indigo-100/80 bg-white p-6 shadow-[0_12px_36px_-12px_rgba(79,70,229,0.1)] dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="flex items-center gap-2.5">
              <AudioLines className="h-5 w-5 text-[#4F39F6] dark:text-indigo-400" aria-hidden="true" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Parameter Suara
              </h2>
            </div>

            {/* Baris Pilih Bahasa & Kecepatan Bicara */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="tts-language-select"
                  className="block text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  Pilih Bahasa
                </label>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 flex items-center">
                    <FlagIcon language={language} />
                  </div>
                  <select
                    id="tts-language-select"
                    value={language}
                    disabled={isGenerating}
                    onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                    className="w-full appearance-none rounded-2xl border border-indigo-100 bg-[#FAF9FF] py-2.5 pr-9 pl-11 text-xs font-semibold text-slate-800 focus:border-[#4F39F6] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3.5 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="tts-speed-range"
                    className="text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    Kecepatan Bicara
                  </label>
                  <span className="font-mono text-xs font-bold tabular-nums text-[#4F39F6] dark:text-indigo-400">
                    {speed.toFixed(1)}x
                  </span>
                </div>

                <div className="pt-1">
                  <input
                    id="tts-speed-range"
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={speed}
                    disabled={isGenerating}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-indigo-100 accent-[#4F39F6] dark:bg-slate-700"
                  />
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Lambat</span>
                    <span>Cepat</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strip Pilih Suara (3 Kartu Cepat) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Headphones className="h-4 w-4 text-[#4F39F6] dark:text-indigo-400" aria-hidden="true" />
                  <span>Pilih Suara</span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    voiceListSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#4F39F6] hover:underline cursor-pointer dark:text-indigo-400"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {quickVoices.map((voice) => {
                  const isSelected = selectedVoice?.id === voice.id;
                  const isPreviewing = previewingVoiceId === voice.id;
                  return (
                    <div
                      key={voice.id}
                      onClick={() => onSelectVoice(voice.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectVoice(voice.id);
                        }
                      }}
                      className={`relative flex items-center gap-2.5 rounded-2xl border p-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#4F39F6] bg-indigo-50/60 ring-1 ring-[#4F39F6]/30 dark:border-indigo-500 dark:bg-indigo-950/40'
                          : 'border-indigo-100/90 bg-[#FAF9FF] hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-950/50'
                      }`}
                    >
                      <VoiceAvatar
                        avatarKey={voice.avatarKey}
                        name={voice.name}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1 pr-5">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                          {voice.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {voice.shortTitle ?? voice.genderLabel}
                        </p>
                      </div>

                      <button
                        type="button"
                        aria-label={`Preview suara ${voice.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewVoice(voice, language);
                        }}
                        className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100/90 text-[#4F39F6] hover:bg-[#4F39F6] hover:text-white transition-colors cursor-pointer dark:bg-slate-800 dark:text-indigo-400"
                      >
                        {isPreviewing ? (
                          <Square className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                        ) : (
                          <Play className="ml-0.5 h-2.5 w-2.5 fill-current" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instruksi Gaya Bicara (Prompt Ekspresi) */}
            <div className="space-y-2.5">
              <label
                htmlFor="tts-style-input"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <MessageSquareText className="h-4 w-4 text-[#4F39F6] dark:text-indigo-400" aria-hidden="true" />
                <span>Instruksi Gaya Bicara (Prompt Ekspresi)</span>
              </label>

              <input
                id="tts-style-input"
                type="text"
                value={styleInstruction}
                disabled={isGenerating}
                onChange={(e) => setStyleInstruction(e.target.value)}
                placeholder="Contoh: Dengan gaya formal, ramah, dan meyakinkan..."
                className="w-full rounded-2xl border border-indigo-100 bg-[#FAF9FF] px-4 py-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#4F39F6] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {STYLE_PRESETS.map((preset) => {
                  const active = styleInstruction === preset.promptValue;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setStyleInstruction(preset.promptValue)}
                      className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#4F39F6] text-white'
                          : 'bg-indigo-50/80 text-slate-600 hover:bg-indigo-100 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Progress Bar saat Memproses */}
            {isGenerating && progress && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                  <span>{progress.statusText}</span>
                  <span className="font-mono tabular-nums">
                    {progress.percentage}% ({progress.currentChunk}/{progress.totalChunks})
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-200 dark:bg-indigo-950">
                  <div
                    className="h-full rounded-full bg-[#4F39F6] transition-all duration-200"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Baris Tombol Reset & Buat Suara */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-2xl border border-indigo-100 bg-[#FAF9FF] px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 transition-colors cursor-pointer disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>

              <button
                type="submit"
                disabled={isGenerating || !text.trim() || isOverLimit}
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#432DD7] via-[#4F39F6] to-[#6347FF] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/35 transition-all hover:brightness-110 active:scale-98 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <AudioLines className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{isGenerating ? 'Memproses...' : 'Buat Suara'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* KOLOM KANAN: Pilihan Karakter Suara */}
        <aside
          ref={voiceListSectionRef}
          className="rounded-3xl border border-indigo-100/80 bg-white p-6 shadow-[0_12px_36px_-12px_rgba(79,70,229,0.1)] dark:border-slate-800 dark:bg-slate-900 lg:col-span-5 space-y-5"
        >
          {/* Header Pilihan Karakter Suara */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-500 dark:bg-amber-950/50">
                <Star className="h-5 w-5 fill-amber-400 text-amber-500" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Pilihan Karakter Suara
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Temukan suara yang paling cocok untuk kebutuhan Anda.
                </p>
              </div>
            </div>

            <div className="relative shrink-0">
              <select
                aria-label="Filter kategori suara"
                value={voiceFilter}
                onChange={(e) => setVoiceFilter(e.target.value as VoiceCategoryFilter)}
                className="appearance-none rounded-xl border border-indigo-100 bg-[#FAF9FF] py-1.5 pr-7 pl-3 text-xs font-semibold text-slate-700 focus:border-[#4F39F6] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">Semua</option>
                <option value="female">Wanita</option>
                <option value="male">Pria</option>
                <option value="custom">Kustom</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Daftar Karakter Suara */}
          <div className="divide-y divide-indigo-50 dark:divide-slate-800/80 space-y-2">
            {filteredVoices.map((voice) => {
              const isSelected = selectedVoice?.id === voice.id;
              const isPreviewing = previewingVoiceId === voice.id;

              return (
                <div
                  key={voice.id}
                  className={`relative rounded-2xl p-3.5 transition-all ${
                    isSelected
                      ? 'border-2 border-[#4F39F6] bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30'
                      : 'border border-transparent hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Lencana Centang Ungu di Sudut Kanan Atas Saat Terpilih */}
                  {isSelected && (
                    <div
                      aria-hidden="true"
                      className="absolute -top-2.5 -right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#4F39F6] text-white shadow-sm ring-2 ring-white dark:ring-slate-900"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <VoiceAvatar
                        avatarKey={voice.avatarKey}
                        name={voice.name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                            {voice.name}
                          </p>
                          {voice.isPopular && (
                            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-[#4F39F6] dark:bg-indigo-950 dark:text-indigo-300">
                              Populer
                            </span>
                          )}
                          {voice.source === 'custom' && (
                            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              Kustom
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                          {voice.characterDescription}
                        </p>
                      </div>
                    </div>

                    {/* Tombol Preview & Pilih */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onPreviewVoice(voice, language)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-indigo-300 hover:text-[#4F39F6] transition-colors cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {isPreviewing ? (
                          <Square className="h-3 w-3 fill-current text-[#4F39F6]" aria-hidden="true" />
                        ) : (
                          <Play className="h-3 w-3 fill-current text-slate-700 dark:text-slate-200" aria-hidden="true" />
                        )}
                        <span>{isPreviewing ? 'Stop' : 'Preview'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectVoice(voice.id)}
                        className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#4F39F6] text-white shadow-sm shadow-indigo-500/30'
                            : 'border border-indigo-200 bg-indigo-50/50 text-[#4F39F6] hover:bg-[#4F39F6] hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300'
                        }`}
                      >
                        Pilih
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Banner Info Bawah */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-indigo-50/90 px-4 py-3.5 dark:border-slate-800 dark:from-slate-800/70 dark:to-indigo-950/40">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#4F39F6] dark:text-indigo-400" aria-hidden="true" />
              <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Suara berkualitas tinggi dengan teknologi AI terkini untuk hasil yang lebih natural.{' '}
                <button
                  type="button"
                  onClick={onNavigateToCloning}
                  className="font-bold text-[#4F39F6] underline cursor-pointer dark:text-indigo-400"
                >
                  Buat suara kustom
                </button>
              </div>
            </div>

            {/* Ilustrasi Bar Equalizer Mini di Kanan Banner */}
            <div className="hidden sm:flex items-end gap-1 h-7 shrink-0 opacity-60" aria-hidden="true">
              <span className="w-1 h-3 rounded-full bg-indigo-400" />
              <span className="w-1 h-5 rounded-full bg-indigo-500" />
              <span className="w-1 h-7 rounded-full bg-indigo-400" />
              <span className="w-1 h-4 rounded-full bg-indigo-300" />
              <span className="w-1 h-6 rounded-full bg-indigo-500" />
              <span className="w-1 h-3 rounded-full bg-indigo-400" />
            </div>
          </div>
        </aside>
      </div>

      {/* Bar Bawah Full-Width: Preview Hasil Suara */}
      <AudioPlayerCard
        title="Preview Hasil Suara"
        subtitle={
          latestResult
            ? `Suara ${latestResult.voiceName} · ${latestResult.language === 'id-ID' ? 'Bahasa Indonesia' : 'Bahasa Inggris'} · Kecepatan ${latestResult.speed.toFixed(1)}x`
            : 'Dengarkan hasil konversi teks Anda di sini.'
        }
        audioBase64={latestResult?.audioBase64 ?? null}
        durationHintSeconds={latestResult?.durationSeconds ?? 12}
        fileNamePrefix={
          latestResult ? `voicestudio-${latestResult.voiceName}` : 'voicestudio'
        }
        autoPlay={Boolean(latestResult)}
        isGenerating={isGenerating}
        onRequestGenerate={() => void triggerGenerate()}
      />
    </div>
  );
};
