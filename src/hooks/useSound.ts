import { useCallback } from "react";

// AudioContext 타입 정의
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export const useSound = () => {
  // Work 완료 시 벨소리 (높은 음 → 낮은 음, 성취감)
  const playWorkComplete = useCallback((volume: number) => {
    const AudioContextClass = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    const playTone = (frequency: number, startTime: number, duration: number, gain: number) => {
      const oscillator = audioContext.createOscillator();
      const toneGain = audioContext.createGain();

      oscillator.connect(toneGain);
      toneGain.connect(gainNode);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      toneGain.gain.setValueAtTime(0, audioContext.currentTime + startTime);
      toneGain.gain.linearRampToValueAtTime(gain, audioContext.currentTime + startTime + 0.01);
      toneGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + startTime + duration);

      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };

    const v = volume / 100;
    // 성취감 있는 3음 상승 멜로디 (도-미-솔)
    playTone(523, 0, 0.2, v);      // 도 (C5)
    playTone(659, 0.25, 0.2, v);   // 미 (E5)
    playTone(784, 0.5, 0.3, v);    // 솔 (G5)

    setTimeout(() => audioContext.close(), 1000);
  }, []);

  // Break 완료 시 벨소리 (부드러운 2음, 휴식 끝)
  const playBreakComplete = useCallback((volume: number) => {
    const AudioContextClass = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    const playTone = (frequency: number, startTime: number, duration: number, gain: number) => {
      const oscillator = audioContext.createOscillator();
      const toneGain = audioContext.createGain();

      oscillator.connect(toneGain);
      toneGain.connect(gainNode);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      toneGain.gain.setValueAtTime(0, audioContext.currentTime + startTime);
      toneGain.gain.linearRampToValueAtTime(gain, audioContext.currentTime + startTime + 0.01);
      toneGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + startTime + duration);

      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };

    const v = volume / 100;
    // 부드러운 2음 (솔-도, 다시 시작을 알림)
    playTone(784, 0, 0.2, v);      // 솔 (G5)
    playTone(523, 0.25, 0.25, v);  // 도 (C5)

    setTimeout(() => audioContext.close(), 800);
  }, []);

  // Coin 효과음 재생 (사이클 완료, 목표 달성 시)
  const playCoinSound = useCallback((volume: number = 30) => {
    const audio = new Audio("/coin05.mp3");
    audio.volume = volume / 100;
    audio.play().catch(() => {
      // Failed to play coin sound
    });
  }, []);

  return { playWorkComplete, playBreakComplete, playCoinSound };
};
