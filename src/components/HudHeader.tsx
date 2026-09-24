import React from 'react';
import { Settings, Zap, ArrowLeft } from 'lucide-react';
import { ViewTab } from '../types';

interface HudHeaderProps {
  activeTab?: ViewTab;
  onOpenSettings: () => void;
  onBackToMain?: () => void;
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  activeTab = 'orb_hud',
  onOpenSettings,
  onBackToMain,
}) => {
  return (
    <header className="w-full bg-[#070b14]/90 backdrop-blur-md border-b border-cyan-950/40 px-4 py-3 z-40 select-none">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand: Logo & ULTRON Title */}
        <div className="flex items-center gap-3">
          {activeTab !== 'orb_hud' && onBackToMain && (
            <button
              onClick={onBackToMain}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono-code transition-all"
              title="Return to Main Voice HUD"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>HUD</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center relative overflow-hidden shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Zap className="w-4 h-4 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-400/10 blur-sm pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cyber font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-white text-base">
                  ULTRON
                </span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-md font-semibold tracking-wider">
                  v2.5 AI
                </span>
              </div>
              <div className="text-[9px] font-mono-code text-slate-400 uppercase tracking-widest">
                ANDROID JARVIS CORE
              </div>
            </div>
          </div>
        </div>

        {/* Right: Settings Icon */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)] active:scale-95"
          title="Open Settings & Control Center"
        >
          <Settings className="w-5 h-5 text-cyan-400 hover:rotate-45 transition-transform duration-300" />
        </button>
      </div>
    </header>
  );
};
