import { useEffect, useState } from 'react';
import {
  ArrowRight,
  AudioLines,
  ChevronDown,
  History,
  Moon,
  Settings,
  Star,
  Sun,
  Users,
} from 'lucide-react';
import { Toaster } from 'sonner';
import { HistoryTab } from './components/HistoryTab';
import { ProviderSettingsModal } from './components/ProviderSettingsModal';
import { TtsStudioTab } from './components/TtsStudioTab';
import { HeroMicrophoneIllustration } from './components/ui/StudioGraphics';
import { VoiceCloningTab } from './components/VoiceCloningTab';
import { PREBUILT_GEMINI_VOICES } from './constants/voice.constants';
import { useVoiceStudio } from './hooks/useVoiceStudio';
import { storageRepository } from './repositories/storage.repository';
import type { NavigationTab } from './types/voice.types';

export default function App() {
  const studio = useVoiceStudio();

  const [activeTab, setActiveTab] = useState<NavigationTab>('tts');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    PREBUILT_GEMINI_VOICES[0].id
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    storageRepository.getTheme()
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    storageRepository.saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#F4F2FF] via-[#FAF9FF] to-[#EEEBFF] text-slate-900 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 dark:text-slate-100">
      <Toaster position="top-right" richColors closeButton />

      {/* Dekorasi Gelombang Sudut Kanan Atas & Kanan Bawah */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-900/20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-20 -bottom-24 h-72 w-96 rotate-[-18deg] rounded-[100%] bg-[#2E236C]/85 blur-xs dark:bg-indigo-950/80"
      />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-30 border-b border-indigo-100/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Zona 1: Logo Soundwave + VoiceStudio */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('tts');
            }}
            className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 dark:text-slate-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#4F39F6] dark:bg-indigo-950 dark:text-indigo-400">
              <AudioLines className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>VoiceStudio</span>
          </a>

          {/* Zona 2: 4 Menu Navigasi Tengah */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            <a
              href="#buat-suara"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('tts');
              }}
              className={`relative py-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'tts'
                  ? 'font-bold text-[#4F39F6] dark:text-indigo-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Buat Suara
              {activeTab === 'tts' && (
                <span className="absolute right-0 -bottom-1 left-0 h-0.5 rounded-full bg-[#4F39F6] dark:bg-indigo-400" />
              )}
            </a>

            <a
              href="#suara-saya"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('cloning');
              }}
              className={`relative py-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'cloning'
                  ? 'font-bold text-[#4F39F6] dark:text-indigo-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Suara Saya ({studio.customVoices.length})
              {activeTab === 'cloning' && (
                <span className="absolute right-0 -bottom-1 left-0 h-0.5 rounded-full bg-[#4F39F6] dark:bg-indigo-400" />
              )}
            </a>

            <a
              href="#riwayat"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('history');
              }}
              className={`relative py-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'history'
                  ? 'font-bold text-[#4F39F6] dark:text-indigo-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Riwayat
              {activeTab === 'history' && (
                <span className="absolute right-0 -bottom-1 left-0 h-0.5 rounded-full bg-[#4F39F6] dark:bg-indigo-400" />
              )}
            </a>

            <a
              href="#pengaturan-provider"
              onClick={(e) => {
                e.preventDefault();
                setIsSettingsOpen(true);
              }}
              className="py-2 transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white"
            >
              Pengaturan Provider
            </a>
          </nav>

          {/* Zona 3: Toggle Tema + Profil Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-indigo-50 hover:text-[#4F39F6] transition-colors cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white py-1 pr-3 pl-1 text-xs font-semibold text-slate-800 shadow-2xs hover:border-indigo-300 transition-colors cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#312E81] text-[11px] font-bold text-white">
                A
              </span>
              <span>Alex</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:px-8 space-y-7">
        {/* HERO SECTION (3 Kolom seperti pada gambar acuan) */}
        <section className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* Kiri: Badge, Judul 2 Baris, dan Subjudul */}
          <div className="space-y-3.5 lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100/90 px-3.5 py-1.5 text-xs font-semibold text-[#3B28CC] dark:bg-indigo-950/80 dark:text-indigo-300">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
              <span>TTS Indonesia • Cepat & Berkualitas</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[40px] lg:leading-[1.15]">
              <span className="block text-slate-900 dark:text-white">
                Studio Text-to-Speech
              </span>
              <span className="block text-[#4F39F6] dark:text-indigo-400">
                Bahasa Indonesia
              </span>
            </h1>

            <p className="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Ubah teks jadi suara natural dalam hitungan detik. Cocok untuk
              konten, presentasi, dan kebutuhan kreatif lainnya.
            </p>
          </div>

          {/* Tengah: Ilustrasi 3D Mikrofon & Naskah */}
          <div className="lg:col-span-4">
            <HeroMicrophoneIllustration />
          </div>

          {/* Kanan: 4 Kartu Navigasi Cepat Bertumpuk */}
          <div className="space-y-2.5 lg:col-span-3">
            {/* Kartu 1: Buat Suara */}
            <button
              type="button"
              onClick={() => setActiveTab('tts')}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all cursor-pointer ${
                activeTab === 'tts'
                  ? 'border-indigo-200 bg-white shadow-md shadow-indigo-500/10 dark:border-indigo-500/60 dark:bg-slate-900'
                  : 'border-white/80 bg-white/75 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#4F39F6] dark:bg-indigo-950 dark:text-indigo-400">
                  <AudioLines className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                    Buat Suara
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    Mulai dari teks sekarang
                  </p>
                </div>
              </div>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                  activeTab === 'tts'
                    ? 'bg-[#4F39F6] text-white shadow-xs'
                    : 'bg-indigo-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </button>

            {/* Kartu 2: Suara Saya */}
            <button
              type="button"
              onClick={() => setActiveTab('cloning')}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all cursor-pointer ${
                activeTab === 'cloning'
                  ? 'border-indigo-200 bg-white shadow-md shadow-indigo-500/10 dark:border-indigo-500/60 dark:bg-slate-900'
                  : 'border-white/80 bg-white/75 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Users className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                    Suara Saya ({studio.customVoices.length})
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    Kelola suara favorit Anda
                  </p>
                </div>
              </div>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                  activeTab === 'cloning'
                    ? 'bg-[#4F39F6] text-white shadow-xs'
                    : 'bg-indigo-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </button>

            {/* Kartu 3: Riwayat */}
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'border-indigo-200 bg-white shadow-md shadow-indigo-500/10 dark:border-indigo-500/60 dark:bg-slate-900'
                  : 'border-white/80 bg-white/75 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <History className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                    Riwayat
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    Lihat hasil sebelumnya
                  </p>
                </div>
              </div>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                  activeTab === 'history'
                    ? 'bg-[#4F39F6] text-white shadow-xs'
                    : 'bg-indigo-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </button>

            {/* Kartu 4: Pengaturan Provider */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-left transition-all hover:bg-white cursor-pointer dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Settings className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                    Pengaturan Provider
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    Kelola layanan TTS
                  </p>
                </div>
              </div>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </button>
          </div>
        </section>

        {/* PANEL KONTEN TAB AKTIF */}
        {activeTab === 'tts' && (
          <TtsStudioTab
            voices={studio.allVoices}
            selectedVoiceId={selectedVoiceId}
            onSelectVoice={setSelectedVoiceId}
            isGenerating={studio.isGeneratingTts}
            progress={studio.ttsProgress}
            errorMessage={studio.ttsError}
            onClearError={() => studio.setTtsError(null)}
            latestResult={studio.latestResult}
            previewingVoiceId={studio.previewingVoiceId}
            onPreviewVoice={studio.previewVoice}
            onGenerateSpeech={studio.generateSpeech}
            onNavigateToCloning={() => setActiveTab('cloning')}
          />
        )}

        {activeTab === 'cloning' && (
          <VoiceCloningTab
            providerConfig={studio.providerConfig}
            isCloning={studio.isCloningVoice}
            cloneError={studio.cloneError}
            onClearCloneError={() => studio.setCloneError(null)}
            onCreateClonedVoice={async (input) => {
              const created = await studio.createClonedVoice(input);
              if (created) {
                setSelectedVoiceId(created.id);
              }
              return created;
            }}
            queryCustomVoices={studio.queryCustomVoices}
            onRenameVoice={studio.renameCustomVoice}
            onDeleteVoice={(voiceId) => {
              studio.deleteCustomVoice(voiceId);
              if (selectedVoiceId === voiceId) {
                setSelectedVoiceId(PREBUILT_GEMINI_VOICES[0].id);
              }
            }}
            onUseVoiceInTts={(voiceId) => {
              setSelectedVoiceId(voiceId);
              setActiveTab('tts');
            }}
            previewingVoiceId={studio.previewingVoiceId}
            onPreviewVoice={studio.previewVoice}
            onOpenProviderSettings={() => setIsSettingsOpen(true)}
            onRefreshVoices={studio.refreshVoices}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            queryHistory={studio.queryHistory}
            onDeleteItem={studio.deleteHistoryItem}
            onClearAll={studio.clearAllHistory}
            onRefresh={studio.refreshHistory}
            onNavigateToTts={() => setActiveTab('tts')}
          />
        )}
      </main>

      <ProviderSettingsModal
        open={isSettingsOpen}
        config={studio.providerConfig}
        onClose={() => setIsSettingsOpen(false)}
        onSave={studio.updateProviderConfig}
      />
    </div>
  );
}
