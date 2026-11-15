import React, { useEffect, useState } from 'react';
import { Check, KeyRound, Save, Trash2, X } from 'lucide-react';
import { getAllVoiceProviders } from '../services/elevenLabsProvider';
import type { ProviderConfig, VoiceProviderId } from '../types/voice.types';
import { Button } from './ui/Button';
import { Alert, Modal } from './ui/Feedback';
import { FormField, Input, SelectField } from './ui/FormControls';

export interface ProviderSettingsModalProps {
  open: boolean;
  config: ProviderConfig;
  onClose: () => void;
  onSave: (nextConfig: ProviderConfig) => void;
}

const ELEVENLABS_MODELS = [
  {
    value: 'eleven_multilingual_v2',
    label: 'Eleven Multilingual v2 (Direkomendasikan — Bahasa Indonesia & Inggris)',
  },
  {
    value: 'eleven_turbo_v2_5',
    label: 'Eleven Turbo v2.5 (Latensi Rendah)',
  },
] as const;

export const ProviderSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  open,
  config,
  onClose,
  onSave,
}) => {
  const [activeProvider, setActiveProvider] = useState<VoiceProviderId>(
    config.activeProvider
  );
  const [apiKey, setApiKey] = useState<string>(config.elevenLabsApiKey);
  const [modelId, setModelId] = useState<string>(config.elevenLabsModelId);

  const providers = getAllVoiceProviders();

  useEffect(() => {
    if (open) {
      setActiveProvider(config.activeProvider);
      setApiKey(config.elevenLabsApiKey);
      setModelId(config.elevenLabsModelId || 'eleven_multilingual_v2');
    }
  }, [open, config]);

  const handleSave = () => {
    onSave({
      activeProvider,
      elevenLabsApiKey: apiKey.trim(),
      elevenLabsModelId: modelId,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Pengaturan Penyedia Kloning Suara (VoiceProvider)"
      description="Konfigurasi abstraksi VoiceProvider untuk fitur Voice Cloning. Kunci API hanya disimpan di sessionStorage sesi browser ini."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" icon={X} onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" icon={Save} onClick={handleSave}>
            Simpan Pengaturan
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <FormField
          label="Pilih Implementasi VoiceProvider"
          htmlFor="provider-select"
          hint="Antarmuka VoiceProvider memudahkan pergantian layanan kloning suara"
        >
          <div className="space-y-2.5">
            {providers.map((prov) => {
              const isSelected = activeProvider === prov.id;
              return (
                <div
                  key={prov.id}
                  className={`rounded-xl border p-3.5 transition-colors ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {prov.displayName}
                      </p>
                      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {prov.description}
                      </p>
                    </div>
                    <Button
                      variant={isSelected ? 'primary' : 'outline'}
                      size="sm"
                      icon={Check}
                      onClick={() => setActiveProvider(prov.id)}
                    >
                      {isSelected ? 'Aktif' : 'Pilih'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </FormField>

        {activeProvider === 'elevenlabs' && (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <FormField
              label="ElevenLabs API Key (xi-api-key)"
              htmlFor="elevenlabs-api-key"
              hint="Disimpan hanya di sessionStorage browser selama tab ini dibuka, tidak pernah di-hardcode."
              rightSlot={
                apiKey ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setApiKey('')}
                  >
                    Bersihkan Key
                  </Button>
                ) : undefined
              }
            >
              <Input
                id="elevenlabs-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Masukkan xi-api-key ElevenLabs Anda..."
                autoComplete="off"
              />
            </FormField>

            <FormField
              label="Model Sintesis ElevenLabs"
              htmlFor="elevenlabs-model-id"
            >
              <SelectField
                id="elevenlabs-model-id"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                options={ELEVENLABS_MODELS}
              />
            </FormField>
          </div>
        )}

        <Alert
          variant="info"
          title="Catatan Keamanan"
          message="Fitur Text-to-Speech bawaan menggunakan Gemini TTS di sisi server secara otomatis. Pengaturan di atas khusus untuk penyedia Voice Cloning (Suara Kustom)."
        />
      </div>
    </Modal>
  );
};
export { KeyRound };
