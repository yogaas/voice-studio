import React from 'react';
import type { SupportedLanguage, VoiceOption } from '../../types/voice.types';

export interface VoiceAvatarProps {
  avatarKey?: VoiceOption['avatarKey'];
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceAvatar: React.FC<VoiceAvatarProps> = ({
  avatarKey = 'nadia',
  name,
  size = 'md',
}) => {
  const sizeClass =
    size === 'sm'
      ? 'h-10 w-10'
      : size === 'lg'
        ? 'h-14 w-14'
        : 'h-12 w-12';

  const isFemale =
    avatarKey === 'nadia' || avatarKey === 'santi' || avatarKey === 'putri';

  const palette = {
    nadia: { bg: '#EEF0FF', shirt: '#F59E0B', hair: '#1E1B2E', skin: '#F6C6A5' },
    rizky: { bg: '#E8EEFF', shirt: '#2563EB', hair: '#1E293B', skin: '#EAB694' },
    santi: { bg: '#F3E8FF', shirt: '#C084FC', hair: '#272038', skin: '#F8CBAE' },
    dimas: { bg: '#E0E7FF', shirt: '#1D4ED8', hair: '#0F172A', skin: '#EBAA86' },
    putri: { bg: '#FCE7F3', shirt: '#F472B6', hair: '#1F192B', skin: '#F7C8AA' },
    budi: { bg: '#E2E8F0', shirt: '#334155', hair: '#1E293B', skin: '#E5AA87' },
    custom: { bg: '#EDE9FE', shirt: '#4F46E5', hair: '#1E1B4B', skin: '#F3C1A0' },
  }[avatarKey ?? 'custom'];

  return (
    <div
      className={`${sizeClass} relative shrink-0 overflow-hidden rounded-full shadow-xs ring-2 ring-white dark:ring-slate-800`}
      title={name}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="32" fill={palette.bg} />
        <circle cx="32" cy="32" r="28" fill="url(#avatarGlow)" fillOpacity="0.4" />

        {/* Rambut Belakang untuk Karakter Wanita */}
        {isFemale && (
          <path
            d="M17 31C17 20 23.5 14 32 14C40.5 14 47 20 47 31C47 38 45 45 43 48H21C19 45 17 38 17 31Z"
            fill={palette.hair}
          />
        )}

        {/* Bahu / Baju */}
        <path
          d="M12 64C12 51.5 20.5 45 32 45C43.5 45 52 51.5 52 64H12Z"
          fill={palette.shirt}
        />
        {/* Kerah Baju */}
        <path
          d="M25 45L32 52L39 45H25Z"
          fill="#FFFFFF"
          fillOpacity="0.85"
        />

        {/* Leher */}
        <rect x="28" y="38" width="8" height="10" rx="4" fill={palette.skin} />

        {/* Wajah */}
        <rect x="20" y="18" width="24" height="24" rx="12" fill={palette.skin} />

        {/* Telinga */}
        <circle cx="20" cy="30" r="3" fill={palette.skin} />
        <circle cx="44" cy="30" r="3" fill={palette.skin} />

        {/* Mata & Alis */}
        <circle cx="27.5" cy="29.5" r="1.6" fill="#1E293B" />
        <circle cx="36.5" cy="29.5" r="1.6" fill="#1E293B" />
        <path
          d="M25 26.5C26.5 25.5 28.5 25.5 30 26.5"
          stroke="#1E293B"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M34 26.5C35.5 25.5 37.5 25.5 39 26.5"
          stroke="#1E293B"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* Senyum Ramah */}
        <path
          d="M28.5 35C30 36.8 34 36.8 35.5 35"
          stroke="#B45309"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Rambut Depan */}
        {isFemale ? (
          <path
            d="M19 27C19 19 25 14 32 14C39 14 45 19 45 27C42 23 37 21 32 22C26 22.5 22 24.5 19 27Z"
            fill={palette.hair}
          />
        ) : (
          <path
            d="M19.5 26.5C19.5 18.5 24.5 14.5 32 14.5C39.5 14.5 44.5 18.5 44.5 26.5C42 22 37.5 20.5 32 20.5C26.5 20.5 22 22 19.5 26.5Z"
            fill={palette.hair}
          />
        )}

        <defs>
          <radialGradient id="avatarGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 24) rotate(90) scale(30)">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#818CF8" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

export const FlagIcon: React.FC<{ language: SupportedLanguage }> = ({ language }) => {
  if (language === 'id-ID') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0 rounded-full shadow-xs border border-slate-200"
        aria-hidden="true"
      >
        <clipPath id="idFlagClip">
          <circle cx="12" cy="12" r="12" />
        </clipPath>
        <g clipPath="url(#idFlagClip)">
          <rect width="24" height="12" fill="#EF4444" />
          <rect y="12" width="24" height="12" fill="#FFFFFF" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 rounded-full shadow-xs border border-slate-200"
      aria-hidden="true"
    >
      <clipPath id="enFlagClip">
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath="url(#enFlagClip)">
        <rect width="24" height="24" fill="#1E3A8A" />
        <path d="M0 4H24M0 10H24M0 16H24M0 22H24" stroke="#EF4444" strokeWidth="2.5" />
        <path d="M0 7H24M0 13H24M0 19H24" stroke="#FFFFFF" strokeWidth="2" />
        <rect width="12" height="12" fill="#1D4ED8" />
      </g>
    </svg>
  );
};

export const HeroMicrophoneIllustration: React.FC = () => {
  return (
    <div className="relative mx-auto flex h-52 w-full max-w-[340px] items-center justify-center select-none">
      {/* Glow Latar Belakang */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-300/40 via-purple-200/40 to-amber-200/30 blur-2xl dark:from-indigo-600/25 dark:via-purple-700/20 dark:to-indigo-900/10" />

      <svg
        viewBox="0 0 340 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 h-full w-full drop-shadow-sm"
        aria-hidden="true"
      >
        {/* Bentuk Blob Lavender Lembut */}
        <path
          d="M65 168C32 146 28 96 58 66C88 36 146 22 198 36C250 50 308 82 298 134C288 186 222 196 160 194C98 192 98 190 65 168Z"
          fill="url(#heroBlobGrad)"
          fillOpacity="0.65"
        />

        {/* Bar Gelombang Suara Kiri */}
        <rect x="42" y="96" width="6" height="36" rx="3" fill="#6366F1" />
        <rect x="54" y="76" width="6" height="76" rx="3" fill="#4F46E5" />
        <rect x="66" y="88" width="6" height="52" rx="3" fill="#818CF8" />
        <rect x="78" y="68" width="6" height="90" rx="3" fill="#4F46E5" />
        <rect x="90" y="92" width="6" height="42" rx="3" fill="#A5B4FC" />
        <rect x="102" y="102" width="6" height="24" rx="3" fill="#818CF8" />

        {/* Kartu Naskah 3D di Kanan */}
        <g transform="translate(198, 72) rotate(11)">
          <rect
            x="4"
            y="8"
            width="84"
            height="102"
            rx="14"
            fill="#6366F1"
            fillOpacity="0.18"
          />
          <rect
            x="0"
            y="0"
            width="84"
            height="102"
            rx="14"
            fill="url(#cardSurface)"
            stroke="#E0E7FF"
            strokeWidth="2"
          />
          <rect x="16" y="22" width="44" height="7" rx="3.5" fill="#A5B4FC" />
          <rect x="16" y="38" width="52" height="7" rx="3.5" fill="#C7D2FE" />
          <rect x="16" y="54" width="48" height="7" rx="3.5" fill="#C7D2FE" />
          <rect x="16" y="70" width="34" height="7" rx="3.5" fill="#A5B4FC" />
        </g>

        {/* Aksen Nada & Sparkle */}
        <path
          d="M196 66C198 58 205 56 208 62C210 66 204 74 198 76"
          stroke="#818CF8"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M232 48L238 40M242 62L252 58M236 74L245 77"
          stroke="#F59E0B"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Bayangan Dasar Mikrofon */}
        <ellipse cx="152" cy="192" rx="54" ry="11" fill="#4338CA" fillOpacity="0.18" />

        {/* Dudukan Mikrofon (Base & Stand) */}
        <path
          d="M114 186C114 179 130 174 152 174C174 174 190 179 190 186H114Z"
          fill="url(#micStandGrad)"
        />
        <rect x="146" y="148" width="12" height="30" rx="4" fill="url(#micStandGrad)" />

        {/* Lengan Penyangga U-Bracket */}
        <path
          d="M118 106V116C118 134.778 133.222 150 152 150C170.778 150 186 134.778 186 116V106"
          stroke="url(#micStandGrad)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <circle cx="118" cy="106" r="6" fill="#4338CA" />
        <circle cx="186" cy="106" r="6" fill="#4338CA" />

        {/* Kapsul Mikrofon 3D */}
        <rect
          x="126"
          y="42"
          width="52"
          height="92"
          rx="26"
          fill="url(#micBodyGrad)"
        />
        {/* Sabuk Tengah Mikrofon */}
        <rect x="125" y="84" width="54" height="9" rx="4" fill="#312E81" />

        {/* Tekstur Grille Kepala Mikrofon */}
        <path
          d="M134 58H170M131 68H173M134 76H170"
          stroke="#A5B4FC"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient id="heroBlobGrad" x1="35" y1="30" x2="295" y2="195" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E0E7FF" />
            <stop offset="0.5" stopColor="#DDD6FE" />
            <stop offset="1" stopColor="#F3E8FF" />
          </linearGradient>
          <linearGradient id="micBodyGrad" x1="126" y1="42" x2="178" y2="134" gradientUnits="userSpaceOnUse">
            <stop stopColor="#818CF8" />
            <stop offset="0.45" stopColor="#4F46E5" />
            <stop offset="1" stopColor="#1E1B4B" />
          </linearGradient>
          <linearGradient id="micStandGrad" x1="118" y1="106" x2="188" y2="188" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#1E1B4B" />
          </linearGradient>
          <linearGradient id="cardSurface" x1="0" y1="0" x2="84" y2="102" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#EEF2FF" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
