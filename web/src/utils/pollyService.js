import { PollyClient, SynthesizeSpeechCommand, DescribeVoicesCommand } from '@aws-sdk/client-polly';
import { fromEnv } from '@aws-sdk/credential-providers';

// Child-friendly voices configuration
export const CHILD_FRIENDLY_VOICES = {
  // US English voices
  'Ivy': { language: 'en-US', gender: 'Female', description: 'Child-like, clear female voice' },
  'Joanna': { language: 'en-US', gender: 'Female', description: 'Warm, friendly female voice' },
  'Matthew': { language: 'en-US', gender: 'Male', description: 'Clear, gentle male voice' },
  'Kimberly': { language: 'en-US', gender: 'Female', description: 'Young, energetic female voice' },
  'Justin': { language: 'en-US', gender: 'Male', description: 'Young, clear male voice' },
  
  // British English voices
  'Amy': { language: 'en-GB', gender: 'Female', description: 'British female voice' },
  'Brian': { language: 'en-GB', gender: 'Male', description: 'British male voice' },
  'Emma': { language: 'en-GB', gender: 'Female', description: 'British female voice (neural)' },
  
  // Australian English voices
  'Nicole': { language: 'en-AU', gender: 'Female', description: 'Australian female voice' },
  'Russell': { language: 'en-AU', gender: 'Male', description: 'Australian male voice' },
};

// Polly client instance
let pollyClient = null;

// Initialize Polly client
const getPollyClient = () => {
  if (!pollyClient) {
    try {
      pollyClient = new PollyClient({
        region: process.env.AWS_POLLY_REGION || 'ap-southeast-1',
        credentials: fromEnv(),
      });
    } catch (error) {
      console.error('Failed to initialize Polly client:', error);
      throw new Error('AWS Polly service unavailable');
    }
  }
  return pollyClient;
};

// Generate speech from text
export const synthesizeText = async (text, voiceId = null, options = {}) => {
  try {
    const client = getPollyClient();
    
    const command = new SynthesizeSpeechCommand({
      Text: text,
      VoiceId: voiceId || process.env.AWS_POLLY_DEFAULT_VOICE || 'Ivy',
      OutputFormat: options.outputFormat || process.env.AWS_POLLY_OUTPUT_FORMAT || 'mp3',
      SampleRate: options.sampleRate || process.env.AWS_POLLY_SAMPLE_RATE || '22050',
      Engine: options.engine || process.env.AWS_POLLY_VOICE_ENGINE || 'neural',
      TextType: options.textType || 'text', // 'text' or 'ssml'
      LanguageCode: options.languageCode || 'en-US',
    });

    const response = await client.send(command);
    
    // Convert the audio stream to a blob
    const audioStream = response.AudioStream;
    const chunks = [];
    
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    
    const audioBuffer = Buffer.concat(chunks);
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    
    return {
      audioBlob,
      audioUrl: URL.createObjectURL(audioBlob),
      metadata: {
        voiceId: command.input.VoiceId,
        outputFormat: command.input.OutputFormat,
        textLength: text.length,
        estimatedDuration: Math.ceil(text.length / 10), // Rough estimate: ~10 characters per second
      }
    };
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    throw new Error(`Speech synthesis failed: ${error.message}`);
  }
};

// Get available voices
export const getAvailableVoices = async (languageCode = 'en-US') => {
  try {
    const client = getPollyClient();
    
    const command = new DescribeVoicesCommand({
      LanguageCode: languageCode,
      Engine: 'neural', // Prefer neural voices for better quality
    });

    const response = await client.send(command);
    
    // Filter to child-friendly voices and add our metadata
    return response.Voices
      .filter(voice => CHILD_FRIENDLY_VOICES[voice.Id])
      .map(voice => ({
        ...voice,
        ...CHILD_FRIENDLY_VOICES[voice.Id],
        isRecommended: ['Ivy', 'Joanna', 'Matthew', 'Kimberly', 'Justin'].includes(voice.Id),
      }));
  } catch (error) {
    console.error('Error fetching voices:', error);
    // Return fallback child-friendly voices
    return Object.entries(CHILD_FRIENDLY_VOICES)
      .filter(([id, info]) => info.language === languageCode)
      .map(([id, info]) => ({
        Id: id,
        Name: id,
        ...info,
        isRecommended: ['Ivy', 'Joanna', 'Matthew', 'Kimberly', 'Justin'].includes(id),
      }));
  }
};

// Synthesize story text with SSML for better narration
export const synthesizeStoryText = async (storyData, voiceId = null, options = {}) => {
  try {
    const { title, text, characterName } = storyData;
    
    // Create SSML for better story narration
    const ssmlText = `
      <speak>
        <prosody rate="medium" pitch="medium">
          <emphasis level="strong">${title}</emphasis>
          <break time="1s"/>
          ${text.replace(new RegExp(characterName || 'Lily', 'g'), 
            `<emphasis level="moderate">${characterName || 'Lily'}</emphasis>`)}
        </prosody>
      </speak>
    `;

    return await synthesizeText(ssmlText, voiceId, {
      ...options,
      textType: 'ssml',
    });
  } catch (error) {
    console.error('Error synthesizing story text:', error);
    // Fallback to plain text if SSML fails
    return await synthesizeText(`${storyData.title}. ${storyData.text}`, voiceId, options);
  }
};

// Cleanup audio URLs to prevent memory leaks
export const cleanupAudioUrl = (audioUrl) => {
  if (audioUrl && audioUrl.startsWith('blob:')) {
    URL.revokeObjectURL(audioUrl);
  }
};

// Test Polly service connection
export const testPollyConnection = async () => {
  try {
    const voices = await getAvailableVoices();
    return {
      success: true,
      message: `Connected to AWS Polly. Found ${voices.length} child-friendly voices.`,
      voices: voices.slice(0, 3), // Return first 3 voices as test
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to AWS Polly: ${error.message}`,
      error: error.message,
    };
  }
};