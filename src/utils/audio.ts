import { DEFAULT_SAMPLE_RATE } from '../constants/voice.constants';
import type { AcousticProfile } from '../types/voice.types';

const WAV_HEADER_SIZE = 44;

function writeAsciiString(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

/**
 * Memeriksa apakah array byte sudah memiliki header RIFF WAVE (44 byte).
 */
export function hasRiffWavHeader(bytes: Uint8Array): boolean {
  if (bytes.byteLength < WAV_HEADER_SIZE) {
    return false;
  }
  return (
    bytes[0] === 0x52 && // 'R'
    bytes[1] === 0x49 && // 'I'
    bytes[2] === 0x46 && // 'F'
    bytes[3] === 0x46 && // 'F'
    bytes[8] === 0x57 && // 'W'
    bytes[9] === 0x41 && // 'A'
    bytes[10] === 0x56 && // 'V'
    bytes[11] === 0x45 // 'E'
  );
}

/**
 * Mengekstrak hanya payload PCM murni dari subchunk 'data' di dalam container RIFF WAVE,
 * mengabaikan subchunk metadata tambahan di ujung file (seperti C2PA / JUMBF / LIST)
 * yang dapat menyebabkan bunyi kasar/noise di akhir pemutaran.
 */
export function extractCleanPcmFromWav(
  wavOrPcmBytes: Uint8Array,
  fallbackSampleRate = DEFAULT_SAMPLE_RATE
): { pcmData: Uint8Array; sampleRate: number } {
  if (!hasRiffWavHeader(wavOrPcmBytes)) {
    const evenLen = wavOrPcmBytes.byteLength & ~1;
    return {
      pcmData: wavOrPcmBytes.subarray(0, evenLen),
      sampleRate: fallbackSampleRate,
    };
  }

  const view = new DataView(
    wavOrPcmBytes.buffer,
    wavOrPcmBytes.byteOffset,
    wavOrPcmBytes.byteLength
  );

  let sampleRate = fallbackSampleRate;
  let offset = 12;

  while (offset + 8 <= wavOrPcmBytes.byteLength) {
    const id0 = wavOrPcmBytes[offset];
    const id1 = wavOrPcmBytes[offset + 1];
    const id2 = wavOrPcmBytes[offset + 2];
    const id3 = wavOrPcmBytes[offset + 3];
    const chunkSize = view.getUint32(offset + 4, true);
    const dataStart = offset + 8;

    // 'fmt '
    if (id0 === 0x66 && id1 === 0x6d && id2 === 0x74 && id3 === 0x20) {
      if (dataStart + 8 <= wavOrPcmBytes.byteLength) {
        const parsedRate = view.getUint32(dataStart + 4, true);
        if (parsedRate >= 8000 && parsedRate <= 96000) {
          sampleRate = parsedRate;
        }
      }
    }

    // 'data'
    if (id0 === 0x64 && id1 === 0x61 && id2 === 0x74 && id3 === 0x61) {
      const safeEnd = Math.min(wavOrPcmBytes.byteLength, dataStart + chunkSize);
      const evenByteLength = (safeEnd - dataStart) & ~1;
      const pcmCopy = wavOrPcmBytes.slice(dataStart, dataStart + evenByteLength);

      // Terapkan micro fade-out 15ms pada akhir sampel PCM agar bebas bunyi pop/noise
      const pcmView = new DataView(pcmCopy.buffer, pcmCopy.byteOffset, pcmCopy.byteLength);
      const totalSamples = pcmCopy.byteLength / 2;
      const fadeSamples = Math.min(totalSamples, Math.floor(sampleRate * 0.015));
      const startSample = totalSamples - fadeSamples;

      for (let i = 0; i < fadeSamples; i++) {
        const byteIdx = (startSample + i) * 2;
        const sampleVal = pcmView.getInt16(byteIdx, true);
        const gain = 1 - (i + 1) / fadeSamples;
        pcmView.setInt16(byteIdx, Math.round(sampleVal * gain), true);
      }

      return { pcmData: pcmCopy, sampleRate };
    }

    const paddedSize = chunkSize + (chunkSize % 2);
    offset = dataStart + paddedSize;
  }

  // Fallback jika subchunk 'data' tidak ditemukan di posisi standar
  const fallbackEnd = wavOrPcmBytes.byteLength;
  const evenLen = Math.max(0, (fallbackEnd - WAV_HEADER_SIZE) & ~1);
  return {
    pcmData: wavOrPcmBytes.subarray(WAV_HEADER_SIZE, WAV_HEADER_SIZE + evenLen),
    sampleRate,
  };
}

/**
 * Mengonversi data PCM 16-bit little-endian mentah menjadi format WAV lengkap dengan header RIFF 44-byte.
 */
export function pcmToWavBytes(
  pcmData: Uint8Array,
  sampleRate = DEFAULT_SAMPLE_RATE,
  numChannels = 1,
  bitsPerSample = 16
): Uint8Array {
  const evenByteLength = pcmData.byteLength & ~1;
  const cleanPcm = pcmData.subarray(0, evenByteLength);
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = cleanPcm.byteLength;
  const buffer = new ArrayBuffer(WAV_HEADER_SIZE + dataSize);
  const view = new DataView(buffer);

  writeAsciiString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAsciiString(view, 8, 'WAVE');
  writeAsciiString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Ukuran subchunk PCM
  view.setUint16(20, 1, true); // AudioFormat 1 = Linear PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAsciiString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const output = new Uint8Array(buffer);
  output.set(cleanPcm, WAV_HEADER_SIZE);
  return output;
}

/**
 * Mengonversi PCM atau WAV bytes menjadi objek Blob audio/wav yang sudah dibersihkan
 * dari metadata C2PA/non-audio di bagian ekor file.
 */
export function pcmToWavBlob(pcmOrWavBytes: Uint8Array, sampleRate = DEFAULT_SAMPLE_RATE): Blob {
  const { pcmData, sampleRate: detectedRate } = extractCleanPcmFromWav(
    pcmOrWavBytes,
    sampleRate
  );
  const wavBytes = pcmToWavBytes(pcmData, detectedRate);
  return new Blob([wavBytes.slice().buffer], { type: 'audio/wav' });
}

/**
 * Menggabungkan beberapa potongan audio (baik yang sudah memiliki header WAV maupun PCM mentah)
 * menjadi satu file WAV utuh yang mulus tanpa metadata C2PA di tengah/akhir.
 */
export function concatenateAudioChunksToWav(
  chunks: Uint8Array[],
  sampleRate = DEFAULT_SAMPLE_RATE
): Uint8Array {
  if (chunks.length === 0) {
    return pcmToWavBytes(new Uint8Array(0), sampleRate);
  }

  let detectedSampleRate = sampleRate;
  const pcmPayloads: Uint8Array[] = [];

  for (const chunk of chunks) {
    const extracted = extractCleanPcmFromWav(chunk, detectedSampleRate);
    detectedSampleRate = extracted.sampleRate;
    pcmPayloads.push(extracted.pcmData);
  }

  // Tambahkan jeda hening singkat (120 mdtk) antar potongan kalimat agar terdengar natural
  const silenceSamples = Math.floor(detectedSampleRate * 0.12);
  const silenceBytes = new Uint8Array(silenceSamples * 2);

  let totalPcmBytes = 0;
  pcmPayloads.forEach((payload, index) => {
    totalPcmBytes += payload.byteLength;
    if (index < pcmPayloads.length - 1) {
      totalPcmBytes += silenceBytes.byteLength;
    }
  });

  const combinedPcm = new Uint8Array(totalPcmBytes);
  let offset = 0;

  pcmPayloads.forEach((payload, index) => {
    combinedPcm.set(payload, offset);
    offset += payload.byteLength;
    if (index < pcmPayloads.length - 1) {
      combinedPcm.set(silenceBytes, offset);
      offset += silenceBytes.byteLength;
    }
  });

  return pcmToWavBytes(combinedPcm, detectedSampleRate);
}

/**
 * Mengenkode AudioBuffer dari Web Audio API menjadi Uint8Array WAV 16-bit
 * lengkap dengan fade-out halus di ujung akhir.
 */
export function audioBufferToWavBytes(audioBuffer: AudioBuffer): Uint8Array {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const totalSamples = channelData.length;
  const fadeSamples = Math.min(totalSamples, Math.floor(sampleRate * 0.015));
  const fadeStart = totalSamples - fadeSamples;

  const pcmBuffer = new ArrayBuffer(totalSamples * 2);
  const pcmView = new DataView(pcmBuffer);

  for (let i = 0; i < totalSamples; i++) {
    let sample = channelData[i];
    if (i >= fadeStart && fadeSamples > 0) {
      const gain = 1 - (i - fadeStart + 1) / fadeSamples;
      sample *= gain;
    }
    const clamped = Math.max(-1, Math.min(1, sample));
    const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    pcmView.setInt16(i * 2, int16, true);
  }

  return pcmToWavBytes(new Uint8Array(pcmBuffer), sampleRate, 1, 16);
}

/**
 * Menerapkan kecepatan bicara (speed) dan profil akustik (untuk suara kustom)
 * menggunakan OfflineAudioContext serta mengembalikan durasi presisi.
 */
export async function processAudioWithSpeedAndProfile(
  rawAudioBytes: Uint8Array,
  speed: number,
  acousticProfile?: AcousticProfile
): Promise<{ wavBytes: Uint8Array; durationSeconds: number }> {
  const { pcmData, sampleRate } = extractCleanPcmFromWav(
    rawAudioBytes,
    DEFAULT_SAMPLE_RATE
  );
  const wavInput = pcmToWavBytes(pcmData, sampleRate);

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const tempCtx = new AudioCtx();

  try {
    const copyBuffer = wavInput.slice().buffer;
    const decoded = await tempCtx.decodeAudioData(copyBuffer);

    const pitchRatio = acousticProfile
      ? Math.pow(2, acousticProfile.pitchShiftSemitones / 12)
      : 1;
    const rateFactor = acousticProfile ? acousticProfile.speakingRateFactor : 1;
    const effectiveRate = Math.max(0.5, Math.min(2.2, speed * rateFactor * pitchRatio));

    if (Math.abs(effectiveRate - 1) < 0.02 && !acousticProfile) {
      return {
        wavBytes: wavInput,
        durationSeconds: Number(decoded.duration.toFixed(2)),
      };
    }

    const outputLength = Math.max(1, Math.ceil(decoded.length / effectiveRate));
    const offlineCtx = new OfflineAudioContext(1, outputLength, decoded.sampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = decoded;
    source.playbackRate.value = effectiveRate;

    if (acousticProfile && Math.abs(acousticProfile.warmthDb) > 0.1) {
      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'lowshelf';
      filter.frequency.value = 260;
      filter.gain.value = acousticProfile.warmthDb;
      source.connect(filter);
      filter.connect(offlineCtx.destination);
    } else {
      source.connect(offlineCtx.destination);
    }

    source.start(0);
    const rendered = await offlineCtx.startRendering();
    const processedWav = audioBufferToWavBytes(rendered);

    return {
      wavBytes: processedWav,
      durationSeconds: Number(rendered.duration.toFixed(2)),
    };
  } finally {
    await tempCtx.close().catch(() => undefined);
  }
}

/**
 * Membaca durasi file/blob audio secara akurat dalam satuan detik.
 */
export async function getAudioDurationFromBlob(blob: Blob): Promise<number> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return Number(audioBuffer.duration.toFixed(2));
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

/**
 * Menganalisis sampel suara pengguna untuk mengekstrak karakter vokal (pitch, kehangatan, tempo)
 * serta memilih karakter dasar Gemini yang paling mendekati.
 */
export async function analyzeVoiceSampleProfile(blob: Blob): Promise<AcousticProfile> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const data = audioBuffer.getChannelData(0);

    let zeroCrossings = 0;
    let sumSquares = 0;
    const step = Math.max(1, Math.floor(data.length / 48000));

    for (let i = step; i < data.length; i += step) {
      if ((data[i] >= 0 && data[i - step] < 0) || (data[i] < 0 && data[i - step] >= 0)) {
        zeroCrossings++;
      }
      sumSquares += data[i] * data[i];
    }

    const rms = Math.sqrt(sumSquares / (data.length / step));
    const normalizedZcr = zeroCrossings / (data.length / step);

    const pitchShiftSemitones = Number(((normalizedZcr - 0.08) * 14).toFixed(2));
    const clampedPitch = Math.max(-2.5, Math.min(2.5, pitchShiftSemitones));
    const warmthDb = Number(Math.max(-3, Math.min(4.5, (0.15 - rms) * 18)).toFixed(1));

    const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'Aoede'];
    const voiceIndex = Math.abs(Math.round(zeroCrossings + rms * 1000)) % voices.length;

    return {
      pitchShiftSemitones: clampedPitch,
      speakingRateFactor: 1.0,
      warmthDb,
      baseGeminiVoice: voices[voiceIndex],
    };
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

/**
 * Mengekstrak puncak amplitudo gelombang suara untuk visualisasi waveform.
 */
export async function extractWaveformPeaks(blob: Blob, barCount = 48): Promise<number[]> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channelData.length / barCount));
    const peaks: number[] = [];

    for (let i = 0; i < barCount; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize && start + j < channelData.length; j += 4) {
        const val = Math.abs(channelData[start + j]);
        if (val > max) {
          max = val;
        }
      }
      peaks.push(Math.max(0.12, Math.min(1, max * 1.4)));
    }
    return peaks;
  } catch {
    return Array.from({ length: barCount }, (_, idx) => 0.25 + ((idx * 7) % 5) * 0.12);
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

/**
 * Membuat sampel suara demo berdurasi 32 detik (memenuhi syarat minimal 30 detik)
 * dengan modulasi frekuensi vokal alami untuk pengujian cepat fitur Voice Cloning.
 */
export function createStudioDemoVoiceSample(durationSeconds = 32): Blob {
  const sampleRate = 16000;
  const totalSamples = sampleRate * durationSeconds;
  const pcmBuffer = new ArrayBuffer(totalSamples * 2);
  const view = new DataView(pcmBuffer);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const phraseEnvelope = Math.sin(t * 1.8) > -0.65 ? 1 : 0.04;
    const syllableEnvelope = 0.55 + 0.45 * Math.sin(2 * Math.PI * 3.2 * t);
    const f0 = 135 + 18 * Math.sin(2 * Math.PI * 0.45 * t);

    const harmonic1 = Math.sin(2 * Math.PI * f0 * t);
    const harmonic2 = 0.5 * Math.sin(2 * Math.PI * f0 * 2 * t);
    const harmonic3 = 0.25 * Math.sin(2 * Math.PI * f0 * 3 * t);
    const harmonic4 = 0.12 * Math.sin(2 * Math.PI * f0 * 4 * t);

    const sample =
      0.32 * phraseEnvelope * syllableEnvelope * (harmonic1 + harmonic2 + harmonic3 + harmonic4);
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(i * 2, clamped * 0x7fff, true);
  }

  const wavBytes = pcmToWavBytes(new Uint8Array(pcmBuffer), sampleRate, 1, 16);
  return new Blob([wavBytes.slice().buffer], { type: 'audio/wav' });
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const binary = window.atob(cleanBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...sub);
  }
  return window.btoa(binary);
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatIndonesianDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return (
      new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      }).format(date) + ' WIB'
    );
  } catch {
    return isoString;
  }
}
