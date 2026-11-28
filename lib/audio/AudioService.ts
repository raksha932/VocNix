import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteParticipant,
  LocalAudioTrack,
  createLocalAudioTrack,
  ConnectionState,
  TrackPublication,
  AudioPresets,
} from 'livekit-client';

export type AudioConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface AnnouncementData {
  id: string;
  roomId?: string;
  senderName?: string;
  languageCode?: string;
  message: string;
  createdAt: string;
}

export interface AudioServiceCallbacks {
  onConnectionChange?: (state: AudioConnectionStatus) => void;
  onParticipantCountChange?: (count: number) => void;
  onAudioLevelChange?: (level: number) => void; // 0.0 to 1.0
  onRemoteTrackChange?: (track: RemoteTrack | null) => void;
  onAnnouncementReceived?: (announcement: AnnouncementData) => void;
  onError?: (err: Error) => void;
}

export class AudioService {
  private room: Room | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private callbacks: AudioServiceCallbacks = {};
  private remoteAudioElement: HTMLAudioElement | null = null;
  private isMicMuted: boolean = false;
  private isMonoChannel: boolean = true;

  constructor(callbacks: AudioServiceCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: AudioServiceCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getConnectionState(): ConnectionState {
    return this.room ? this.room.state : ConnectionState.Disconnected;
  }

  public isMuted(): boolean {
    return this.isMicMuted;
  }

  public isMono(): boolean {
    return this.isMonoChannel;
  }

  // ==========================================================
  // TRANSLATOR AUDIO PIPELINE
  // ==========================================================
  public async connectTranslator(params: {
    wsUrl: string;
    token: string;
    audioDeviceId?: string;
    useMono?: boolean;
  }): Promise<void> {
    try {
      this.callbacks.onConnectionChange?.('connecting');
      const useMono = params.useMono !== false;
      this.isMonoChannel = useMono;

      // 1. Request microphone stream with echo cancellation and noise suppression
      // Channel count: 1 for mono (saves ~50% bandwidth), 2 for stereo
      const audioOptions: {
        echoCancellation?: boolean;
        noiseSuppression?: boolean;
        autoGainControl?: boolean;
        channelCount?: number;
        deviceId?: string;
      } = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: useMono ? 1 : 2,
      };
      if (params.audioDeviceId) {
        audioOptions.deviceId = params.audioDeviceId;
      }

      this.localAudioTrack = await createLocalAudioTrack(audioOptions);
      this.isMicMuted = false;

      // 2. Setup AudioContext for real-time VU meter
      this.setupLocalAudioAnalyser(this.localAudioTrack.mediaStreamTrack);

      // 3. Connect to real-time audio room
      // When mono is enabled: use Speech preset (24kbps) + DTX to optimize bandwidth
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: useMono ? 1 : 2,
        },
        publishDefaults: {
          audioPreset: useMono ? AudioPresets.speech : AudioPresets.musicStereo,
          dtx: true,
          red: true,
        },
      });

      this.setupRoomEvents();

      await this.room.connect(params.wsUrl, params.token);

      // 4. Publish real microphone track with speech/stereo preset
      await this.room.localParticipant.publishTrack(this.localAudioTrack, {
        name: 'translator-mic',
        source: Track.Source.Microphone,
        audioPreset: useMono ? AudioPresets.speech : AudioPresets.musicStereo,
        dtx: true,
        red: true,
      });

      this.callbacks.onConnectionChange?.('connected');
      this.updateParticipantCount();
    } catch (err: any) {
      this.callbacks.onConnectionChange?.('error');
      this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
      this.cleanup();
      throw err;
    }
  }

  // ==========================================================
  // AUDIENCE AUDIO PIPELINE
  // ==========================================================
  public async connectAudience(params: {
    wsUrl: string;
    token: string;
    targetAudioElement?: HTMLAudioElement | null;
    useMono?: boolean;
  }): Promise<void> {
    try {
      this.callbacks.onConnectionChange?.('connecting');
      const useMono = params.useMono !== false;
      this.isMonoChannel = useMono;

      if (params.targetAudioElement) {
        this.remoteAudioElement = params.targetAudioElement;
      }

      this.room = new Room({
        adaptiveStream: true,
      });

      this.setupRoomEvents();

      // Listen for incoming translator audio track
      this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: TrackPublication, participant: RemoteParticipant) => {
        if (track.kind === Track.Kind.Audio) {
          if (this.remoteAudioElement) {
            track.attach(this.remoteAudioElement);
          }
          this.callbacks.onRemoteTrackChange?.(track);
        }
      });

      this.room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          if (this.remoteAudioElement) {
            track.detach(this.remoteAudioElement);
          }
          this.callbacks.onRemoteTrackChange?.(null);
        }
      });

      await this.room.connect(params.wsUrl, params.token);

      this.callbacks.onConnectionChange?.('connected');
      this.updateParticipantCount();
    } catch (err: any) {
      this.callbacks.onConnectionChange?.('error');
      this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
      this.cleanup();
      throw err;
    }
  }

  // ==========================================================
  // CONTROLS: MUTE / UNMUTE (PAUSE / RESUME)
  // ==========================================================
  public async muteMicrophone(): Promise<void> {
    if (this.localAudioTrack) {
      await this.localAudioTrack.mute();
      this.isMicMuted = true;
    }
  }

  public async unmuteMicrophone(): Promise<void> {
    if (this.localAudioTrack) {
      await this.localAudioTrack.unmute();
      this.isMicMuted = false;
    }
  }

  // ==========================================================
  // EVENT WIRING & PARTICIPANTS
  // ==========================================================
  private setupRoomEvents(): void {
    if (!this.room) return;

    this.room.on(RoomEvent.Reconnecting, () => {
      this.callbacks.onConnectionChange?.('reconnecting');
    });

    this.room.on(RoomEvent.Reconnected, () => {
      this.callbacks.onConnectionChange?.('connected');
      this.updateParticipantCount();
    });

    this.room.on(RoomEvent.Disconnected, () => {
      this.callbacks.onConnectionChange?.('disconnected');
    });

    this.room.on(RoomEvent.ParticipantConnected, () => {
      this.updateParticipantCount();
    });

    this.room.on(RoomEvent.ParticipantDisconnected, () => {
      this.updateParticipantCount();
    });

    // Real-time WebRTC DataChannel listener for announcements and interactive messages
    this.room.on(
      RoomEvent.DataReceived,
      (payload: Uint8Array | ArrayBuffer, participant?: RemoteParticipant, kind?: any, topic?: string) => {
        try {
          const rawBytes = payload instanceof Uint8Array ? payload : new Uint8Array(payload as any);
          const text = new TextDecoder().decode(rawBytes);
          const data = JSON.parse(text);
          if (data && (data.type === 'announcement' || topic === 'announcement' || data.message)) {
            const announcement: AnnouncementData = {
              id: data.id || `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              roomId: data.roomId,
              senderName: data.senderName || participant?.name || participant?.identity || 'Translator',
              languageCode: data.languageCode,
              message: data.message || data.text || '',
              createdAt: data.createdAt || new Date().toISOString(),
            };
            this.callbacks.onAnnouncementReceived?.(announcement);
          }
        } catch (err) {
          console.warn('[AudioService] Failed to parse received data packet:', err);
        }
      }
    );
  }

  // ==========================================================
  // INTERACTIVITY: REAL-TIME ANNOUNCEMENTS (WebRTC DataChannel)
  // ==========================================================
  public async sendAnnouncement(
    message: string,
    metadata?: {
      id?: string;
      senderName?: string;
      languageCode?: string;
      roomId?: string;
    }
  ): Promise<AnnouncementData> {
    if (!this.room || !this.room.localParticipant) {
      throw new Error('Room is not connected. Broadcast must be active to publish real-time announcements.');
    }

    const trimmed = (message || '').trim();
    if (!trimmed) {
      throw new Error('Announcement message cannot be empty');
    }

    const announcement: AnnouncementData = {
      id: metadata?.id || `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      roomId: metadata?.roomId,
      senderName: metadata?.senderName || this.room.localParticipant.name || 'Translator',
      languageCode: metadata?.languageCode,
      message: trimmed,
      createdAt: new Date().toISOString(),
    };

    const payload = new TextEncoder().encode(
      JSON.stringify({
        type: 'announcement',
        ...announcement,
      })
    );

    // Reliable data transmission via LiveKit WebRTC DataChannel
    await this.room.localParticipant.publishData(payload, {
      reliable: true,
      topic: 'announcement',
    });

    return announcement;
  }

  private updateParticipantCount(): void {
    if (!this.room) return;
    // Number of remote participants in this room
    const count = this.room.remoteParticipants.size;
    this.callbacks.onParticipantCountChange?.(count);
  }

  // ==========================================================
  // REAL-TIME AUDIO VU METER (RMS Level Calculation)
  // ==========================================================
  private setupLocalAudioAnalyser(mediaStreamTrack: MediaStreamTrack): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const stream = new MediaStream([mediaStreamTrack]);
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkLevel = () => {
        if (!this.analyser || this.isMicMuted) {
          this.callbacks.onAudioLevelChange?.(0);
        } else {
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const normalized = Math.min(1.0, average / 128);
          this.callbacks.onAudioLevelChange?.(normalized);
        }
        this.animationFrameId = requestAnimationFrame(checkLevel);
      };

      this.animationFrameId = requestAnimationFrame(checkLevel);
    } catch {
      // Graceful fallback if Web Audio API is restricted
    }
  }

  // ==========================================================
  // TEARDOWN & CLEANUP
  // ==========================================================
  public disconnect(): void {
    this.cleanup();
    this.callbacks.onConnectionChange?.('disconnected');
  }

  private cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    if (this.localAudioTrack) {
      try {
        this.localAudioTrack.stop();
      } catch {}
      this.localAudioTrack = null;
    }

    if (this.room) {
      try {
        this.room.disconnect();
      } catch {}
      this.room = null;
    }

    if (this.remoteAudioElement) {
      try {
        this.remoteAudioElement.pause();
        this.remoteAudioElement.srcObject = null;
      } catch {}
    }
  }
}
