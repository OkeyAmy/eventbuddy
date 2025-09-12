'use client';

import { useState } from 'react';
import Prism from '@/components/ui/prism';

const Index = () => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleDiscordConnect = async () => {
    setIsConnecting(true);
    try {
      const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID as string | undefined;
      if (!clientId) {
        throw new Error('Missing VITE_DISCORD_CLIENT_ID');
      }
      const permissions = '8';
      const scopes = 'bot applications.commands';
      const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${encodeURIComponent(scopes)}`;
      window.location.href = inviteUrl;
    } catch (error) {
      console.error('Failed to connect to Discord:', error);
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Prism Background (kept) */}
      <div className="fixed inset-0 z-0">
        <Prism
          animationType="rotate"
          timeScale={0.2}
          height={3.5}
          baseWidth={1.5}
          scale={4.6}
          hueShift={-0.5}
          colorFrequency={1}
          noise={0}
          glow={0.5}
        />
      </div>
      
      {/* Top glass nav pill */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-30">
        <div className="rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-2 shadow-lg shadow-black/20 flex items-center gap-2 min-w-max">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex-shrink-0">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          </span>
          <span className="font-medium text-white/85 font-sans whitespace-nowrap">EventBuddy</span>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-20 flex flex-col items-center text-center">
        <div className="mb-6">
          {/* <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
            AI Event Bot
          </span> */}
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white drop-shadow-[0_1px_12px_rgba(0,0,0,0.25)] max-w-4xl font-sans">
          AI Discord Event Bot
        </h1>

        <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mt-6 mb-8 leading-relaxed font-sans">
          Transform Discord servers into event management hubs. Import attendees from CSV, create channels automatically, get analytics, and let AI handle event questions naturally.
        </p>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleDiscordConnect}
            disabled={isConnecting}
            className="px-8 py-4 rounded-full bg-white text-slate-900 font-semibold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting to Discord...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Add to Discord Server
              </>
            )}
          </button>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2 font-sans">CSV Import</h3>
            <p className="text-white/70 text-sm font-sans">Upload attendee lists and auto-create event records with one command</p>
          </div>
          
            <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2 font-sans">Owner-Only Controls</h3>
            <p className="text-white/70 text-sm font-sans">Secure admin commands for server owners with confirmation prompts</p>
            </div>
          
            <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2 font-sans">Smart AI Responses</h3>
            <p className="text-white/70 text-sm font-sans">Answers event questions naturally, stays silent otherwise</p>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Index;