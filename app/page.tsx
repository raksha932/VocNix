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

      {/* Subscription & Event Passes Pricing Section */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            TRANSPARENT PASSES & QUOTAS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Flexible Subscription & Event Passes
          </h2>
          <p className="text-sm text-slate-400">
            Choose the right pass for your technical tests, single-session seminars, or full-day multi-track summits.
          </p>
        </div>

        {/* Desktop Pricing Table */}
        <div className="hidden lg:block overflow-hidden border border-slate-800 rounded-2xl bg-slate-950/70">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 tracking-wider bg-slate-900/50">
                <th className="py-4 px-6">Plan</th>
                <th className="py-4 px-6">Price (INR)</th>
                <th className="py-4 px-6">Duration & Quotas</th>
                <th className="py-4 px-6">Key Capabilities</th>
                <th className="py-4 px-6 text-right">Get Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              <tr className="hover:bg-slate-900/40 transition">
                <td className="py-5 px-6 font-bold text-white whitespace-nowrap align-top">
                  Free Starter Pass
                </td>
                <td className="py-5 px-6 font-extrabold text-white text-base align-top whitespace-nowrap">
                  ₹0
                </td>
                <td className="py-5 px-6 align-top">
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li>• Up to <strong className="text-white">1 Hour</strong> live audio</li>
                    <li>• Max <strong className="text-white">1 Event / day</strong></li>
                    <li>• Up to <strong className="text-white">25 Listeners</strong></li>
                  </ul>
                </td>
                <td className="py-5 px-6 text-xs text-slate-300 max-w-xs align-top leading-relaxed">
                  Dry-runs, technical tests, soundchecks, 1-on-1 translator trials
                </td>
                <td className="py-5 px-6 text-right align-top whitespace-nowrap">
                  <Link
                    href="/dashboard"
                    className="py-2 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition inline-block border border-slate-700"
                  >
                    Start Free
                  </Link>
                </td>
              </tr>

              <tr className="hover:bg-slate-900/40 transition bg-emerald-500/[0.03]">
                <td className="py-5 px-6 font-bold text-white whitespace-nowrap align-top">
                  <div className="flex items-center space-x-2">
                    <span>Single Event Pass</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Popular
                    </span>
                  </div>
                </td>
                <td className="py-5 px-6 font-extrabold text-white text-base align-top whitespace-nowrap">
                  ₹2,999 <span className="text-xs font-normal text-slate-400">(+ GST)</span>
                </td>
                <td className="py-5 px-6 align-top">
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li>• Up to <strong className="text-white">3 Hours</strong> live audio</li>
                    <li>• Max <strong className="text-white">1 Event / day</strong></li>
                    <li>• Up to <strong className="text-white">150 Listeners</strong></li>
                  </ul>
                </td>
                <td className="py-5 px-6 text-xs text-slate-300 max-w-xs align-top leading-relaxed">
                  Product launches, keynotes, single-session seminars, town halls
                </td>
                <td className="py-5 px-6 text-right align-top whitespace-nowrap">
                  <Link
                    href="/dashboard"
                    className="py-2 px-4 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition inline-block shadow-lg shadow-emerald-500/20"
                  >
                    Select Pass
                  </Link>
                </td>
              </tr>

              <tr className="hover:bg-slate-900/40 transition">
                <td className="py-5 px-6 font-bold text-white whitespace-nowrap align-top">
                  Full Day Pass
                </td>
                <td className="py-5 px-6 font-extrabold text-white text-base align-top whitespace-nowrap">
                  ₹7,999 <span className="text-xs font-normal text-slate-400">(+ GST)</span>
                </td>
                <td className="py-5 px-6 align-top">
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li>• Up to <strong className="text-white">8 Hours</strong> live audio</li>
                    <li>• <strong className="text-white">Unlimited events per day</strong></li>
                    <li>• Up to <strong className="text-white">500 Listeners</strong></li>
                  </ul>
                </td>
                <td className="py-5 px-6 text-xs text-slate-300 max-w-xs align-top leading-relaxed">
                  Full-day corporate conferences, medical summits, trade meets
                </td>
                <td className="py-5 px-6 text-right align-top whitespace-nowrap">
                  <Link
                    href="/dashboard"
                    className="py-2 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition inline-block border border-slate-700"
                  >
                    Select Pass
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:hidden gap-5">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white">Free Starter Pass</h3>
              <div className="text-2xl font-black text-white">₹0</div>
              <ul className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li>• Up to 1 Hour live audio</li>
                <li>• Max 1 Event / day</li>
                <li>• Up to 25 Listeners</li>
              </ul>
              <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                Dry-runs, technical tests, soundchecks, 1-on-1 translator trials
              </p>
            </div>
            <Link
              href="/dashboard"
              className="w-full text-center py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition block"
            >
              Start Free
            </Link>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Single Event Pass</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Popular
                </span>
              </div>
              <div className="text-2xl font-black text-white">₹2,999 <span className="text-xs text-slate-400 font-normal">(+ GST)</span></div>
              <ul className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li>• Up to 3 Hours live audio</li>
                <li>• Max 1 Event / day</li>
                <li>• Up to 150 Listeners</li>
              </ul>
              <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                Product launches, keynotes, single-session seminars, town halls
              </p>
            </div>
            <Link
              href="/dashboard"
              className="w-full text-center py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition block shadow-lg shadow-emerald-500/20"
            >
              Select Pass
            </Link>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white">Full Day Pass</h3>
              <div className="text-2xl font-black text-white">₹7,999 <span className="text-xs text-slate-400 font-normal">(+ GST)</span></div>
              <ul className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li>• Up to 8 Hours live audio</li>
                <li>• Unlimited events per day</li>
                <li>• Up to 500 Listeners</li>
              </ul>
              <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                Full-day corporate conferences, medical summits, trade meets
              </p>
            </div>
            <Link
              href="/dashboard"
              className="w-full text-center py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition block"
            >
              Select Pass
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
