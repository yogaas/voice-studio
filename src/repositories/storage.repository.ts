import { STORAGE_KEYS } from '../constants/voice.constants';
import type {
  ProviderConfig,
  TtsGenerationResult,
  VoiceOption,
} from '../types/voice.types';

const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  activeProvider: 'elevenlabs',
  elevenLabsApiKey: '',
  elevenLabsModelId: 'eleven_multilingual_v2',
};

export const storageRepository = {
  getCustomVoices(): VoiceOption[] {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.CUSTOM_VOICES);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as VoiceOption[]) : [];
    } catch {
      return [];
    }
  },

  saveCustomVoices(voices: VoiceOption[]): void {
    try {
      window.localStorage.setItem(STORAGE_KEYS.CUSTOM_VOICES, JSON.stringify(voices));
    } catch {
      // Abaikan jika kuota penyimpanan penuh
    }
  },

  getHistory(): TtsGenerationResult[] {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.TTS_HISTORY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as TtsGenerationResult[]) : [];
    } catch {
      return [];
    }
  },

  saveHistory(items: TtsGenerationResult[]): void {
    // Batasi maksimal 25 riwayat terbaru agar tidak melampaui kuota localStorage
    const trimmed = items.slice(0, 25);
    try {
      window.localStorage.setItem(STORAGE_KEYS.TTS_HISTORY, JSON.stringify(trimmed));
    } catch {
      // Jika ukuran audio base64 terlalu besar, simpan 10 item terakhir
      try {
        window.localStorage.setItem(
          STORAGE_KEYS.TTS_HISTORY,
          JSON.stringify(trimmed.slice(0, 10))
        );
      } catch {
        // Abaikan jika tetap penuh
      }
    }
  },

  getProviderConfigFromSession(): ProviderConfig {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEYS.SESSION_PROVIDER_CONFIG);
      if (!raw) {
        return DEFAULT_PROVIDER_CONFIG;
      }
      const parsed = JSON.parse(raw) as Partial<ProviderConfig>;
      return {
        activeProvider:
          parsed.activeProvider === 'studio_acoustic' ? 'studio_acoustic' : 'elevenlabs',
        elevenLabsApiKey:
          typeof parsed.elevenLabsApiKey === 'string' ? parsed.elevenLabsApiKey : '',
        elevenLabsModelId:
          typeof parsed.elevenLabsModelId === 'string' && parsed.elevenLabsModelId.trim()
            ? parsed.elevenLabsModelId
            : 'eleven_multilingual_v2',
      };
    } catch {
      return DEFAULT_PROVIDER_CONFIG;
    }
  },

  saveProviderConfigToSession(config: ProviderConfig): void {
    try {
      window.sessionStorage.setItem(
        STORAGE_KEYS.SESSION_PROVIDER_CONFIG,
        JSON.stringify(config)
      );
    } catch {
      // Abaikan jika sessionStorage tidak tersedia
    }
  },

  getTheme(): 'light' | 'dark' {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEYS.THEME);
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  },

  saveTheme(theme: 'light' | 'dark'): void {
    try {
      window.localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // Abaikan
    }
  },
};
