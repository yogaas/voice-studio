export type ErrorCode =
  | 'QUOTA_EXCEEDED'
  | 'INVALID_API_KEY'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUDIO_DECODE_ERROR'
  | 'PROVIDER_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status?: number;

  constructor(message: string, code: ErrorCode = 'UNKNOWN_ERROR', status?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return new AppError(
      'Gagal terhubung ke jaringan. Periksa koneksi internet Anda lalu coba kembali.',
      'NETWORK_ERROR'
    );
  }

  const rawMessage = error instanceof Error ? error.message : String(error);
  const lower = rawMessage.toLowerCase();

  if (lower.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted')) {
    return new AppError(
      'Kuota layanan API telah habis atau mencapai batas permintaan per menit. Silakan tunggu sejenak atau periksa kuota akun Anda.',
      'QUOTA_EXCEEDED',
      429
    );
  }

  if (
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('api key') ||
    lower.includes('api_key') ||
    lower.includes('unauthorized')
  ) {
    return new AppError(
      'Kunci API tidak valid atau belum diatur. Periksa kembali API Key Anda di menu Pengaturan.',
      'INVALID_API_KEY',
      401
    );
  }

  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('offline')) {
    return new AppError(
      'Koneksi jaringan terputus saat memproses audio. Pastikan perangkat Anda terhubung ke internet.',
      'NETWORK_ERROR'
    );
  }

  return new AppError(
    rawMessage || 'Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.',
    'UNKNOWN_ERROR'
  );
}
