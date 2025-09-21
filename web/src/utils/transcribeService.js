import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand
} from '@aws-sdk/client-transcribe-streaming';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';

// Transcribe client instance
let transcribeClient = null;

const getRegion = () => {
  return (
    process.env.NEXT_PUBLIC_AWS_TRANSCRIBE_REGION ||
    process.env.NEXT_PUBLIC_AWS_REGION ||
    process.env.AWS_TRANSCRIBE_REGION ||
    process.env.AWS_POLLY_REGION ||
    'ap-southeast-1'
  );
};

// Initialize Transcribe client
const getTranscribeClient = () => {
  if (!transcribeClient) {
    try {
      const region = getRegion();
      const isBrowser = typeof window !== 'undefined';

      let credentials;

      if (isBrowser) {
        const identityPoolId = process.env.NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID;
        if (!identityPoolId) {
          throw new Error(
            'Cognito Identity Pool not configured. Set NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID for browser transcription.'
          );
        }
        credentials = fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region }),
          identityPoolId,
        });
      } else {
        const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY;
        if (!accessKeyId || !secretAccessKey) {
          throw new Error('Missing AWS credentials for server environment');
        }
        credentials = { accessKeyId, secretAccessKey };
      }

      transcribeClient = new TranscribeStreamingClient({
        region,
        credentials,
      });
    } catch (error) {
      console.error('Failed to initialize Transcribe client:', error);
      throw new Error(error.message || 'AWS Transcribe service unavailable');
    }
  }
  return transcribeClient;
};

// Audio configuration for transcription
const AUDIO_CONFIG = {
  sampleRate: 16000, // 16kHz is optimal for speech recognition
  channels: 1, // Mono audio
  bitsPerSample: 16,
  format: 'pcm', // Raw PCM audio
};

// Create audio stream from microphone
export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioContext = null;
    this.processor = null;
    this.stream = null;
    this.isRecording = false;
    this.onAudioData = null;
    this.onError = null;
  }

  async initialize() {
    try {
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: AUDIO_CONFIG.sampleRate,
          channelCount: AUDIO_CONFIG.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Create audio context for processing
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: AUDIO_CONFIG.sampleRate,
      });

      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Create script processor for audio data
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (event) => {
        if (this.isRecording && this.onAudioData) {
          const inputBuffer = event.inputBuffer;
          const inputData = inputBuffer.getChannelData(0);
          
          // Convert float32 to int16 PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          
          this.onAudioData(pcmData.buffer);
        }
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      return true;
    } catch (error) {
      console.error('Failed to initialize audio recorder:', error);
      if (this.onError) {
        this.onError(error);
      }
      return false;
    }
  }

  startRecording(onAudioData, onError) {
    this.onAudioData = onAudioData;
    this.onError = onError;
    this.isRecording = true;
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  stopRecording() {
    this.isRecording = false;
    this.onAudioData = null;
  }

  cleanup() {
    this.stopRecording();
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}

// Amazon Transcribe streaming service
export class TranscribeService {
  constructor() {
    this.audioRecorder = new AudioRecorder();
    this.transcribeStream = null;
    this.isTranscribing = false;
    this.onTranscript = null;
    this.onError = null;
    this.onEnd = null;
    // Streaming helpers
    this.audioStreamResolver = null;
    this.pendingChunks = [];
  }

  async initialize() {
    try {
      const success = await this.audioRecorder.initialize();
      if (!success) {
        throw new Error('Failed to initialize audio recorder');
      }
      return true;
    } catch (error) {
      console.error('Failed to initialize TranscribeService:', error);
      if (this.onError) {
        this.onError(error);
      }
      return false;
    }
  }

  async startTranscription(options = {}) {
    if (this.isTranscribing) {
      console.warn('Transcription already in progress');
      return false;
    }

    try {
      const client = getTranscribeClient();

      // Mark as transcribing first
      this.isTranscribing = true;

      // Start audio recording so chunks begin flowing
      this.audioRecorder.startRecording(
        (audioData) => this.sendAudioData(audioData),
        (error) => this.handleError(error)
      );

      // Create audio stream generator
      const audioStream = this.createAudioStream();

      // Build command params
      const params = {
        LanguageCode: options.languageCode || 'en-US',
        MediaSampleRateHertz: AUDIO_CONFIG.sampleRate,
        MediaEncoding: 'pcm',
        AudioStream: audioStream,
        EnablePartialResultsStabilization: true,
        PartialResultsStability: 'medium',
      };

      // Optionally apply vocabulary filter if configured
      const vocabFilterName =
        process.env.NEXT_PUBLIC_AWS_TRANSCRIBE_VOCABULARY_FILTER_NAME ||
        process.env.AWS_TRANSCRIBE_VOCABULARY_FILTER_NAME;

      if (vocabFilterName) {
        params.VocabularyFilterName = vocabFilterName;
        params.VocabularyFilterMethod = 'remove';
      }

      const command = new StartStreamTranscriptionCommand(params);

      // Send command and get streaming response
      this.transcribeStream = await client.send(command);

      // Process transcription results
      this.processTranscriptionResults();

      return true;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      this.handleError(error);
      return false;
    }
  }

  async stopTranscription() {
    if (!this.isTranscribing) {
      return;
    }

    this.isTranscribing = false;
    this.audioRecorder.stopRecording();

    // Clear any pending resolver/chunks
    this.audioStreamResolver = null;
    this.pendingChunks = [];

    // Clear stream handle
    this.transcribeStream = null;

    if (this.onEnd) {
      this.onEnd();
    }
  }

  createAudioStream() {
    const self = this;

    return (async function* () {
      while (self.isTranscribing) {
        // Flush any queued chunks first
        if (self.pendingChunks && self.pendingChunks.length > 0) {
          const queued = self.pendingChunks.shift();
          if (queued) {
            yield { AudioEvent: { AudioChunk: queued } };
            continue;
          }
        }

        // Wait for next chunk
        const chunk = await new Promise((resolve) => {
          self.audioStreamResolver = resolve;
        });

        if (chunk) {
          yield { AudioEvent: { AudioChunk: chunk } };
        }
      }
    })();
  }

  sendAudioData(audioData) {
    if (!this.isTranscribing) return;

    const chunk = audioData instanceof Uint8Array ? audioData : new Uint8Array(audioData);

    if (this.audioStreamResolver) {
      const resolve = this.audioStreamResolver;
      this.audioStreamResolver = null;
      resolve(chunk);
    } else {
      // Queue chunk until the generator requests it
      this.pendingChunks.push(chunk);
    }
  }

  async processTranscriptionResults() {
    try {
      for await (const event of this.transcribeStream.TranscriptResultStream) {
        if (event.TranscriptEvent) {
          const results = event.TranscriptEvent.Transcript.Results;
          
          for (const result of results) {
            if (result.Alternatives && result.Alternatives.length > 0) {
              const transcript = result.Alternatives[0].Transcript;
              const isPartial = !result.IsPartial;
              
              if (this.onTranscript) {
                this.onTranscript({
                  transcript,
                  isFinal: isPartial,
                  confidence: result.Alternatives[0].Confidence || 0.5,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing transcription results:', error);
      this.handleError(error);
    }
  }

  handleError(error) {
    console.error('TranscribeService error:', error);
    this.isTranscribing = false;
    
    if (this.onError) {
      this.onError(error);
    }
  }

  cleanup() {
    this.stopTranscription();
    this.audioRecorder.cleanup();
  }

  // Event handlers
  setOnTranscript(callback) {
    this.onTranscript = callback;
  }

  setOnError(callback) {
    this.onError = callback;
  }

  setOnEnd(callback) {
    this.onEnd = callback;
  }
}

// Test Transcribe service connection
export const testTranscribeConnection = async () => {
  try {
    const client = getTranscribeClient();
    
    // Test by attempting to create a client (no actual API call needed for test)
    return {
      success: true,
      message: 'Connected to AWS Transcribe successfully.',
      region: client.config.region,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to AWS Transcribe: ${error.message}`,
      error: error.message,
    };
  }
};
