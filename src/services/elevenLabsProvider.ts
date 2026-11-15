import { AppError, toAppError } from '../lib/errors';
import { storageRepository } from '../repositories/storage.repository';
import type { CloneVoiceInput, VoiceOption, VoiceProviderId } from '../types/voice.types';
import {
  analyzeVoiceSampleProfile,
  base64ToUint8Array,
  concatenateAudioChunksToWav,
  getAudioDurationFromBlob,
  processAudioWithSpeedAndProfile,
  uint8ArrayToBase64,
} from '../utils/audio';
import { splitTextIntoChunks } from '../utils/textChunker';
import { synthesizeWithGeminiTts } from './geminiTts';
import type {
  VoiceProvider,
  VoiceSynthesisOutput,
  VoiceSynthesisParams,
} from './voiceProvider';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

interface ElevenLabsAddVoiceResponse {
  voice_id?: string;
  detail?: {
    message?: string;
    status?: string;
  } | string;
}

/**
 * Implementasi VoiceProvider untuk ElevenLabs API (Instant Voice Cloning & Multilingual TTS).
 * API Key dibaca dari sessionStorage (diatur pengguna di halaman Pengaturan).
 */
export class ElevenLabsVoiceProvider implements VoiceProvider {
  public readonly id: VoiceProviderId = 'elevenlabs';
  public readonly displayName = 'ElevenLabs API (Instant Voice Cloning)';
  public readonly description =
    'Mengirim sampel audio ke endpoint resmi ElevenLabs (/v1/voices/add) menggunakan API Key sesi Anda.';
  public readonly requiresApiKey = true;

  private getApiKeyAndModel(): { apiKey: string; modelId: string } {
    const config = storageRepository.getProviderConfigFromSession();
    const apiKey = config.elevenLabsApiKey.trim();
    if (!apiKey) {
      throw new AppError(
        'API Key ElevenLabs belum diisi. Silakan buka tombol "Pengaturan" di pojok kanan atas untuk memasukkan API Key ElevenLabs Anda, atau pilih mode "Studio Acoustic Cloner (Bawaan)".',
        'INVALID_API_KEY',
        401
      );
    }
    return {
      apiKey,
      modelId: config.elevenLabsModelId || 'eleven_multilingual_v2',
    };
  }

  public async cloneVoice(input: CloneVoiceInput): Promise<VoiceOption> {
    try {
      const { apiKey } = this.getApiKeyAndModel();
      const formData = new FormData();
      formData.append('name', input.name.trim());
      formData.append(
        'description',
        input.description?.trim() || 'Suara kustom dibuat melalui VoiceStudio'
      );
      formData.append('files', input.sampleBlob, input.sampleFileName || 'sample.wav');

      const response = await fetch(`${ELEVENLABS_API_BASE}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: formData,
      });

      const data = (await response.json().catch(() => ({}))) as ElevenLabsAddVoiceResponse;

      if (!response.ok || !data.voice_id) {
        const detailMsg =
          typeof data.detail === 'string'
            ? data.detail
            : data.detail?.message || 'Gagal membuat kloning suara di ElevenLabs.';

        if (response.status === 401 || response.status === 403) {
          throw new AppError(
            `Kunci API ElevenLabs ditolak atau tidak memiliki akses Instant Voice Cloning: ${detailMsg}`,
            'INVALID_API_KEY',
            response.status
          );
        }
        if (response.status === 429) {
          throw new AppError(
            'Kuota karakter atau jumlah suara kustom di akun ElevenLabs Anda telah habis.',
            'QUOTA_EXCEEDED',
            429
          );
        }
        throw new AppError(detailMsg, 'PROVIDER_ERROR', response.status);
      }

      const acousticProfile = await analyzeVoiceSampleProfile(input.sampleBlob);

      return {
        id: `custom_el_${data.voice_id}`,
        name: input.name.trim(),
        shortTitle: 'Suara Kustom',
        avatarKey: 'custom',
        source: 'custom',
        providerId: 'elevenlabs',
        externalVoiceId: data.voice_id,
        genderLabel: 'Suara Kustom (ElevenLabs)',
        characterDescription:
          input.description?.trim() ||
          `Kloning suara ElevenLabs (${Math.round(input.sampleDurationSeconds)} dtk sampel)`,
        previewTextId: `Halo, ini adalah pratinjau suara kustom ${input.name.trim()} yang telah berhasil dibuat.`,
        previewTextEn: `Hello, this is a preview of the custom cloned voice ${input.name.trim()}.`,
        createdAt: new Date().toISOString(),
        sampleDurationSeconds: input.sampleDurationSeconds,
        acousticProfile,
      };
    } catch (error: unknown) {
      throw toAppError(error);
    }
  }

  public async synthesizeSpeech(params: VoiceSynthesisParams): Promise<VoiceSynthesisOutput> {
    try {
      const { apiKey, modelId } = this.getApiKeyAndModel();
      const externalId =
        params.voice.externalVoiceId || params.voice.id.replace(/^custom_el_/, '');

      const chunks = splitTextIntoChunks(params.text);
      const totalChunks = chunks.length;
      const decodedWavChunks: Uint8Array[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const currentChunk = i + 1;
        params.onProgress?.({
          currentChunk,
          totalChunks,
          percentage: Math.round(((i + 0.2) / totalChunks) * 100),
          statusText:
            totalChunks > 1
              ? `Mensintesis bagian ${currentChunk} dari ${totalChunks} via ElevenLabs...`
              : 'Menghubungi ElevenLabs TTS API...',
        });

        const response = await fetch(
          `${ELEVENLABS_API_BASE}/text-to-speech/${encodeURIComponent(externalId)}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
              Accept: 'audio/mpeg',
            },
            body: JSON.stringify({
              text: chunks[i],
              model_id: modelId,
              voice_settings: {
                stability: 0.55,
                similarity_boost: 0.82,
                style: params.styleInstruction ? 0.35 : 0.0,
                use_speaker_boost: true,
              },
            }),
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new AppError(
              'API Key ElevenLabs tidak valid atau sesi telah berakhir. Periksa kembali di menu Pengaturan.',
              'INVALID_API_KEY',
              response.status
            );
          }
          if (response.status === 429) {
            throw new AppError(
              'Kuota karakter ElevenLabs Anda telah habis.',
              'QUOTA_EXCEEDED',
              429
            );
          }
          throw new AppError(
            'Gagal menghasilkan audio dari ElevenLabs API.',
            'PROVIDER_ERROR',
            response.status
          );
        }

        const audioBlob = await response.blob();
        const arrayBuf = await audioBlob.arrayBuffer();
        const { wavBytes } = await processAudioWithSpeedAndProfile(
          new Uint8Array(arrayBuf),
          params.speed
        );
        decodedWavChunks.push(wavBytes);
      }

      const finalWav = concatenateAudioChunksToWav(decodedWavChunks);
      const finalBlob = new Blob([finalWav.slice().buffer], { type: 'audio/wav' });
      const durationSeconds = await getAudioDurationFromBlob(finalBlob);

      params.onProgress?.({
        currentChunk: totalChunks,
        totalChunks,
        percentage: 100,
        statusText: 'Audio kustom siap diputar!',
      });

      return {
        audioBase64: uint8ArrayToBase64(finalWav),
        mimeType: 'audio/wav',
        durationSeconds,
      };
    } catch (error: unknown) {
      throw toAppError(error);
    }
  }
}

/**
 * Implementasi alternatif VoiceProvider: Studio Acoustic Cloner (Bawaan).
 * Memungkinkan pengguna menguji pembuatan profil suara kustom secara langsung
 * dengan menganalisis frekuensi dasar & timbre sampel lalu memadukannya dengan mesin Gemini TTS.
 */
export class StudioAcousticVoiceProvider implements VoiceProvider {
  public readonly id: VoiceProviderId = 'studio_acoustic';
  public readonly displayName = 'Studio Acoustic Cloner (Bawaan — Tanpa Kunci Eksternal)';
  public readonly description =
    'Menganalisis spektrum frekuensi dan warna vokal dari sampel suara Anda di browser, lalu mensintesis suara kustom melalui mesin hibrida Gemini TTS.';
  public readonly requiresApiKey = false;

  public async cloneVoice(input: CloneVoiceInput): Promise<VoiceOption> {
    try {
      const acousticProfile = await analyzeVoiceSampleProfile(input.sampleBlob);
      const uniqueId = `custom_sa_${Date.now().toString(36)}`;

      return {
        id: uniqueId,
        name: input.name.trim(),
        shortTitle: 'Suara Kustom',
        avatarKey: 'custom',
        source: 'custom',
        providerId: 'studio_acoustic',
        genderLabel: 'Suara Kustom (Studio Acoustic)',
        characterDescription:
          input.description?.trim() ||
          `Profil akustik kustom (Pitch ${acousticProfile.pitchShiftSemitones >= 0 ? '+' : ''}${acousticProfile.pitchShiftSemitones} st · Dasar ${acousticProfile.baseGeminiVoice})`,
        previewTextId: `Halo, ini adalah suara kustom ${input.name.trim()} yang diadaptasi dari sampel rekaman Anda.`,
        previewTextEn: `Hello, this is the custom voice ${input.name.trim()} adapted from your voice sample.`,
        createdAt: new Date().toISOString(),
        sampleDurationSeconds: input.sampleDurationSeconds,
        acousticProfile,
      };
    } catch (error: unknown) {
      throw toAppError(error);
    }
  }

  public async synthesizeSpeech(params: VoiceSynthesisParams): Promise<VoiceSynthesisOutput> {
    const profile = params.voice.acousticProfile ?? {
      pitchShiftSemitones: 0,
      speakingRateFactor: 1,
      warmthDb: 1.5,
      baseGeminiVoice: 'Kore',
    };

    const result = await synthesizeWithGeminiTts({
      text: params.text,
      voiceName: profile.baseGeminiVoice,
      language: params.language,
      speed: params.speed,
      styleInstruction: params.styleInstruction,
      acousticProfile: profile,
      onProgress: params.onProgress,
    });

    return {
      audioBase64: result.audioBase64,
      mimeType: result.mimeType,
      durationSeconds: result.durationSeconds,
    };
  }
}

const providers: Record<VoiceProviderId, VoiceProvider> = {
  elevenlabs: new ElevenLabsVoiceProvider(),
  studio_acoustic: new StudioAcousticVoiceProvider(),
};

export function getVoiceProvider(providerId?: VoiceProviderId): VoiceProvider {
  if (providerId && providers[providerId]) {
    return providers[providerId];
  }
  const config = storageRepository.getProviderConfigFromSession();
  return providers[config.activeProvider] ?? providers.elevenlabs;
}

export function getAllVoiceProviders(): VoiceProvider[] {
  return [providers.elevenlabs, providers.studio_acoustic];
}

export { base64ToUint8Array };
