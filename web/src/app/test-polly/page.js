'use client';

import { useState, useEffect } from 'react';
import { useTTS } from '../../hooks/useTTS';
import { useTranscribe } from '../../hooks/useTranscribe';


// Robust unique ID generator for React keys
const genId = () => (
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
);

export default function TestPollyPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testText, setTestText] = useState("Hello! This is a test of Amazon Polly text-to-speech. The quick brown fox jumps over the lazy dog.");

  const tts = useTTS({
    defaultVoice: 'Ivy',
    onEnd: () => {
      addResult('Audio playback completed', 'success');
    }
  });

  const transcribe = useTranscribe({
    languageCode: 'en-US',
    onFinalTranscript: (result) => {
      addResult(`Transcription: "${result.transcript}" (${Math.round(result.confidence * 100)}% confidence)`, 'success');
    },
    onError: (error) => {
      addResult(`Transcription error: ${error.message}`, 'error');
    },
    confidenceThreshold: 0.3,
  });

  const addResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, {
      id: genId(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: Load available voices
  const testVoices = async () => {
    addResult('Testing voice loading...', 'info');
    try {
      await tts.loadVoices();
      if (tts.availableVoices.length > 0) {
        addResult(`✅ Loaded ${tts.availableVoices.length} voices: ${tts.availableVoices.map(v => v.Id).join(', ')}`, 'success');
      } else {
        addResult('❌ No voices loaded', 'error');
      }
    } catch (error) {
      addResult(`❌ Voice loading failed: ${error.message}`, 'error');
    }
  };

  // Test 2: Test API endpoint directly
  const testAPIEndpoint = async () => {
    addResult('Testing API endpoint...', 'info');
    try {
      const response = await fetch('/api/tts?language=en-US');
      const data = await response.json();

      if (data.success) {
        addResult(`✅ API endpoint working: ${data.voices?.length || 0} voices available`, 'success');
      } else {
        addResult(`❌ API endpoint failed: ${data.error}`, 'error');
      }
    } catch (error) {
      addResult(`❌ API endpoint error: ${error.message}`, 'error');
    }
  };

  // Test 3: Test text synthesis
  const testSynthesis = async () => {
    addResult('Testing text synthesis...', 'info');
    try {
      const result = await tts.synthesizeAndPlay(testText);
      if (result.success) {
        addResult('✅ Text synthesis successful', 'success');
      } else {
        addResult(`❌ Text synthesis failed: ${result.error}`, 'error');
      }
    } catch (error) {
      addResult(`❌ Synthesis error: ${error.message}`, 'error');
    }
  };

  // Test 4: Test different voices
  const testDifferentVoices = async () => {
    const voicesToTest = ['Ivy', 'Joanna', 'Matthew'];

    for (const voice of voicesToTest) {
      addResult(`Testing voice: ${voice}`, 'info');
      try {
        tts.setSelectedVoice(voice);
        const result = await tts.synthesizeAndPlay(`Hello, this is ${voice} speaking.`);
        if (result.success) {
          addResult(`✅ Voice ${voice} working`, 'success');
        } else {
          addResult(`❌ Voice ${voice} failed: ${result.error}`, 'error');
        }
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        addResult(`❌ Voice ${voice} error: ${error.message}`, 'error');
      }
    }
  };

  // Test 5: Test SSML
  const testSSML = async () => {
    addResult('Testing SSML support...', 'info');
    try {
      tts.setNaturalSpeech(true);
      const result = await tts.synthesizeAndPlay("This is a test with natural speech, pauses, and emphasis!");
      if (result.success) {
        addResult('✅ SSML synthesis successful', 'success');
      } else {
        addResult(`❌ SSML synthesis failed: ${result.error}`, 'error');
      }
    } catch (error) {
      addResult(`❌ SSML error: ${error.message}`, 'error');
    }
  };

  // Test 6: Test Amazon Transcribe
  const testTranscribe = async () => {
    addResult('Testing Amazon Transcribe...', 'info');
    try {
      if (!transcribe.isSupported) {
        addResult('❌ Amazon Transcribe not supported in this browser', 'error');
        return;
      }

      if (!transcribe.permissionGranted) {
        addResult('Requesting microphone permission...', 'info');
        const granted = await transcribe.requestPermission();
        if (!granted) {
          addResult('❌ Microphone permission denied', 'error');
          return;
        }
      }

      addResult('Starting transcription... (speak something)', 'info');
      const success = await transcribe.startListening();
      if (success) {
        addResult('✅ Amazon Transcribe started successfully', 'success');

        // Stop after 5 seconds
        setTimeout(() => {
          transcribe.stopListening();
          addResult('Transcription stopped', 'info');
        }, 5000);
      } else {
        addResult('❌ Failed to start Amazon Transcribe', 'error');
      }
    } catch (error) {
      addResult(`❌ Transcribe error: ${error.message}`, 'error');
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();

    addResult('🎯 Starting Amazon Polly Test Suite', 'info');

    await testAPIEndpoint();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testVoices();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testSynthesis();
    await new Promise(resolve => setTimeout(resolve, 3000));

    await testSSML();
    await new Promise(resolve => setTimeout(resolve, 3000));

    await testDifferentVoices();

    await testTranscribe();

    addResult('🎉 Test suite completed!', 'success');
    setIsRunning(false);
  };

  const getResultColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Amazon Polly Test Suite</h1>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Text:
            </label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md"
              rows={3}
              disabled={isRunning}
            />
          </div>

          <div className="flex gap-4 flex-wrap">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>

            <button
              onClick={testAPIEndpoint}
              disabled={isRunning}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Test API
            </button>

            <button
              onClick={testVoices}
              disabled={isRunning}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Test Voices
            </button>

            <button
              onClick={testSynthesis}
              disabled={isRunning}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              Test Synthesis
            </button>

            <button
              onClick={testTranscribe}
              disabled={isRunning}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Test Transcribe
            </button>

            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* TTS & Transcribe Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">TTS & Transcribe Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl ${tts.isLoading ? 'text-yellow-500' : 'text-gray-400'}`}>
                ⏳
              </div>
              <div className="text-sm">Loading</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl ${tts.isPlaying ? 'text-green-500' : 'text-gray-400'}`}>
                ▶️
              </div>
              <div className="text-sm">Playing</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl ${tts.isPaused ? 'text-blue-500' : 'text-gray-400'}`}>
                ⏸️
              </div>
              <div className="text-sm">Paused</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl ${tts.error ? 'text-red-500' : 'text-gray-400'}`}>
                ❌
              </div>
              <div className="text-sm">Error</div>
            </div>
          </div>

          {tts.error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-red-700">Error: {tts.error}</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Text-to-Speech (Polly)</h3>
              <p>Selected Voice: {tts.selectedVoice}</p>
              <p>Available Voices: {tts.availableVoices.length}</p>
              <p>Natural Speech: {tts.naturalSpeech ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Speech-to-Text (Transcribe)</h3>
              <p>Supported: {transcribe.isSupported ? 'Yes' : 'No'}</p>
              <p>Permission: {transcribe.permissionGranted ? 'Granted' : 'Not granted'}</p>
              <p>Ready: {transcribe.isReady ? 'Yes' : 'No'}</p>
              <p>Listening: {transcribe.isListening ? 'Yes' : 'No'}</p>
              {transcribe.transcript && (
                <p>Last: &ldquo;{transcribe.transcript.substring(0, 30)}&hellip;&rdquo;</p>
              )}
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>

          {testResults.length === 0 ? (
            <p className="text-gray-500 italic">No test results yet. Run some tests to see results here.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result) => (
                <div key={result.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                  <span className="text-xs text-gray-500 min-w-[60px]">
                    {result.timestamp}
                  </span>
                  <span className={`flex-1 ${getResultColor(result.type)}`}>
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
