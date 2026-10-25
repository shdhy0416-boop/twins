/**
 * Audio Synthesis Engine using the Web Audio API
 * Generates rich musical chords, tactile clicks, and unique harmonic signatures
 * for each personality / twin match without external media dependencies.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Global Sound Mute State (persisted in localStorage)
let soundEnabled = true;
try {
  const saved = localStorage.getItem('twin_sound_enabled');
  if (saved !== null) {
    soundEnabled = saved === 'true';
  }
} catch {
  soundEnabled = true;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  try {
    localStorage.setItem('twin_sound_enabled', enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function toggleSound(): boolean {
  setSoundEnabled(!soundEnabled);
  if (soundEnabled) {
    playClickPop();
  }
  return soundEnabled;
}

/**
 * Creates a soft musical tone with natural attack, sustain, and release
 */
function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainLevel = 0.15
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Soft attack and natural decay
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/**
 * Unique personality chime for each user profile.
 * Every person has a signature melodic sequence based on their ID.
 */
export function playPersonChime(personId: string): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Preset signatures for well-known twin profiles or hash-based notes
  const presetTunes: Record<string, number[]> = {
    twin_1_faisal: [392.0, 523.25, 659.25, 783.99],
    twin_2_noura: [440.0, 554.37, 659.25, 880.0],
    twin_3_saad: [349.23, 440.0, 523.25, 698.46],
    twin_4_lama: [392.0, 493.88, 587.33, 783.99],
    twin_5_bader: [293.66, 392.0, 440.0, 587.33],
    twin_6_reem: [329.63, 440.0, 523.25, 659.25],
    user_faisal: [392.0, 523.25, 659.25, 783.99], // G4, C5, E5, G5 (Triumphant noble chord)
    user_noura: [440.0, 554.37, 659.25, 880.0],  // A4, C#5, E5, A5 (Sparkling sweet chime)
    user_saad: [349.23, 440.0, 523.25, 698.46],  // F4, A4, C5, F5 (Oceanic chill melody)
    user_bader: [293.66, 392.0, 440.0, 587.33],  // D4, G4, A4, D5 (Warm desert oud cadence)
    user_reem: [329.63, 440.0, 523.25, 659.25],  // E4, A4, C5, E5 (Mountain mist breeze)
    user_lama: [392.0, 493.88, 587.33, 783.99],  // G4, B4, D5, G5 (Joyful Riyadh twinkle)
  };

  let notes = presetTunes[personId];

  if (!notes) {
    // Generate a beautiful pentatonic chord based on person ID string hash
    const pentatonicScale = [
      261.63, // C4
      293.66, // D4
      329.63, // E4
      392.0,  // G4
      440.0,  // A4
      523.25, // C5
      587.33, // D5
      659.25, // E5
      783.99, // G5
      880.0,  // A5
      1046.5, // C6
    ];

    let hash = 0;
    for (let i = 0; i < personId.length; i++) {
      hash = (hash << 5) - hash + personId.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const rootIndex = absHash % (pentatonicScale.length - 4);
    notes = [
      pentatonicScale[rootIndex],
      pentatonicScale[rootIndex + 1],
      pentatonicScale[rootIndex + 2],
      pentatonicScale[rootIndex + 3],
    ];
  }

  // Play ascending resonant arpeggio
  notes.forEach((freq, idx) => {
    playTone(ctx, freq, now + idx * 0.08, 0.45, 'triangle', 0.16);
    // Add subtle octave overtone for crystal shimmer
    playTone(ctx, freq * 1.5, now + idx * 0.08 + 0.01, 0.25, 'sine', 0.05);
  });
}

/**
 * Celebratory Twin Match & High-Five Chime
 */
export function playHighFiveSound(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // High-five slap burst
  const burstFreqs = [523.25, 659.25, 783.99, 1046.5];
  burstFreqs.forEach((freq, idx) => {
    playTone(ctx, freq, now + idx * 0.06, 0.5, 'triangle', 0.2);
  });

  // Resonant sustained chord
  setTimeout(() => {
    if (!ctx) return;
    const t = ctx.currentTime;
    playTone(ctx, 1046.5, t, 0.8, 'sine', 0.12);
    playTone(ctx, 1318.5, t + 0.05, 0.9, 'sine', 0.1);
  }, 220);
}

/**
 * Friendly Wave / Greeting Ding-Dong
 */
export function playWaveSound(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  playTone(ctx, 587.33, now, 0.3, 'sine', 0.18); // D5
  playTone(ctx, 880.0, now + 0.14, 0.45, 'sine', 0.2); // A5
}

/**
 * Mysterious Dark Mode Activated 🌙
 * Deep, atmospheric, velvet ambient sound with warm low-mid resonance
 */
export function playMysteriousDarkSound(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Low mysterious pad chord: D3, A3, F4, C5
  const freqs = [146.83, 220.0, 349.23, 523.25];
  freqs.forEach((freq) => {
    playTone(ctx, freq, now, 0.85, 'sine', 0.15);
  });

  // Soft high shimmer descending into darkness
  const shimmer = ctx.createOscillator();
  const gain = ctx.createGain();
  shimmer.type = 'triangle';
  shimmer.frequency.setValueAtTime(880, now);
  shimmer.frequency.exponentialRampToValueAtTime(440, now + 0.6);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

  shimmer.connect(gain);
  gain.connect(ctx.destination);
  shimmer.start(now);
  shimmer.stop(now + 0.75);
}

/**
 * Light Mode Activated ☀️
 * Bright, cheerful, golden morning bell chime
 */
export function playLightModeSound(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Sunny chime: G4, B4, D5, G5
  const freqs = [392.0, 493.88, 587.33, 783.99, 987.77];
  freqs.forEach((freq, idx) => {
    playTone(ctx, freq, now + idx * 0.05, 0.4, 'sine', 0.14);
  });
}

/**
 * Tactile Pill Button Pop
 */
export function playClickPop(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  playTone(ctx, 440, now, 0.04, 'triangle', 0.08);
}
