import type {
  CloneVoiceInput,
  SupportedLanguage,
  TtsChunkProgress,
  VoiceOption,
  VoiceProviderId,
} from '../types/voice.types';

export interface VoiceSynthesisParams {
  text: string;
  voice: VoiceOption;
  language: SupportedLanguage;
  speed: number;
  styleInstruction: string;
  onProgress?: (progress: TtsChunkProgress) => void;
}

export interface VoiceSynthesisOutput {
  audioBase64: string;
  mimeType: string;
  durationSeconds: number;
}

/**
 * Antarmuka (Interface) abstraksi VoiceProvider agar penyedia layanan Voice Cloning
 * dapat diganti tanpa mengubah logika komponen UI.
 */
export interface VoiceProvider {
  readonly id: VoiceProviderId;
  readonly displayName: string;
  readonly description: string;
  readonly requiresApiKey: boolean;

  /**
   * Mengirim sampel rekaman/file suara ke provider untuk membuat suara kustom baru.
   */
  cloneVoice(input: CloneVoiceInput): Promise<VoiceOption>;

  /**
   * Mengubah teks menjadi audio menggunakan suara hasil kloning.
   */
  synthesizeSpeech(params: VoiceSynthesisParams): Promise<VoiceSynthesisOutput>;
}
