import { NextResponse } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand, DescribeVoicesCommand } from '@aws-sdk/client-polly';

// Initialize Polly client
const pollyClient = new PollyClient({
  region: process.env.AWS_POLLY_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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

  // Add exciting intonation - do word replacements first, then punctuation
  processedText = processedText
    // Make exciting words higher pitch and faster
    .replace(/\b(welcome|magical|adventure|ready|amazing|wonderful|exciting|fantastic)\b/gi, '<prosody rate="110%" pitch="+25%">$1</prosody>')
    // Make animal names fun and bouncy
    .replace(/\b(lion|monkey|penguin|hippo|elephant|giraffe|zebra|animals?)\b/gi, '<prosody pitch="+30%" rate="105%">$1</prosody>')
    // Add emphasis to action words
    .replace(/\b(roar|swing|jump|sleep|goodnight|go|begin)\b/gi, '<prosody pitch="+20%" rate="110%">$1</prosody>');

  // Add pauses after prosody tags to avoid conflicts
  processedText = processedText
    .replace(/!\s+/g, '! <break time="600ms"/>')
    .replace(/\?\s+/g, '? <break time="700ms"/>')
    .replace(/\.\s+/g, '. <break time="800ms"/>')
    .replace(/,\s+/g, ', <break time="300ms"/>');

  // Wrap in SSML speak tags with normal rate but exciting delivery
  return `<speak><break time="500ms"/><prosody rate="100%">${processedText}</prosody><break time="300ms"/></speak>`;
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
    try {
      response = await pollyClient.send(command);
    } catch (ssmlError) {
      if (useSSML && ssmlError.name === 'InvalidSsmlException') {
        console.log('SSML failed, falling back to plain text:', ssmlError.message);
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

    // Return audio as base64 for client-side playback
    const audioBase64 = audioBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      audio: audioBase64,
      metadata: {
        voiceId: selectedVoice,
        voiceInfo: CHILD_FRIENDLY_VOICES[selectedVoice],
        outputFormat: command.input.OutputFormat,
        textLength: text.length,
        estimatedDuration: Math.ceil(text.length / 10), // Rough estimate
      }
    });

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
    
    // Return fallback voices if API fails
    const fallbackVoices = Object.entries(CHILD_FRIENDLY_VOICES)
      .filter(([id, info]) => info.language === (searchParams?.get('language') || 'en-US'))
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
    });
  }
}