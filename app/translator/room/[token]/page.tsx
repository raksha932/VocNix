'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Radio,
  Play,
  Pause,
  Square,
  Users,
  Clock,
  Volume2,
  AlertCircle,
  CheckCircle,
  Globe,
  Settings,
} from 'lucide-react';
import { AudioService, AudioConnectionStatus } from '@/lib/audio/AudioService';

export default function TranslatorRoomPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  // Connection & Room state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<{
    id: string;
    livekitRoomName: string;
    languageName: string;
    languageCode: string;
    eventTitle: string;
    startedAt?: string;
  } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);

  // Audio & Broadcast state
  const [broadcastState, setBroadcastState] = useState<'idle' | 'live' | 'paused' | 'stopped'>('idle');
  const [connectionStatus, setConnectionStatus] = useState<AudioConnectionStatus>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [listenerCount, setListenerCount] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Devices
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const audioServiceRef = useRef<AudioService | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize AudioService and discover audio inputs
  useEffect(() => {
    const service = new AudioService({
      onConnectionChange: (status) => setConnectionStatus(status),
      onParticipantCountChange: (count) => setListenerCount(count),
      onAudioLevelChange: (level) => setAudioLevel(level),
      onError: (err) => setError(err.message),
    });
    audioServiceRef.current = service;

    async function loadDevices() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter((d) => d.kind === 'audioinput');
          setAudioDevices(audioInputs);
          if (audioInputs.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(audioInputs[0].deviceId);
          }
        }
      } catch {}
    }
    loadDevices();

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      service.disconnect();
    };
  }, []);

  // Fetch verified room information from backend
  useEffect(() => {
    async function verifyToken() {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/livekit/translator-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secureRoomToken: token,
            translatorName: 'Translator',
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to authenticate translator session');
          setLoading(false);
          return;
        }

        setRoomData(data.room);
        setSessionId(data.sessionId);
        setLivekitToken(data.token);
        setWsUrl(data.wsUrl);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Network error authenticating room');
        setLoading(false);
      }
    }
    verifyToken();
  }, [token]);

  // Authoritative elapsed time counter
  useEffect(() => {
    if (broadcastState === 'live') {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [broadcastState]);

  // Periodic listener count sync
  useEffect(() => {
    if (!roomData?.id) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/events`);
        const data = await res.json();
        if (data.success && data.events) {
          for (const ev of data.events) {
            const foundRoom = ev.rooms?.find((r: any) => r.id === roomData.id);
            if (foundRoom) {
              setListenerCount(foundRoom.active_listener_count || 0);
              break;
            }
          }
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [roomData?.id]);

  // ==========================================================
  // TRANSLATOR CONTROLS
  // ==========================================================
  const handleStartBroadcast = async () => {
    if (!wsUrl || !livekitToken || !audioServiceRef.current) {
      setError('LiveKit connection parameters not ready.');
      return;
    }

    try {
      setError(null);
      let resolvedWsUrl = wsUrl;
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && wsUrl.includes('127.0.0.1')) {
        resolvedWsUrl = wsUrl.replace('127.0.0.1', 'localhost');
      }
      await audioServiceRef.current.connectTranslator({
        wsUrl: resolvedWsUrl,
        token: livekitToken,
        audioDeviceId: selectedDeviceId || undefined,
      });
      setBroadcastState('live');
    } catch (err: any) {
      setError(err.message || 'Failed to access microphone or connect to LiveKit');
    }
  };

  const handlePauseBroadcast = async () => {
    if (!audioServiceRef.current || !sessionId) return;
    try {
      await audioServiceRef.current.muteMicrophone();
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' }),
      });
      setBroadcastState('paused');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResumeBroadcast = async () => {
    if (!audioServiceRef.current || !sessionId) return;
    try {
      await audioServiceRef.current.unmuteMicrophone();
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });
      setBroadcastState('live');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStopBroadcast = async () => {
    if (!audioServiceRef.current || !sessionId) return;
    const confirmStop = window.confirm('Are you sure you want to stop this live translation broadcast?');
    if (!confirmStop) return;

    try {
      audioServiceRef.current.disconnect();
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      const data = await res.json();
      setBroadcastState('stopped');
      alert(`Broadcast stopped. Total duration: ${data.usageMinutes || 0} minutes.`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Authenticating translator credentials...</p>
      </div>
    );
  }

  if (error && !roomData) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900/90 border border-red-500/30 rounded-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-sm text-slate-300">{error}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Translator Control Room</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {roomData?.eventTitle}
          </h1>
          <div className="flex items-center space-x-3 text-sm text-slate-400 pt-1">
            <span className="flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Language:</span>
              <strong className="text-slate-200">{roomData?.languageName}</strong>
            </span>
            <span>•</span>
            <span className="font-mono text-xs text-slate-500">Room: {roomData?.livekitRoomName}</span>
          </div>
        </div>

        {/* Live status badge */}
        <div className="flex items-center space-x-3">
          <div
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center space-x-2 border ${
              broadcastState === 'live'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
                : broadcastState === 'paused'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : broadcastState === 'stopped'
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                broadcastState === 'live'
                  ? 'bg-emerald-400'
                  : broadcastState === 'paused'
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
            <span>{broadcastState.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Error alert if any during broadcast */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl flex items-start space-x-3 text-sm text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Live Monitoring Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Listeners */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Live Listeners</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{listenerCount}</div>
          <div className="text-xs text-slate-500">Connected to {roomData?.languageName} channel</div>
        </div>

        {/* Authoritative Timer */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Session Duration</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-black text-white">{formatTimer(elapsedSeconds)}</div>
          <div className="text-xs text-slate-500">Authoritative broadcast time</div>
        </div>

        {/* WebRTC State */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Audio Pipeline</span>
            <Radio className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white capitalize">{connectionStatus}</div>
          <div className="text-xs text-slate-500">LiveKit WebRTC Connection</div>
        </div>
      </div>

      {/* Main Broadcast Console */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Mic className="w-5 h-5 text-emerald-400" />
              <span>Microphone & Audio Input</span>
            </h2>
            {/* Device Selector */}
            {audioDevices.length > 0 && (
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Settings className="w-3.5 h-3.5" />
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  disabled={broadcastState !== 'idle'}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Real-time Audio VU Meter */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span>Microphone Input Level</span>
              </span>
              <span className="font-mono text-emerald-400">{Math.round(audioLevel * 100)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-75 ${
                  audioLevel > 0.8
                    ? 'bg-red-500'
                    : audioLevel > 0.5
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.round(audioLevel * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-800">
          {broadcastState === 'idle' && (
            <button
              onClick={handleStartBroadcast}
              className="px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base flex items-center space-x-3 transition shadow-lg shadow-emerald-500/20"
            >
              <Mic className="w-5 h-5" />
              <span>START LIVE BROADCAST</span>
            </button>
          )}

          {broadcastState === 'live' && (
            <>
              <button
                onClick={handlePauseBroadcast}
                className="px-6 py-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-sm border border-amber-500/30 flex items-center space-x-2 transition"
              >
                <Pause className="w-4 h-4" />
                <span>PAUSE (Mute Audio)</span>
              </button>

              <button
                onClick={handleStopBroadcast}
                className="px-6 py-3.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-sm border border-red-500/30 flex items-center space-x-2 transition"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>STOP BROADCAST</span>
              </button>
            </>
          )}

          {broadcastState === 'paused' && (
            <>
              <button
                onClick={handleResumeBroadcast}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center space-x-2 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME (Unmute Audio)</span>
              </button>

              <button
                onClick={handleStopBroadcast}
                className="px-6 py-3.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-sm border border-red-500/30 flex items-center space-x-2 transition"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>STOP BROADCAST</span>
              </button>
            </>
          )}

          {broadcastState === 'stopped' && (
            <div className="text-center space-y-3">
              <p className="text-sm text-slate-300 font-medium">Broadcast completed and session recorded.</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
