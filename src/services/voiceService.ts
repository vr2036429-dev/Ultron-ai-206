import { voicePipelineDiagnostics } from './voicePipelineDiagnostics';

/**
 * VoiceService: Audio & Speech output utility.
 * Note: Primary Voice Architecture is exclusively Gemini Live Audio-to-Audio (24kHz).
 * Web Speech STT fallback has been completely removed.
 */
export class VoiceService {
  private isSpeaking: boolean = false;
  private isListening: boolean = false;
  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private chosenVoice: SpeechSynthesisVoice | null = null;
  private currentPitch: number = 0.95;
  private currentRate: number = 1.05;

  public onSpeakStart?: () => void;
  public onSpeakEnd?: () => void;

  constructor() {
    this.initVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
    }
  }

  public supportsSpeechRecognition(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public startListening(
    onTranscript: (text: string, isFinal: boolean) => void,
    onError?: (err: any) => void
  ): boolean {
    if (typeof window === 'undefined') return false;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('[VoiceService] Web Speech API not supported on this platform');
      return false;
    }

    try {
      this.stopSpeaking();
      if (this.recognition) {
        try { this.recognition.abort(); } catch (e) {}
        this.recognition = null;
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        this.isListening = true;
        console.log('[VoiceService] Speech recognition active');
      };

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const text = (final || interim).trim();
        if (text) {
          onTranscript(text, !!final);
        }
      };

      rec.onerror = (errEvent: any) => {
        console.warn('[VoiceService] Speech recognition notice:', errEvent?.error);
        if (errEvent?.error === 'not-allowed') {
          onError?.(new Error('Microphone permission denied'));
        }
      };

      rec.onend = () => {
        this.isListening = false;
      };

      rec.start();
      this.recognition = rec;
      this.isListening = true;
      return true;
    } catch (e) {
      console.warn('[VoiceService] startListening exception:', e);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    this.chosenVoice = 
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('UK') || v.name.includes('British') || v.name.includes('Natural') || v.name.includes('George') || v.name.includes('Oliver'))) ||
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('David') || v.name.includes('Male'))) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0] || null;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
  }

  public setVoice(voiceName: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    const found = voices.find(v => v.name === voiceName);
    if (found) {
      this.chosenVoice = found;
    }
  }

  public setPitch(pitch: number) {
    this.currentPitch = pitch;
  }

  public setRate(rate: number) {
    this.currentRate = rate;
  }

  public getAudioFrequencyData(): Uint8Array {
    if (this.analyser) {
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);
      return dataArray;
    }
    return new Uint8Array(32).fill(0);
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  public speak(
    text: string, 
    onStart?: () => void, 
    onEnd?: () => void,
    pitch: number = 0.95,
    rate: number = 1.05
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        onEnd?.();
        resolve();
        return;
      }

      this.stopSpeaking();

      // Clean spoken text
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`{1,3}[\s\S]*?`{1,3}/g, 'code block')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/https?:\/\/\S+/g, 'link')
        .replace(/[#_~]/g, '')
        .trim();

      if (!cleanText) {
        onEnd?.();
        resolve();
        return;
      }

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (this.chosenVoice) {
        utterance.voice = this.chosenVoice;
      }
      utterance.pitch = pitch ?? this.currentPitch;
      utterance.rate = rate ?? this.currentRate;

      let hasEnded = false;
      const safeEnd = () => {
        if (!hasEnded) {
          hasEnded = true;
          this.isSpeaking = false;
          this.onSpeakEnd?.();
          onEnd?.();
          resolve();
        }
      };

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.onSpeakStart?.();
        onStart?.();
      };

      utterance.onend = () => {
        safeEnd();
      };

      utterance.onerror = () => {
        safeEnd();
      };

      const wordCount = cleanText.split(/\s+/).length;
      const estimatedDurationMs = Math.max(3000, (wordCount / 2.2) * 1000 + 2000);
      setTimeout(() => {
        if (this.isSpeaking) {
          this.stopSpeaking();
          safeEnd();
        }
      }, estimatedDurationMs);

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        safeEnd();
      }
    });
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const voiceService = new VoiceService();
