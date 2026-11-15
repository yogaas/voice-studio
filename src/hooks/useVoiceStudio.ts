import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '../constants/voice.constants';
import { toAppError } from '../lib/errors';
import { notify } from '../lib/notify';
import { studioService } from '../services/studio.service';
import type {
  CloneVoiceInput,
  PagedParams,
  ProviderConfig,
  SupportedLanguage,
  TtsChunkProgress,
  TtsGenerateRequest,
  TtsGenerationResult,
  VoiceOption,
} from '../types/voice.types';
import { base64ToUint8Array, pcmToWavBlob } from '../utils/audio';

export function useVoiceStudio() {
  const [voicesVersion, setVoicesVersion] = useState(0);
  const [historyVersion, setHistoryVersion] = useState(0);

  // State untuk Text-to-Speech
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [ttsProgress, setTtsProgress] = useState<TtsChunkProgress | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<TtsGenerationResult | null>(null);

  // State untuk Pratinjau Suara Singkat
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [activePreviewAudio, setActivePreviewAudio] = useState<HTMLAudioElement | null>(null);

  // State untuk Voice Cloning
  const [isCloningVoice, setIsCloningVoice] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

  // State Konfigurasi Provider (disimpan di sessionStorage)
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>(() =>
    studioService.getProviderConfig()
  );

  const allVoices = useMemo(() => {
    void voicesVersion;
    return studioService.getAllAvailableVoices();
  }, [voicesVersion]);

  const customVoices = useMemo(() => {
    void voicesVersion;
    return studioService.getCustomVoices();
  }, [voicesVersion]);

  const refreshVoices = useCallback(() => {
    setVoicesVersion((v) => v + 1);
  }, []);

  const refreshHistory = useCallback(() => {
    setHistoryVersion((v) => v + 1);
  }, []);

  const generateSpeech = useCallback(async (request: TtsGenerateRequest) => {
    setIsGeneratingTts(true);
    setTtsError(null);
    setTtsProgress({
      currentChunk: 1,
      totalChunks: 1,
      percentage: 10,
      statusText: 'Menyiapkan sintesis suara...',
    });

    try {
      const result = await studioService.generateSpeech(request, (progress) => {
        setTtsProgress(progress);
      });
      setLatestResult(result);
      setHistoryVersion((v) => v + 1);
      notify.success('Suara berhasil dibuat dan disimpan ke Riwayat.');
      return result;
    } catch (err: unknown) {
      const appErr = toAppError(err);
      setTtsError(appErr.message);
      notify.error(appErr.message);
      return null;
    } finally {
      setIsGeneratingTts(false);
      setTtsProgress(null);
    }
  }, []);

  const previewVoice = useCallback(
    async (voice: VoiceOption, language: SupportedLanguage) => {
      if (activePreviewAudio) {
        activePreviewAudio.pause();
        setActivePreviewAudio(null);
      }

      if (previewingVoiceId === voice.id) {
        setPreviewingVoiceId(null);
        return;
      }

      setPreviewingVoiceId(voice.id);
      try {
        const { audioBase64 } = await studioService.previewVoice(voice, language);
        const wavBlob = pcmToWavBlob(base64ToUint8Array(audioBase64));
        const url = URL.createObjectURL(wavBlob);
        const audio = new Audio(url);
        setActivePreviewAudio(audio);

        audio.onended = () => {
          setPreviewingVoiceId(null);
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          setPreviewingVoiceId(null);
          URL.revokeObjectURL(url);
        };

        await audio.play();
      } catch (err: unknown) {
        setPreviewingVoiceId(null);
        const appErr = toAppError(err);
        notify.error(appErr.message);
      }
    },
    [activePreviewAudio, previewingVoiceId]
  );

  const createClonedVoice = useCallback(async (input: CloneVoiceInput) => {
    setIsCloningVoice(true);
    setCloneError(null);
    try {
      const created = await studioService.createClonedVoice(input);
      setVoicesVersion((v) => v + 1);
      notify.success(`Suara kustom "${created.name}" berhasil dibuat!`);
      return created;
    } catch (err: unknown) {
      const appErr = toAppError(err);
      setCloneError(appErr.message);
      notify.error(appErr.message);
      return null;
    } finally {
      setIsCloningVoice(false);
    }
  }, []);

  const renameCustomVoice = useCallback((voiceId: string, newName: string) => {
    try {
      studioService.renameCustomVoice(voiceId, newName);
      setVoicesVersion((v) => v + 1);
      notify.success('Nama suara kustom berhasil diperbarui.');
      return true;
    } catch (err: unknown) {
      const appErr = toAppError(err);
      notify.error(appErr.message);
      return false;
    }
  }, []);

  const deleteCustomVoice = useCallback((voiceId: string) => {
    studioService.deleteCustomVoice(voiceId);
    setVoicesVersion((v) => v + 1);
    notify.success('Suara kustom berhasil dihapus.');
  }, []);

  const queryCustomVoices = useCallback(
    (params: PagedParams) => {
      void voicesVersion;
      return studioService.queryCustomVoices(params);
    },
    [voicesVersion]
  );

  const queryHistory = useCallback(
    (params: PagedParams) => {
      void historyVersion;
      return studioService.queryHistory(params);
    },
    [historyVersion]
  );

  const deleteHistoryItem = useCallback((id: string) => {
    studioService.deleteHistoryItem(id);
    setHistoryVersion((v) => v + 1);
    notify.success('Item riwayat berhasil dihapus.');
  }, []);

  const clearAllHistory = useCallback(() => {
    studioService.clearAllHistory();
    setHistoryVersion((v) => v + 1);
    notify.success('Seluruh riwayat audio telah dibersihkan.');
  }, []);

  const updateProviderConfig = useCallback((nextConfig: ProviderConfig) => {
    studioService.saveProviderConfig(nextConfig);
    setProviderConfig(nextConfig);
    notify.success('Pengaturan penyedia suara berhasil disimpan di sesi browser ini.');
  }, []);

  return {
    allVoices,
    customVoices,
    isGeneratingTts,
    ttsProgress,
    ttsError,
    setTtsError,
    latestResult,
    setLatestResult,
    previewingVoiceId,
    isCloningVoice,
    cloneError,
    setCloneError,
    providerConfig,
    generateSpeech,
    previewVoice,
    createClonedVoice,
    renameCustomVoice,
    deleteCustomVoice,
    queryCustomVoices,
    queryHistory,
    deleteHistoryItem,
    clearAllHistory,
    updateProviderConfig,
    refreshVoices,
    refreshHistory,
    defaultPageSize: DEFAULT_PAGE_SIZE,
  };
}
