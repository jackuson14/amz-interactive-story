#!/usr/bin/env node

/**
 * Simple Amazon Polly Test
 * 
 * Quick test to verify your Polly setup is working
 */

// Test environment variables first
function checkEnvironment() {
  console.log('🔍 Checking environment variables...\n');
  
  const required = ['APP_AWS_ACCESS_KEY_ID', 'APP_AWS_SECRET_ACCESS_KEY'];
  const optional = ['AWS_POLLY_REGION', 'AWS_POLLY_DEFAULT_VOICE'];
  
  let hasRequired = true;
  
  for (const env of required) {
    if (process.env[env]) {
      console.log(`✅ ${env}: Set`);
    } else {
      console.log(`❌ ${env}: Missing`);
      hasRequired = false;
    }
  }
  
  for (const env of optional) {
    if (process.env[env]) {
      console.log(`✅ ${env}: ${process.env[env]}`);
    } else {
      console.log(`⚠️  ${env}: Using default`);
    }
  }
  
  return hasRequired;
}

// Test AWS SDK directly
async function testAWSSDK() {
  console.log('\n🔍 Testing AWS SDK directly...\n');
  
  try {
    const { PollyClient, DescribeVoicesCommand } = await import('@aws-sdk/client-polly');
    
    const client = new PollyClient({
      region: process.env.AWS_POLLY_REGION || 'ap-southeast-1',
      credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
      },
    });
    
    console.log('✅ Polly client created successfully');
    
    // Test voice listing
    const command = new DescribeVoicesCommand({
      LanguageCode: 'en-US',
      Engine: 'neural'
    });
    
    const response = await client.send(command);
    console.log(`✅ Found ${response.Voices.length} voices`);
    
    // Show child-friendly voices
    const childFriendlyVoices = ['Ivy', 'Joanna', 'Matthew', 'Kimberly', 'Justin'];
    const availableChildVoices = response.Voices.filter(v => childFriendlyVoices.includes(v.Id));
    
    console.log(`✅ Child-friendly voices available: ${availableChildVoices.map(v => v.Id).join(', ')}`);
    
    return true;
  } catch (error) {
    console.log(`❌ AWS SDK test failed: ${error.message}`);
    return false;
  }
}

// Test a simple synthesis
async function testSynthesis() {
  console.log('\n🔍 Testing speech synthesis...\n');
  
  try {
    const { PollyClient, SynthesizeSpeechCommand } = await import('@aws-sdk/client-polly');
    
    const client = new PollyClient({
      region: process.env.AWS_POLLY_REGION || 'ap-southeast-1',
      credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
      },
    });
    
    const command = new SynthesizeSpeechCommand({
      Text: 'Hello! This is a test of Amazon Polly.',
      VoiceId: 'Ivy',
      OutputFormat: 'mp3',
      Engine: 'neural',
      TextType: 'text'
    });
    
    const response = await client.send(command);
    
    // Count audio data
    const chunks = [];
    for await (const chunk of response.AudioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    
    console.log(`✅ Speech synthesis successful! Generated ${audioBuffer.length} bytes of audio`);
    return true;
  } catch (error) {
    console.log(`❌ Speech synthesis failed: ${error.message}`);
    return false;
  }
}

// Test SSML
async function testSSML() {
  console.log('\n🔍 Testing SSML support...\n');
  
  try {
    const { PollyClient, SynthesizeSpeechCommand } = await import('@aws-sdk/client-polly');
    
    const client = new PollyClient({
      region: process.env.AWS_POLLY_REGION || 'ap-southeast-1',
      credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
      },
    });
    
    const ssmlText = `<speak><break time="500ms"/><prosody rate="100%">Hello! This is a test with <emphasis level="strong">emphasis</emphasis> and pauses.</prosody><break time="300ms"/></speak>`;
    
    const command = new SynthesizeSpeechCommand({
      Text: ssmlText,
      VoiceId: 'Ivy',
      OutputFormat: 'mp3',
      Engine: 'neural',
      TextType: 'ssml'
    });
    
    const response = await client.send(command);
    
    // Count audio data
    const chunks = [];
    for await (const chunk of response.AudioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    
    console.log(`✅ SSML synthesis successful! Generated ${audioBuffer.length} bytes of audio`);
    return true;
  } catch (error) {
    console.log(`❌ SSML synthesis failed: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🎯 Amazon Polly Simple Test\n');
  console.log('=' .repeat(40));
  
  // Check environment
  if (!checkEnvironment()) {
    console.log('\n❌ Environment check failed!');
    console.log('\nPlease set these environment variables:');
    console.log('export APP_AWS_ACCESS_KEY_ID="your_access_key"');
    console.log('export APP_AWS_SECRET_ACCESS_KEY="your_secret_key"');
    console.log('export AWS_POLLY_REGION="ap-southeast-1"  # optional');
    return;
  }
  
  // Test AWS SDK
  const sdkOk = await testAWSSDK();
  if (!sdkOk) {
    console.log('\n❌ AWS SDK test failed! Check your credentials and region.');
    return;
  }
  
  // Test synthesis
  const synthesisOk = await testSynthesis();
  if (!synthesisOk) {
    console.log('\n❌ Speech synthesis test failed!');
    return;
  }
  
  // Test SSML
  const ssmlOk = await testSSML();
  if (!ssmlOk) {
    console.log('\n⚠️  SSML test failed, but basic synthesis works.');
  }
  
  // Summary
  console.log('\n' + '=' .repeat(40));
  console.log('🎉 TEST SUMMARY');
  console.log('=' .repeat(40));
  console.log('✅ Environment variables: OK');
  console.log('✅ AWS SDK connection: OK');
  console.log('✅ Speech synthesis: OK');
  console.log(ssmlOk ? '✅ SSML support: OK' : '⚠️  SSML support: Limited');
  
  console.log('\n🚀 Your Amazon Polly integration is working!');
  console.log('You can now use the read-aloud feature in your story app.');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
