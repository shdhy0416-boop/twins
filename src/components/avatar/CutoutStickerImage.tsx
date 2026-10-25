import React, { useEffect, useState } from 'react';

const processedCache = new Map<string, string>();
const inflightCache = new Map<string, Promise<string>>();

function colorDistSq(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

/**
 * Studio-grade background matting & die-cut extractor for all 3D stickers & caricatures.
 * Handles:
 *  - Pure white, cream, & light studio gray backdrops
 *  - Checkerboard fake-PNG grids (white + light gray squares)
 *  - Chromatic & warm-tinted studio backdrops (yellow, royal blue, peach, tan, greige)
 *    using local gradient-continuity + border-seed envelope flood-fill so white thobes,
 *    turbans, eyes, teeth, and blue jerseys remain 100% intact
 *  - Corner watermark / badge pre-masking + auto tight bounding-box crop
 */
function stripOuterBackground(src: string): Promise<string> {
  const cached = processedCache.get(src);
  if (cached) {
    return Promise.resolve(cached);
  }

  const inflight = inflightCache.get(src);
  if (inflight) {
    return inflight;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(src);
  }

  const job = new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;
        if (!naturalW || !naturalH) {
          resolve(src);
          return;
        }

        const maxDim = 640;
        const scale = Math.min(1, maxDim / Math.max(naturalW, naturalH));
        const w = Math.max(1, Math.round(naturalW * scale));
        const h = Math.max(1, Math.round(naturalH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        const totalPixels = w * h;
        const visited = new Uint8Array(totalPixels);
        const removed = new Uint8Array(totalPixels);
        const queue = new Int32Array(totalPixels);
        let head = 0;
        let tail = 0;

        const forceClearRect = (x0: number, y0: number, x1: number, y1: number) => {
          const sx = Math.max(0, Math.min(w, x0));
          const ex = Math.max(0, Math.min(w, x1));
          const sy = Math.max(0, Math.min(h, y0));
          const ey = Math.max(0, Math.min(h, y1));
          for (let y = sy; y < ey; y++) {
            for (let x = sx; x < ex; x++) {
              const pos = y * w + x;
              removed[pos] = 1;
              visited[pos] = 1;
              data[pos * 4 + 3] = 0;
            }
          }
        };

        // 1. Pre-mask known corner/edge badges & border bars before flood-fill
        let topSafeY = 0;
        let botSafeY = h - 1;

        if (src.includes('sticker_coffee_lover')) {
          botSafeY = Math.floor(h * 0.908) - 1;
          forceClearRect(0, Math.floor(h * 0.908), w, h);
        }
        if (src.includes('sticker_music_dance')) {
          topSafeY = Math.ceil(h * 0.034);
          botSafeY = Math.floor(h * 0.962) - 1;
          forceClearRect(0, 0, w, topSafeY);
          forceClearRect(0, Math.floor(h * 0.962), w, h);
        }
        if (src.includes('sticker_leo_messi')) {
          forceClearRect(Math.floor(w * 0.79), 0, w, Math.floor(h * 0.088));
        }
        if (src.includes('sticker_cargo_caricature')) {
          forceClearRect(Math.floor(w * 0.79), Math.floor(h * 0.88), w, h);
        }
        if (src.includes('sticker_coffee_shades')) {
          forceClearRect(Math.floor(w * 0.74), Math.floor(h * 0.915), w, h);
        }
        if (src.includes('sticker_orange_bow')) {
          forceClearRect(Math.floor(w * 0.75), Math.floor(h * 0.925), w, h);
        }
        if (src.includes('sticker_pixar_yellow')) {
          forceClearRect(Math.floor(w * 0.85), Math.floor(h * 0.895), w, h);
        }
        if (src.includes('chic_bandana') || src.includes('african_turban')) {
          forceClearRect(Math.floor(w * 0.85), Math.floor(h * 0.93), w, h);
        }
        if (src.includes('rolling_laugh')) {
          const sx = Math.floor(w * 0.68);
          const sy = Math.floor(h * 0.88);
          for (let y = sy; y < h; y++) {
            for (let x = sx; x < w; x++) {
              const pos = y * w + x;
              const pIdx = pos * 4;
              const maxC = Math.max(data[pIdx], data[pIdx + 1], data[pIdx + 2]);
              const minC = Math.min(data[pIdx], data[pIdx + 1], data[pIdx + 2]);
              const lum = 0.299 * data[pIdx] + 0.587 * data[pIdx + 1] + 0.114 * data[pIdx + 2];
              if (lum >= 180 && maxC - minC <= 24) {
                removed[pos] = 1;
                visited[pos] = 1;
              }
            }
          }
        }

        // 2. Sample reliable background seeds from upper perimeter & upper flanks
        const seedSampleCoords: [number, number][] = [
          [2, topSafeY + 2],
          [w - 3, topSafeY + 2],
          [Math.floor(w * 0.14), topSafeY + 2],
          [Math.floor(w * 0.86), topSafeY + 2],
          [2, Math.min(botSafeY, Math.floor(h * 0.2))],
          [w - 3, Math.min(botSafeY, Math.floor(h * 0.2))],
          [2, Math.min(botSafeY, Math.floor(h * 0.45))],
          [w - 3, Math.min(botSafeY, Math.floor(h * 0.45))],
        ];

        const bgSeeds: [number, number, number][] = [];
        for (const [sx, sy] of seedSampleCoords) {
          if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;
          const pos = sy * w + sx;
          if (removed[pos]) continue;
          const idx = pos * 4;
          if (data[idx + 3] < 20) continue;
          bgSeeds.push([data[idx], data[idx + 1], data[idx + 2]]);
        }
        if (bgSeeds.length === 0) {
          bgSeeds.push([255, 255, 255]);
        }

        const minSeedDistSq = (r: number, g: number, b: number): number => {
          let best = Infinity;
          for (let i = 0; i < bgSeeds.length; i++) {
            const [sr, sg, sb] = bgSeeds[i];
            const d = colorDistSq(r, g, b, sr, sg, sb);
            if (d < best) best = d;
          }
          return best;
        };

        // Determine average luminance & chroma of top corners
        let avgLum = 0;
        let avgChroma = 0;
        const cornerCount = Math.min(4, bgSeeds.length);
        for (let i = 0; i < cornerCount; i++) {
          const [sr, sg, sb] = bgSeeds[i];
          avgLum += 0.299 * sr + 0.587 * sg + 0.114 * sb;
          avgChroma += Math.max(sr, sg, sb) - Math.min(sr, sg, sb);
        }
        avgLum /= cornerCount;
        avgChroma /= cornerCount;

        const isCheckerboard = src.includes('sticker_coffee_first');
        const isTightWhiteTurban = src.includes('sticker_egyptian_uncle');
        const isSubtleTintedStudio =
          src.includes('sticker_gulf_khanjar') ||
          src.includes('sticker_saudi_shemagh') ||
          src.includes('sticker_vini_jr') ||
          src.includes('sticker_cucurella') ||
          src.includes('sticker_hoodie_shades') ||
          src.includes('sticker_sassy_bob');
        const isVividColoredStudio =
          src.includes('sticker_pixar_yellow') ||
          src.includes('sticker_scholar_blue') ||
          src.includes('sticker_cargo_caricature') ||
          avgChroma > 18 ||
          avgLum < 232;

        // 3. Mode-Specific Flood-Fill Execution
        if (isSubtleTintedStudio || isVividColoredStudio) {
          // Gradient-continuity + border-seed envelope flood-fill:
          // Smooth studio lighting gradients pass effortlessly, while ANY character contour
          // (including white thobes against beige/tan or navy shoulders against blue) stops sharply!
          const maxStepSq = isSubtleTintedStudio ? 15 * 15 : 19 * 19;
          const maxEnvelopeSq = isSubtleTintedStudio ? 36 * 36 : 68 * 68;
          const seedAcceptSq = isSubtleTintedStudio ? 28 * 28 : 54 * 54;

          const trySeedBorder = (x: number, y: number) => {
            if (x < 0 || x >= w || y < topSafeY || y > botSafeY) return;
            const pos = y * w + x;
            if (visited[pos]) return;
            const pIdx = pos * 4;
            const r = data[pIdx];
            const g = data[pIdx + 1];
            const b = data[pIdx + 2];
            if (data[pIdx + 3] < 20 || minSeedDistSq(r, g, b) <= seedAcceptSq) {
              visited[pos] = 1;
              removed[pos] = 1;
              queue[tail++] = pos;
            }
          };

          // Seed top border & left/right borders; on bottom border only outer flanks matching seed
          for (let x = 0; x < w; x++) {
            trySeedBorder(x, topSafeY);
          }
          for (let y = topSafeY; y <= botSafeY; y++) {
            trySeedBorder(0, y);
            trySeedBorder(w - 1, y);
          }
          for (let x = 0; x < w; x++) {
            if (x < w * 0.22 || x > w * 0.78 || src.includes('sticker_cargo_caricature') || src.includes('sticker_gulf_khanjar')) {
              trySeedBorder(x, botSafeY);
            }
          }

          const tryStepNeighbor = (fromIdx: number, nx: number, ny: number) => {
            if (nx < 0 || nx >= w || ny < topSafeY || ny > botSafeY) return;
            const nPos = ny * w + nx;
            if (visited[nPos]) return;
            const nIdx = nPos * 4;
            if (data[nIdx + 3] < 18) {
              visited[nPos] = 1;
              removed[nPos] = 1;
              queue[tail++] = nPos;
              return;
            }

            const nr = data[nIdx];
            const ng = data[nIdx + 1];
            const nb = data[nIdx + 2];

            // Protect crisp pure-white thobe/turban against warm beige/tan/blue backdrops
            if (
              (src.includes('sticker_gulf_khanjar') || src.includes('sticker_saudi_shemagh')) &&
              nr >= 237 &&
              ng >= 237 &&
              nb >= 236 &&
              Math.max(nr, ng, nb) - Math.min(nr, ng, nb) <= 6
            ) {
              return;
            }

            const stepSq = colorDistSq(
              data[fromIdx],
              data[fromIdx + 1],
              data[fromIdx + 2],
              nr,
              ng,
              nb
            );
            if (stepSq <= maxStepSq && minSeedDistSq(nr, ng, nb) <= maxEnvelopeSq) {
              visited[nPos] = 1;
              removed[nPos] = 1;
              queue[tail++] = nPos;
            }
          };

          while (head < tail) {
            const curr = queue[head++];
            const cx = curr % w;
            const cy = (curr - cx) / w;
            const cIdx = curr * 4;

            tryStepNeighbor(cIdx, cx - 1, cy);
            tryStepNeighbor(cIdx, cx + 1, cy);
            tryStepNeighbor(cIdx, cx, cy - 1);
            tryStepNeighbor(cIdx, cx, cy + 1);
            tryStepNeighbor(cIdx, cx - 1, cy - 1);
            tryStepNeighbor(cIdx, cx + 1, cy - 1);
            tryStepNeighbor(cIdx, cx - 1, cy + 1);
            tryStepNeighbor(cIdx, cx + 1, cy + 1);
          }
        } else {
          // Neutral White / Off-White / Checkerboard Outer Flood-Fill
          const isOuterNeutralBg = (pIdx: number): boolean => {
            const a = data[pIdx + 3];
            if (a < 16) return true;

            const r = data[pIdx];
            const g = data[pIdx + 1];
            const b = data[pIdx + 2];
            const chroma = Math.max(r, g, b) - Math.min(r, g, b);
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (isCheckerboard) {
              // Eats both white (#FFF) and light-gray (#E6E6E6) checkerboard squares up to dark outline
              return lum >= 202 && chroma <= 22;
            }

            if (isTightWhiteTurban) {
              // Preserves shaded 3D white turban (lum ~215-244) while stripping pure white backdrop
              return lum >= 247 && chroma <= 10;
            }

            if (lum >= 230 && chroma <= 26) return true;
            if (lum >= 205 && chroma <= 14) return true;
            if (lum >= 195 && chroma <= 32 && minSeedDistSq(r, g, b) <= 1450) return true;

            return false;
          };

          const tryEnqueue = (x: number, y: number) => {
            if (x < 0 || x >= w || y < topSafeY || y > botSafeY) return;
            const pos = y * w + x;
            if (visited[pos]) return;
            visited[pos] = 1;
            if (isOuterNeutralBg(pos * 4)) {
              removed[pos] = 1;
              queue[tail++] = pos;
            }
          };

          // Seed top & sides; protect center of bottom edge on half-body portraits (e.g. Messi's white stripe)
          const protectBottomShirt =
            src.includes('sticker_leo_messi') ||
            src.includes('sticker_lamine_yamal') ||
            src.includes('sticker_mo_salah');

          for (let x = 0; x < w; x++) {
            tryEnqueue(x, topSafeY);
            if (!protectBottomShirt || x < w * 0.14 || x > w * 0.86) {
              tryEnqueue(x, botSafeY);
            }
          }
          for (let y = topSafeY + 1; y < botSafeY; y++) {
            tryEnqueue(0, y);
            tryEnqueue(w - 1, y);
          }

          while (head < tail) {
            const curr = queue[head++];
            const cx = curr % w;
            const cy = (curr - cx) / w;

            tryEnqueue(cx - 1, cy);
            tryEnqueue(cx + 1, cy);
            tryEnqueue(cx, cy - 1);
            tryEnqueue(cx, cy + 1);
            tryEnqueue(cx - 1, cy - 1);
            tryEnqueue(cx + 1, cy - 1);
            tryEnqueue(cx - 1, cy + 1);
            tryEnqueue(cx + 1, cy + 1);
          }
        }

        // 4. Apply alpha=0, clean 1px edge feathering & color-spill decontamination, and measure bbox
        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;

        const [bgR, bgG, bgB] = bgSeeds[0];

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const pos = y * w + x;
            const pIdx = pos * 4;
            if (removed[pos]) {
              data[pIdx + 3] = 0;
              continue;
            }

            const touchesBg =
              (x > 0 && removed[pos - 1] === 1) ||
              (x < w - 1 && removed[pos + 1] === 1) ||
              (y > 0 && removed[pos - w] === 1) ||
              (y < h - 1 && removed[pos + w] === 1);

            if (touchesBg) {
              const r = data[pIdx];
              const g = data[pIdx + 1];
              const b = data[pIdx + 2];
              const distToBg = Math.sqrt(colorDistSq(r, g, b, bgR, bgG, bgB));

              if (distToBg < 48) {
                const alphaRatio = Math.max(0.18, Math.min(0.92, distToBg / 48));
                data[pIdx + 3] = Math.min(data[pIdx + 3], Math.round(alphaRatio * 255));

                // Subtle color spill decontamination on chromatic backgrounds (yellow/blue/peach)
                if (isVividColoredStudio && alphaRatio < 0.85) {
                  const inv = 1 / Math.max(0.25, alphaRatio);
                  data[pIdx] = Math.max(0, Math.min(255, Math.round((r - (1 - alphaRatio) * bgR) * inv)));
                  data[pIdx + 1] = Math.max(0, Math.min(255, Math.round((g - (1 - alphaRatio) * bgG) * inv)));
                  data[pIdx + 2] = Math.max(0, Math.min(255, Math.round((b - (1 - alphaRatio) * bgB) * inv)));
                }
              }
            }

            if (data[pIdx + 3] > 20) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // 5. Auto-trim transparent margins so every sticker fills its box prominently
        if (maxX > minX && maxY > minY) {
          const pad = 2;
          const cropX = Math.max(0, minX - pad);
          const cropY = Math.max(0, minY - pad);
          const cropW = Math.min(w - cropX, maxX - minX + 1 + pad * 2);
          const cropH = Math.min(h - cropY, maxY - minY + 1 + pad * 2);

          const trimmed = document.createElement('canvas');
          trimmed.width = cropW;
          trimmed.height = cropH;
          const tCtx = trimmed.getContext('2d');
          if (tCtx) {
            tCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            const url = trimmed.toDataURL('image/png');
            processedCache.set(src, url);
            resolve(url);
            return;
          }
        }

        const fallbackUrl = canvas.toDataURL('image/png');
        processedCache.set(src, fallbackUrl);
        resolve(fallbackUrl);
      } catch {
        resolve(src);
      }
    };

    img.onerror = () => {
      resolve(src);
    };

    img.src = src;
  }).finally(() => {
    inflightCache.delete(src);
  });

  inflightCache.set(src, job);
  return job;
}

export function preloadCutoutStickers(urls: string[]): void {
  if (typeof window === 'undefined') return;
  for (const url of urls) {
    if (!processedCache.has(url) && !inflightCache.has(url)) {
      void stripOuterBackground(url);
    }
  }
}

interface CutoutStickerImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const CutoutStickerImage: React.FC<CutoutStickerImageProps> = ({
  src,
  alt,
  className = '',
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => processedCache.get(src) || null);

  useEffect(() => {
    let active = true;
    const cached = processedCache.get(src);
    if (cached) {
      setResolvedSrc(cached);
      return;
    }

    setResolvedSrc(null);
    stripOuterBackground(src).then((cleanUrl) => {
      if (active) {
        setResolvedSrc(cleanUrl);
      }
    });

    return () => {
      active = false;
    };
  }, [src]);

  if (!resolvedSrc) {
    return <div className={`w-full h-full bg-transparent ${className}`} aria-hidden="true" />;
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={`bg-transparent select-none pointer-events-none ${className}`}
      decoding="async"
    />
  );
};
