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
  Play,
  Pause,
  Loader2,
  Users,
} from 'lucide-react';
import { AudioService, AudioConnectionStatus } from '@/lib/audio/AudioService';

export default function AudienceListenPage() {
  const params = useParams();
  const eventToken = params?.eventToken as string;

  // Event & Language State
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [selectedLanguageRoom, setSelectedLanguageRoom] = useState<any>(null);

  // Audio Connection State
  const [connectingAudio, setConnectingAudio] = useState(false);
  const [audioConnected, setAudioConnected] = useState(false);
  const [audioState, setAudioState] = useState<AudioConnectionStatus>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasRemoteTrack, setHasRemoteTrack] = useState(false);
  const [listenerCount, setListenerCount] = useState<number>(0);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioServiceRef = useRef<AudioService | null>(null);
  const sessionKeyRef = useRef<string>('');

  // 1. Fetch Event details and available dynamic languages
  useEffect(() => {
    async function loadEvent() {
      if (!eventToken) return;
      try {
        setLoadingEvent(true);
        setError(null);

        const res = await fetch('/api/events?all=true', { cache: 'no-store' });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to load event data');
          setLoadingEvent(false);
          return;
        }

        const currentEvent = data.events?.find((e: any) => e.public_access_token === eventToken);
        if (!currentEvent) {
          setError('Event not found or the access link is invalid/expired.');
          setLoadingEvent(false);
          return;
        }

        setEventData(currentEvent);

        // Pre-select first available language room
        if (currentEvent.rooms && currentEvent.rooms.length > 0) {
          const firstRoom = currentEvent.rooms[0];
          const lang = currentEvent.languages?.find((l: any) => l.id === firstRoom.event_language_id);
          setSelectedLanguageRoom({ ...firstRoom, languageName: lang?.language_name || 'Translation' });
        }

        setLoadingEvent(false);
      } catch (err: any) {
        setError(err.message || 'Error connecting to server');
        setLoadingEvent(false);
      }
    }

    loadEvent();
  }, [eventToken]);

  // 2. Setup AudioService and cleanup on unmount
  useEffect(() => {
    const service = new AudioService({
      onConnectionChange: (status) => {
        setAudioState(status);
        if (status === 'connected') {
          setAudioConnected(true);
        } else if (status === 'disconnected' || status === 'error') {
          setAudioConnected(false);
          setIsPlaying(false);
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
      // Leave audience session
      if (selectedLanguageRoom?.id && sessionKeyRef.current) {
        fetch('/api/audience/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: selectedLanguageRoom.id,
            sessionKey: sessionKeyRef.current,
          }),
        }).catch(() => {});
      }
      service.disconnect();
    };
  }, []);

  // 3. Connect to selected dynamic language room
  const handleConnectToRoom = async (roomObj: any) => {
    if (!roomObj) return;

    try {
      setConnectingAudio(true);
      setError(null);

      // Disconnect previous audio if connected
      if (audioServiceRef.current) {
        audioServiceRef.current.disconnect();
      }

      // Request audience token from server
      const res = await fetch('/api/livekit/audience-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventToken,
          roomId: roomObj.id,
          sessionKey: sessionKeyRef.current || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to connect to language channel');
        setConnectingAudio(false);
        return;
      }

      sessionKeyRef.current = data.sessionKey;
      setListenerCount(data.room.listeners || 1);

      // Connect LiveKit client engine
      let resolvedWsUrl = data.wsUrl;
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && resolvedWsUrl.includes('127.0.0.1')) {
        resolvedWsUrl = resolvedWsUrl.replace('127.0.0.1', 'localhost');
      }
      await audioServiceRef.current?.connectAudience({
        wsUrl: resolvedWsUrl,
        token: data.token,
        targetAudioElement: audioElementRef.current,
      });

      // Browser Autoplay: Play audio element
      if (audioElementRef.current) {
        audioElementRef.current.volume = volume;
        await audioElementRef.current.play().catch(() => {
          // If browser policy blocks, prompt user to tap
        });
      }

      setIsPlaying(true);
      setConnectingAudio(false);
    } catch (err: any) {
      setError(err.message || 'Failed to play audio stream');
      setConnectingAudio(false);
    }
  };

  const handleLanguageChange = (room: any) => {
    const lang = eventData?.languages?.find((l: any) => l.id === room.event_language_id);
    const roomWithLang = { ...room, languageName: lang?.language_name || 'Translation' };
    setSelectedLanguageRoom(roomWithLang);

    if (audioConnected) {
      handleConnectToRoom(roomWithLang);
    }
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-slate-400 text-sm">Joining event audio channel...</p>
      </div>
    );
  }

  if (error && !eventData) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900/90 border border-red-500/30 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Event Unavailable</h2>
        <p className="text-sm text-slate-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Hidden audio element for WebRTC audio track playback */}
      <audio ref={audioElementRef} playsInline autoPlay />

      {/* Event Header */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>LIVE AUDIO BROADCAST</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {eventData?.title}
        </h1>
        {eventData?.description && (
          <p className="text-sm text-slate-400 max-w-md mx-auto">{eventData.description}</p>
        )}
      </div>

      {/* Dynamic Language Selection */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Select Your Language:</span>
          </label>
          <span className="text-xs text-slate-500">Real-time dynamic channels</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {eventData?.rooms?.map((room: any) => {
            const lang = eventData.languages?.find((l: any) => l.id === room.event_language_id);
            const isSelected = selectedLanguageRoom?.id === room.id;
            return (
              <button
                key={room.id}
                onClick={() => handleLanguageChange(room)}
                className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white font-bold shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-sm">{lang?.language_name || 'Language'}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {lang?.language_code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio Playback Deck */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-center shadow-xl">
        {/* Connection status indicator */}
        <div className="flex items-center justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                audioConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span className="capitalize">{audioState}</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1 text-slate-400">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>{listenerCount} Listening</span>
          </div>
        </div>

        {/* Audio Wave Visualizer while playing */}
        <div className="h-12 flex items-center justify-center space-x-1.5 py-2">
          {audioConnected && hasRemoteTrack ? (
            <>
              <div className="w-1.5 bg-emerald-400 rounded-full animate-wave-1" />
              <div className="w-1.5 bg-emerald-400 rounded-full animate-wave-2" />
              <div className="w-1.5 bg-emerald-400 rounded-full animate-wave-3" />
              <div className="w-1.5 bg-emerald-400 rounded-full animate-wave-4" />
              <div className="w-1.5 bg-emerald-400 rounded-full animate-wave-5" />
            </>
          ) : (
            <div className="text-xs text-slate-500 italic">
              {audioConnected ? 'Waiting for translator microphone audio...' : 'Audio disconnected'}
            </div>
          )}
        </div>

        {/* Primary TAP TO LISTEN Button (Browser Autoplay Compliant) */}
        {!audioConnected ? (
          <button
            onClick={() => handleConnectToRoom(selectedLanguageRoom)}
            disabled={connectingAudio || !selectedLanguageRoom}
            className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center space-x-3 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {connectingAudio ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>CONNECTING LIVE AUDIO...</span>
              </>
            ) : (
              <>
                <Headphones className="w-5 h-5" />
                <span>TAP TO LISTEN ({selectedLanguageRoom?.languageName?.toUpperCase() || 'AUDIO'})</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={toggleMute}
                className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
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
                className="w-32 sm:w-44 accent-emerald-500"
              />
            </div>

            <button
              onClick={() => {
                audioServiceRef.current?.disconnect();
                setAudioConnected(false);
                setIsPlaying(false);
              }}
              className="text-xs text-slate-400 hover:text-red-400 transition"
            >
              Stop Listening
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-500">
        <p>No account required • Real-time WebRTC audio • Protected against audio leakage</p>
      </div>
    </div>
  );
}
