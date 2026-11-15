import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const TTS_MODEL = 'gemini-3.8-flash-lite-tts';

const ALLOWED_VOICES = new Set([
  'Kore',
  'Puck',
  'Charon',
  'Fenrir',
  'Zephyr',
  'Aoede',
  'Leda',
  'Orus',
]);

interface TtsRequestBody {
  text?: string;
  voiceName?: string;
  language?: 'id-ID' | 'en-US';
  styleInstruction?: string;
}

/**
 * Membersihkan container RIFF WAVE dari subchunk non-audio di bagian akhir
 * (seperti metadata C2PA / JUMBF / LIST) agar tidak terbaca sebagai noise PCM,
 * serta memberikan fade-out halus 15ms di ujung sampel audio.
 */
function sanitizeWavBuffer(inputBuffer: Buffer): Buffer {
  if (
    inputBuffer.length < 44 ||
    inputBuffer.toString('ascii', 0, 4) !== 'RIFF' ||
    inputBuffer.toString('ascii', 8, 12) !== 'WAVE'
  ) {
    return inputBuffer;
  }

  let offset = 12;
  let sampleRate = 24000;
  let numChannels = 1;
  let bitsPerSample = 16;
  let pcmSlice: Buffer | null = null;

  while (offset + 8 <= inputBuffer.length) {
    const chunkId = inputBuffer.toString('ascii', offset, offset + 4);
    const chunkSize = inputBuffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;

    if (chunkId === 'fmt ' && dataStart + 16 <= inputBuffer.length) {
      numChannels = inputBuffer.readUInt16LE(dataStart + 2);
      sampleRate = inputBuffer.readUInt32LE(dataStart + 4);
      bitsPerSample = inputBuffer.readUInt16LE(dataStart + 14);
    } else if (chunkId === 'data') {
      const safeEnd = Math.min(inputBuffer.length, dataStart + chunkSize);
      const evenLength = (safeEnd - dataStart) & ~1;
      pcmSlice = Buffer.from(inputBuffer.subarray(dataStart, dataStart + evenLength));
      break;
    }

    // Subchunk RIFF selalu rata genap (word-aligned)
    const paddedSize = chunkSize + (chunkSize % 2);
    offset = dataStart + paddedSize;
  }

  if (!pcmSlice) {
    return inputBuffer;
  }

  // Terapkan micro fade-out (15ms terakhir) pada PCM 16-bit untuk mencegah bunyi klik/pop di akhir
  if (bitsPerSample === 16 && pcmSlice.length >= 4) {
    const totalSamples = pcmSlice.length / 2;
    const fadeSamples = Math.min(totalSamples, Math.floor(sampleRate * 0.015));
    const startSample = totalSamples - fadeSamples;
    for (let i = 0; i < fadeSamples; i++) {
      const sampleIndex = (startSample + i) * 2;
      const sampleValue = pcmSlice.readInt16LE(sampleIndex);
      const gain = 1 - (i + 1) / fadeSamples;
      pcmSlice.writeInt16LE(Math.round(sampleValue * gain), sampleIndex);
    }
  }

  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmSlice.length;

  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmSlice]);
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY_MISSING: Kunci API Gemini belum dikonfigurasi di server.');
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      apiVersion: 'v1beta',
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildStylePrompt(
  language: 'id-ID' | 'en-US',
  styleInstruction?: string
): string {
  const langLabel =
    language === 'en-US'
      ? 'Natural fluent English pronunciation'
      : 'Pelafalan Bahasa Indonesia yang fasih, jelas, dan alami';

  const trimmedStyle = styleInstruction?.trim();
  if (!trimmedStyle) {
    return langLabel;
  }
  return `${langLabel}. Gaya bicara: ${trimmedStyle}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/tts', async (req: Request, res: Response) => {
    try {
      const body = req.body as TtsRequestBody;
      const rawText = typeof body.text === 'string' ? body.text.trim() : '';

      if (!rawText) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Teks tidak boleh kosong.',
        });
        return;
      }

      if (rawText.length > 5000) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Panjang teks melebihi batas maksimal 5.000 karakter.',
        });
        return;
      }

      const requestedVoice =
        body.voiceName && ALLOWED_VOICES.has(body.voiceName)
          ? body.voiceName
          : 'Kore';
      const language = body.language === 'en-US' ? 'en-US' : 'id-ID';
      const stylePrompt = buildStylePrompt(language, body.styleInstruction);

      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: rawText,
                speechMetadata: {
                  style: stylePrompt,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: requestedVoice,
              },
            },
          },
        },
      });

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const rawBase64 = inlineData?.data;

      if (!rawBase64) {
        res.status(502).json({
          code: 'EMPTY_AUDIO_RESPONSE',
          message: 'Server sintesis suara tidak mengembalikan data audio. Silakan coba lagi.',
        });
        return;
      }

      const rawBuffer = Buffer.from(rawBase64, 'base64');
      const cleanWavBuffer = sanitizeWavBuffer(rawBuffer);

      res.json({
        audioBase64: cleanWavBuffer.toString('base64'),
        mimeType: 'audio/wav',
        voiceName: requestedVoice,
      });
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      const lower = rawMessage.toLowerCase();

      if (
        lower.includes('429') ||
        lower.includes('resource_exhausted') ||
        lower.includes('quota')
      ) {
        res.status(429).json({
          code: 'QUOTA_EXCEEDED',
          message:
            'Kuota penggunaan Gemini API telah habis atau mencapai batas permintaan. Silakan tunggu beberapa saat atau tingkatkan kuota API di panel Settings > Secrets.',
        });
        return;
      }

      if (
        lower.includes('401') ||
        lower.includes('403') ||
        lower.includes('api_key_invalid') ||
        lower.includes('permission_denied') ||
        lower.includes('api_key_missing')
      ) {
        res.status(403).json({
          code: 'INVALID_API_KEY',
          message:
            'Kunci API Gemini tidak valid atau belum memiliki izin akses. Silakan periksa konfigurasi di panel Settings > Secrets.',
        });
        return;
      }

      res.status(500).json({
        code: 'TTS_GENERATION_FAILED',
        message:
          'Gagal memproses sintesis suara di server. Silakan periksa koneksi atau coba kembali.',
        detail: rawMessage,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    process.stdout.write(`VoiceStudio server running on http://0.0.0.0:${PORT}\n`);
  });
}

void startServer();
