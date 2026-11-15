import { z } from 'zod';
import {
  MAX_SAMPLE_FILE_SIZE_BYTES,
  MAX_TTS_CHARS,
  MIN_SAMPLE_DURATION_SECONDS,
} from '../constants/voice.constants';

export const ttsFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Teks wajib diisi sebelum membuat suara.')
    .max(MAX_TTS_CHARS, `Teks tidak boleh melebihi ${MAX_TTS_CHARS.toLocaleString('id-ID')} karakter.`),
  voiceId: z.string().min(1, 'Silakan pilih suara terlebih dahulu.'),
  language: z.enum(['id-ID', 'en-US']),
  speed: z
    .number()
    .min(0.5, 'Kecepatan minimal adalah 0.5x.')
    .max(2.0, 'Kecepatan maksimal adalah 2.0x.'),
  styleInstruction: z
    .string()
    .max(250, 'Instruksi gaya bicara maksimal 250 karakter.'),
});

export const cloneVoiceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama suara kustom wajib diisi (minimal 2 karakter).')
    .max(60, 'Nama suara kustom maksimal 60 karakter.'),
  description: z
    .string()
    .max(200, 'Deskripsi suara maksimal 200 karakter.')
    .optional(),
  sampleDurationSeconds: z
    .number()
    .min(
      MIN_SAMPLE_DURATION_SECONDS,
      `Durasi sampel suara minimal ${MIN_SAMPLE_DURATION_SECONDS} detik agar kualitas kloning optimal.`
    ),
  sampleSizeBytes: z
    .number()
    .min(100, 'File sampel suara tidak valid atau kosong.')
    .max(
      MAX_SAMPLE_FILE_SIZE_BYTES,
      'Ukuran file sampel suara melebihi batas maksimal 10 MB.'
    ),
  consentAccepted: z.literal(true, {
    error: 'Anda wajib menyetujui pernyataan kepemilikan dan etika penggunaan suara.',
  }),
});

export const renameVoiceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama suara wajib diisi (minimal 2 karakter).')
    .max(60, 'Nama suara maksimal 60 karakter.'),
});

export const providerConfigSchema = z.object({
  activeProvider: z.enum(['elevenlabs', 'studio_acoustic']),
  elevenLabsApiKey: z.string().trim(),
  elevenLabsModelId: z.string().trim().min(1, 'Model ID wajib diisi.'),
});

export type TtsFormValues = z.infer<typeof ttsFormSchema>;
export type CloneVoiceValues = z.infer<typeof cloneVoiceSchema>;
