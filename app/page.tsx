import Link from 'next/link';
import { Radio, Mic, Headphones, ShieldCheck, Zap, Server, ArrowRight, Activity, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>PRODUCTION-GRADE LIVEKIT & WEBRTC AUDIO PLATFORM</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Real-Time Human Audio Translation for Global Events
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
          Zero fake audio. Zero static rooms. A unified multi-tenant platform delivering live browser microphone
          WebRTC audio directly from human translators to audience members worldwide.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center space-x-2 transition shadow-lg shadow-emerald-500/20"
          >
            <Activity className="w-5 h-5" />
            <span>Open Admin Dashboard</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            href="/api/health"
            target="_blank"
            className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center space-x-2 transition border border-slate-700"
          >
            <Server className="w-5 h-5 text-blue-400" />
            <span>Health & Diagnostics API</span>
          </Link>
        </div>
      </section>

      {/* Audio Pipeline Architecture Diagram */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white tracking-wide">Real-Time Audio Pipeline Architecture</h2>
          <p className="text-sm text-slate-400">Strict end-to-end WebRTC audio path with dynamic SFU room isolation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          {/* Step 1 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Mic className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-white">Translator Mic</div>
            <div className="text-xs text-slate-400">MediaStream with Echo Cancellation & Noise Suppression</div>
          </div>

          <div className="hidden md:flex justify-center text-slate-600">
            <ArrowRight className="w-6 h-6 animate-pulse" />
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-white">LiveKit SFU</div>
            <div className="text-xs text-slate-400">Server-minted JWT with strict publisher/subscriber scoping</div>
          </div>

          <div className="hidden md:flex justify-center text-slate-600">
            <ArrowRight className="w-6 h-6 animate-pulse" />
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-white">Audience Output</div>
            <div className="text-xs text-slate-400">No login required. Autoplay-compliant &quot;Tap to Listen&quot;</div>
          </div>
        </div>
      </section>

      {/* Production Guarantees */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Dynamic Language Channels</h3>
          <p className="text-sm text-slate-400">
            Rooms are never hardcoded. When an event is scheduled with Tamil, Hindi, and French, the backend dynamically mints isolated WebRTC rooms with zero cross-talk leakage.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Authoritative Usage & Billing</h3>
          <p className="text-sm text-slate-400">
            Translation minutes are recorded using authoritative database timestamps (started_at & ended_at). Sessions are strictly blocked once subscription quotas are reached.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Audio-Only Human Translation</h3>
          <p className="text-sm text-slate-400">
            Strictly dedicated to human translators. No synthetic AI voices, no video overhead, and no simulated audio streams.
          </p>
        </div>
      </section>
    </div>
  );
}
