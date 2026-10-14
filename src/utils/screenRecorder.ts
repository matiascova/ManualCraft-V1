/**
 * Screen recorder helper using navigator.mediaDevices.getDisplayMedia
 */

export interface RecordedSession {
  blob: Blob;
  videoUrl: string;
}

export class ScreenRecorderService {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getDisplayMedia;
  }

  public async startRecording(onStopCallback?: (session: RecordedSession) => void): Promise<MediaStream> {
    this.recordedChunks = [];

    // Prompt user for screen sharing
    this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'monitor',
      },
      audio: false,
    });

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4';

    this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: mimeType });
      const videoUrl = URL.createObjectURL(blob);
      if (onStopCallback) {
        onStopCallback({ blob, videoUrl });
      }
      this.cleanupStream();
    };

    // If user stops sharing via browser UI bar
    const tracks = this.mediaStream.getVideoTracks();
    if (tracks[0]) {
      tracks[0].onended = () => {
        this.stopRecording();
      };
    }

    this.mediaRecorder.start(500); // 500ms chunks
    return this.mediaStream;
  }

  public stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanupStream();
  }

  private cleanupStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }
}

export const screenRecorder = new ScreenRecorderService();
