"use client";

type TransactionSound = "Deposit" | "Withdrawal";

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio is not available.");
  }

  return new AudioContextClass();
}

function playTone(
  audioContext: AudioContext,
  destination: AudioNode,
  frequency: number,
  start: number,
  duration: number,
  gainValue: number
) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

export function playTransactionSound(type: TransactionSound) {
  if (typeof window === "undefined") return;

  try {
    const audioContext = getAudioContext();
    const master = audioContext.createGain();
    master.gain.value = 0.16;
    master.connect(audioContext.destination);

    const now = audioContext.currentTime;

    if (type === "Deposit") {
      playTone(audioContext, master, 523.25, now, 0.16, 0.7);
      playTone(audioContext, master, 659.25, now + 0.08, 0.18, 0.7);
      playTone(audioContext, master, 783.99, now + 0.18, 0.22, 0.55);
    } else {
      playTone(audioContext, master, 392, now, 0.16, 0.55);
      playTone(audioContext, master, 329.63, now + 0.1, 0.2, 0.45);
    }

    window.setTimeout(() => audioContext.close().catch(() => undefined), 700);
  } catch {
    // Browsers can deny audio in some privacy modes; the transaction should still save.
  }
}

export function playVaultUnlockSound() {
  if (typeof window === "undefined") return;

  try {
    const audioContext = getAudioContext();
    const master = audioContext.createGain();
    master.gain.value = 0.14;
    master.connect(audioContext.destination);

    const now = audioContext.currentTime;
    playTone(audioContext, master, 220, now, 0.1, 0.45);
    playTone(audioContext, master, 329.63, now + 0.09, 0.12, 0.5);
    playTone(audioContext, master, 493.88, now + 0.2, 0.18, 0.55);
    playTone(audioContext, master, 659.25, now + 0.32, 0.2, 0.45);

    window.setTimeout(() => audioContext.close().catch(() => undefined), 850);
  } catch {
    // Login should never depend on audio support.
  }
}

export function playVaultErrorSound() {
  if (typeof window === "undefined") return;

  try {
    const audioContext = getAudioContext();
    const master = audioContext.createGain();
    master.gain.value = 0.12;
    master.connect(audioContext.destination);

    const now = audioContext.currentTime;
    playTone(audioContext, master, 196, now, 0.15, 0.45);
    playTone(audioContext, master, 146.83, now + 0.14, 0.2, 0.38);

    window.setTimeout(() => audioContext.close().catch(() => undefined), 650);
  } catch {
    // Login should never depend on audio support.
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
