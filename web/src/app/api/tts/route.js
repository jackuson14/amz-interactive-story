import { NextResponse } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand, DescribeVoicesCommand } from '@aws-sdk/client-polly';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';

// Initialize Polly client
const pollyClient = new PollyClient({
  region: process.env.APP_AWS_POLLY_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
  },
});
// Initialize S3 client and caching helpers
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || process.env.APP_AWS_POLLY_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
  },
});

const TTS_BUCKET = process.env.APP_AWS_TTS_BUCKET || process.env.S3_TTS_BUCKET || process.env.AWS_S3_BUCKET_TTS;

// Request deduplication - track active synthesis requests
const activeRequests = new Map();

function getRequestKey(text, voiceId, options) {
  return createHash('md5').update(JSON.stringify({ text, voiceId, options })).digest('hex');
}

function makeCacheKeys({ voiceId, hash }) {
  const base = `tts/${voiceId}/${hash}`;
  return { audioKey: `${base}.mp3`, marksKey: `${base}.marks.json` };
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}


// Child-friendly voices
const CHILD_FRIENDLY_VOICES = {
  'Ivy': { language: 'en-US', gender: 'Female', description: 'Child-like, clear female voice' },
  'Joanna': { language: 'en-US', gender: 'Female', description: 'Warm, friendly female voice' },
  'Matthew': { language: 'en-US', gender: 'Male', description: 'Clear, gentle male voice' },
  'Kimberly': { language: 'en-US', gender: 'Female', description: 'Young, energetic female voice' },
  'Justin': { language: 'en-US', gender: 'Male', description: 'Young, clear male voice' },
  'Amy': { language: 'en-GB', gender: 'Female', description: 'British female voice' },
  'Brian': { language: 'en-GB', gender: 'Male', description: 'British male voice' },
  'Emma': { language: 'en-GB', gender: 'Female', description: 'British female voice (neural)' },
  'Nicole': { language: 'en-AU', gender: 'Female', description: 'Australian female voice' },
  'Russell': { language: 'en-AU', gender: 'Male', description: 'Australian male voice' },
};

// Convert text to SSML for more natural intonation
function convertToSSML(text, voiceId) {
  // Start with the original text and escape XML characters
  let processedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Neural-compatible enhancements - use rate and volume instead of pitch
  processedText = processedText
    // Make exciting words faster and louder (neural-compatible)
    .replace(/\b(welcome|magical|adventure|ready|amazing|wonderful|exciting|fantastic)\b/gi, '<prosody rate="115%" volume="loud">$1</prosody>')
    // Make animal names bouncy with rate changes only
    .replace(/\b(lion|monkey|penguin|hippo|elephant|giraffe|zebra|animals?)\b/gi, '<prosody rate="110%" volume="medium">$1</prosody>')
    // Emphasize action words with rate and emphasis
    .replace(/\b(roar|swing|jump|sleep|goodnight|go|begin)\b/gi, '<emphasis level="strong"><prosody rate="105%">$1</prosody></emphasis>');

  // Add natural pauses (fully supported)
  processedText = processedText
    .replace(/!\s+/g, '! <break time="600ms"/>')
    .replace(/\?\s+/g, '? <break time="700ms"/>')
    .replace(/\.\s+/g, '. <break time="800ms"/>')
    .replace(/,\s+/g, ', <break time="300ms"/>');

  // Wrap in SSML speak tags with neural-friendly prosody
  return `<speak><break time="500ms"/><prosody rate="95%" volume="medium">${processedText}</prosody><break time="300ms"/></speak>`;
}

export async function POST(request) {
  try {
    // Debug: Log raw request body
    const body = await request.text();
    console.log('Raw request body:', body);

    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError.message },
        { status: 400 }
      );
    }

    const { text, voiceId, options = {} } = parsedBody;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Validate voice
    const selectedVoice = voiceId || process.env.AWS_POLLY_DEFAULT_VOICE || 'Ivy';
    if (!CHILD_FRIENDLY_VOICES[selectedVoice]) {
      return NextResponse.json(
        { error: 'Invalid or non-child-friendly voice selected' },
        { status: 400 }
      );
    }

    // Request deduplication
    const requestKey = getRequestKey(text, selectedVoice, options);

    // Check if identical request is already in progress
    if (activeRequests.has(requestKey)) {
      console.log('Duplicate request detected, waiting for existing synthesis...');
      try {
        // Wait for the existing request to complete
        const existingResult = await activeRequests.get(requestKey);
        return NextResponse.json(existingResult);
      } catch (error) {
        // If existing request failed, remove it and continue with new request
        activeRequests.delete(requestKey);
      }
    }

    // Create promise for this request
    const synthesisPromise = (async () => {
      try {
        // Use SSML for natural speech if requested, otherwise use plain text
        const useSSML = options.naturalSpeech !== false; // Default to true
        const finalText = useSSML ? convertToSSML(text, selectedVoice) : text;
        const textType = useSSML ? 'ssml' : 'text';

    console.log('Using natural speech:', useSSML);
    if (useSSML) {
      console.log('Generated SSML:', finalText);
    }

    // Prepare synthesis parameters
    const command = new SynthesizeSpeechCommand({
      Text: finalText,
      VoiceId: selectedVoice,
      OutputFormat: options.outputFormat || process.env.AWS_POLLY_OUTPUT_FORMAT || 'mp3',
      SampleRate: options.sampleRate || process.env.AWS_POLLY_SAMPLE_RATE || '22050',
      Engine: options.engine || process.env.AWS_POLLY_VOICE_ENGINE || 'neural',
      TextType: textType,
      LanguageCode: CHILD_FRIENDLY_VOICES[selectedVoice].language,
    });

    console.log('Synthesizing speech with Polly:', {
      voiceId: selectedVoice,
      textLength: text.length,
      outputFormat: command.input.OutputFormat,
      textType: textType,
      useSSML: useSSML,
    });

    // Call Polly with fallback handling
    let response;
    let ssmlFallbackUsed = false;
    try {
      response = await pollyClient.send(command);
    } catch (ssmlError) {
      if (useSSML && ssmlError.name === 'InvalidSsmlException') {
        console.log('SSML failed, falling back to plain text:', ssmlError.message);
        ssmlFallbackUsed = true;
        // Fallback to plain text
        const fallbackCommand = new SynthesizeSpeechCommand({
          Text: text,
          VoiceId: selectedVoice,
          OutputFormat: options.outputFormat || process.env.AWS_POLLY_OUTPUT_FORMAT || 'mp3',
          SampleRate: options.sampleRate || process.env.AWS_POLLY_SAMPLE_RATE || '22050',
          Engine: options.engine || process.env.AWS_POLLY_VOICE_ENGINE || 'neural',
          TextType: 'text',
          LanguageCode: CHILD_FRIENDLY_VOICES[selectedVoice].language,
        });
        response = await pollyClient.send(fallbackCommand);
      } else {
        throw ssmlError;
      }
    }

    // Convert audio stream to buffer
    const chunks = [];
    for await (const chunk of response.AudioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Generate speech marks (word + sentence)
    let marks = [];
    try {
      // First attempt: Use same text/format as successful audio synthesis
      const marksTextType = useSSML && !ssmlFallbackUsed ? 'ssml' : 'text';
      const marksText = useSSML && !ssmlFallbackUsed ? finalText : text;

      const marksCommand = new SynthesizeSpeechCommand({
        Text: marksText,
        VoiceId: selectedVoice,
        OutputFormat: 'json',
        SpeechMarkTypes: ['word', 'sentence'],
        SampleRate: options.sampleRate || process.env.AWS_POLLY_SAMPLE_RATE || '22050',
        Engine: options.engine || process.env.AWS_POLLY_VOICE_ENGINE || 'neural',
        TextType: marksTextType,
        LanguageCode: CHILD_FRIENDLY_VOICES[selectedVoice].language,
      });

      const marksResponse = await pollyClient.send(marksCommand);
      let acc = '';
      for await (const chunk of marksResponse.AudioStream) {
        acc += chunk.toString();
        const lines = acc.split('\n');
        acc = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try { marks.push(JSON.parse(line)); } catch {}
        }
      }
      if (acc.trim()) { try { marks.push(JSON.parse(acc)); } catch {} }
    } catch (marksError) {
      console.warn('Speech marks generation failed:', marksError?.message || marksError);

      // Fallback: Try again with plain text if SSML was used
      if (useSSML && marksError.name === 'InvalidSsmlException') {
        try {
          console.log('Retrying speech marks with plain text fallback');
          const fallbackMarksCommand = new SynthesizeSpeechCommand({
            Text: text, // Use original plain text
            VoiceId: selectedVoice,
            OutputFormat: 'json',
            SpeechMarkTypes: ['word', 'sentence'],
            SampleRate: options.sampleRate || process.env.AWS_POLLY_SAMPLE_RATE || '22050',
            Engine: options.engine || process.env.AWS_POLLY_VOICE_ENGINE || 'neural',
            TextType: 'text',
            LanguageCode: CHILD_FRIENDLY_VOICES[selectedVoice].language,
          });

          const fallbackMarksResponse = await pollyClient.send(fallbackMarksCommand);
          let acc = '';
          for await (const chunk of fallbackMarksResponse.AudioStream) {
            acc += chunk.toString();
            const lines = acc.split('\n');
            acc = lines.pop() || '';
            for (const line of lines) {
              if (!line.trim()) continue;
              try { marks.push(JSON.parse(line)); } catch {}
            }
          }
          if (acc.trim()) { try { marks.push(JSON.parse(acc)); } catch {} }
        } catch (fallbackError) {
          console.warn('Speech marks fallback also failed:', fallbackError?.message || fallbackError);
          // Continue without marks - not critical for basic functionality
        }
      }
    }

    // Best-effort S3 cache write of audio and marks
    if (TTS_BUCKET) {
      try {
        const engine = options.engine || process.env.AWS_POLLY_VOICE_ENGINE || 'neural';
        const sampleRate = options.sampleRate || process.env.AWS_POLLY_SAMPLE_RATE || '22050';
        const outputFormat = options.outputFormat || process.env.AWS_POLLY_OUTPUT_FORMAT || 'mp3';
        const language = CHILD_FRIENDLY_VOICES[selectedVoice].language;
        const usedText = (options.naturalSpeech !== false) ? finalText : text;
        const usedTextType = (options.naturalSpeech !== false) ? 'ssml' : 'text';
        const hashInput = JSON.stringify({ text: usedText, textType: usedTextType, voiceId: selectedVoice, engine, sampleRate, outputFormat, language });
        const hash = createHash('sha256').update(hashInput).digest('hex');
        const { audioKey, marksKey } = makeCacheKeys({ voiceId: selectedVoice, hash });
        await Promise.allSettled([
          s3Client.send(new PutObjectCommand({ Bucket: TTS_BUCKET, Key: audioKey, Body: audioBuffer, ContentType: 'audio/mpeg' })),
          s3Client.send(new PutObjectCommand({ Bucket: TTS_BUCKET, Key: marksKey, Body: Buffer.from(JSON.stringify(marks)), ContentType: 'application/json' })),
        ]);
      } catch (e) {
        console.warn('S3 cache write skipped:', e?.message || e);
      }
    }

        // Return audio as base64 for client-side playback along with marks
        const audioBase64 = audioBuffer.toString('base64');
        return {
          success: true,
          audio: audioBase64,
          marks,
          metadata: {
            voiceId: selectedVoice,
            voiceInfo: CHILD_FRIENDLY_VOICES[selectedVoice],
            outputFormat: command.input.OutputFormat,
            textLength: text.length,
          }
        };
      } catch (error) {
        activeRequests.delete(requestKey);
        throw error;
      }
    })();

    // Store the promise immediately to prevent duplicates
    activeRequests.set(requestKey, synthesisPromise);

    // Return the result
    try {
      const result = await synthesisPromise;
      return NextResponse.json(result);
    } finally {
      // Clean up completed request
      activeRequests.delete(requestKey);
    }

  } catch (error) {
    console.error('TTS API Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to synthesize speech',
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('language') || 'en-US';

    // Get available voices for the language
    const command = new DescribeVoicesCommand({
      LanguageCode: languageCode,
      Engine: 'neural',
    });

    const response = await pollyClient.send(command);

    // Filter to child-friendly voices
    const childFriendlyVoices = response.Voices
      .filter(voice => CHILD_FRIENDLY_VOICES[voice.Id])
      .map(voice => ({
        ...voice,
        ...CHILD_FRIENDLY_VOICES[voice.Id],
        isRecommended: ['Ivy', 'Joanna', 'Matthew', 'Kimberly', 'Justin'].includes(voice.Id),
      }));

    return NextResponse.json({
      success: true,
      voices: childFriendlyVoices,
      totalCount: childFriendlyVoices.length,
    });

  } catch (error) {
    console.error('Get Voices API Error:', error);

    // Safely determine requested language
    let requestedLanguage = 'en-US';
    try {
      const { searchParams } = new URL(request.url);
      requestedLanguage = searchParams.get('language') || 'en-US';
    } catch {}

    // Return fallback voices if API fails
    const fallbackVoices = Object.entries(CHILD_FRIENDLY_VOICES)
      .filter(([, info]) => info.language === requestedLanguage)
      .map(([id, info]) => ({
        Id: id,
        Name: id,
        ...info,
        isRecommended: ['Ivy', 'Joanna', 'Matthew', 'Kimberly', 'Justin'].includes(id),
      }));

    return NextResponse.json({
      success: true,
      voices: fallbackVoices,
      totalCount: fallbackVoices.length,
      fallback: true,
    }, { status: 200 });
  }
}