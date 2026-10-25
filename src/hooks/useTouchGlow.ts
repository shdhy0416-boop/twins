import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface TouchGlowPosition {
  x: number;
  y: number;
  active: boolean;
}

export function useTouchGlow(options?: { haptic?: boolean }) {
  const [glowPos, setGlowPos] = useState<TouchGlowPosition>({ x: 50, y: 50, active: false });
  const hasHapticFiredRef = useRef(false);

  // تتبع موضع اللمس أو المؤشر بدقة متناهية لأي عنصر (كرت أو زر)
  const handleTouchMove = useCallback(
    (
      e:
        | React.TouchEvent<HTMLElement>
        | React.MouseEvent<HTMLElement>
        | React.PointerEvent<HTMLElement>
    ) => {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const isTouch = 'touches' in e && e.touches.length > 0;
      const clientX = isTouch ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = isTouch ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;

      // تأثير نبض واهتزاز خفيف (Haptic Pulse) ليعطي شعوراً مجسماً وفخماً
      if (options?.haptic !== false && !hasHapticFiredRef.current && isTouch) {
        try {
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(10);
          }
        } catch {
          // ignore
        }
        hasHapticFiredRef.current = true;
      }

      setGlowPos({ x, y, active: true });
    },
    [options?.haptic]
  );

  const handleTouchEnd = useCallback(() => {
    setGlowPos((prev) => ({ ...prev, active: false }));
    hasHapticFiredRef.current = false;
  }, []);

  const glowHandlers = {
    onTouchStart: handleTouchMove,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
    onMouseMove: handleTouchMove,
    onMouseLeave: handleTouchEnd,
  };

  return { glowPos, handleTouchMove, handleTouchEnd, glowHandlers };
}

/**
 * تتبع شامل لكل الكروت والأزرار في التطبيق لتفعيل التوهج الديناميكي الزمردي والذهبي
 * عند اللمس أو تحريك المؤشر بسلاسة فائقة (60fps) دون إعادة تصيير غير ضرورية.
 */
export function useGlobalTouchGlow(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    let activeEl: HTMLElement | null = null;
    let lastVibratedEl: HTMLElement | null = null;

    const SELECTOR =
      'button:not(:disabled), [role="button"], [data-custom-glow="true"], .glow-surface, .card-interactive, div.rounded-3xl:not([class*="max-h-"])';

    const updateGlow = (clientX: number, clientY: number, rawTarget: EventTarget | null, isTouchStart = false) => {
      if (!(rawTarget instanceof Element)) return;
      const target = rawTarget.closest<HTMLElement>(SELECTOR);

      if (activeEl && activeEl !== target) {
        activeEl.removeAttribute('data-tg-active');
      }

      if (!target) {
        activeEl = null;
        return;
      }

      const rect = target.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        target.style.setProperty('--tg-x', `${x.toFixed(1)}%`);
        target.style.setProperty('--tg-y', `${y.toFixed(1)}%`);
        target.setAttribute('data-tg-active', 'true');
        activeEl = target;

        if (isTouchStart && lastVibratedEl !== target) {
          lastVibratedEl = target;
          try {
            if ('vibrate' in navigator) {
              navigator.vibrate(10);
            }
          } catch {
            // ignore
          }
        }
      }
    };

    const clearGlow = () => {
      if (activeEl) {
        activeEl.removeAttribute('data-tg-active');
        activeEl = null;
      }
      lastVibratedEl = null;
    };

    const onPointerMove = (e: PointerEvent) => {
      updateGlow(e.clientX, e.clientY, e.target, false);
    };

    const onPointerDown = (e: PointerEvent) => {
      updateGlow(e.clientX, e.clientY, e.target, e.pointerType === 'touch');
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const hovered = document.elementFromPoint(touch.clientX, touch.clientY) || e.target;
        updateGlow(touch.clientX, touch.clientY, hovered, false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('pointerup', clearGlow, { passive: true });
    document.addEventListener('pointercancel', clearGlow, { passive: true });
    document.addEventListener('touchend', clearGlow, { passive: true });

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('pointerup', clearGlow);
      document.removeEventListener('pointercancel', clearGlow);
      document.removeEventListener('touchend', clearGlow);
      clearGlow();
    };
  }, [enabled]);
}
