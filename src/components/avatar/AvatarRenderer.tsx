import React, { useState } from 'react';
import { AvatarConfig } from '../../types';
import { CutoutStickerImage } from './CutoutStickerImage';
import { getStickerImageById } from '../../data/stickersData';

interface AvatarRendererProps {
  avatar: AvatarConfig;
  size?: number;
  direction?: 'left' | 'right' | 'center';
  highFivePose?: boolean;
  className?: string;
  showBackdrop?: boolean;
  animate?: boolean;
  interactive?: boolean;
  forceMotion?: AvatarConfig['motionStyle'];
  onClick?: (e: React.MouseEvent) => void;
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  avatar,
  size = 96,
  direction,
  highFivePose = false,
  className = '',
  showBackdrop = false,
  animate = true,
  interactive = true,
  forceMotion,
  onClick,
}) => {
  const [isTapped, setIsTapped] = useState(false);
  const dir = direction || avatar.direction || 'center';
  const s = size;

  const motion = forceMotion || avatar.motionStyle || 'waving';

  // Face shift based on direction
  const faceShiftX = dir === 'right' ? 4 : dir === 'left' ? -4 : 0;
  const isFacingRight = dir === 'right';
  const isFacingLeft = dir === 'left';

  // Determine motion class
  let motionClass = '';
  if (animate) {
    if (motion === 'bouncing') {
      motionClass = 'animate-avatar-bounce';
    } else if (motion === 'cool-sway') {
      motionClass = 'animate-avatar-sway';
    } else if (motion === 'smiling') {
      motionClass = 'animate-avatar-smile';
    }
  }

  const handleInteraction = (e: React.MouseEvent) => {
    if (!interactive) return;
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch {
      // ignore
    }
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 900);
    onClick?.(e);
  };

  // Check if avatar uses a 3D Sticker
  if (avatar.stickerId) {
    const stickerMotion = avatar.stickerMotion || 'sway';
    const stickerAnimClass =
      stickerMotion === 'sway'
        ? 'animate-sticker-sway'
        : stickerMotion === 'bounce'
        ? 'animate-sticker-bounce'
        : 'animate-sticker-pulse';

    const imgSrc = getStickerImageById(avatar.stickerId);
    const flipStyle = dir === 'left' ? 'scaleX(-1)' : dir === 'right' ? 'scaleX(1)' : 'none';

    return (
      <div
        style={{ width: s, height: s }}
        onClick={interactive ? handleInteraction : onClick}
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${
          interactive ? 'cursor-pointer active:scale-95 transition-transform' : ''
        } ${className}`}
        aria-label={`3D Sticker for ${avatar.id}`}
      >
        {isTapped && (
          <div className="absolute -top-3 inset-x-0 flex justify-center pointer-events-none z-30 animate-avatar-pop">
            <span className="text-sm">✨</span>
          </div>
        )}

        {/* Backgroundless floating 3D cutout character with sway/bounce animation */}
        <div
          className={`w-full h-full flex items-center justify-center bg-transparent relative ${
            animate ? stickerAnimClass : ''
          }`}
          style={{ transform: flipStyle }}
        >
          <CutoutStickerImage
            src={imgSrc}
            alt="3D Cutout Avatar"
            className="w-full h-full object-contain drop-shadow-[0_6px_12px_rgba(11,93,59,0.18)] dark:drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ width: s, height: s }}
      onClick={interactive ? handleInteraction : onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        interactive ? 'cursor-pointer active:scale-95 transition-transform' : ''
      } ${className}`}
      aria-label={`Avatar for ${avatar.id}`}
    >
      {/* Interactive celebratory tap reaction sparkle */}
      {isTapped && (
        <div className="absolute -top-3 inset-x-0 flex justify-center pointer-events-none z-30 animate-avatar-pop">
          <span className="text-sm">✨</span>
        </div>
      )}

      <svg
        width={s}
        height={s}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full overflow-visible ${motionClass}`}
      >
        <defs>
          <filter id={`shadow_${avatar.id}`} x="-20%" y="-20%" width="140%" height="145%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.1" result="outline" />
            <feFlood floodColor="#FFFFFF" floodOpacity="0.96" result="outlineColor" />
            <feComposite in="outlineColor" in2="outline" operator="in" result="whiteStroke" />
            <feDropShadow
              in="whiteStroke"
              dx="0"
              dy="3.5"
              stdDeviation="3.2"
              floodColor="#0B3B24"
              floodOpacity="0.18"
              result="dropShadow"
            />
            <feMerge>
              <feMergeNode in="dropShadow" />
              <feMergeNode in="whiteStroke" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={`torso_clip_${avatar.id}`}>
            <path d="M24 111C24 92 38 82 60 82C82 82 96 92 96 111Q60 117 24 111Z" />
          </clipPath>
          <linearGradient id={`bg_${avatar.id}`} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F5F9F6" />
            <stop offset="1" stopColor="#E2EFE7" />
          </linearGradient>
          <radialGradient id={`glow_${avatar.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Optional backdrop (disabled by default so avatars float without background) */}
        {showBackdrop && (
          <circle
            cx="60"
            cy="60"
            r="56"
            fill={`url(#bg_${avatar.id})`}
            stroke="#0B5D3B"
            strokeWidth="2.5"
            strokeOpacity="0.3"
            className="dark:fill-[#15221B] dark:stroke-[#10B981]/50"
          />
        )}

        {/* Subtle celebration sparkle aura only on tap */}
        {isTapped && (
          <circle cx="60" cy="56" r="46" fill={`url(#glow_${avatar.id})`} className="animate-pulse" />
        )}

        <g filter={`url(#shadow_${avatar.id})`}>
          {/* SHOULDERS & CLOTHING (Curved die-cut waist hem) */}
          <g clipPath={`url(#torso_clip_${avatar.id})`}>
            <path
              d="M24 118C24 93 38 82 60 82C82 82 96 93 96 118H24Z"
              fill={avatar.clothingColor || '#0B5D3B'}
            />

            {/* Clothing Collar & Style details */}
            {avatar.clothingStyle === 'thobe' && (
              <>
                <path d="M52 82V96H68V82" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <line x1="60" y1="96" x2="60" y2="116" stroke="#CBD5E0" strokeWidth="1.5" />
                <circle cx="60" cy="88" r="1.5" fill="#D4AF37" />
                <circle cx="60" cy="104" r="1.5" fill="#D4AF37" />
              </>
            )}

            {avatar.clothingStyle === 'blazer' && (
              <>
                <polygon points="52,82 68,82 60,98" fill="#FFFFFF" />
                <polygon points="46,82 56,104 38,116" fill="#18221C" fillOpacity="0.3" />
                <polygon points="74,82 64,104 82,116" fill="#18221C" fillOpacity="0.3" />
              </>
            )}

            {avatar.clothingStyle === 'hoodie' && (
              <>
                <path d="M50 86C50 94 48 98 48 102" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                <path d="M70 86C70 94 72 98 72 102" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                <path d="M42 98C42 92 78 92 78 98" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
              </>
            )}

            {avatar.clothingStyle === 'street-tee' && (
              <>
                <circle cx="60" cy="82" r="10" fill="none" stroke="#FFFFFF" strokeWidth="2" />
                <rect x="52" y="94" width="16" height="12" rx="2" fill="#D4AF37" fillOpacity="0.8" />
                <path d="M55 100L65 100" stroke="#1A202C" strokeWidth="1.5" />
              </>
            )}

            {avatar.clothingStyle === 'varsity' && (
              <>
                <path d="M24 116C24 94 36 86 42 86L34 116H24Z" fill="#F8F7F2" />
                <path d="M96 116C96 94 84 86 78 86L86 116H96Z" fill="#F8F7F2" />
                <path d="M48 82C48 88 72 88 72 82" stroke="#D4AF37" strokeWidth="2" fill="none" />
                <circle cx="60" cy="94" r="2" fill="#F8F7F2" />
                <circle cx="60" cy="106" r="2" fill="#F8F7F2" />
              </>
            )}

            {avatar.clothingStyle === 'denim' && (
              <>
                <path d="M44 92H54V102H44Z" fill="#1E3A8A" fillOpacity="0.3" stroke="#F59E0B" strokeWidth="1" />
                <path d="M66 92H76V102H66Z" fill="#1E3A8A" fillOpacity="0.3" stroke="#F59E0B" strokeWidth="1" />
                <line x1="60" y1="84" x2="60" y2="116" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2,2" />
              </>
            )}

            {avatar.clothingStyle === 'linen-shirt' && (
              <>
                <polygon points="50,82 60,94 54,104" fill="#FFFFFF" fillOpacity="0.7" />
                <polygon points="70,82 60,94 66,104" fill="#FFFFFF" fillOpacity="0.7" />
                <circle cx="60" cy="108" r="1.5" fill="#B45309" />
              </>
            )}
          </g>

          {/* NECK */}
          <rect x="52" y="70" width="16" height="18" rx="4" fill={avatar.skinTone} />

          {/* HEAD & JAW (Wrapped in motion group for nodding) */}
          <g className={animate && motion === 'nodding' ? 'animate-avatar-nod' : ''}>
            <ellipse
              cx={60 + faceShiftX}
              cy="54"
              rx="24"
              ry="27"
              fill={avatar.skinTone}
            />

            {/* EARS */}
            <ellipse cx={36 + faceShiftX * 0.5} cy="56" rx="4.5" ry="7" fill={avatar.skinTone} />
            <ellipse cx={84 + faceShiftX * 0.5} cy="56" rx="4.5" ry="7" fill={avatar.skinTone} />

            {/* HAIR / HEADWEAR (بي كاب او بدون) */}
            {avatar.hairStyle === 'traditional' && (
              <>
                <path
                  d="M32 54C32 26 88 26 88 54C88 68 84 84 94 98L82 100C78 84 74 68 74 54H46C46 68 42 84 38 100L26 98C36 84 32 68 32 54Z"
                  fill="#FAF9F6"
                  stroke="#C53030"
                  strokeWidth="1.5"
                  strokeDasharray="2,3"
                />
                <ellipse cx={60 + faceShiftX} cy="36" rx="26" ry="6" stroke="#1A202C" strokeWidth="4.5" fill="none" />
                <ellipse cx={60 + faceShiftX} cy="32" rx="24" ry="5.5" stroke="#2D3748" strokeWidth="4" fill="none" />
              </>
            )}

            {avatar.hairStyle === 'hijab' && (
              <>
                <path
                  d="M34 52C34 26 86 26 86 52C86 78 82 92 88 102H32C38 92 34 78 34 52Z"
                  fill="#202923"
                />
                <ellipse cx={60 + faceShiftX} cy="54" rx="20" ry="23" fill={avatar.skinTone} />
              </>
            )}

            {avatar.hairStyle === 'short-fade' && (
              <path
                d={`M${36 + faceShiftX} 50C${36 + faceShiftX} 28 ${84 + faceShiftX} 28 ${84 + faceShiftX} 50C84 42 78 32 60 32C42 32 36 42 ${36 + faceShiftX} 50Z`}
                fill={avatar.hairColor || '#1A202C'}
              />
            )}

            {avatar.hairStyle === 'textured-crop' && (
              <g fill={avatar.hairColor || '#1A202C'}>
                <path d={`M${35 + faceShiftX} 48C${35 + faceShiftX} 26 ${85 + faceShiftX} 26 ${85 + faceShiftX} 48C80 34 68 30 60 30C52 30 40 34 ${35 + faceShiftX} 48Z`} />
                <polygon points={`${48 + faceShiftX},32 ${52 + faceShiftX},26 ${56 + faceShiftX},32`} />
                <polygon points={`${58 + faceShiftX},30 ${62 + faceShiftX},24 ${66 + faceShiftX},30`} />
                <polygon points={`${68 + faceShiftX},32 ${72 + faceShiftX},27 ${76 + faceShiftX},32`} />
              </g>
            )}

            {avatar.hairStyle === 'buzz' && (
              <path
                d={`M${37 + faceShiftX} 50C${37 + faceShiftX} 30 ${83 + faceShiftX} 30 ${83 + faceShiftX} 50C83 38 77 34 60 34C43 34 37 38 ${37 + faceShiftX} 50Z`}
                fill={avatar.hairColor || '#2D3748'}
                opacity="0.85"
              />
            )}

            {avatar.hairStyle === 'curly' && (
              <g fill={avatar.hairColor || '#2D3748'}>
                <circle cx={42 + faceShiftX} cy="36" r="9" />
                <circle cx={54 + faceShiftX} cy="30" r="10" />
                <circle cx={66 + faceShiftX} cy="30" r="10" />
                <circle cx={78 + faceShiftX} cy="36" r="9" />
                <circle cx={36 + faceShiftX} cy="46" r="7" />
                <circle cx={84 + faceShiftX} cy="46" r="7" />
              </g>
            )}

            {avatar.hairStyle === 'wavy' && (
              <path
                d={`M${34 + faceShiftX} 52C${34 + faceShiftX} 24 ${86 + faceShiftX} 24 ${86 + faceShiftX} 52C88 64 92 78 94 92C90 90 86 76 84 66C82 46 80 36 60 36C40 36 38 46 36 66C34 76 30 90 26 92C28 78 32 64 ${34 + faceShiftX} 52Z`}
                fill={avatar.hairColor || '#4A3728'}
              />
            )}

            {avatar.hairStyle === 'sleek' && (
              <path
                d={`M${33 + faceShiftX} 50C${33 + faceShiftX} 24 ${87 + faceShiftX} 24 ${87 + faceShiftX} 50V90C82 88 80 76 80 62C80 44 76 35 60 35C44 35 40 44 40 62C40 76 38 88 ${33 + faceShiftX} 90V50Z`}
                fill={avatar.hairColor || '#2B1B10'}
              />
            )}

            {avatar.hairStyle === 'cap' && (
              <>
                {/* Modern Snapback Baseball Cap (أمامي) */}
                <path d={`M${33 + faceShiftX} 44C${33 + faceShiftX} 26 ${87 + faceShiftX} 26 ${87 + faceShiftX} 44H${33 + faceShiftX}Z`} fill={avatar.capColor || '#0B5D3B'} />
                <ellipse cx={60 + (isFacingRight ? 16 : isFacingLeft ? -16 : 0)} cy="44" rx="27" ry="6" fill={avatar.capColor || '#08422A'} />
                {/* Cap metal eyelet */}
                <circle cx={60 + faceShiftX} cy="28" r="2.5" fill="#D4AF37" />
              </>
            )}

            {avatar.hairStyle === 'backward-cap' && (
              <>
                {/* Modern Backward Cap (كاب مقلوب للوراء) */}
                <path d={`M${34 + faceShiftX} 44C${34 + faceShiftX} 26 ${86 + faceShiftX} 26 ${86 + faceShiftX} 44H${34 + faceShiftX}Z`} fill={avatar.capColor || '#1E293B'} />
                {/* Backward closure strap cutout */}
                <path d={`M${52 + faceShiftX} 44C${52 + faceShiftX} 36 ${68 + faceShiftX} 36 ${68 + faceShiftX} 44`} fill={avatar.skinTone} />
                <ellipse cx={60 + faceShiftX} cy="44" rx="8" ry="2.5" fill="#334155" />
              </>
            )}

            {avatar.hairStyle === 'beanie' && (
              <>
                {/* Modern Streetwear Beanie (قبعة بيني شتوية) */}
                <path d={`M${32 + faceShiftX} 48C${32 + faceShiftX} 22 ${88 + faceShiftX} 22 ${88 + faceShiftX} 48H${32 + faceShiftX}Z`} fill={avatar.capColor || '#7C2D12'} />
                <rect x={30 + faceShiftX} y="44" width="60" height="8" rx="3" fill={avatar.capColor || '#9A3412'} />
              </>
            )}

            {avatar.hairStyle === 'bucket-hat' && (
              <>
                {/* Streetwear Bucket Hat (قبعة باكت هات شبابية) */}
                <path d={`M${40 + faceShiftX} 38C${40 + faceShiftX} 26 ${80 + faceShiftX} 26 ${80 + faceShiftX} 38H${40 + faceShiftX}Z`} fill={avatar.capColor || '#0F172A'} />
                <path d={`M${26 + faceShiftX} 46L${38 + faceShiftX} 38H${82 + faceShiftX}L${94 + faceShiftX} 46H${26 + faceShiftX}Z`} fill={avatar.capColor || '#1E293B'} />
              </>
            )}

            {/* Eyebrows */}
            <path
              d={isFacingRight ? "M48 45C52 43 56 43 59 45" : isFacingLeft ? "M45 45C48 43 52 43 56 45" : "M47 45C51 43 55 43 57 45"}
              stroke="#2D3748"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d={isFacingRight ? "M65 45C68 43 72 43 76 45" : isFacingLeft ? "M63 45C66 43 70 43 74 45" : "M63 45C65 43 69 43 73 45"}
              stroke="#2D3748"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Eyes */}
            {avatar.expression === 'wink' || motion === 'wink' ? (
              <>
                <circle cx={52 + faceShiftX} cy="51" r="3.2" fill="#1A202C" />
                <circle cx={53 + faceShiftX} cy="50" r="1.2" fill="#FFFFFF" />
                <path
                  d={`M${65 + faceShiftX} 52C${68 + faceShiftX} 50 ${72 + faceShiftX} 50 ${75 + faceShiftX} 52`}
                  stroke="#1A202C"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  className={animate ? 'animate-avatar-wink' : ''}
                />
                <path
                  d={`M${78 + faceShiftX} 48L${80 + faceShiftX} 44L${82 + faceShiftX} 48L${86 + faceShiftX} 50L${82 + faceShiftX} 52L${80 + faceShiftX} 56L${78 + faceShiftX} 52L${74 + faceShiftX} 50Z`}
                  fill="#D4AF37"
                  className="animate-sparkle-glow"
                />
              </>
            ) : (
              <>
                <circle cx={52 + faceShiftX} cy="51" r="3.2" fill="#1A202C" />
                <circle cx={53 + faceShiftX} cy="50" r="1.2" fill="#FFFFFF" />
                <circle cx={69 + faceShiftX} cy="51" r="3.2" fill="#1A202C" />
                <circle cx={70 + faceShiftX} cy="50" r="1.2" fill="#FFFFFF" />
              </>
            )}

            {/* Rosy Cheek Blush */}
            {(avatar.expression === 'smile' || avatar.expression === 'cheerful' || motion === 'smiling' || isTapped) && (
              <>
                <ellipse cx={45 + faceShiftX} cy="59" rx="4.5" ry="2.6" fill="#FF8A8A" fillOpacity="0.45" />
                <ellipse cx={75 + faceShiftX} cy="59" rx="4.5" ry="2.6" fill="#FF8A8A" fillOpacity="0.45" />
              </>
            )}

            {/* Nose */}
            <path
              d={`M${60 + faceShiftX} 52V58C${60 + faceShiftX} 59.5 ${62 + faceShiftX} 60.5 ${63 + faceShiftX} 60.5`}
              stroke="#B7791F"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Mouth */}
            {avatar.expression === 'smile' || avatar.expression === 'cheerful' || motion === 'smiling' ? (
              <path
                d={`M${53 + faceShiftX} 65C${56 + faceShiftX} 71 ${64 + faceShiftX} 71 ${67 + faceShiftX} 65`}
                stroke="#822727"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill={avatar.expression === 'cheerful' ? '#E53E3E' : 'none'}
              />
            ) : (
              <path
                d={`M${55 + faceShiftX} 67C${58 + faceShiftX} 68.5 ${63 + faceShiftX} 68.5 ${66 + faceShiftX} 67`}
                stroke="#822727"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}

            {/* ACCESSORIES (يلبس نظارة وغيرها) */}
            {avatar.accessory === 'sunglasses' && (
              <g>
                <rect x={44 + faceShiftX} y="46" width="14" height="10" rx="3" fill="#1A202C" stroke="#D4AF37" strokeWidth="1" />
                <rect x={62 + faceShiftX} y="46" width="14" height="10" rx="3" fill="#1A202C" stroke="#D4AF37" strokeWidth="1" />
                <line x1={58 + faceShiftX} y1="50" x2={62 + faceShiftX} y2="50" stroke="#D4AF37" strokeWidth="1.5" />
              </g>
            )}

            {avatar.accessory === 'glasses' && (
              <g>
                <circle cx={52 + faceShiftX} cy="51" r="7" stroke="#0B5D3B" strokeWidth="1.8" fill="#FFFFFF" fillOpacity="0.2" />
                <circle cx={69 + faceShiftX} cy="51" r="7" stroke="#0B5D3B" strokeWidth="1.8" fill="#FFFFFF" fillOpacity="0.2" />
                <line x1={59 + faceShiftX} y1="51" x2={62 + faceShiftX} y2="51" stroke="#0B5D3B" strokeWidth="1.8" />
              </g>
            )}

            {avatar.accessory === 'retro-shades' && (
              <g>
                {/* Streetwear Rectangular Sunglasses (نظارات ريترو شبابية) */}
                <rect x={42 + faceShiftX} y="47" width="16" height="8" rx="2" fill="#09090B" stroke="#10B981" strokeWidth="1.2" />
                <rect x={62 + faceShiftX} y="47" width="16" height="8" rx="2" fill="#09090B" stroke="#10B981" strokeWidth="1.2" />
                <line x1={58 + faceShiftX} y1="51" x2={62 + faceShiftX} y2="51" stroke="#10B981" strokeWidth="1.5" />
                <line x1={44 + faceShiftX} y1="49" x2={50 + faceShiftX} y2="49" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
                <line x1={64 + faceShiftX} y1="49" x2={70 + faceShiftX} y2="49" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
              </g>
            )}

            {avatar.accessory === 'gold-wire' && (
              <g>
                {/* Trendy Round Gold-Wire Glasses (إطار ذهبي راقي) */}
                <circle cx={52 + faceShiftX} cy="51" r="7.5" stroke="#D4AF37" strokeWidth="1.5" fill="#FFFFFF" fillOpacity="0.15" />
                <circle cx={69 + faceShiftX} cy="51" r="7.5" stroke="#D4AF37" strokeWidth="1.5" fill="#FFFFFF" fillOpacity="0.15" />
                <path d={`M${59.5 + faceShiftX} 50C${60.5 + faceShiftX} 48 ${61.5 + faceShiftX} 48 ${62.5 + faceShiftX} 50`} stroke="#D4AF37" strokeWidth="1.5" fill="none" />
              </g>
            )}

            {avatar.accessory === 'sports-wrap' && (
              <g>
                {/* Athletic Wrap Shades (نظارة رياضية سريعة) */}
                <path d={`M${40 + faceShiftX} 47Q${60 + faceShiftX} 44 ${80 + faceShiftX} 47L${78 + faceShiftX} 56Q${60 + faceShiftX} 54 ${42 + faceShiftX} 56Z`} fill="#1E293B" stroke="#FF5722" strokeWidth="1.2" />
                <line x1={44 + faceShiftX} y1="50" x2={76 + faceShiftX} y2="50" stroke="#FF9800" strokeWidth="1" opacity="0.7" />
              </g>
            )}

            {avatar.accessory === 'clear-optical' && (
              <g>
                {/* Modern Clear / Transparent Optical Glasses (نظارة طبية شفافة عصرية) */}
                <circle cx={52 + faceShiftX} cy="51" r="7.5" stroke="#94A3B8" strokeWidth="1.8" fill="#FFFFFF" fillOpacity="0.3" />
                <circle cx={69 + faceShiftX} cy="51" r="7.5" stroke="#94A3B8" strokeWidth="1.8" fill="#FFFFFF" fillOpacity="0.3" />
                <line x1={59.5 + faceShiftX} y1="51" x2={61.5 + faceShiftX} y2="51" stroke="#94A3B8" strokeWidth="1.8" />
                <line x1={47 + faceShiftX} y1="48" x2={53 + faceShiftX} y2="48" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
                <line x1={64 + faceShiftX} y1="48" x2={70 + faceShiftX} y2="48" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
              </g>
            )}

            {avatar.accessory === 'cyber-tint' && (
              <g>
                {/* Cyber Gradient Street Shades (نظارة سايبر ملونة شبابية) */}
                <rect x={42 + faceShiftX} y="46" width="16" height="9" rx="3" fill="#6366F1" stroke="#EC4899" strokeWidth="1.2" />
                <rect x={62 + faceShiftX} y="46" width="16" height="9" rx="3" fill="#6366F1" stroke="#EC4899" strokeWidth="1.2" />
                <line x1={58 + faceShiftX} y1="50" x2={62 + faceShiftX} y2="50" stroke="#EC4899" strokeWidth="1.5" />
                <line x1={44 + faceShiftX} y1="48" x2={52 + faceShiftX} y2="48" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
                <line x1={64 + faceShiftX} y1="48" x2={72 + faceShiftX} y2="48" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
              </g>
            )}

            {avatar.accessory === 'headphones' && (
              <g>
                <path d="M34 50C34 32 86 32 86 50" stroke="#0B5D3B" strokeWidth="4" fill="none" strokeLinecap="round" />
                <rect x="30" y="46" width="8" height="16" rx="4" fill="#D4AF37" />
                <rect x="82" y="46" width="8" height="16" rx="4" fill="#D4AF37" />
              </g>
            )}
          </g>

          {/* ============================================================== */}
          {/* INTERACTIVE RAISED HAND & GESTURE MOTIONS (ويرفع يدو) */}
          {/* ============================================================== */}
          {!highFivePose && (motion === 'waving' || motion === 'peace' || motion === 'thumbs-up' || motion === 'hand-raised' || motion === 'double-raise' || motion === 'finger-point' || isTapped) && (
            <>
              {/* DOUBLE RAISE: Left & Right both raised up celebrating 🙌 */}
              {motion === 'double-raise' ? (
                <g className="animate-avatar-bounce" style={{ transformOrigin: '60px 80px' }}>
                  {/* Left Arm Raised */}
                  <g>
                    <path d="M40 90 L22 56 L14 60 L34 98 Z" fill={avatar.clothingColor || '#0B5D3B'} />
                    <circle cx="16" cy="48" r="6.5" fill={avatar.skinTone} />
                    <path d="M21 44L21 34M18 42L18 32M15 42L15 32M12 44L12 35" stroke={avatar.skinTone} strokeWidth="2" strokeLinecap="round" />
                  </g>
                  {/* Right Arm Raised */}
                  <g>
                    <path d="M80 90 L98 56 L106 60 L86 98 Z" fill={avatar.clothingColor || '#0B5D3B'} />
                    <circle cx="104" cy="48" r="6.5" fill={avatar.skinTone} />
                    <path d="M99 44L99 34M102 42L102 32M105 42L105 32M108 44L108 35" stroke={avatar.skinTone} strokeWidth="2" strokeLinecap="round" />
                  </g>
                </g>
              ) : dir !== 'left' ? (
                /* Right Arm Gestures (Viewer's right side) */
                <g className={motion === 'waving' || isTapped ? 'animate-avatar-wave' : 'animate-avatar-sway'} style={{ transformOrigin: '82px 90px' }}>
                  <path d="M80 90 L98 62 L106 66 L86 98 Z" fill={avatar.clothingColor || '#0B5D3B'} />
                  <line x1="97" y1="63" x2="105" y2="67" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" />
                  
                  {motion === 'peace' ? (
                    /* Peace / Victory Sign (✌️) */
                    <g>
                      <circle cx="104" cy="54" r="6" fill={avatar.skinTone} />
                      <path d="M102 52L100 40L103 40L104 50" fill={avatar.skinTone} stroke={avatar.skinTone} strokeWidth="1" />
                      <path d="M105 50L108 40L111 41L107 52" fill={avatar.skinTone} stroke={avatar.skinTone} strokeWidth="1" />
                    </g>
                  ) : motion === 'thumbs-up' ? (
                    /* Thumbs Up Gesture (👍) */
                    <g>
                      <circle cx="104" cy="54" r="6.5" fill={avatar.skinTone} />
                      <path d="M103 52L103 41L107 41L107 52" stroke={avatar.skinTone} strokeWidth="3" strokeLinecap="round" />
                    </g>
                  ) : motion === 'finger-point' ? (
                    /* Youth Finger Point / Gesture (👉) */
                    <g>
                      <circle cx="104" cy="54" r="6.5" fill={avatar.skinTone} />
                      <path d="M102 52L116 50L116 53L104 55" fill={avatar.skinTone} />
                      <circle cx="101" cy="50" r="2" fill={avatar.skinTone} />
                    </g>
                  ) : motion === 'hand-raised' ? (
                    /* High Hand Raise (✋) */
                    <g>
                      <circle cx="104" cy="52" r="7" fill={avatar.skinTone} />
                      <path d="M99 47L99 38M102 46L102 36M105 46L105 36M108 47L108 38M111 49L113 42" stroke={avatar.skinTone} strokeWidth="2" strokeLinecap="round" />
                    </g>
                  ) : (
                    /* Default Friendly Wave (👋) */
                    <g>
                      <circle cx="104" cy="54" r="6.5" fill={avatar.skinTone} />
                      <path d="M102 48 L104 42 L106 48" stroke={avatar.skinTone} strokeWidth="2.2" strokeLinecap="round" />
                      <path d="M105 48 L108 42 L110 48" stroke={avatar.skinTone} strokeWidth="2.2" strokeLinecap="round" />
                      <path d="M108 50 L112 45 L112 50" stroke={avatar.skinTone} strokeWidth="2" strokeLinecap="round" />
                      <path d="M99 53 L94 51 L98 56" stroke={avatar.skinTone} strokeWidth="2" strokeLinecap="round" />
                    </g>
                  )}
                </g>
              ) : (
                /* Left Arm Gestures (Viewer's left side) */
                <g className={motion === 'waving' || isTapped ? 'animate-avatar-wave-left' : 'animate-avatar-sway'} style={{ transformOrigin: '38px 90px' }}>
                  <path d="M40 90 L22 62 L14 66 L34 98 Z" fill={avatar.clothingColor || '#0B5D3B'} />
                  <line x1="23" y1="63" x2="15" y2="67" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" />
                  
                  {motion === 'peace' ? (
                    <g>
                      <circle cx="16" cy="54" r="6" fill={avatar.skinTone} />
                      <path d="M18 52L20 40L17 40L16 50" fill={avatar.skinTone} stroke={avatar.skinTone} strokeWidth="1" />
                      <path d="M15 50L12 40L9 41L13 52" fill={avatar.skinTone} stroke={avatar.skinTone} strokeWidth="1" />
                    </g>
                  ) : motion === 'thumbs-up' ? (
                    <g>
                      <circle cx="16" cy="54" r="6.5" fill={avatar.skinTone} />
                      <path d="M17 52L17 41L13 41L13 52" stroke={avatar.skinTone} strokeWidth="3" strokeLinecap="round" />
                    </g>
                  ) : motion === 'finger-point' ? (
                    <g>
                      <circle cx="16" cy="54" r="6.5" fill={avatar.skinTone} />
                      <path d="M18 52L4 50L4 53L16 55" fill={avatar.skinTone} />
                      <circle cx="19" cy="50" r="2" fill={avatar.skinTone} />
                    </g>
                  ) : motion === 'hand-raised' ? (
                    <g>
                      <circle cx="16" cy="52" r="7" fill={avatar.skinTone} />
                      <path d="M21 47L21 38M18 46L18 36M15 46L15 36M12 47L12 38M9 49L7 42" stroke={avatar.skinTone} strokeWidth="2" strokeLinecap="round" />
                    </g>
                  ) : (
                    <g>
                      <circle cx="16" cy="54" r="6.5" fill={avatar.skinTone} />
                      <path d="M18 48 L16 42 L14 48" stroke={avatar.skinTone} strokeWidth="2.2" strokeLinecap="round" />
                      <path d="M15 48 L12 42 L10 48" stroke={avatar.skinTone} strokeWidth="2.2" strokeLinecap="round" />
                      <path d="M12 50 L8 45 L8 50" stroke={avatar.skinTone} strokeWidth="2" strokeLinecap="round" />
                      <path d="M21 53 L26 51 L22 56" stroke={avatar.skinTone} strokeWidth="2" strokeLinecap="round" />
                    </g>
                  )}
                </g>
              )}
            </>
          )}

          {/* HIGH-FIVE RAISED HAND & ARM FOR SPECIAL REVEALS */}
          {highFivePose && isFacingRight && (
            <g className="origin-bottom-left transition-transform duration-300">
              <path
                d="M78 88L110 52L116 57L86 96Z"
                fill={avatar.clothingColor || '#0B5D3B'}
              />
              <circle cx="114" cy="50" r="7" fill={avatar.skinTone} />
              <path d="M112 44L120 40L122 43L115 47Z" fill={avatar.skinTone} />
              <path d="M116 46L124 44L125 48L118 50Z" fill={avatar.skinTone} />
              <path d="M117 50L125 51L124 55L116 53Z" fill={avatar.skinTone} />
            </g>
          )}

          {highFivePose && isFacingLeft && (
            <g className="origin-bottom-right transition-transform duration-300">
              <path
                d="M42 88L10 52L4 57L34 96Z"
                fill={avatar.clothingColor || '#0B5D3B'}
              />
              <circle cx="6" cy="50" r="7" fill={avatar.skinTone} />
              <path d="M8 44L0 40L-2 43L5 47Z" fill={avatar.skinTone} />
              <path d="M4 46L-4 44L-5 48L2 50Z" fill={avatar.skinTone} />
              <path d="M3 50L-5 51L-4 55L4 53Z" fill={avatar.skinTone} />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
