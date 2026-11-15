import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ALLOWED_AUDIO_EXTENSIONS,
  ALLOWED_AUDIO_MIMES,
  MAX_SAMPLE_FILE_SIZE_BYTES,
  MIN_SAMPLE_DURATION_SECONDS,
} from '../constants/voice.constants';
import { notify } from '../lib/notify';
import {
  createStudioDemoVoiceSample,
  getAudioDurationFromBlob,
} from '../utils/audio';

export interface AudioSampleState {
  blob: Blob | null;
  fileName: string;
  durationSeconds: number;
  sizeBytes: number;
  previewUrl: string;
  validationError: string | null;
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveWaveform, setLiveWaveform] = useState<number[]>(
    Array.from({ length: 36 }, () => 0.12)
  );
  const [sample, setSample] = useState<AudioSampleState>({
    blob: null,
    fileName: '',
    durationSeconds: 0,
    sizeBytes: 0,
    previewUrl: '',
    validationError: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimestampRef = useRef<number>(0);

  const cleanupRecordingResources = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupRecordingResources();
    };
  }, [cleanupRecordingResources]);

  const applyNewSampleBlob = useCallback(
    async (blob: Blob, fileName: string, fallbackDuration?: number) => {
      if (sample.previewUrl) {
        URL.revokeObjectURL(sample.previewUrl);
      }

      if (blob.size > MAX_SAMPLE_FILE_SIZE_BYTES) {
        setSample({
          blob: null,
          fileName,
          durationSeconds: 0,
          sizeBytes: blob.size,
          previewUrl: '',
          validationError: 'Ukuran file sampel melebihi batas maksimal 10 MB.',
        });
        notify.error('Ukuran file terlalu besar (maksimal 10 MB).');
        return;
      }

      let duration = fallbackDuration ?? 0;
      try {
        const decodedDuration = await getAudioDurationFromBlob(blob);
        if (Number.isFinite(decodedDuration) && decodedDuration > 0) {
          duration = decodedDuration;
        }
      } catch {
        if (!duration) {
          setSample({
            blob: null,
            fileName,
            durationSeconds: 0,
            sizeBytes: blob.size,
            previewUrl: '',
            validationError:
              'Format audio tidak dapat dibaca oleh browser. Gunakan file WAV, MP3, atau M4A yang valid.',
          });
          notify.error('Gagal membaca durasi file audio.');
          return;
        }
      }

      const previewUrl = URL.createObjectURL(blob);
      const isTooShort = duration < MIN_SAMPLE_DURATION_SECONDS;
      const validationError = isTooShort
        ? `Durasi sampel saat ini ${duration.toFixed(1)} detik. Dibutuhkan minimal ${MIN_SAMPLE_DURATION_SECONDS} detik suara jernih.`
        : null;

      setSample({
        blob,
        fileName,
        durationSeconds: Number(duration.toFixed(1)),
        sizeBytes: blob.size,
        previewUrl,
        validationError,
      });

      if (isTooShort) {
        notify.warning(
          `Durasi sampel (${duration.toFixed(1)} dtk) kurang dari ${MIN_SAMPLE_DURATION_SECONDS} detik.`
        );
      } else {
        notify.success(`Sampel audio (${duration.toFixed(1)} detik) siap digunakan.`);
      }
    },
    [sample.previewUrl]
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWave = () => {
        analyser.getByteFrequencyData(dataArray);
        const bars: number[] = [];
        for (let i = 0; i < 36; i++) {
          const val = dataArray[i % dataArray.length] / 255;
          bars.push(Math.max(0.1, Math.min(1, val * 1.3)));
        }
        setLiveWaveform(bars);
        animFrameRef.current = requestAnimationFrame(updateWave);
      };
      animFrameRef.current = requestAnimationFrame(updateWave);

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      startTimestampRef.current = Date.now();
      setRecordingSeconds(0);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
        setRecordingSeconds(elapsed);
      }, 250);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const elapsedSeconds = Math.max(
          1,
          Number(((Date.now() - startTimestampRef.current) / 1000).toFixed(1))
        );
        const mimeType = recorder.mimeType || 'audio/webm';
        const recordedBlob = new Blob(chunksRef.current, { type: mimeType });
        cleanupRecordingResources();
        setIsRecording(false);
        void applyNewSampleBlob(
          recordedBlob,
          `rekaman-mikrofon-${Date.now()}.webm`,
          elapsedSeconds
        );
      };

      recorder.start(250);
    } catch {
      cleanupRecordingResources();
      setIsRecording(false);
      notify.error(
        'Akses mikrofon ditolak atau perangkat mikrofon tidak ditemukan. Anda juga dapat mengunggah file WAV/MP3/M4A atau memakai Sampel Demo.'
      );
    }
  }, [applyNewSampleBlob, cleanupRecordingResources]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      const lowerName = file.name.toLowerCase();
      const hasValidExt = ALLOWED_AUDIO_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
      const hasValidMime = ALLOWED_AUDIO_MIMES.some((mime) =>
        file.type.toLowerCase().includes(mime)
      );

      if (!hasValidExt && !hasValidMime) {
        setSample((prev) => ({
          ...prev,
          validationError:
            'Format file tidak didukung. Harap unggah file audio berformat WAV, MP3, atau M4A.',
        }));
        notify.error('Format file harus WAV, MP3, atau M4A.');
        return;
      }

      await applyNewSampleBlob(file, file.name);
    },
    [applyNewSampleBlob]
  );

  const loadStudioDemoSample = useCallback(async () => {
    const demoBlob = createStudioDemoVoiceSample(32);
    await applyNewSampleBlob(demoBlob, 'sampel-suara-studio-32dtk.wav', 32);
  }, [applyNewSampleBlob]);

  const clearSample = useCallback(() => {
    if (sample.previewUrl) {
      URL.revokeObjectURL(sample.previewUrl);
    }
    setSample({
      blob: null,
      fileName: '',
      durationSeconds: 0,
      sizeBytes: 0,
      previewUrl: '',
      validationError: null,
    });
    setRecordingSeconds(0);
  }, [sample.previewUrl]);

  return {
    isRecording,
    recordingSeconds,
    liveWaveform,
    sample,
    startRecording,
    stopRecording,
    handleFileUpload,
    loadStudioDemoSample,
    clearSample,
  };
}
