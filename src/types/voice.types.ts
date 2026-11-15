export type SupportedLanguage = 'id-ID' | 'en-US';

export type VoiceSource = 'gemini' | 'custom';

export type VoiceProviderId = 'elevenlabs' | 'studio_acoustic';

export type NavigationTab = 'tts' | 'cloning' | 'history';

export type SortOrder = 'asc' | 'desc';

export interface AcousticProfile {
  pitchShiftSemitones: number;
  speakingRateFactor: number;
  warmthDb: number;
  baseGeminiVoice: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  shortTitle?: string;
  isPopular?: boolean;
  avatarKey?: 'nadia' | 'rizky' | 'santi' | 'dimas' | 'putri' | 'budi' | 'custom';
  source: VoiceSource;
  providerId?: VoiceProviderId;
  externalVoiceId?: string;
  genderLabel: string;
  characterDescription: string;
  previewTextId: string;
  previewTextEn: string;
  createdAt?: string;
  sampleDurationSeconds?: number;
  acousticProfile?: AcousticProfile;
}

export interface TtsGenerateRequest {
  text: string;
  voice: VoiceOption;
  language: SupportedLanguage;
  speed: number;
  styleInstruction: string;
}

export interface TtsChunkProgress {
  currentChunk: number;
  totalChunks: number;
  percentage: number;
  statusText: string;
}

export interface TtsGenerationResult {
  id: string;
  text: string;
  voiceId: string;
  voiceName: string;
  voiceSource: VoiceSource;
  language: SupportedLanguage;
  speed: number;
  styleInstruction: string;
  audioBase64: string;
  mimeType: string;
  durationSeconds: number;
  createdAt: string;
}

export interface CloneVoiceInput {
  name: string;
  description?: string;
  sampleBlob: Blob;
  sampleFileName: string;
  sampleDurationSeconds: number;
  consentAccepted: boolean;
}

export interface ProviderConfig {
  activeProvider: VoiceProviderId;
  elevenLabsApiKey: string;
  elevenLabsModelId: string;
}

export interface PagedParams {
  q?: string;
  sort?: string;
  order?: SortOrder;
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
}
