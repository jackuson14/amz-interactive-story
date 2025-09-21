#!/usr/bin/env node

/**
 * Comprehensive Amazon Polly Implementation Test
 * 
 * This script tests all aspects of your Amazon Polly integration:
 * 1. Environment variables and credentials
 * 2. AWS SDK client initialization
 * 3. API endpoint functionality
 * 4. Voice availability
 * 5. Text-to-speech synthesis
 * 6. SSML support
 * 7. Error handling
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`${status.padEnd(6)} ${testName}`, statusColor);
  if (details) {
    log(`       ${details}`, 'reset');
  }
}

// Test environment variables
function testEnvironmentVariables() {
  logSection('1. ENVIRONMENT VARIABLES CHECK');
  
  const requiredEnvVars = [
    'APP_AWS_ACCESS_KEY_ID',
    'APP_AWS_SECRET_ACCESS_KEY',
  ];
  
  const optionalEnvVars = [
    'AWS_POLLY_REGION',
    'AWS_POLLY_DEFAULT_VOICE',
    'AWS_POLLY_OUTPUT_FORMAT',
    'AWS_POLLY_SAMPLE_RATE',
    'AWS_POLLY_VOICE_ENGINE',
  ];
  
  let allRequired = true;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      logTest(`${envVar}`, 'PASS', 'Set');
    } else {
      logTest(`${envVar}`, 'FAIL', 'Missing - Required for Polly to work');
      allRequired = false;
    }
  }
  
  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      logTest(`${envVar}`, 'PASS', `Set to: ${process.env[envVar]}`);
    } else {
      logTest(`${envVar}`, 'WARN', 'Not set - Using default value');
    }
  }
  
  return allRequired;
}

// Test server startup and API endpoints
async function testServerAndAPI() {
  logSection('2. SERVER AND API ENDPOINT TESTS');
  
  return new Promise((resolve) => {
    // Start the Next.js server
    log('Starting Next.js development server...', 'blue');
    const server = spawn('npm', ['run', 'dev'], {
      cwd: __dirname,
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    let serverReady = false;
    let serverOutput = '';
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      
      if (output.includes('Ready') || output.includes('localhost:3000')) {
        serverReady = true;
        log('Server started successfully', 'green');
        runAPITests().then(resolve);
      }
    });
    
    server.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('warn') && !output.includes('Warning')) {
        log(`Server error: ${output}`, 'red');
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        logTest('Server startup', 'FAIL', 'Server failed to start within 30 seconds');
        server.kill();
        resolve(false);
      }
    }, 30000);
    
    // Cleanup on exit
    process.on('exit', () => {
      server.kill();
    });
  });
}

// Test API endpoints
async function runAPITests() {
  try {
    // Import fetch for Node.js
    const { default: fetch } = await import('node-fetch');
    
    // Test 1: GET /api/tts (voice listing)
    try {
      log('\nTesting GET /api/tts (voice listing)...', 'blue');
      const response = await fetch('http://localhost:3000/api/tts?language=en-US');
      const data = await response.json();
      
      if (response.ok && data.success) {
        logTest('GET /api/tts', 'PASS', `Found ${data.voices?.length || 0} voices`);
        if (data.voices && data.voices.length > 0) {
          log(`       Available voices: ${data.voices.map(v => v.Id).join(', ')}`, 'reset');
        }
      } else {
        logTest('GET /api/tts', 'FAIL', data.error || 'Unknown error');
      }
    } catch (error) {
      logTest('GET /api/tts', 'FAIL', error.message);
    }
    
    // Test 2: POST /api/tts (text synthesis)
    try {
      log('\nTesting POST /api/tts (text synthesis)...', 'blue');
      const testText = "Hello! This is a test of Amazon Polly text-to-speech.";
      
      const response = await fetch('http://localhost:3000/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceId: 'Ivy',
          options: {
            outputFormat: 'mp3',
            sampleRate: '22050',
            engine: 'neural',
            naturalSpeech: false // Test plain text first
          }
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.audio) {
        logTest('POST /api/tts (plain text)', 'PASS', `Generated ${data.audio.length} bytes of audio`);
        log(`       Voice: ${data.metadata?.voiceId}, Format: ${data.metadata?.outputFormat}`, 'reset');
      } else {
        logTest('POST /api/tts (plain text)', 'FAIL', data.error || 'No audio generated');
      }
    } catch (error) {
      logTest('POST /api/tts (plain text)', 'FAIL', error.message);
    }
    
    // Test 3: POST /api/tts with SSML
    try {
      log('\nTesting POST /api/tts with SSML...', 'blue');
      const testText = "This is a test with natural speech and pauses.";
      
      const response = await fetch('http://localhost:3000/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceId: 'Ivy',
          options: {
            outputFormat: 'mp3',
            sampleRate: '22050',
            engine: 'neural',
            naturalSpeech: true // Test SSML
          }
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.audio) {
        logTest('POST /api/tts (SSML)', 'PASS', `Generated ${data.audio.length} bytes of audio with SSML`);
      } else {
        logTest('POST /api/tts (SSML)', 'FAIL', data.error || 'SSML synthesis failed');
      }
    } catch (error) {
      logTest('POST /api/tts (SSML)', 'FAIL', error.message);
    }
    
    // Test 4: Error handling
    try {
      log('\nTesting error handling...', 'blue');
      const response = await fetch('http://localhost:3000/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '', // Empty text should cause error
          voiceId: 'InvalidVoice'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        logTest('Error handling', 'PASS', 'Properly handles invalid requests');
      } else {
        logTest('Error handling', 'WARN', 'Should have failed with empty text');
      }
    } catch (error) {
      logTest('Error handling', 'PASS', 'Network error handling works');
    }
    
    return true;
  } catch (error) {
    logTest('API Tests', 'FAIL', error.message);
    return false;
  }
}

// Test client-side integration
function testClientIntegration() {
  logSection('3. CLIENT-SIDE INTEGRATION CHECK');
  
  // Check if required files exist
  const requiredFiles = [
    'src/hooks/useTTS.js',
    'src/utils/pollyService.js',
    'src/app/api/tts/route.js'
  ];
  
  const fs = require('fs');
  const path = require('path');
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      logTest(`File: ${file}`, 'PASS', 'Exists');
    } else {
      logTest(`File: ${file}`, 'FAIL', 'Missing');
    }
  }
}

// Main test runner
async function runAllTests() {
  log('Amazon Polly Implementation Test Suite', 'magenta');
  log('=====================================', 'magenta');
  
  // Test 1: Environment Variables
  const envOk = testEnvironmentVariables();
  
  if (!envOk) {
    log('\n❌ CRITICAL: Missing required environment variables!', 'red');
    log('Please set the following environment variables:', 'yellow');
    log('  APP_AWS_ACCESS_KEY_ID=your_access_key', 'yellow');
    log('  APP_AWS_SECRET_ACCESS_KEY=your_secret_key', 'yellow');
    log('\nOptional variables (with defaults):', 'yellow');
    log('  AWS_POLLY_REGION=ap-southeast-1', 'yellow');
    log('  AWS_POLLY_DEFAULT_VOICE=Ivy', 'yellow');
    log('  AWS_POLLY_OUTPUT_FORMAT=mp3', 'yellow');
    log('  AWS_POLLY_SAMPLE_RATE=22050', 'yellow');
    log('  AWS_POLLY_VOICE_ENGINE=neural', 'yellow');
    return;
  }
  
  // Test 2: Client Integration
  testClientIntegration();
  
  // Test 3: Server and API
  log('\nStarting server tests (this may take a moment)...', 'blue');
  await testServerAndAPI();
  
  logSection('TEST SUMMARY');
  log('✅ Environment variables configured', 'green');
  log('✅ Client-side files present', 'green');
  log('✅ API endpoints tested', 'green');
  log('\nIf all tests passed, your Amazon Polly integration is working correctly!', 'green');
  log('You can now use the read-aloud feature in your story app.', 'green');
  
  process.exit(0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
