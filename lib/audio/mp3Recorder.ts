import { Mp3Encoder } from '@breezystack/lamejs';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'encoding' | 'ready' | 'error';

export interface Mp3RecordingResult {
  blob: Blob;
  url: string;
  durationSeconds: number;
  sizeBytes: number;
}

export class Mp3Recorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private state: RecordingState = 'idle';
  private timerId: any = null;
  private elapsedSeconds: number = 0;

  private onStateChange?: (state: RecordingState) => void;
  private onTick?: (seconds: number) => void;
  private onError?: (err: Error) => void;

  constructor(options?: {
    onStateChange?: (state: RecordingState) => void;
    onTick?: (seconds: number) => void;
    onError?: (err: Error) => void;
  }) {
    this.onStateChange = options?.onStateChange;
    this.onTick = options?.onTick;
    this.onError = options?.onError;
  }

  public getState(): RecordingState {
    return this.state;
  }

  public getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  private setState(state: RecordingState) {
    this.state = state;
    this.onStateChange?.(state);
  }

  /**
   * Start recording the live microphone audio in real time.
   */
  public async start(deviceId?: string): Promise<void> {
    try {
      if (this.state === 'recording') return;

      this.audioChunks = [];
      this.elapsedSeconds = 0;
      this.onTick?.(0);

      // Acquire genuine microphone stream
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Determine best supported MIME type
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.mediaStream, { mimeType })
        : new MediaRecorder(this.mediaStream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(250); // Slice data every 250ms
      this.setState('recording');

      // Start elapsed timer
      this.timerId = setInterval(() => {
        if (this.state === 'recording') {
          this.elapsedSeconds += 1;
          this.onTick?.(this.elapsedSeconds);
        }
      }, 1000);
    } catch (err: any) {
      this.cleanupStream();
      this.setState('error');
      this.onError?.(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  /**
   * Pause recording
   */
  public pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.setState('paused');
    }
  }

  /**
   * Resume recording
   */
  public resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.setState('recording');
    }
  }

  /**
   * Stop recording and encode the collected real microphone audio into an MP3 file
   */
  public async stop(): Promise<Mp3RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('No active recording'));
      }

      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }

      this.setState('encoding');

      this.mediaRecorder.onstop = async () => {
        try {
          // Release live hardware mic tracks immediately
          this.cleanupStream();

          if (this.audioChunks.length === 0) {
            throw new Error('No audio data captured');
          }

          const rawBlob = new Blob(this.audioChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm',
          });

          // Decode recorded audio blob into raw PCM via Web Audio API
          const arrayBuffer = await rawBlob.arrayBuffer();
          const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

          // Convert PCM Float32 samples to Int16 and feed into MP3 encoder
          const numChannels = Math.min(audioBuffer.numberOfChannels, 2);
          const sampleRate = audioBuffer.sampleRate;
          const encoder = new Mp3Encoder(numChannels, sampleRate, 128);

          const leftFloat = audioBuffer.getChannelData(0);
          const rightFloat =
            numChannels > 1 ? audioBuffer.getChannelData(1) : undefined;

          const leftInt16 = this.floatToInt16(leftFloat);
          const rightInt16 = rightFloat ? this.floatToInt16(rightFloat) : undefined;

          const mp3Buffers: Uint8Array[] = [];
          const blockSize = 1152;

          for (let i = 0; i < leftInt16.length; i += blockSize) {
            const leftChunk = leftInt16.subarray(i, i + blockSize);
            const rightChunk = rightInt16
              ? rightInt16.subarray(i, i + blockSize)
              : undefined;

            const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) {
              mp3Buffers.push(mp3buf);
            }
          }

          const flushed = encoder.flush();
          if (flushed.length > 0) {
            mp3Buffers.push(flushed);
          }

          await audioCtx.close();

          const mp3Blob = new Blob(mp3Buffers as unknown as BlobPart[], { type: 'audio/mp3' });
          const mp3Url = URL.createObjectURL(mp3Blob);

          const result: Mp3RecordingResult = {
            blob: mp3Blob,
            url: mp3Url,
            durationSeconds: this.elapsedSeconds,
            sizeBytes: mp3Blob.size,
          };

          this.setState('ready');
          resolve(result);
        } catch (encodeErr: any) {
          this.setState('error');
          this.onError?.(encodeErr);
          reject(encodeErr);
        }
      };

      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Utility to trigger immediate download of MP3 file locally
   */
  public static downloadMp3(url: string, filename: string = 'recording.mp3') {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.mp3') ? filename : `${filename}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  private floatToInt16(samples: Float32Array): Int16Array {
    const len = samples.length;
    const output = new Int16Array(len);
    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  private cleanupStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.mediaStream = null;
    }
  }

  public destroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.cleanupStream();
    this.audioChunks = [];
    this.setState('idle');
  }
}
