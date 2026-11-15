import React, { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import {
  base64ToUint8Array,
  extractWaveformPeaks,
  formatDuration,
  pcmToWavBlob,
} from '../../utils/audio';

export interface AudioPlayerCardProps {
  title?: string;
  subtitle?: string;
  audioBase64?: string | null;
  durationHintSeconds?: number;
  fileNamePrefix?: string;
  autoPlay?: boolean;
  isGenerating?: boolean;
  onRequestGenerate?: () => void;
}

const DEFAULT_STANDBY_PEAKS: number[] = [
  0.22, 0.38, 0.55, 0.32, 0.68, 0.85, 0.52, 0.78, 0.92, 0.44, 0.62, 0.35,
  0.48, 0.74, 0.58, 0.3, 0.42, 0.66, 0.82, 0.46, 0.28, 0.54, 0.72, 0.38,
  0.64, 0.88, 0.52, 0.34, 0.6, 0.76, 0.45, 0.3, 0.58, 0.8, 0.48, 0.36,
  0.66, 0.5, 0.32, 0.7, 0.54, 0.4, 0.62, 0.44, 0.28, 0.52, 0.38, 0.24,
];

export const AudioPlayerCard: React.FC<AudioPlayerCardProps> = ({
  title = 'Preview Hasil Suara',
  subtitle = 'Dengarkan hasil konversi teks Anda di sini.',
  audioBase64 = null,
  durationHintSeconds = 12,
  fileNamePrefix = 'voicestudio-audio',
  autoPlay = false,
  isGenerating = false,
  onRequestGenerate,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationHintSeconds);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [peaks, setPeaks] = useState<number[]>(DEFAULT_STANDBY_PEAKS);
  const [downloadFormat, setDownloadFormat] = useState<'wav' | 'mp3'>('wav');

  useEffect(() => {
    if (!audioBase64) {
      setAudioUrl(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(durationHintSeconds || 12);
      setPeaks(DEFAULT_STANDBY_PEAKS);
      return;
    }

    const bytes = base64ToUint8Array(audioBase64);
    const wavBlob = pcmToWavBlob(bytes);
    const objectUrl = URL.createObjectURL(wavBlob);
    setAudioUrl(objectUrl);
    setIsPlaying(false);
    setCurrentTime(0);

    void extractWaveformPeaks(wavBlob, 48).then(setPeaks);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [audioBase64, durationHintSeconds]);

  useEffect(() => {
    if (autoPlay && audioRef.current && audioUrl) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [audioUrl, autoPlay]);

  const togglePlay = () => {
    if (!audioBase64 || !audioUrl) {
      onRequestGenerate?.();
      return;
    }

    const el = audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.volume = isMuted ? 0 : volume;
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleBarSeek = (barIndex: number) => {
    if (!audioBase64 || !audioRef.current) return;
    const effectiveDur = duration > 0 ? duration : durationHintSeconds || 1;
    const targetTime = (barIndex / Math.max(1, peaks.length - 1)) * effectiveDur;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    setIsMuted(nextVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = nextVol;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  const handleDownload = (ext: 'wav' | 'mp3') => {
    if (!audioBase64) {
      onRequestGenerate?.();
      return;
    }
    const bytes = base64ToUint8Array(audioBase64);
    const wavBlob = pcmToWavBlob(bytes);
    const downloadBlob =
      ext === 'mp3' ? new Blob([wavBlob], { type: 'audio/mpeg' }) : wavBlob;

    const url = URL.createObjectURL(downloadBlob);
    const anchor = document.createElement('a');
    const cleanPrefix = fileNamePrefix
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-|-$/g, '');
    anchor.href = url;
    anchor.download = `${cleanPrefix || 'voicestudio'}.${ext}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const effectiveDuration = duration > 0 ? duration : durationHintSeconds || 12;
  const progressRatio = audioBase64
    ? Math.min(1, Math.max(0, currentTime / effectiveDuration))
    : 0.25;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100/90 bg-white/95 px-5 py-4 shadow-[0_14px_40px_-14px_rgba(79,70,229,0.14)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      {/* Aksen Gelombang Ungu Halus di Sisi Kiri */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -bottom-10 -left-8 w-44 rounded-r-full bg-gradient-to-r from-indigo-500/20 via-purple-400/15 to-transparent dark:from-indigo-500/15 dark:via-purple-500/10"
      />

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) {
              setDuration(d);
            }
          }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Kiri: Tombol Play Lingkaran Besar + Judul & Waveform */}
        <div className="flex flex-1 items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={togglePlay}
            disabled={isGenerating}
            aria-label={isPlaying ? 'Jeda suara' : 'Putar hasil suara'}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#432DD7] to-[#5B45FF] text-white shadow-lg shadow-indigo-500/35 transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {isGenerating ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6 fill-current" aria-hidden="true" />
            ) : (
              <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true" />
            )}
          </button>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {title}
                </h4>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              </div>
            </div>

            {/* Bar Equalizer Waveform */}
            <div
              className="flex h-8 items-center gap-1 pt-1"
              role="slider"
              aria-label="Posisi pemutaran audio"
              aria-valuemin={0}
              aria-valuemax={Math.round(effectiveDuration)}
              aria-valuenow={Math.round(currentTime)}
              tabIndex={0}
            >
              {peaks.map((peak, idx) => {
                const barRatio = idx / Math.max(1, peaks.length);
                const isActive = barRatio <= progressRatio;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleBarSeek(idx)}
                    aria-label={`Lompat ke bagian ${Math.round(barRatio * 100)}%`}
                    style={{ height: `${Math.max(22, Math.round(peak * 100))}%` }}
                    className={`flex-1 rounded-full transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-t from-[#432DD7] to-[#7C66FF]'
                        : 'bg-slate-200 hover:bg-indigo-200 dark:bg-slate-700 dark:hover:bg-slate-600'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Kanan: Waktu, Volume Slider, dan Tombol Download */}
        <div className="flex flex-wrap items-center justify-between gap-4 pl-0 sm:justify-end lg:pl-4">
          <span className="font-mono text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
            {formatDuration(currentTime)} / {formatDuration(effectiveDuration)}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Aktifkan suara' : 'Bisukan suara'}
              className="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <input
              type="range"
              aria-label="Volume suara"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-indigo-100 accent-[#4F39F6] dark:bg-slate-700"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <select
              aria-label="Format unduhan"
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value as 'wav' | 'mp3')}
              className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-2.5 py-2 text-xs font-semibold text-indigo-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="wav">WAV</option>
              <option value="mp3">MP3</option>
            </select>

            <button
              type="button"
              onClick={() => handleDownload(downloadFormat)}
              className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-2xs transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5 text-[#4F39F6] dark:text-indigo-400" aria-hidden="true" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
