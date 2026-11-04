import React, { useState } from 'react';

interface CuteRobotAvatarProps {
  className?: string;
  isSpeaking?: boolean;
  isHovered?: boolean;
  showFullBody?: boolean;
}

export const CuteRobotAvatar: React.FC<CuteRobotAvatarProps> = ({
  className = "w-20 h-24",
  isSpeaking = false,
  isHovered = false,
  showFullBody = true,
}) => {
  const [internalHover, setInternalHover] = useState(false);
  const activeHover = isHovered || internalHover;

  // Jika hanya ingin kepala (misal di ikon chat kecil)
  if (!showFullBody) {
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id="headGradMini" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="visorMini" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <filter id="eyeGlowMini" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Antena */}
          <rect x="58" y="10" width="4" height="12" rx="2" fill="#94a3b8" />
          <circle cx="60" cy="8" r="6" fill="#38bdf8" className="animate-pulse" />

          {/* Telinga */}
          <rect x="16" y="44" width="8" height="24" rx="4" fill="#38bdf8" />
          <rect x="96" y="44" width="8" height="24" rx="4" fill="#38bdf8" />

          {/* Kepala */}
          <rect x="22" y="22" width="76" height="70" rx="24" fill="url(#headGradMini)" stroke="#e2e8f0" strokeWidth="2" />
          {/* Visor */}
          <rect x="29" y="34" width="62" height="44" rx="16" fill="url(#visorMini)" stroke="#334155" strokeWidth="1.5" />

          {/* Mata */}
          {isSpeaking ? (
            <>
              <path d="M38 56 C41 49, 49 49, 52 56" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" fill="none" filter="url(#eyeGlowMini)" />
              <path d="M68 56 C71 49, 79 49, 82 56" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" fill="none" filter="url(#eyeGlowMini)" />
            </>
          ) : (
            <>
              <ellipse cx="45" cy="54" rx="5.5" ry="7" fill="#22d3ee" filter="url(#eyeGlowMini)" />
              <circle cx="43" cy="51" r="2.2" fill="#ffffff" />
              <ellipse cx="75" cy="54" rx="5.5" ry="7" fill="#22d3ee" filter="url(#eyeGlowMini)" />
              <circle cx="73" cy="51" r="2.2" fill="#ffffff" />
            </>
          )}
          <circle cx="36" cy="65" r="3" fill="#fb7185" opacity="0.5" />
          <circle cx="84" cy="65" r="3" fill="#fb7185" opacity="0.5" />
          <path d="M57 66 Q60 70 63 66" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    );
  }

  // ROBOT FULL BODY DENGAN TANGAN, KAKI, BADAN, DAN ANIMASI LOMPAT-LOMPAT
  return (
    <div
      onMouseEnter={() => setInternalHover(true)}
      onMouseLeave={() => setInternalHover(false)}
      className={`relative flex flex-col items-center justify-center select-none cursor-pointer ${className}`}
    >
      <style>{`
        @keyframes robotBounceJump {
          0%, 100% {
            transform: translateY(0px) scale(1, 1);
          }
          30% {
            transform: translateY(-16px) scale(0.96, 1.05);
          }
          50% {
            transform: translateY(-20px) scale(0.94, 1.07);
          }
          70% {
            transform: translateY(-8px) scale(1.02, 0.98);
          }
          85% {
            transform: translateY(2px) scale(1.06, 0.94);
          }
        }

        @keyframes waveLeftArm {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-35deg);
          }
        }

        @keyframes waveRightArmGreeting {
          0%, 100% {
            transform: rotate(15deg);
          }
          50% {
            transform: rotate(-45deg);
          }
        }

        @keyframes legKickLeft {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(14deg);
          }
        }

        @keyframes legKickRight {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-14deg);
          }
        }

        @keyframes shadowShrinkGrow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.35;
          }
          50% {
            transform: scale(0.65);
            opacity: 0.15;
          }
        }

        .animate-robot-jump {
          animation: robotBounceJump 2s cubic-bezier(0.28, 0.84, 0.42, 1) infinite;
          transform-origin: bottom center;
        }

        .animate-wave-left {
          animation: waveLeftArm 1.5s ease-in-out infinite;
          transform-origin: 32px 75px;
        }

        .animate-wave-right {
          animation: waveRightArmGreeting 1.2s ease-in-out infinite;
          transform-origin: 88px 75px;
        }

        .animate-leg-left {
          animation: legKickLeft 2s ease-in-out infinite;
          transform-origin: 46px 105px;
        }

        .animate-leg-right {
          animation: legKickRight 2s ease-in-out infinite;
          transform-origin: 74px 105px;
        }

        .animate-robot-shadow {
          animation: shadowShrinkGrow 2s cubic-bezier(0.28, 0.84, 0.42, 1) infinite;
          transform-origin: center center;
        }
      `}</style>

      {/* SVG ROBOT LENGKAP KEPALA, TANGAN, BADAN, KAKI */}
      <div className="relative w-full h-full flex flex-col items-center">
        <svg
          viewBox="0 0 120 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible drop-shadow-xl animate-robot-jump"
        >
          <defs>
            {/* Gradients Utama Tubuh Robot */}
            <linearGradient id="bodyGradWhite" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            <linearGradient id="chestPlateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            <linearGradient id="visorGlassGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="70%" stopColor="#090d16" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            <linearGradient id="neonCyanEyeFull" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            <linearGradient id="earPlateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            <linearGradient id="goldAccFull" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            <linearGradient id="armLegGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="neonFullGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="coreGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ========================================================= */}
          {/* 1. TANGAN KIRI (LENGAN BULAT ROBOT GEMAS) */}
          {/* ========================================================= */}
          <g className="animate-wave-left">
            {/* Sendi Bahu Kiri */}
            <circle cx="33" cy="76" r="5" fill="#64748b" />
            {/* Lengan Kiri */}
            <rect x="17" y="73" width="16" height="8" rx="4" fill="url(#armLegGrad)" stroke="#cbd5e1" strokeWidth="1" />
            {/* Tangan Sarung Tinju Putih Bulat */}
            <circle cx="15" cy="77" r="7" fill="url(#bodyGradWhite)" stroke="#cbd5e1" strokeWidth="1.2" />
            <circle cx="13" cy="75" r="2" fill="#38bdf8" />
          </g>

          {/* ========================================================= */}
          {/* 2. TANGAN KANAN (MELAMBAI-LAMBAI RAMAH GREETING) */}
          {/* ========================================================= */}
          <g className="animate-wave-right">
            {/* Sendi Bahu Kanan */}
            <circle cx="87" cy="76" r="5" fill="#64748b" />
            {/* Lengan Kanan terangkat ke atas melambai */}
            <rect x="87" y="73" width="16" height="8" rx="4" fill="url(#armLegGrad)" stroke="#cbd5e1" strokeWidth="1" />
            {/* Tangan Sarung Bulat Kanan */}
            <circle cx="105" cy="77" r="7" fill="url(#bodyGradWhite)" stroke="#cbd5e1" strokeWidth="1.2" />
            <circle cx="107" cy="75" r="2" fill="#38bdf8" />
          </g>

          {/* ========================================================= */}
          {/* 3. KAKI KIRI & KANAN (SEPATU BOOT ROBOT CHIBI) */}
          {/* ========================================================= */}
          {/* Kaki Kiri */}
          <g className="animate-leg-left">
            <rect x="42" y="103" width="8" height="18" rx="4" fill="url(#armLegGrad)" stroke="#cbd5e1" strokeWidth="1" />
            {/* Sepatu Boot Kiri */}
            <rect x="37" y="118" width="18" height="11" rx="5.5" fill="url(#bodyGradWhite)" stroke="#94a3b8" strokeWidth="1.2" />
            <rect x="39" y="123" width="14" height="4" rx="2" fill="url(#earPlateGrad)" />
          </g>

          {/* Kaki Kanan */}
          <g className="animate-leg-right">
            <rect x="70" y="103" width="8" height="18" rx="4" fill="url(#armLegGrad)" stroke="#cbd5e1" strokeWidth="1" />
            {/* Sepatu Boot Kanan */}
            <rect x="65" y="118" width="18" height="11" rx="5.5" fill="url(#bodyGradWhite)" stroke="#94a3b8" strokeWidth="1.2" />
            <rect x="67" y="123" width="14" height="4" rx="2" fill="url(#earPlateGrad)" />
          </g>

          {/* ========================================================= */}
          {/* 4. BADAN ROBOT (CHEST BODY & CORE POWER APBN) */}
          {/* ========================================================= */}
          {/* Badan Utama */}
          <rect
            x="34"
            y="68"
            width="52"
            height="38"
            rx="16"
            fill="url(#bodyGradWhite)"
            stroke="#cbd5e1"
            strokeWidth="2"
          />

          {/* Plat Dada Biru KPPN */}
          <rect
            x="41"
            y="73"
            width="38"
            height="26"
            rx="10"
            fill="url(#chestPlateGrad)"
            stroke="#1d4ed8"
            strokeWidth="1.5"
          />

          {/* Core Power Heart (Simbol Cakra / Bintang APBN Berpendar) */}
          <circle cx="60" cy="85" r="7" fill="#0284c7" />
          <polygon
            points="60,79 62,83 66,85 62,87 60,91 58,87 54,85 58,83"
            fill="url(#goldAccFull)"
            filter="url(#coreGlow)"
            className="animate-spin"
            style={{ transformOrigin: '60px 85px', animationDuration: '6s' }}
          />

          {/* Sabuk Bawah */}
          <rect x="44" y="99" width="32" height="4" rx="2" fill="#64748b" />
          <circle cx="60" cy="101" r="2.5" fill="url(#goldAccFull)" />

          {/* ========================================================= */}
          {/* 5. KEPALA ROBOT UTAMA (CHIBI DOME) */}
          {/* ========================================================= */}
          {/* Antena Atas */}
          <rect x="58" y="7" width="4" height="14" rx="2" fill="#94a3b8" />
          <circle cx="60" cy="15" r="2.5" fill="#cbd5e1" />
          {/* Bola Antena Lampu Kedip */}
          <circle cx="60" cy="6" r="6.5" fill="#38bdf8" filter="url(#coreGlow)" className="animate-pulse" />
          <circle cx="60" cy="6" r="3.5" fill="#ffffff" />

          {/* Telinga Kiri & Kanan */}
          <rect x="20" y="32" width="7" height="20" rx="3.5" fill="url(#earPlateGrad)" />
          <circle cx="23.5" cy="42" r="2" fill="#ffffff" />
          <rect x="93" y="32" width="7" height="20" rx="3.5" fill="url(#earPlateGrad)" />
          <circle cx="96.5" cy="42" r="2" fill="#ffffff" />

          {/* Batok Kepala Putih Mengkilap */}
          <rect
            x="24"
            y="17"
            width="72"
            height="50"
            rx="20"
            fill="url(#bodyGradWhite)"
            stroke="#cbd5e1"
            strokeWidth="2"
          />

          {/* Kilau Atas Kepala */}
          <path d="M36 21 C45 19, 75 19, 84 21 C78 24, 42 24, 36 21 Z" fill="#ffffff" opacity="0.8" />

          {/* Visor Kaca Wajah Hitam */}
          <rect
            x="30"
            y="25"
            width="60"
            height="34"
            rx="14"
            fill="url(#visorGlassGradFull)"
            stroke="#334155"
            strokeWidth="1.2"
          />
          {/* Kilau Diagonal Visor */}
          <path d="M34 31 C38 28, 52 27, 72 29 L68 33 C52 31, 38 32, 34 31 Z" fill="#ffffff" opacity="0.2" />

          {/* MATA CYAN ROBOT EKSPRESIF */}
          {isSpeaking ? (
            // Mata Senang Tertawa ^^ saat bicara / nyanyi
            <>
              <path d="M40 40 C43 34, 49 34, 52 40" stroke="#22d3ee" strokeWidth="3.2" strokeLinecap="round" fill="none" filter="url(#neonFullGlow)" />
              <path d="M68 40 C71 34, 77 34, 80 40" stroke="#22d3ee" strokeWidth="3.2" strokeLinecap="round" fill="none" filter="url(#neonFullGlow)" />
            </>
          ) : activeHover ? (
            // Mata Bintang / Kedip Wink saat Hover
            <>
              <ellipse cx="46" cy="41" rx="5" ry="6.5" fill="url(#neonCyanEyeFull)" filter="url(#neonFullGlow)" />
              <circle cx="44" cy="38" r="2" fill="#ffffff" />
              <path d="M68 41 C71 36, 77 36, 80 41" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#neonFullGlow)" />
            </>
          ) : (
            // Mata Normal Imut Berbinar
            <>
              <ellipse cx="46" cy="41" rx="5" ry="6.5" fill="url(#neonCyanEyeFull)" filter="url(#neonFullGlow)" />
              <circle cx="44.5" cy="38.5" r="2" fill="#ffffff" />
              <circle cx="47.5" cy="43.5" r="1" fill="#ffffff" />

              <ellipse cx="74" cy="41" rx="5" ry="6.5" fill="url(#neonCyanEyeFull)" filter="url(#neonFullGlow)" />
              <circle cx="72.5" cy="38.5" r="2" fill="#ffffff" />
              <circle cx="75.5" cy="43.5" r="1" fill="#ffffff" />
            </>
          )}

          {/* Pipi Merona Pink Gemas */}
          <circle cx="36" cy="48" r="2.8" fill="#fb7185" opacity="0.55" />
          <circle cx="84" cy="48" r="2.8" fill="#fb7185" opacity="0.55" />

          {/* Mulut Robot */}
          {isSpeaking ? (
            <ellipse cx="60" cy="50" rx="4" ry="3" fill="#38bdf8" filter="url(#neonFullGlow)" className="animate-ping" style={{ animationDuration: '0.8s' }} />
          ) : (
            <path d="M57 49 Q60 52 63 49" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" filter="url(#neonFullGlow)" />
          )}

          {/* Dasi / Badge KPPN Semarang I */}
          <polygon points="56,66 64,66 60,72" fill="url(#goldAccFull)" stroke="#b45309" strokeWidth="0.6" />
        </svg>

        {/* BAYANGAN KAKI ROBOT DI LANTAI (MENYUSUT & MEMBESAR SAAT LOMPAT) */}
        <div className="w-16 h-3 rounded-full bg-slate-900/30 dark:bg-black/50 blur-xs animate-robot-shadow -mt-1" />
      </div>
    </div>
  );
};
