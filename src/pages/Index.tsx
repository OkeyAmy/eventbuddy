'use client';

import { useState, useEffect, lazy, Suspense } from 'react';

const PrismBg = lazy(() => import('@/components/ui/prism'));

const Index = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [email, setEmail] = useState('');
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    document.title = 'EventBuddy AI — Discord Event Bot for Events | CSV Import, Channels, Analytics, AI Q&A';

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    if (meta) {
      meta.setAttribute(
        'content',
        'EventBuddy is an AI-powered Discord event bot that imports attendees from CSV, auto-creates channels, provides analytics, and answers event questions. Set up your next hackathon, meetup, or community launch in minutes.'
      );
    }

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', window.location.origin + '/');
      document.head.appendChild(canonical);
    }

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'EventBuddy AI - Discord Event Bot',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0' },
      description:
        'AI-powered Discord bot for events: CSV attendee import, channel automation, server analytics, and natural-language Q&A for participants.'
    } as const;

    let ldScript = document.getElementById('ld-json-eventbuddy') as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.type = 'application/ld+json';
      ldScript.id = 'ld-json-eventbuddy';
      ldScript.textContent = JSON.stringify(ld);
      document.head.appendChild(ldScript);
    } else {
      ldScript.textContent = JSON.stringify(ld);
    }
  }, []);

  // Defer heavy WebGL background until the browser is idle
  const [showPrism, setShowPrism] = useState(false);
  useEffect(() => {
    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: any) => number)
      | undefined;
    if (ric) {
      const id = ric(() => setShowPrism(true), { timeout: 2000 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setShowPrism(true), 300);
    return () => clearTimeout(t);
  }, []);

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitStatus('loading');

    try {
      // Use API URL from environment variable (required in production)
      const apiUrl = (import.meta as any).env.VITE_API_URL || (import.meta as any).env.VITE_BACKEND_URL;
      const isDev = (import.meta as any).env.DEV;
      const resolvedBase = apiUrl ? String(apiUrl).replace(/\/$/, '') : (isDev ? 'http://localhost:3000' : '');

      if (!resolvedBase) {
        console.error('Missing VITE_API_URL in production. Set it to your Railway base URL.');
        setSubmitStatus('error');
        setSubmitMessage('Server not configured. Please try again shortly.');
        return;
      }

      const endpoint = `${resolvedBase}/api/submit-email`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          forwardTo: 'amaobiokeoma@gmail.com',
          timestamp: new Date().toISOString(),
          source: 'EventBuddy Landing Page'
        }),
      });

      const text = await response.text().catch(() => '');
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}

      if (response.ok && data?.success) {
        setSubmitStatus('success');
        setSubmitMessage("Perfect! Check your email - I'll reach out within 48hrs with a private demo link.");
        setEmail('');
      } else {
        setSubmitStatus('error');
        setSubmitMessage('Unable to send right now. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background: lightweight gradient first; lazy WebGL after idle */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1220] via-[#101827] to-[#1f2937]" />
        {showPrism && (
          <Suspense fallback={<div className="absolute inset-0" />}>
            <PrismBg
              animationType="rotate"
              timeScale={0.2}
              height={3.5}
              baseWidth={1.5}
              scale={4.6}
              hueShift={-0.5}
              colorFrequency={1}
              noise={0}
              glow={0.5}
              suspendWhenOffscreen={true}
            />
          </Suspense>
        )}
      </div>
      
      {/* Top glass nav pill - Mobile optimized */}
      <div className="fixed top-4 md:top-6 left-1/2 transform -translate-x-1/2 z-30 px-4">
        <div className="rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-3 md:px-4 py-1.5 md:py-2 shadow-lg shadow-black/20 flex items-center gap-2 min-w-max">
          <span className="inline-flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex-shrink-0">
            <svg className="h-3 w-3 md:h-4 md:w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          </span>
          <span className="font-medium text-white/85 font-sans whitespace-nowrap text-sm md:text-base">EventBuddy</span>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-20 flex flex-col items-center text-center">
        {/* Social Proof Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-sm text-green-300 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            1,200+ events powered • 50K+ attendees managed
          </span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white drop-shadow-[0_1px_12px_rgba(0,0,0,0.25)] max-w-4xl font-sans px-4">
          Stop losing attendees to manual event management
        </h1>

        <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mt-4 md:mt-6 mb-6 md:mb-8 leading-relaxed font-sans px-4">
          <strong className="text-white">Save 10+ hours per event.</strong> Upload attendee lists, auto-create channels, get real-time analytics, and let AI handle all event questions – while you focus on what matters.
        </p>

        {/* Primary CTA with urgency */}
        <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-4 justify-center px-4 items-center">
          <button
            onClick={handleDiscordConnect}
            disabled={isConnecting}
            className="px-8 md:px-10 py-4 md:py-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3 w-full sm:w-auto group transform hover:scale-105"
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
                <svg className="h-5 w-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Start Free Setup (2 min)
              </>
            )}
          </button>
          
          {/* Secondary CTA - Demo button */}
          <div className="text-white/60 text-sm">or</div>
          <button
            onClick={() => { setShowDemoPanel(true); setSubmitStatus('idle'); setSubmitMessage(''); }}
            className="px-6 py-3 rounded-full font-medium transition-all duration-200 whitespace-nowrap backdrop-blur-sm border border-white/20 bg-white/20 hover:bg-white/30 text-white w-full sm:w-auto"
          >
            Get Demo
          </button>
        </div>

        {/* Trust signals */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 text-sm text-white/70 px-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Free forever
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secure & safe
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No coding needed
          </div>
        </div>

        {/* Key Features - Enhanced with urgency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-12 md:mt-16 max-w-6xl mx-auto px-4">
          <div className="text-center bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2 font-sans text-base md:text-lg">Instant CSV Import</h3>
            <p className="text-white/70 text-sm md:text-base font-sans leading-relaxed">Bulk-import <strong className="text-white/90">1000+ attendees</strong> and auto-create roles in under 30 seconds.</p>
          </div>
          
          <div className="text-center bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2 font-sans text-base md:text-lg">Zero-Risk Setup</h3>
            <p className="text-white/70 text-sm md:text-base font-sans leading-relaxed">Owner-only controls with confirmations. <strong className="text-white/90">Never breaks</strong> mid-event.</p>
          </div>
          
          <div className="text-center bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2 font-sans text-base md:text-lg">Smart AI Assistant</h3>
            <p className="text-white/70 text-sm md:text-base font-sans leading-relaxed">Answer <strong className="text-white/90">100+ questions</strong> instantly. Reduces mod workload by 80%.</p>
          </div>
        </div>

        {/* Testimonial Section */}
        <div className="max-w-4xl mx-auto mt-12 md:mt-16 px-4">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 md:p-8 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-1 mb-4 justify-center">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-white/90 text-lg md:text-xl font-medium text-center mb-4 italic">
              "EventBuddy saved us 6+ hours of manual setup for our 500-person hackathon. The CSV import and auto-channels worked flawlessly."
            </blockquote>
                         <div className="text-center">
               <div className="text-white font-semibold">Sarah Chen</div>
               <div className="text-white/60 text-sm">Event Director, TechHacks 2025</div>
             </div>
          </div>
        </div>
        
        {/* FAQ (compact, SEO-friendly) */}
        <div className="max-w-3xl mx-auto mt-12 md:mt-16 px-4 space-y-4">
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-left hover:bg-white/8 transition-all">
            <h2 className="text-white font-semibold text-lg md:text-xl mb-2">What is EventBuddy?</h2>
            <p className="text-white/70 text-sm md:text-base">EventBuddy is an AI Discord event bot that automates attendee import, channel setup, analytics, and Q&A so you can run smooth, high-engagement events in under 5 minutes.</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-left hover:bg-white/8 transition-all">
            <h2 className="text-white font-semibold text-lg md:text-xl mb-2">Is it free to install?</h2>
            <p className="text-white/70 text-sm md:text-base">Yes, completely free forever. You can add the bot to any Discord server at no cost. Owner-only permissions keep your setup safe and secure.</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-left hover:bg-white/8 transition-all">
            <h2 className="text-white font-semibold text-lg md:text-xl mb-2">Who is it for?</h2>
            <p className="text-white/70 text-sm md:text-base">Communities, hackathons, meetups, cohorts, and product launches that run on Discord and need reliable event operations. Perfect for 50-5000+ attendees.</p>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 md:mt-16 text-center">
          <button
            onClick={handleDiscordConnect}
            disabled={isConnecting}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            {isConnecting ? 'Connecting...' : 'Join 1,200+ Events Using EventBuddy →'}
          </button>
          <p className="text-white/60 text-sm mt-3">Setup takes under 2 minutes • No credit card required</p>
        </div>
        
        {/* Footer */}
        <div className="mt-16 text-center text-white/60 font-sans">
          <a href="/terms" className="text-white/60 hover:text-white/80 transition-colors duration-200 mx-3">
            Terms of Service
          </a>
          <span className="mx-2">·</span>
          <a href="/privacy" className="text-white/60 hover:text-white/80 transition-colors duration-200 mx-3">
            Privacy Policy
          </a>
        </div>
      </div>

      {/* Demo Panel (modal) */}
      {showDemoPanel && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDemoPanel(false)} />
          <div className="relative z-50 w-full max-w-md rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 text-left shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-lg font-semibold">Request a demo</h3>
              <button onClick={() => setShowDemoPanel(false)} className="text-white/70 hover:text-white text-xl leading-none">×</button>
            </div>

            {submitStatus === 'success' ? (
              <div className="text-white/90">
                <p className="mb-4">Check your email. I’ll reach out within 48hrs.</p>
                <button
                  onClick={() => { setShowDemoPanel(false); setSubmitStatus('idle'); }}
                  className="px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white w-full"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <p className="text-white/80 text-sm">Drop your email. I’ll follow up personally.</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm w-full"
                  required
                />
                <button
                  type="submit"
                  disabled={submitStatus === 'loading'}
                  className="w-full px-5 py-3 rounded-full font-semibold transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitStatus === 'loading' ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Request Demo'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;