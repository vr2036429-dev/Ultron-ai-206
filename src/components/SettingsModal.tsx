import React, { useState, useMemo } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Volume2, 
  ShieldCheck, 
  Database, 
  Trash2, 
  Radio, 
  Check, 
  Zap, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Flashlight, 
  Mic, 
  MicOff, 
  Battery, 
  BatteryCharging, 
  Smartphone, 
  Search, 
  Sparkles, 
  MessageSquare, 
  Wrench, 
  Code, 
  Activity, 
  Layers, 
  Compass, 
  ArrowRight, 
  VolumeX, 
  Vibrate, 
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { UserPreferences, VoiceMode, DeviceStatus, ViewTab, VoiceEngineType } from '../types';
import { VoicePipelineDiagnosticsPanel } from './VoicePipelineDiagnosticsPanel';
import { biometricService } from '../services/biometricService';

export type SettingsCategory = 
  | 'quick_controls'
  | 'voice_engine'
  | 'device_status'
  | 'commands'
  | 'ai_api'
  | 'tools_features'
  | 'about';

interface SettingsModalProps {
  isOpen: boolean;
  preferences: UserPreferences;
  contextFacts: string[];
  deviceStatus: DeviceStatus;
  isListening: boolean;
  isMicMuted: boolean;
  onClose: () => void;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onClearMemory: () => void;
  onToggleTorch: () => void;
  onToggleMute: () => void;
  onToggleListening: () => void;
  onOpenVoiceLock: () => void;
  onInterruptAi?: () => void;
  onExecuteCommand: (command: string, isVoice?: boolean) => void;
  onSelectTab: (tab: ViewTab) => void;
  onInspectScreen?: () => void;
  onTriggerVibration?: () => void;
  onCheckBattery?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  preferences,
  contextFacts,
  deviceStatus,
  isListening,
  isMicMuted,
  onClose,
  onUpdatePreferences,
  onClearMemory,
  onToggleTorch,
  onToggleMute,
  onToggleListening,
  onOpenVoiceLock,
  onInterruptAi,
  onExecuteCommand,
  onSelectTab,
  onInspectScreen,
  onTriggerVibration,
  onCheckBattery,
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('quick_controls');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCmdInput, setQuickCmdInput] = useState('');

  // Gemini API Key state
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return localStorage.getItem('ultron_gemini_api_key') || '';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState<string | null>(null);

  // Biometric enrollment state
  const [enrollingBio, setEnrollingBio] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState<string | null>(null);

  const suggestedCommands = [
    { label: 'Open YouTube', prompt: 'Open YouTube', desc: 'Launch Android YouTube application' },
    { label: 'Research Android AI', prompt: 'Research the latest Android AI assistant technologies', desc: 'Run deep web autonomous agent' },
    { label: 'What is on my screen?', prompt: 'What is on my screen?', desc: 'Analyze current UI elements & visual contents' },
    { label: 'Check Battery Level', prompt: 'Check device battery diagnostics', desc: 'Device hardware battery report' },
    { label: 'Turn on Flashlight', prompt: 'Turn on flashlight', desc: 'Hardware LED torch toggle' },
    { label: 'Find PDF Notes', prompt: 'Find my PDF files and summarize them', desc: 'Inspect device storage documents' },
    { label: 'Call John', prompt: 'Call John', desc: 'Initiate voice telephony call' },
    { label: 'Morning Tech Briefing', prompt: 'Research tech news and save summary', desc: 'Execute morning automation workflow' },
  ];

  const toolsAndFeatures = [
    { id: 'chat' as ViewTab, label: 'Conversation Stream', icon: MessageSquare, desc: 'Full chat history, transcripts, and voice replay' },
    { id: 'tasks' as ViewTab, label: 'Task Continuity & Planner', icon: Layers, desc: 'Multi-turn autonomous task goals and steps' },
    { id: 'multimodal' as ViewTab, label: 'Vision & Screen Intelligence', icon: Compass, desc: 'Live camera capture and visual screen analysis' },
    { id: 'research' as ViewTab, label: 'Deep Web Research Agent', icon: Search, desc: 'Multi-query web research, source synthesis' },
    { id: 'automation' as ViewTab, label: 'Automations & Workflows', icon: Sparkles, desc: 'Multi-step scheduled routines and triggers' },
    { id: 'tools' as ViewTab, label: 'Tools & Android Apps', icon: Wrench, desc: 'Files, notifications, and Android app launchers' },
    { id: 'coder' as ViewTab, label: 'ULTRON Coder & IDE', icon: Code, desc: 'Built-in code editor, terminal, and workspace' },
    { id: 'diagnostics' as ViewTab, label: 'Diagnostics & Telemetry', icon: Activity, desc: 'Real-time performance metrics and event logs' },
    { id: 'security' as ViewTab, label: 'Owner Security Center', icon: ShieldCheck, desc: 'ASIK multi-layer voice biometric verification' },
  ];

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    const cleanKey = apiKeyInput.trim();
    if (cleanKey) {
      localStorage.setItem('ultron_gemini_api_key', cleanKey);
      setKeySaveMessage('Gemini API Key successfully saved to device storage.');
    } else {
      localStorage.removeItem('ultron_gemini_api_key');
      setKeySaveMessage('API Key removed. System will use default server environment configuration.');
    }
    setTimeout(() => setKeySaveMessage(null), 3000);
  };

  const handleEnrollBiometrics = async () => {
    setEnrollingBio(true);
    setEnrollStatus('Requesting hardware authenticator...');
    const res = await biometricService.enrollBiometrics(preferences.userName);
    setEnrollingBio(false);
    setEnrollStatus(res.message);
    if (res.success) {
      onUpdatePreferences({ biometricEnrolled: true });
    }
  };

  const handleRunCommand = (cmd: string) => {
    onExecuteCommand(cmd, false);
    onClose();
  };

  const handleSelectTool = (tab: ViewTab) => {
    onSelectTab(tab);
    onClose();
  };

  // Search filtering logic
  const isMatch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#070b14] border border-cyan-500/30 rounded-3xl w-full max-w-3xl h-[92vh] max-h-[900px] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.18)]">
        
        {/* Top Header & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-cyan-950/60 bg-[#090f1f]/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <SettingsIcon className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="font-cyber font-bold text-white text-base tracking-wider flex items-center gap-2">
                  <span>ULTRON SETTINGS</span>
                  <span className="text-[10px] font-mono-code px-1.5 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded">
                    CONTROL CENTER
                  </span>
                </h2>
                <p className="text-[11px] font-mono-code text-slate-400">All controls, voice engine, device status & AI tools</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="Close Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search controls, flashlight, mic, commands, api key, tools..."
              className="w-full bg-[#050811] border border-cyan-500/25 focus:border-cyan-400 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono-code transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-cyan-950/40 bg-[#080d1a] overflow-x-auto no-scrollbar font-mono-code text-xs">
          {[
            { id: 'quick_controls' as SettingsCategory, label: 'Quick Controls' },
            { id: 'voice_engine' as SettingsCategory, label: 'Voice Engine' },
            { id: 'device_status' as SettingsCategory, label: 'Device Status' },
            { id: 'commands' as SettingsCategory, label: 'Commands' },
            { id: 'ai_api' as SettingsCategory, label: 'AI & API' },
            { id: 'tools_features' as SettingsCategory, label: 'Tools & Features' },
            { id: 'about' as SettingsCategory, label: 'About' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 font-mono-code text-xs">
          
          {/* CATEGORY 1: QUICK CONTROLS */}
          {(activeCategory === 'quick_controls' || searchQuery) && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs border-b border-cyan-950 pb-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Quick Controls</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Flashlight Toggle */}
                {isMatch('flashlight torch light') && (
                  <div className="p-3.5 rounded-2xl bg-[#090f1e] border border-cyan-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                        deviceStatus.torchOn ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        <Flashlight className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">Device Flashlight</div>
                        <div className="text-[10px] text-slate-400">{deviceStatus.torchOn ? 'LED Torch ON' : 'LED Torch OFF'}</div>
                      </div>
                    </div>
                    <button
                      onClick={onToggleTorch}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        deviceStatus.torchOn
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {deviceStatus.torchOn ? 'TURN OFF' : 'TURN ON'}
                    </button>
                  </div>
                )}

                {/* 2. Microphone Mute / Unmute */}
                {isMatch('mic mute microphone audio listening') && (
                  <div className="p-3.5 rounded-2xl bg-[#090f1e] border border-cyan-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                        isMicMuted ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      }`}>
                        {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">Microphone Input</div>
                        <div className="text-[10px] text-slate-400">{isMicMuted ? 'Audio stream muted' : 'Microphone audio active'}</div>
                      </div>
                    </div>
                    <button
                      onClick={onToggleMute}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        isMicMuted
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}
                    >
                      {isMicMuted ? 'UNMUTE' : 'MUTE'}
                    </button>
                  </div>
                )}

                {/* 3. Owner Voice Lock (ASIK ONLY) */}
                {isMatch('voice lock asik owner biometric speaker authentication') && (
                  <div className="p-3.5 rounded-2xl bg-[#090f1e] border border-cyan-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">Voice Lock (ASIK ONLY)</div>
                        <div className="text-[10px] text-slate-400">Owner voice authentication & anti-spoof</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenVoiceLock();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold transition-all"
                    >
                      CONFIGURE
                    </button>
                  </div>
                )}

                {/* 4. Barge-In / Interrupt Voice */}
                {isMatch('interrupt barge in stop speaking speech') && (
                  <div className="p-3.5 rounded-2xl bg-[#090f1e] border border-cyan-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 flex items-center justify-center">
                        <VolumeX className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">Interrupt Playback</div>
                        <div className="text-[10px] text-slate-400">Instantly halt assistant audio output</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onInterruptAi?.()}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 text-xs font-semibold transition-all"
                    >
                      INTERRUPT
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* CATEGORY 2: VOICE ENGINE */}
          {(activeCategory === 'voice_engine' || searchQuery) && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs border-b border-cyan-950 pb-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Voice Engine & Diagnostics</span>
              </div>

              {/* Engine Switcher */}
              {isMatch('live audio engine 24khz fallback stt tts speech') && (
                <div>
                  <label className="text-slate-300 font-semibold block mb-2">
                    Primary Voice Architecture
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div
                      onClick={() => onUpdatePreferences({ voiceEngine: 'live_audio', audioToAudioEnabled: true })}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        preferences.voiceEngine !== 'fallback_stt_tts'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : 'bg-[#090f1e] border-slate-800 text-slate-400 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          Live Audio-to-Audio (24kHz)
                        </span>
                        {preferences.voiceEngine !== 'fallback_stt_tts' && <Check className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <p className="text-[11px] opacity-80">Bidirectional 24kHz audio stream with zero-delay interruption</p>
                    </div>

                    <div
                      onClick={() => onUpdatePreferences({ voiceEngine: 'fallback_stt_tts', audioToAudioEnabled: false })}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        preferences.voiceEngine === 'fallback_stt_tts'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : 'bg-[#090f1e] border-slate-800 text-slate-400 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-100">Standard Voice (STT/TTS)</span>
                        {preferences.voiceEngine === 'fallback_stt_tts' && <Check className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <p className="text-[11px] opacity-80">Browser Web Speech API fallback pipeline</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sensitivity & Modes */}
              {isMatch('vad sensitivity detection continuous wakeword push') && (
                <div className="space-y-3 bg-[#090f1e] p-4 rounded-2xl border border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold">
                      Voice Activity Detection (VAD) Sensitivity ({preferences.vadSensitivity || 3}/5)
                    </label>
                    <span className="text-cyan-400 font-bold">
                      {preferences.vadSensitivity === 5 ? 'Ultra-High' : preferences.vadSensitivity === 1 ? 'Low' : 'Balanced'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={preferences.vadSensitivity || 3}
                    onChange={(e) => onUpdatePreferences({ vadSensitivity: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    Determines speech barge-in threshold during active playback.
                  </p>

                  <div className="pt-2">
                    <label className="text-slate-300 font-semibold block mb-1.5">Summon Wake Word</label>
                    <input
                      type="text"
                      value={preferences.wakeWord}
                      onChange={(e) => onUpdatePreferences({ wakeWord: e.target.value })}
                      className="w-full bg-[#050811] border border-cyan-500/30 px-3 py-2 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-400"
                      placeholder="ULTRON"
                    />
                  </div>
                </div>
              )}

              {/* Embedded Voice Pipeline Telemetry Panel */}
              {isMatch('pipeline telemetry diagnostics 10 stage test audio') && (
                <div>
                  <div className="text-slate-300 font-semibold mb-2">Voice Pipeline Telemetry & Self-Test</div>
                  <VoicePipelineDiagnosticsPanel 
                    onRunTestUtterance={(testPrompt) => onExecuteCommand(testPrompt, true)}
                  />
                </div>
              )}
            </section>
          )}

          {/* CATEGORY 3: DEVICE STATUS */}
          {(activeCategory === 'device_status' || searchQuery) && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs border-b border-cyan-950 pb-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Device Telemetry & Hardware Status</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Battery Card */}
                {isMatch('battery power charging percentage') && (
                  <div className="p-3.5 rounded-2xl bg-[#090f1e] border border-cyan-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
                        {deviceStatus.isCharging ? <BatteryCharging className="w-4 h-4 text-cyan-400" /> : <Battery className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">Battery Level</div>
                        <div className="text-[10px] text-slate-400">
                          {(deviceStatus.batteryLevel * 100).toFixed(0)}% • {deviceStatus.isCharging ? 'Charging' : 'Discharging'}
                        </div>
                      </div>
                    </div>
                    {onCheckBattery && (
                      <button
                        onClick={onCheckBattery}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold"
                      >
                        ANNOUNCE
                      </button>
                    )}
                  </div>
                )}

                {/* Screen Inspector */}
                {isMatch('screen inspector inspect ui elements reader') && (
                  <div className="p-3.5 rounded-2xl bg-[#090f1e] border border-cyan-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">Screen OCR & Inspector</div>
                        <div className="text-[10px] text-slate-400">Inspect accessible elements</div>
                      </div>
                    </div>
                    {onInspectScreen && (
                      <button
                        onClick={() => {
                          onClose();
                          onInspectScreen();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold"
                      >
                        INSPECT
                      </button>
                    )}
                  </div>
                )}

                {/* Haptic Vibration */}
                {isMatch('vibration haptic motor') && (
                  <div className="p-3.5 rounded-2xl bg-[#090f1e] border border-cyan-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
                        <Vibrate className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">Haptic Engine</div>
                        <div className="text-[10px] text-slate-400">Trigger test vibration pulse</div>
                      </div>
                    </div>
                    {onTriggerVibration && (
                      <button
                        onClick={onTriggerVibration}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold"
                      >
                        PULSE
                      </button>
                    )}
                  </div>
                )}

                {/* Network & Screen Wake */}
                {isMatch('network wifi screen awake') && (
                  <div className="p-3.5 rounded-2xl bg-[#090f1e] border border-cyan-500/20 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Network & Connectivity</div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Online • Ultra-Low Latency WebSocket
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* CATEGORY 4: COMMANDS */}
          {(activeCategory === 'commands' || searchQuery) && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs border-b border-cyan-950 pb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Jarvis Suggested Commands & Shortcuts</span>
              </div>

              {/* Direct Command Runner */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickCmdInput}
                  onChange={(e) => setQuickCmdInput(e.target.value)}
                  placeholder="Type any custom directive to execute..."
                  className="flex-1 bg-[#050811] border border-cyan-500/30 px-3 py-2 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && quickCmdInput.trim()) {
                      handleRunCommand(quickCmdInput.trim());
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (quickCmdInput.trim()) {
                      handleRunCommand(quickCmdInput.trim());
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-semibold"
                >
                  EXECUTE
                </button>
              </div>

              {/* Suggested Chips List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {suggestedCommands
                  .filter((cmd) => isMatch(cmd.label + ' ' + cmd.desc))
                  .map((cmd, idx) => (
                    <div
                      key={`cmd-${cmd.label}-${idx}`}
                      onClick={() => handleRunCommand(cmd.prompt)}
                      className="p-3 rounded-2xl bg-[#090f1e] hover:bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-cyan-300">{cmd.label}</div>
                        <div className="text-[10px] text-slate-400">{cmd.desc}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* CATEGORY 5: AI & API */}
          {(activeCategory === 'ai_api' || searchQuery) && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs border-b border-cyan-950 pb-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Gemini API & Intelligence Configuration</span>
              </div>

              {isMatch('gemini api key token ai flash live audio') && (
                <div className="space-y-3 bg-[#090f1e] p-4 rounded-2xl border border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-200">Custom Gemini API Key</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Stored securely inside this device's local storage.
                      </p>
                    </div>
                    {apiKeyInput.trim() ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                        CONFIGURED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                        DEFAULT ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Paste AI Studio Gemini API Key (AIzaSy...)"
                      className="w-full bg-[#050811] border border-cyan-500/30 px-3 py-2.5 pr-10 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={handleSaveApiKey}
                      className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-semibold"
                    >
                      SAVE KEY TO DEVICE
                    </button>
                    {apiKeyInput && (
                      <button
                        onClick={() => {
                          setApiKeyInput('');
                          localStorage.removeItem('ultron_gemini_api_key');
                          setKeySaveMessage('API Key cleared.');
                        }}
                        className="text-red-400 hover:text-red-300 text-[11px]"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>

                  {keySaveMessage && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px]">
                      {keySaveMessage}
                    </div>
                  )}
                </div>
              )}

              {/* Context Memory */}
              {isMatch('memory facts context facts stored clear') && (
                <div className="space-y-3 bg-[#090f1e] p-4 rounded-2xl border border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-200">Context Memory Facts</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{contextFacts.length} personal facts remembered</p>
                    </div>
                    {contextFacts.length > 0 && (
                      <button
                        onClick={onClearMemory}
                        className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] hover:bg-red-500/30"
                      >
                        CLEAR MEMORY
                      </button>
                    )}
                  </div>

                  {contextFacts.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No context facts stored yet. Speak to ULTRON to build memory.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {contextFacts.map((fact, idx) => (
                        <div key={`fact-${idx}-${fact.slice(0, 15)}`} className="p-2 rounded-lg bg-[#050811] border border-slate-800 text-slate-300 text-[11px]">
                          • {fact}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* CATEGORY 6: TOOLS & FEATURES */}
          {(activeCategory === 'tools_features' || searchQuery) && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs border-b border-cyan-950 pb-1.5">
                <Wrench className="w-3.5 h-3.5" />
                <span>All ULTRON Subsystems & Workspaces</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {toolsAndFeatures
                  .filter((t) => isMatch(t.label + ' ' + t.desc))
                  .map((tool) => {
                    const IconComponent = tool.icon;
                    return (
                      <div
                        key={tool.id}
                        onClick={() => handleSelectTool(tool.id)}
                        className="p-3.5 rounded-2xl bg-[#090f1e] hover:bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200 group-hover:text-cyan-300">{tool.label}</div>
                            <div className="text-[10px] text-slate-400">{tool.desc}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* CATEGORY 7: ABOUT */}
          {(activeCategory === 'about' || searchQuery) && (
            <section className="space-y-3 bg-[#090f1e] p-5 rounded-2xl border border-cyan-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-cyber font-bold text-white text-base">ULTRON v2.5 AI</h3>
                  <p className="text-[11px] text-slate-400">Android Jarvis Core Assistant</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 text-[11px]">
                <div className="p-2.5 rounded-xl bg-[#050811] border border-slate-800">
                  <div className="text-slate-400">Version</div>
                  <div className="font-bold text-cyan-400 mt-0.5">v2.5 AI</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#050811] border border-slate-800">
                  <div className="text-slate-400">Owner Biometrics</div>
                  <div className="font-bold text-emerald-400 mt-0.5">ASIK Enclave Active</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#050811] border border-slate-800">
                  <div className="text-slate-400">Audio Architecture</div>
                  <div className="font-bold text-slate-200 mt-0.5">24kHz Bidirectional Live</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#050811] border border-slate-800">
                  <div className="text-slate-400">Platform</div>
                  <div className="font-bold text-slate-200 mt-0.5">Capacitor Android Hybrid</div>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
};
