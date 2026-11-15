import { AppError, toAppError } from '../lib/errors';
import type {
  AcousticProfile,
  SupportedLanguage,
  TtsChunkProgress,
} from '../types/voice.types';
import {
  base64ToUint8Array,
  concatenateAudioChunksToWav,
  processAudioWithSpeedAndProfile,
  uint8ArrayToBase64,
} from '../utils/audio';
import { splitTextIntoChunks } from '../utils/textChunker';

interface ServerTtsResponse {
  audioBase64?: string;
  mimeType?: string;
  code?: string;
  message?: string;
}

export interface GeminiTtsSynthesizeOptions {
  text: string;
  voiceName: string;
  language: SupportedLanguage;
  speed: number;
  styleInstruction: string;
  acousticProfile?: AcousticProfile;
  onProgress?: (progress: TtsChunkProgress) => void;
}

/**
 * Memanggil endpoint server /api/tts untuk satu potongan kalimat.
 */
async function requestSingleChunkTts(
  chunkText: string,
  voiceName: string,
  language: SupportedLanguage,
  styleInstruction: string
): Promise<Uint8Array> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: chunkText,
      voiceName,
      language,
      styleInstruction,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as ServerTtsResponse;

  if (!response.ok || !payload.audioBase64) {
    const message =
      payload.message ||
      (response.status === 429
        ? 'Kuota Gemini API telah mencapai batas. Silakan tunggu beberapa saat.'
        : 'Gagal membuat suara dari Gemini TTS.');
    const code =
      response.status === 429
        ? 'QUOTA_EXCEEDED'
        : response.status === 401 || response.status === 403
          ? 'INVALID_API_KEY'
          : 'PROVIDER_ERROR';

    throw new AppError(message, code, response.status);
  }

  return base64ToUint8Array(payload.audioBase64);
}

/**
 * Layanan utama Gemini Text-to-Speech:
 * - Memecah teks panjang menjadi beberapa kalimat/paragraf
 * - Memproses secara bertahap sambil mengirimkan status progress bar
 * - Menggabungkan seluruh potongan PCM/WAV menjadi satu file WAV utuh
 */
export async function synthesizeWithGeminiTts(
  options: GeminiTtsSynthesizeOptions
): Promise<{ audioBase64: string; mimeType: string; durationSeconds: number }> {
  try {
    const chunks = splitTextIntoChunks(options.text);
    if (chunks.length === 0) {
      throw new AppError('Teks tidak boleh kosong.', 'VALIDATION_ERROR');
    }

    const rawAudioChunks: Uint8Array[] = [];
    const totalChunks = chunks.length;

    for (let index = 0; index < totalChunks; index++) {
      const currentChunk = index + 1;
      const percentage = Math.round(((index + 0.2) / totalChunks) * 100);

      options.onProgress?.({
        currentChunk,
        totalChunks,
        percentage,
        statusText:
          totalChunks > 1
            ? `Memproses bagian ${currentChunk} dari ${totalChunks}...`
            : 'Menghasilkan gelombang suara alami...',
      });

      const chunkBytes = await requestSingleChunkTts(
        chunks[index],
        options.voiceName,
        options.language,
        options.styleInstruction
      );

      rawAudioChunks.push(chunkBytes);

      options.onProgress?.({
        currentChunk,
        totalChunks,
        percentage: Math.round((currentChunk / totalChunks) * 90),
        statusText:
          totalChunks > 1
            ? `Bagian ${currentChunk} dari ${totalChunks} selesai disintesis`
            : 'Menyusun hasil akhir audio...',
      });
    }

    options.onProgress?.({
      currentChunk: totalChunks,
      totalChunks,
      percentage: 95,
      statusText: 'Menggabungkan dan menormalisasi gelombang WAV...',
    });

    const mergedWavBytes = concatenateAudioChunksToWav(rawAudioChunks);
    const { wavBytes, durationSeconds } = await processAudioWithSpeedAndProfile(
      mergedWavBytes,
      options.speed,
      options.acousticProfile
    );

    options.onProgress?.({
      currentChunk: totalChunks,
      totalChunks,
      percentage: 100,
      statusText: 'Audio siap diputar!',
    });

    return {
      audioBase64: uint8ArrayToBase64(wavBytes),
      mimeType: 'audio/wav',
      durationSeconds,
    };
  } catch (error: unknown) {
    throw toAppError(error);
  }
}
