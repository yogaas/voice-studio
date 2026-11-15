import { MAX_CHUNK_CHARS } from '../constants/voice.constants';

/**
 * Memecah teks panjang menjadi beberapa bagian kalimat/paragraf yang rapi
 * agar sintesis TTS berjalan bertahap dan stabil.
 */
export function splitTextIntoChunks(rawText: string, maxChunkLength = MAX_CHUNK_CHARS): string[] {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  if (normalized.length <= maxChunkLength) {
    return [normalized];
  }

  const paragraphs = normalized
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentBuffer = '';

  const flushBuffer = () => {
    if (currentBuffer.trim()) {
      chunks.push(currentBuffer.trim());
      currentBuffer = '';
    }
  };

  for (const paragraph of paragraphs) {
    // Pecah per kalimat berdasarkan tanda titik, tanya, atau seru
    const sentences = paragraph
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const sentence of sentences) {
      if (sentence.length > maxChunkLength) {
        flushBuffer();
        const words = sentence.split(/\s+/);
        let wordChunk = '';
        for (const word of words) {
          const candidate = wordChunk ? `${wordChunk} ${word}` : word;
          if (candidate.length <= maxChunkLength) {
            wordChunk = candidate;
          } else {
            if (wordChunk) {
              chunks.push(wordChunk);
            }
            wordChunk = word;
          }
        }
        if (wordChunk) {
          currentBuffer = wordChunk;
        }
      } else {
        const candidate = currentBuffer ? `${currentBuffer} ${sentence}` : sentence;
        if (candidate.length <= maxChunkLength) {
          currentBuffer = candidate;
        } else {
          flushBuffer();
          currentBuffer = sentence;
        }
      }
    }
    flushBuffer();
  }

  flushBuffer();
  return chunks;
}
