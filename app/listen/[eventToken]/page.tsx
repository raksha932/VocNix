'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Headphones,
  Volume2,
  VolumeX,
  Radio,
  Globe,
  AlertCircle,
  Loader2,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { AudioService, AudioConnectionStatus } from '@/lib/audio/AudioService';

interface LanguageOption {
  id: string;
  languageName: string;
  languageCode: string;
  roomId: string;
  roomStatus: string;
}

export default function AudienceListenPage() {
  const params = useParams();
  const eventToken = params?.eventToken as string;

  // Event & Language Selection State
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<{
    id: string;
    title: string;
    description?: string;
    status: string;
  } | null>(null);

  // Available languages during selection (purged once locked)
  const [availableLanguages, setAvailableLanguages] = useState<LanguageOption[]>([]);
  const [pendingSelection, setPendingSelection] = useState<LanguageOption | null>(null);

  // Strict Language Lock State
  const [isLanguageLocked, setIsLanguageLocked] = useState(false);
  const [lockedLanguage, setLockedLanguage] = useState<LanguageOption | null>(null);

  // Audio Connection State
  const [connectingAudio, setConnectingAudio] = useState(false);
  const [audioConnected, setAudioConnected] = useState(false);
  const [audioState, setAudioState] = useState<AudioConnectionStatus>('idle');
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasRemoteTrack, setHasRemoteTrack] = useState(false);
  const [listenerCount, setListenerCount] = useState<number>(0);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioServiceRef = useRef<AudioService | null>(null);
  const sessionKeyRef = useRef<string>('');
  const lockedRoomRef = useRef<string | null>(null);

  useEffect(() => {
    lockedRoomRef.current = lockedLanguage?.roomId || null;
  }, [lockedLanguage]);

  // 1. Initial Load: Fetch event metadata and check for existing language lock
  useEffect(() => {
    async function initAudiencePage() {
      if (!eventToken) return;

      try {
        setLoadingEvent(true);
        setError(null);

        const searchStr = typeof window !== 'undefined' ? window.location.search : '';
        const res = await fetch(`/api/audience/event/${eventToken}${searchStr}`, { cache: 'no-store' });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to load live event');
          setLoadingEvent(false);
          return;
        }

        setEventData(data.event);
        const langs: LanguageOption[] = data.languages || [];

        // Check if URL specifies a language or room directly from the translator's share link
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const queryLang = urlParams?.get('lang');
        const queryRoom = urlParams?.get('room');

        let matchedLang: LanguageOption | undefined;

        // Priority 1: Explicit language link shared by translator (?lang=ta, ?lang=hi, ?lang=te, ?lang=ml)
        if (queryLang) {
          matchedLang = langs.find(
            (l) =>
              l.languageCode.toLowerCase() === queryLang.toLowerCase() ||
              l.languageName.toLowerCase() === queryLang.toLowerCase()
          );
        } else if (queryRoom) {
          matchedLang = langs.find((l) => l.roomId === queryRoom);
        }

        // Priority 2: Established lock from server cookie or local storage
        if (!matchedLang) {
          const localLockedRoomId = typeof window !== 'undefined'
            ? localStorage.getItem('vocnix_locked_room_' + eventToken)
            : null;
          const targetLockedRoomId = data.lockedRoomId || localLockedRoomId;
          if (targetLockedRoomId) {
            matchedLang = langs.find((l) => l.roomId === targetLockedRoomId);
          }
        }

        if (matchedLang) {
          // Strictly lock and purge all other languages from client memory
          if (typeof window !== 'undefined') {
            localStorage.setItem('vocnix_locked_room_' + eventToken, matchedLang.roomId);
            localStorage.setItem('vocnix_locked_lang_' + eventToken, matchedLang.languageCode);
          }
          setLockedLanguage(matchedLang);
          setIsLanguageLocked(true);
          setAvailableLanguages([matchedLang]);
          setLoadingEvent(false);
          connectToAudioRoom(matchedLang);
          return;
        }

        // Language selection required: Present all languages
        setAvailableLanguages(langs);
        if (langs.length > 0) {
          setPendingSelection(langs[0]);
        }

        setLoadingEvent(false);
      } catch (err: any) {
        setError(err.message || 'Error connecting to event service');
        setLoadingEvent(false);
      }
    }

    initAudiencePage();
  }, [eventToken]);

  // 2. Initialize Audio Engine & teardown listeners
  useEffect(() => {
    const service = new AudioService({
      onConnectionChange: (status) => {
        setAudioState(status);
        if (status === 'connected') {
          setAudioConnected(true);
        } else if (status === 'disconnected' || status === 'error') {
          setAudioConnected(false);
        }
      },
      onParticipantCountChange: (count) => {
        setListenerCount(count);
      },
      onRemoteTrackChange: (track) => {
        setHasRemoteTrack(Boolean(track));
      },
      onError: (err) => {
        setError(err.message);
      },
    });

    audioServiceRef.current = service;

    return () => {
      // Clean leave notification
      const roomId = lockedRoomRef.current;
      const sKey = sessionKeyRef.current;
      if (roomId && sKey) {
        const payload = JSON.stringify({ roomId, sessionKey: sKey });
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/audience/leave', new Blob([payload], { type: 'application/json' }));
        } else {
          fetch('/api/audience/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      }
      service.disconnect();
    };
  }, []);

  // 3. Tab close browser unload cleanup via sendBeacon
  useEffect(() => {
    const handleLeave = () => {
      const roomId = lockedRoomRef.current;
      const sKey = sessionKeyRef.current;
      if (roomId && sKey) {
        const payload = JSON.stringify({ roomId, sessionKey: sKey });
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/audience/leave', new Blob([payload], { type: 'application/json' }));
        } else {
          fetch('/api/audience/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);
    return () => {
      window.removeEventListener('beforeunload', handleLeave);
      window.removeEventListener('pagehide', handleLeave);
    };
  }, []);

  // 4. Periodic heartbeat while connected (every 10 seconds)
  useEffect(() => {
    if (!lockedLanguage?.roomId || !sessionKeyRef.current || !audioConnected) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/audience/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: lockedLanguage.roomId,
            sessionKey: sessionKeyRef.current,
          }),
        });
        const data = await res.json();
        if (data.success && typeof data.listeners === 'number') {
          setListenerCount(data.listeners);
        }
      } catch {}
    }, 10000);

    return () => clearInterval(interval);
  }, [lockedLanguage?.roomId, audioConnected]);

  // 5. Connect to the validated, locked room
  // Persistent deterministic session key per browser tab
  const getTabSessionKey = () => {
    if (typeof window === 'undefined') return '';
    const storageKey = `vocnix_audience_session_${eventToken}`;
    let sKey = sessionStorage.getItem(storageKey);
    if (!sKey) {
      sKey = 'aud_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      sessionStorage.setItem(storageKey, sKey);
    }
    return sKey;
  };

  const isConnectingRef = useRef(false);

  // 5. Connect to the validated, locked room
  const connectToAudioRoom = async (targetLang: LanguageOption) => {
    if (!targetLang?.roomId) return;
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    try {
      setConnectingAudio(true);
      setError(null);

      // Request audience token from server (validates and sets server-side cookie lock)
      const sKey = getTabSessionKey();
      sessionKeyRef.current = sKey;

      const res = await fetch('/api/livekit/audience-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventToken,
          roomId: targetLang.roomId,
          languageCode: targetLang.languageCode,
          sessionKey: sKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to authenticate language channel');
        setConnectingAudio(false);
        return;
      }

      sessionKeyRef.current = data.sessionKey;
      setListenerCount(data.room?.listeners || 1);

      // Connect WebRTC Audio Engine
      let resolvedWsUrl = data.wsUrl;
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && resolvedWsUrl.includes('127.0.0.1')) {
        resolvedWsUrl = resolvedWsUrl.replace('127.0.0.1', 'localhost');
      }

      await audioServiceRef.current?.connectAudience({
        wsUrl: resolvedWsUrl,
        token: data.token,
        targetAudioElement: audioElementRef.current,
      });

      // Browser Autoplay: Play audio
      if (audioElementRef.current) {
        audioElementRef.current.volume = volume;
        await audioElementRef.current.play().catch(() => {});
      }

      setConnectingAudio(false);
      isConnectingRef.current = false;
    } catch (err: any) {
      setError(err.message || 'Failed to connect to live audio stream');
      setConnectingAudio(false);
      isConnectingRef.current = false;
    }
  };

  // 6. Confirm Language Selection (Step 1 -> Step 2)
  const handleConfirmLanguageSelection = async () => {
    if (!pendingSelection) return;

    // Persist choice in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('vocnix_locked_room_' + eventToken, pendingSelection.roomId);
      localStorage.setItem('vocnix_locked_lang_' + eventToken, pendingSelection.languageCode);
    }

    // Permanently lock language and purge all other languages from client state
    setLockedLanguage(pendingSelection);
    setIsLanguageLocked(true);
    setAvailableLanguages([pendingSelection]);

    // Connect audio stream
    await connectToAudioRoom(pendingSelection);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioElementRef.current) {
      audioElementRef.current.volume = isMuted ? 0 : newVol;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioElementRef.current) {
      audioElementRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  if (loadingEvent) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-slate-400 text-sm">Joining event audio channel...</p>
      </div>
    );
  }

  if (error && !eventData && !isLanguageLocked) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900/90 border border-red-500/30 rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Event Unavailable</h2>
        <p className="text-sm text-slate-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Hidden audio element for WebRTC playback */}
      <audio ref={audioElementRef} playsInline autoPlay />

      {/* Global Event Header */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-7 text-center space-y-3 shadow-xl backdrop-blur">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>VOCNIX LIVE BROADCAST</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {eventData?.title || 'Live Translation Session'}
        </h1>
        {eventData?.description && (
          <p className="text-sm text-slate-400 max-w-md mx-auto">{eventData.description}</p>
        )}
      </div>

      {/* Notification error banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-start space-x-3 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-red-100">Notice: </strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHASE 1: LANGUAGE SELECTION FIRST (Mandatory Before Entering Session)
         ========================================================================= */}
      {!isLanguageLocked ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-2 border-b border-slate-800 pb-5 text-center sm:text-left">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <Globe className="w-3.5 h-3.5" />
              <span>Step 1 • Select Language</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Select Your Preferred Language
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose the language you wish to hear. Once you enter the session, your listening channel will be locked to this language.
            </p>
          </div>

          {/* Language Options Grid */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Available Broadcast Channels ({availableLanguages.length})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableLanguages.map((lang) => {
                const isSelected = pendingSelection?.id === lang.id;
                const isLive = lang.roomStatus === 'live';
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setPendingSelection(lang)}
                    className={`w-full p-4 rounded-2xl border text-left transition relative flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-base text-white">{lang.languageName}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {lang.languageCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}
                        />
                        <span>{isLive ? 'Live broadcasting' : 'Ready'}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-700" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confirmation Action Button */}
          <div className="pt-2">
            <button
              onClick={handleConfirmLanguageSelection}
              disabled={!pendingSelection || connectingAudio}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center space-x-2.5 transition shadow-xl shadow-emerald-500/25 disabled:opacity-50"
            >
              {connectingAudio ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Entering Session...</span>
                </>
              ) : (
                <>
                  <Headphones className="w-5 h-5" />
                  <span>Confirm & Listen in {pendingSelection?.languageName || 'Selected Language'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* =========================================================================
            PHASE 2: STRICT SINGLE-LANGUAGE LISTENING CONSOLE
            - Zero other languages visible
            - Zero language dropdowns, tabs, or buttons
            - Locked permanently to the chosen language
           ========================================================================= */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl relative">
          {/* Strict Single-Language Lock Indicator */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>LISTENING IN {lockedLanguage?.languageName.toUpperCase()}</span>
          </div>

          {/* Connection status indicator & Listener count */}
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <span
                className={`w-2.5 h-2.5 rounded-full ${audioConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}
              />
              <span className="capitalize">{audioState}</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1 text-slate-400">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>{listenerCount} Listening</span>
            </div>
          </div>

          {/* Live Audio Visualizer */}
          <div className="h-14 flex items-center justify-center space-x-2 py-2">
            {audioConnected && hasRemoteTrack ? (
              <>
                <div className="w-1.5 h-8 bg-emerald-400 rounded-full animate-pulse" />
                <div className="w-1.5 h-12 bg-emerald-400 rounded-full animate-pulse" />
                <div className="w-1.5 h-10 bg-emerald-400 rounded-full animate-pulse" />
                <div className="w-1.5 h-6 bg-emerald-400 rounded-full animate-pulse" />
                <div className="w-1.5 h-12 bg-emerald-400 rounded-full animate-pulse" />
              </>
            ) : (
              <div className="text-xs text-slate-500 italic">
                {audioConnected
                  ? 'Waiting for ' + (lockedLanguage?.languageName || '') + ' translator audio...'
                  : 'Audio stream idle'}
              </div>
            )}
          </div>

          {/* Primary Action Button (TAP TO LISTEN) */}
          {!audioConnected ? (
            <button
              onClick={() => lockedLanguage && connectToAudioRoom(lockedLanguage)}
              disabled={connectingAudio || !lockedLanguage}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center space-x-3 transition shadow-xl shadow-emerald-500/25 disabled:opacity-50"
            >
              {connectingAudio ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>CONNECTING LIVE AUDIO...</span>
                </>
              ) : (
                <>
                  <Headphones className="w-5 h-5" />
                  <span>TAP TO LISTEN IN {lockedLanguage?.languageName.toUpperCase()}</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-center space-x-4 bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl max-w-xs mx-auto">
                <button
                  onClick={toggleMute}
                  className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-36 accent-emerald-500 cursor-pointer"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Connected to dedicated {lockedLanguage?.languageName} live stream. Audio is synchronized in real time.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
