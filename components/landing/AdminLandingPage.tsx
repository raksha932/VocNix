import Link from 'next/link';
import {
  Radio,
  Mic,
  Headphones,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Users,
  HelpCircle,
  Mail,
  FileText,
  Globe,
  Sparkles,
} from 'lucide-react';

export default function AdminLandingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
          <span>REAL-TIME HUMAN AUDIO TRANSLATION</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
          Real-Time Human Audio Translation for Global Events
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Connect professional human interpreters with live audience members worldwide with ultra-low latency browser audio.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/admin/signup"
            className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold flex items-center space-x-2 transition shadow-lg shadow-emerald-500/20"
          >
            <Sparkles className="w-5 h-5" />
            <span>Create Organization Account</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            href="/admin/login"
            className="px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center space-x-2 transition border border-slate-300 dark:border-slate-700 shadow-sm"
          >
            <Radio className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <span>Login to Portal</span>
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="scroll-mt-24 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" />
            <span>About VocNix</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bridging Languages with Authentic Human Translation
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            VocNix is an enterprise real-time audio platform tailored for global conferences, keynotes, multilingual summits, and cross-border corporate events. Unlike synthetic voice generators, VocNix empowers professional human interpreters to deliver precise cultural nuances and live translations directly into the hands of attendees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Human-First Audio</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Dedicated to genuine human interpreters with studio-grade noise suppression, ensuring nuance and natural flow without robotic artifacts.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Zero-Install Audience Join</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Attendees simply scan an event QR code or open an event link on any browser. No app downloads, no accounts, and no hardware headsets needed.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dedicated Admin Workspace</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Complete control over your event roster, interpreter assignments, language channels, and real-time broadcast telemetry.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-24 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Features</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Designed for Flawless Real-Time Execution
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Everything your event production team needs to orchestrate multilingual live broadcasts.
          </p>
        </div>

        {/* Audio Pipeline Diagram */}
        <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">Real-Time Audio Pipeline</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Secure real-time audio delivery with isolated language sessions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {/* Step 1 */}
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Mic className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Translator Mic</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Live microphone audio with noise suppression</div>
            </div>

            <div className="hidden md:flex justify-center text-slate-400 dark:text-slate-600">
              <ArrowRight className="w-6 h-6 animate-pulse" />
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Real-Time Audio Server</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Secure access and controlled audio delivery</div>
            </div>

            <div className="hidden md:flex justify-center text-slate-400 dark:text-slate-600">
              <ArrowRight className="w-6 h-6 animate-pulse" />
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Audience Output</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Direct audience playback with zero configuration</div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Dynamic Language Channels</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Language channels are spun up dynamically for each event, keeping translator and listener audio isolated by language with instant channel switching.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Authoritative Usage & Session Tracking</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Translation minutes are recorded using authoritative database timestamps with real-time synchronized audience metrics and session management.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Human Translation Audio</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              The platform is dedicated exclusively to human translation audio, eliminating latency bottlenecks and bandwidth overhead.
            </p>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section id="support" className="scroll-mt-24 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Support & Assistance</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Here to Support Your Live Broadcasts
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Need technical guidance, custom channel provisioning, or dry-run audio checks? Our team is available to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Direct Technical Support</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Reach our engineering and support specialists for immediate event assistance or configuration questions.
              </p>
            </div>
            <a
              href="mailto:support@vocnix.com"
              className="inline-flex items-center space-x-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-2"
            >
              <span>support@vocnix.com</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Soundcheck & Dry-Runs</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Test translator headsets, calibrate input audio gain, and simulate multi-language distribution ahead of your event.
              </p>
            </div>
            <a
              href="mailto:support@vocnix.com?subject=Soundcheck%20Assistance"
              className="inline-flex items-center space-x-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-2"
            >
              <span>Request Soundcheck</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Event Operations</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Dedicated operational guidance for live event production, translator onboarding, and multi-channel configuration.
              </p>
            </div>
            <a
              href="mailto:support@vocnix.com?subject=Event%20Operations%20Assistance"
              className="inline-flex items-center space-x-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-2"
            >
              <span>Contact Operations</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
