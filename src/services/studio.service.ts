import {
  CUSTOM_VOICE_SORT_COLUMNS,
  HISTORY_SORT_COLUMNS,
  PREBUILT_GEMINI_VOICES,
} from '../constants/voice.constants';
import { AppError } from '../lib/errors';
import { storageRepository } from '../repositories/storage.repository';
import {
  cloneVoiceSchema,
  renameVoiceSchema,
  ttsFormSchema,
} from '../schemas/voice.schema';
import type {
  CloneVoiceInput,
  PagedParams,
  PagedResult,
  ProviderConfig,
  SupportedLanguage,
  TtsChunkProgress,
  TtsGenerateRequest,
  TtsGenerationResult,
  VoiceOption,
} from '../types/voice.types';
import { getVoiceProvider } from './elevenLabsProvider';
import { synthesizeWithGeminiTts } from './geminiTts';

export const studioService = {
  getAllAvailableVoices(): VoiceOption[] {
    const customVoices = storageRepository.getCustomVoices();
    return [...customVoices, ...PREBUILT_GEMINI_VOICES];
  },

  getCustomVoices(): VoiceOption[] {
    return storageRepository.getCustomVoices();
  },

  queryCustomVoices(params: PagedParams): PagedResult<VoiceOption> {
    const all = storageRepository.getCustomVoices();
    const query = (params.q ?? '').trim().toLowerCase();

    const filtered = query
      ? all.filter(
          (v) =>
            v.name.toLowerCase().includes(query) ||
            v.characterDescription.toLowerCase().includes(query)
        )
      : [...all];

    const validSort = CUSTOM_VOICE_SORT_COLUMNS.includes(
      params.sort as (typeof CUSTOM_VOICE_SORT_COLUMNS)[number]
    )
      ? (params.sort as (typeof CUSTOM_VOICE_SORT_COLUMNS)[number])
      : 'createdAt';
    const orderFactor = params.order === 'asc' ? 1 : -1;

    filtered.sort((a, b) => {
      if (validSort === 'name') {
        return a.name.localeCompare(b.name, 'id-ID') * orderFactor;
      }
      if (validSort === 'sampleDurationSeconds') {
        return ((a.sampleDurationSeconds ?? 0) - (b.sampleDurationSeconds ?? 0)) * orderFactor;
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (timeA - timeB) * orderFactor;
    });

    const total = filtered.length;
    const start = (params.page - 1) * params.pageSize;
    const data = filtered.slice(start, start + params.pageSize);
    return { data, total };
  },

  async generateSpeech(
    request: TtsGenerateRequest,
    onProgress?: (progress: TtsChunkProgress) => void
  ): Promise<TtsGenerationResult> {
    const parsed = ttsFormSchema.safeParse({
      text: request.text,
      voiceId: request.voice.id,
      language: request.language,
      speed: request.speed,
      styleInstruction: request.styleInstruction,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw new AppError(
        firstIssue?.message ?? 'Data formulir Text-to-Speech tidak valid.',
        'VALIDATION_ERROR'
      );
    }

    let synthesisResult: {
      audioBase64: string;
      mimeType: string;
      durationSeconds: number;
    };

    if (request.voice.source === 'custom') {
      const provider = getVoiceProvider(request.voice.providerId);
      synthesisResult = await provider.synthesizeSpeech({
        text: parsed.data.text,
        voice: request.voice,
        language: parsed.data.language,
        speed: parsed.data.speed,
        styleInstruction: parsed.data.styleInstruction,
        onProgress,
      });
    } else {
      synthesisResult = await synthesizeWithGeminiTts({
        text: parsed.data.text,
        voiceName: request.voice.id,
        language: parsed.data.language,
        speed: parsed.data.speed,
        styleInstruction: parsed.data.styleInstruction,
        onProgress,
      });
    }

    const resultItem: TtsGenerationResult = {
      id: `tts_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      text: parsed.data.text,
      voiceId: request.voice.id,
      voiceName: request.voice.name,
      voiceSource: request.voice.source,
      language: parsed.data.language,
      speed: parsed.data.speed,
      styleInstruction: parsed.data.styleInstruction,
      audioBase64: synthesisResult.audioBase64,
      mimeType: synthesisResult.mimeType,
      durationSeconds: synthesisResult.durationSeconds,
      createdAt: new Date().toISOString(),
    };

    const currentHistory = storageRepository.getHistory();
    storageRepository.saveHistory([resultItem, ...currentHistory]);

    return resultItem;
  },

  async previewVoice(
    voice: VoiceOption,
    language: SupportedLanguage
  ): Promise<{ audioBase64: string; mimeType: string }> {
    const sampleText =
      language === 'en-US' ? voice.previewTextEn : voice.previewTextId;

    if (voice.source === 'custom') {
      const provider = getVoiceProvider(voice.providerId);
      const out = await provider.synthesizeSpeech({
        text: sampleText,
        voice,
        language,
        speed: 1.0,
        styleInstruction: 'ramah dan jelas',
      });
      return { audioBase64: out.audioBase64, mimeType: out.mimeType };
    }

    const out = await synthesizeWithGeminiTts({
      text: sampleText,
      voiceName: voice.id,
      language,
      speed: 1.0,
      styleInstruction: 'alami dan jernih',
    });

    return { audioBase64: out.audioBase64, mimeType: out.mimeType };
  },

  async createClonedVoice(input: CloneVoiceInput): Promise<VoiceOption> {
    const parsed = cloneVoiceSchema.safeParse({
      name: input.name,
      description: input.description,
      sampleDurationSeconds: input.sampleDurationSeconds,
      sampleSizeBytes: input.sampleBlob.size,
      consentAccepted: input.consentAccepted,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw new AppError(
        firstIssue?.message ?? 'Validasi pembuatan suara kustom gagal.',
        'VALIDATION_ERROR'
      );
    }

    const activeProvider = getVoiceProvider();
    const clonedVoice = await activeProvider.cloneVoice(input);

    const existing = storageRepository.getCustomVoices();
    storageRepository.saveCustomVoices([clonedVoice, ...existing]);

    return clonedVoice;
  },

  renameCustomVoice(voiceId: string, newName: string): VoiceOption[] {
    const parsed = renameVoiceSchema.safeParse({ name: newName });
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? 'Nama suara tidak valid.',
        'VALIDATION_ERROR'
      );
    }

    const existing = storageRepository.getCustomVoices();
    const updated = existing.map((v) =>
      v.id === voiceId ? { ...v, name: parsed.data.name } : v
    );
    storageRepository.saveCustomVoices(updated);
    return updated;
  },

  deleteCustomVoice(voiceId: string): VoiceOption[] {
    const existing = storageRepository.getCustomVoices();
    const updated = existing.filter((v) => v.id !== voiceId);
    storageRepository.saveCustomVoices(updated);
    return updated;
  },

  queryHistory(params: PagedParams): PagedResult<TtsGenerationResult> {
    const all = storageRepository.getHistory();
    const query = (params.q ?? '').trim().toLowerCase();

    const filtered = query
      ? all.filter(
          (item) =>
            item.text.toLowerCase().includes(query) ||
            item.voiceName.toLowerCase().includes(query) ||
            item.styleInstruction.toLowerCase().includes(query)
        )
      : [...all];

    const validSort = HISTORY_SORT_COLUMNS.includes(
      params.sort as (typeof HISTORY_SORT_COLUMNS)[number]
    )
      ? (params.sort as (typeof HISTORY_SORT_COLUMNS)[number])
      : 'createdAt';
    const orderFactor = params.order === 'asc' ? 1 : -1;

    filtered.sort((a, b) => {
      if (validSort === 'voiceName') {
        return a.voiceName.localeCompare(b.voiceName, 'id-ID') * orderFactor;
      }
      if (validSort === 'text') {
        return a.text.localeCompare(b.text, 'id-ID') * orderFactor;
      }
      if (validSort === 'durationSeconds') {
        return (a.durationSeconds - b.durationSeconds) * orderFactor;
      }
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return (timeA - timeB) * orderFactor;
    });

    const total = filtered.length;
    const start = (params.page - 1) * params.pageSize;
    const data = filtered.slice(start, start + params.pageSize);
    return { data, total };
  },

  deleteHistoryItem(id: string): void {
    const existing = storageRepository.getHistory();
    storageRepository.saveHistory(existing.filter((item) => item.id !== id));
  },

  clearAllHistory(): void {
    storageRepository.saveHistory([]);
  },

  getProviderConfig(): ProviderConfig {
    return storageRepository.getProviderConfigFromSession();
  },

  saveProviderConfig(config: ProviderConfig): void {
    storageRepository.saveProviderConfigToSession(config);
  },
};
