'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radio,
  Mic,
  Headphones,
  Globe,
  Users,
  Calendar,
  UserCheck,
  Activity,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Sliders,
} from 'lucide-react';

export default function AdminLandingPage({ initialIsLoggedIn = false }: { initialIsLoggedIn?: boolean }) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(() => {});
  }, []);

  const getStartedUrl = isLoggedIn ? '/dashboard' : '/admin/signup';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-24">
      {/* ======================================================== */}
      {/* HERO SECTION                                             */}
      {/* ======================================================== */}
      <section className="text-center space-y-6 pt-4 sm:pt-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
          <span>REAL-TIME HUMAN AUDIO TRANSLATION</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
          Real-Time Human Audio Translation for Global Events
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Connect professional human interpreters with live audience members worldwide through ultra-low latency browser audio.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href={getStartedUrl}
            className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-base flex items-center space-x-2 transition shadow-lg shadow-emerald-500/20"
          >
            <Sparkles className="w-5 h-5" />
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>WebRTC Audio Streaming</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Zero-Install Listener Access</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Isolated Language Channels</span>
          </span>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 1. ABOUT SECTION                                         */}
      {/* ======================================================== */}
      <section id="about" className="scroll-mt-24 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" />
            <span>About VocNix</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Real-Time, Audio-Only Human Translation
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            VocNix is a real-time, audio-only human translation platform designed for conferences, summits, and multilingual events. It bridges live speakers and international attendees by streaming authentic human translation directly to browsers with ultra-low latency.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Capability 1 */}
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm hover:border-emerald-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Worldwide Audience Reach</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Connects professional human translators directly with a worldwide audience during live events.
            </p>
          </div>

          {/* Capability 2 */}
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm hover:border-blue-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">WebRTC Audio Streaming</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Uses WebRTC for real-time audio streaming, delivering crisp, instantaneous sound with ultra-low delay.
            </p>
          </div>

          {/* Capability 3 */}
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm hover:border-purple-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Separate Language Channels</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Supports multiple languages simultaneously through dedicated, isolated language audio channels.
            </p>
          </div>

          {/* Capability 4 */}
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm hover:border-amber-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero-Install Browser Access</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Allows audiences to listen through a web browser without creating an account or installing an app.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. FEATURES SECTION                                      */}
      {/* ======================================================== */}
      <section id="features" className="scroll-mt-24 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Built for Flawless Multilingual Events
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Explore the core technical capabilities and management tools built into the VocNix platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1: Real-Time Audio Translation */}
          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Real-Time Audio Translation</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Live audio streaming between human translators and audiences using WebRTC.
            </p>
          </div>

          {/* Feature 2: Dynamic Language Channels */}
          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Dynamic Language Channels</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Separate audio rooms for languages such as Tamil, Hindi, and French.
            </p>
          </div>

          {/* Feature 3: Translator Console */}
          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Translator Console</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Microphone access, live audio level monitoring, pause, resume, and stop controls.
            </p>
          </div>

          {/* Feature 4: Audience Access */}
          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Audience Access</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Listen through a dedicated link or QR code without login or app installation.
            </p>
          </div>

          {/* Feature 5: Event Management */}
          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Event Management</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Create, edit, and manage events and their language channels.
            </p>
          </div>

          {/* Feature 6: Translator Management */}
          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Translator Management</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Add, remove, and assign translators to language channels.
            </p>
          </div>

          {/* Feature 7: Live Audience Monitoring */}
          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Live Audience Monitoring</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Monitor connected listeners and translation usage.
            </p>
          </div>

          {/* Feature 8: Super Admin Management */}
          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Super Admin Management</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Manage organizations, monitor broadcasts, view revenue information, and control subscription plans.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. SUPPORT SECTION                                       */}
      {/* ======================================================== */}
      <section id="support" className="scroll-mt-24 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Support</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Platform Support & Assistance
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Guidance and technical assistance for organizations, administrators, and translators using the VocNix platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Event & Channel Configuration</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Assistance for organization administrators on setting up events, configuring language channels, and distributing language-specific audience links.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Translator Audio Setup</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Guidance on microphone permissions, browser soundchecks, input level monitoring, and broadcast controls inside the Translator Console.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Organization & Account Support</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Support for organization onboarding, translator directory assignments, subscription plan tiers, and broadcast usage management.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
