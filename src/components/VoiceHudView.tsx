import React, { useState } from 'react';
import { Mic, MicOff, Send, AlertTriangle, X, RotateCcw } from 'lucide-react';
import { UltronState } from '../types';
import { UltronOrb } from './UltronOrb';

interface VoiceHudViewProps {
  state: UltronState;
  isListening: boolean;
  isSpeaking: boolean;
  transcription: string;
  assistantResponseText: string;
  errorMessage?: string | null;
  toolExecutionNotice?: string | null;
  onToggleListening: () => void;
  onSubmitCommand: (command: string, isVoiceInput?: boolean) => void;
  onDismissError?: () => void;
  onOpenSettings?: () => void;
  onRetry?: () => void;
}

export const VoiceHudView: React.FC<VoiceHudViewProps> = ({
  state,
  isListening,
  isSpeaking,
  transcription,
  assistantResponseText,
  errorMessage,
  toolExecutionNotice,
  onToggleListening,
  onSubmitCommand,
  onDismissError,
  onOpenSettings,
  onRetry,
}) => {
  const [manualText, setManualText] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    onSubmitCommand(manualText.trim(), false);
    setManualText('');
  };

  const getStatusLabel = () => {
    if (toolExecutionNotice) return toolExecutionNotice;
    if (state === 'USER_SPEAKING' || (isListening && transcription)) return 'User Speaking...';
    if (state === 'AI_SPEAKING' || state === 'SPEAKING' || isSpeaking) return 'ULTRON Speaking (24kHz)...';
    if (state === 'PROCESSING' || state === 'THINKING') return 'Processing Directive...';
    if (state === 'LISTENING' || isListening) return 'Connected / Ready (16kHz PCM)';
    if (state === 'INTERRUPTED') return 'Interrupted (Barge-In)';
    if (state === 'RECONNECTING') return 'Reconnecting Live Stream...';
    return 'Standby / Live Voice Ready';
  };

  return (
    <div className="flex-1 flex flex-col justify-between items-center relative overflow-hidden px-4 py-6 select-none">
      {/* Background Holographic Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-cyan-500/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full border border-cyan-500/5 pointer-events-none" />

      {/* Spacing top */}
      <div className="w-full h-2" />

      {/* Central Clean Core: Orb + Status Text + Live Speech Bubble */}
      <div className="my-auto flex flex-col items-center justify-center w-full max-w-md">
        {/* Central Interactive Orb */}
        <UltronOrb 
          state={state} 
          onClick={onToggleListening}
          size={290}
        />

        {/* Status Text: "Connected / Ready" or Tool execution notice */}
        <div className={`mt-5 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#070b14]/80 border ${
          toolExecutionNotice 
            ? (toolExecutionNotice.startsWith('✕') ? 'border-red-500/40' : 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]')
            : (isListening ? 'border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]' : 'border-cyan-500/20')
        } backdrop-blur shadow-[0_0_15px_rgba(6,182,212,0.12)] transition-all`}>
          <span className={`w-2 h-2 rounded-full ${
            toolExecutionNotice 
              ? (toolExecutionNotice.startsWith('✕') ? 'bg-red-400' : 'bg-emerald-400 animate-pulse')
              : (isListening ? 'bg-cyan-400 animate-ping' : isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-500/80')
          }`} />
          <span className={`text-xs font-mono-code ${
            toolExecutionNotice
              ? (toolExecutionNotice.startsWith('✕') ? 'text-red-300' : 'text-emerald-300 font-bold')
              : (isListening ? 'text-cyan-200 font-semibold' : 'text-cyan-300 font-medium')
          } tracking-wider`}>
            {getStatusLabel()}
          </span>
        </div>

        {/* Actionable Error Banner if any */}
        {errorMessage && (
          <div className="mt-3.5 w-full bg-red-950/80 border border-red-500/50 p-3 rounded-2xl flex items-center justify-between text-xs font-mono-code text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.25)] animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5 flex-1 pr-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-[11px] leading-tight font-medium">{errorMessage}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-[10px] font-bold transition-colors shadow-sm"
                  title="Dobara connect try karein"
                >
                  <RotateCcw className="w-3 h-3" />
                  RETRY
                </button>
              )}
              {errorMessage.toLowerCase().includes('key') && onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-[10px] font-bold transition-colors"
                >
                  SETTINGS
                </button>
              )}
              {onDismissError && (
                <button
                  type="button"
                  onClick={onDismissError}
                  className="p-1 rounded-lg hover:bg-red-900/60 text-red-400 hover:text-white transition-colors"
                  title="Dismiss notice"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Live Speech Subtitle when active */}
        <div className="mt-3 min-h-[48px] w-full px-2 text-center flex items-center justify-center">
          {transcription ? (
            <div className="animate-fade-in bg-[#080f1e]/85 border border-cyan-500/30 px-4 py-2 rounded-xl backdrop-blur shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <span className="text-[10px] font-mono-code text-cyan-400 uppercase tracking-widest block mb-0.5">
                ● Live 16kHz Input
              </span>
              <p className="text-sm text-slate-100 font-medium">"{transcription}"</p>
            </div>
          ) : assistantResponseText && (state === 'SPEAKING' || state === 'AI_SPEAKING' || isSpeaking) ? (
            <div className="animate-fade-in bg-[#061418]/85 border border-emerald-500/30 px-4 py-2 rounded-xl backdrop-blur shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <span className="text-[10px] font-mono-code text-emerald-400 uppercase tracking-widest block mb-0.5">
                ● ULTRON 24kHz Stream
              </span>
              <p className="text-xs text-slate-200 line-clamp-2">{assistantResponseText}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom Command Input Bar + Mic Button */}
      <div className="w-full max-w-xl pb-2">
        <form onSubmit={handleManualSubmit} className="flex items-center gap-2 bg-[#090f1d]/90 p-1.5 rounded-2xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.12)] backdrop-blur">
          {/* Main Voice Activation Toggle */}
          <button
            type="button"
            onClick={onToggleListening}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isListening
                ? 'bg-gradient-to-br from-cyan-400 to-sky-600 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.7)] animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700'
            }`}
            title={isListening ? 'Stop Voice Listening' : 'Start Real-time Voice Session'}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Type or speak Jarvis command..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono-code"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!manualText.trim()}
            className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-40 disabled:pointer-events-none border border-cyan-500/40 flex items-center justify-center transition-all active:scale-95"
            title="Execute Command"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
