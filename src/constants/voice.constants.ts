import type { SupportedLanguage, VoiceOption } from '../types/voice.types';

export const MAX_TTS_CHARS = 5000;
export const MAX_CHUNK_CHARS = 420;
export const MAX_SAMPLE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MIN_SAMPLE_DURATION_SECONDS = 30;
export const DEFAULT_SAMPLE_RATE = 24000;

export const ALLOWED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.webm', '.ogg'] as const;
export const ALLOWED_AUDIO_MIMES = [
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/webm',
  'audio/ogg',
] as const;

export const STORAGE_KEYS = {
  CUSTOM_VOICES: 'voicestudio_custom_voices_v1',
  TTS_HISTORY: 'voicestudio_tts_history_v1',
  THEME: 'voicestudio_theme_v1',
  SESSION_PROVIDER_CONFIG: 'voicestudio_provider_session_v1',
} as const;

export const ETHICAL_CONSENT_STATEMENT =
  'Saya adalah pemilik suara ini atau telah mendapat izin tertulis dari pemilik suara untuk menirunya, dan tidak akan menggunakannya untuk penipuan, penyamaran, atau konten menyesatkan.';

export const LANGUAGE_OPTIONS: ReadonlyArray<{
  value: SupportedLanguage;
  label: string;
  shortLabel: string;
}> = [
  { value: 'id-ID', label: 'Bahasa Indonesia (ID)', shortLabel: 'Indonesia' },
  { value: 'en-US', label: 'Bahasa Inggris (EN-US)', shortLabel: 'Inggris' },
] as const;

export const STYLE_PRESETS: ReadonlyArray<{
  id: string;
  label: string;
  promptValue: string;
}> = [
  {
    id: 'ramah',
    label: 'Formal & Ramah',
    promptValue: 'Dengan gaya formal, ramah, dan meyakinkan',
  },
  {
    id: 'tegas',
    label: 'Tegas & Berwibawa',
    promptValue: 'Tegas, jelas, berwibawa, dan penuh percaya diri',
  },
  {
    id: 'santai',
    label: 'Santai & Natural',
    promptValue: 'Santai, kasual, mengalir alami seperti percakapan sehari-hari',
  },
  {
    id: 'berita',
    label: 'Pembawa Berita',
    promptValue: 'Jernih, artikulatif, objektif seperti penyiar berita profesional',
  },
  {
    id: 'narasi',
    label: 'Narator Lembut',
    promptValue: 'Lembut, tenang, dan ekspresif untuk narasi cerita',
  },
] as const;

export const SAMPLE_TEXT_TEMPLATES: ReadonlyArray<{
  id: string;
  label: string;
  language: SupportedLanguage;
  stylePrompt: string;
  text: string;
}> = [
  {
    id: 'simrs-default',
    label: 'Penjelasan SIMRS',
    language: 'id-ID',
    stylePrompt: 'Dengan gaya formal, ramah, dan meyakinkan',
    text: 'SIMRS adalah singkatan dari Sistem Informasi Manajemen Rumah Sakit, Sistem ini merupakan perangkat lunak berbasis teknologi informasi dan komunikasi yang memproses data dan mengintegrasikan seluruh alur proses bisnis pelayanan di rumah sakit secara real-time.',
  },
  {
    id: 'narasi-nusantara',
    label: 'Narasi Dokumenter',
    language: 'id-ID',
    stylePrompt: 'Lembut, tenang, dan ekspresif untuk narasi cerita',
    text: 'Di balik kabut pagi yang menyelimuti pegunungan Nusantara, tersimpan ribuan kisah tentang ketekunan dan harmoni alam. Setiap embusan angin membawa pesan dari generasi ke generasi.',
  },
  {
    id: 'layanan-pelanggan',
    label: 'Sambutan Layanan',
    language: 'id-ID',
    stylePrompt: 'Dengan gaya formal, ramah, dan meyakinkan',
    text: 'Selamat datang di layanan pusat bantuan terpadu kami. Terima kasih telah menghubungi kami hari ini. Tim kami siap membantu menjawab pertanyaan Anda dengan cepat, tepat, dan ramah.',
  },
  {
    id: 'english-keynote',
    label: 'Presentasi Inggris',
    language: 'en-US',
    stylePrompt: 'Tegas, jelas, berwibawa, dan penuh percaya diri',
    text: 'Welcome to VoiceStudio. Today, we are introducing a seamless workflow for natural speech synthesis and custom voice cloning with studio-grade clarity.',
  },
] as const;

export const PREBUILT_GEMINI_VOICES: ReadonlyArray<VoiceOption> = [
  {
    id: 'Kore',
    name: 'Nadia',
    shortTitle: 'Suara Wanita Profesional',
    isPopular: true,
    avatarKey: 'nadia',
    source: 'gemini',
    genderLabel: 'Suara Wanita',
    characterDescription: 'Suara wanita profesional, jelas dan natural.',
    previewTextId: 'Halo, saya Nadia. Suara saya jelas dan natural untuk berbagai kebutuhan narasi profesional Anda.',
    previewTextEn: 'Hello, I am Nadia. My voice is clear and natural for your professional narration needs.',
  },
  {
    id: 'Charon',
    name: 'Rizky',
    shortTitle: 'Suara Pria Profesional',
    avatarKey: 'rizky',
    source: 'gemini',
    genderLabel: 'Suara Pria',
    characterDescription: 'Suara pria profesional, tenang dan meyakinkan.',
    previewTextId: 'Halo, saya Rizky. Saya siap membawakan materi presentasi Anda dengan tenang dan meyakinkan.',
    previewTextEn: 'Hello, I am Rizky. I am ready to deliver your presentation with a calm and convincing tone.',
  },
  {
    id: 'Zephyr',
    name: 'Santi',
    shortTitle: 'Suara Wanita Ceria',
    avatarKey: 'santi',
    source: 'gemini',
    genderLabel: 'Suara Wanita',
    characterDescription: 'Suara wanita ceria, ramah dan enerjik.',
    previewTextId: 'Hai semuanya! Saya Santi, siap membuat konten kreatif Anda terdengar ceria, ramah, dan enerjik.',
    previewTextEn: 'Hi everyone! I am Santi, ready to make your creative content sound cheerful and energetic.',
  },
  {
    id: 'Puck',
    name: 'Dimas',
    shortTitle: 'Suara Pria Muda',
    avatarKey: 'dimas',
    source: 'gemini',
    genderLabel: 'Suara Pria',
    characterDescription: 'Suara pria muda, santai dan bersahabat.',
    previewTextId: 'Halo teman-teman! Saya Dimas, hadir dengan gaya bicara santai dan bersahabat untuk podcast atau konten Anda.',
    previewTextEn: 'Hey friends! I am Dimas, bringing a relaxed and friendly voice for your content.',
  },
  {
    id: 'Aoede',
    name: 'Putri',
    shortTitle: 'Suara Wanita Lembut',
    avatarKey: 'putri',
    source: 'gemini',
    genderLabel: 'Suara Wanita',
    characterDescription: 'Suara wanita lembut, cocok untuk narasi.',
    previewTextId: 'Halo, saya Putri. Intonasi suara saya yang lembut dan tenang sangat cocok untuk narasi maupun cerita.',
    previewTextEn: 'Hello, I am Putri. My gentle and calm intonation is ideal for storytelling and narration.',
  },
  {
    id: 'Fenrir',
    name: 'Budi',
    shortTitle: 'Suara Pria Dewasa',
    avatarKey: 'budi',
    source: 'gemini',
    genderLabel: 'Suara Pria',
    characterDescription: 'Suara pria dewasa, tegas dan berwibawa.',
    previewTextId: 'Selamat pagi, saya Budi. Setiap informasi penting akan saya sampaikan secara tegas dan berwibawa.',
    previewTextEn: 'Good morning, I am Budi. Every key message will be delivered with authority and clarity.',
  },
] as const;

export const RECORDING_READING_SCRIPT =
  'Selamat pagi. Nama saya adalah pengisi suara untuk pembuatan profil suara kustom di VoiceStudio. Hari ini cuaca terlihat cerah dan suasana ruangan sangat tenang. Saya membaca naskah ini dengan kecepatan yang stabil, artikulasi yang jelas, serta intonasi yang alami. Melalui sampel rekaman berdurasi minimal tiga puluh detik ini, sistem dapat mempelajari karakter, warna vokal, dan irama bicara saya secara akurat untuk menghasilkan suara sintetis yang konsisten.';

export const HISTORY_SORT_COLUMNS = ['createdAt', 'voiceName', 'durationSeconds', 'text'] as const;
export const CUSTOM_VOICE_SORT_COLUMNS = ['createdAt', 'name', 'sampleDurationSeconds'] as const;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;
