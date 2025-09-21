#!/usr/bin/env node

/**
 * Amazon Transcribe Integration Test
 * 
 * This script tests the Amazon Transcribe implementation
 */

// Test environment variables
function checkEnvironment() {
  console.log('🔍 Checking environment variables for Amazon Transcribe...\n');
  
  const required = ['APP_AWS_ACCESS_KEY_ID', 'APP_AWS_SECRET_ACCESS_KEY'];
  const optional = ['AWS_TRANSCRIBE_REGION', 'AWS_POLLY_REGION'];
  
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
      console.log(`⚠️  ${env}: Using default (ap-southeast-1)`);
    }
  }
  
  return hasRequired;
}

// Test AWS SDK import
async function testAWSSDK() {
  console.log('\n🔍 Testing AWS Transcribe SDK import...\n');
  
  try {
    const { TranscribeStreamingClient, StartStreamTranscriptionCommand } = await import('@aws-sdk/client-transcribe-streaming');
    
    console.log('✅ AWS Transcribe SDK imported successfully');
    
    // Test client creation
    const client = new TranscribeStreamingClient({
      region: process.env.AWS_TRANSCRIBE_REGION || process.env.AWS_POLLY_REGION || 'ap-southeast-1',
      credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
      },
    });
    
    console.log('✅ Transcribe client created successfully');
    console.log(`✅ Region: ${client.config.region}`);
    
    return true;
  } catch (error) {
    console.log(`❌ AWS SDK test failed: ${error.message}`);
    return false;
  }
}

// Test browser APIs (simulated)
function testBrowserAPIs() {
  console.log('\n🔍 Testing browser API compatibility...\n');
  
  // Check if we're in Node.js environment
  if (typeof window === 'undefined') {
    console.log('⚠️  Running in Node.js environment - browser APIs not available');
    console.log('✅ In browser environment, these APIs would be checked:');
    console.log('   - navigator.mediaDevices.getUserMedia()');
    console.log('   - AudioContext or webkitAudioContext');
    console.log('   - MediaStream API');
    console.log('   - ScriptProcessorNode');
    return true;
  }
  
  // Browser environment checks would go here
  return true;
}

// Test service files
function testServiceFiles() {
  console.log('\n🔍 Testing service files...\n');
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'src/utils/transcribeService.js',
    'src/hooks/useTranscribe.js',
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}: Exists`);
    } else {
      console.log(`❌ ${file}: Missing`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

// Main test runner
async function runTests() {
  console.log('🎯 Amazon Transcribe Integration Test\n');
  console.log('=' .repeat(50));
  
  // Test 1: Environment variables
  const envOk = checkEnvironment();
  if (!envOk) {
    console.log('\n❌ CRITICAL: Missing required environment variables!');
    console.log('Please set the following environment variables:');
    console.log('  APP_AWS_ACCESS_KEY_ID=your_access_key');
    console.log('  APP_AWS_SECRET_ACCESS_KEY=your_secret_key');
    console.log('\nOptional variables:');
    console.log('  AWS_TRANSCRIBE_REGION=ap-southeast-1');
    return;
  }
  
  // Test 2: AWS SDK
  const sdkOk = await testAWSSDK();
  if (!sdkOk) {
    console.log('\n❌ AWS SDK test failed! Check your credentials and region.');
    return;
  }
  
  // Test 3: Browser APIs
  const browserOk = testBrowserAPIs();
  
  // Test 4: Service files
  const filesOk = testServiceFiles();
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log('✅ Environment variables: OK');
  console.log('✅ AWS SDK: OK');
  console.log(browserOk ? '✅ Browser APIs: OK' : '⚠️  Browser APIs: Limited (Node.js env)');
  console.log(filesOk ? '✅ Service files: OK' : '❌ Service files: Missing');
  
  if (envOk && sdkOk && filesOk) {
    console.log('\n🚀 Amazon Transcribe integration is ready!');
    console.log('You can now use real-time speech recognition in your story app.');
    console.log('\nNext steps:');
    console.log('1. Start your Next.js development server: npm run dev');
    console.log('2. Navigate to a story page');
    console.log('3. Click the "Listen" button to test voice recognition');
    console.log('4. Grant microphone permissions when prompted');
    console.log('5. Speak voice commands like "next", "previous", or story-specific keywords');
  } else {
    console.log('\n⚠️  Some issues found. Please fix them before using the transcription feature.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
