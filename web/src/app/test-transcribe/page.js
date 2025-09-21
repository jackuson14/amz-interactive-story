'use client';

import { useState, useEffect } from 'react';
import { useTranscribe } from '../../hooks/useTranscribe';


// Robust unique ID generator for React keys
const genId = () => (
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
);

export default function TestTranscribePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [testResults, setTestResults] = useState([]);
  const [isTestRunning, setIsTestRunning] = useState(false);

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

  // Initialize transcribe with callbacks
  const transcribe = useTranscribe({
    languageCode: 'en-US',
    onTranscript: (result) => {
      if (!result.isFinal) {
        addResult(`Partial: "${result.transcript}"`, 'info');
      }
    },
    onFinalTranscript: (result) => {
      addResult(`Final: "${result.transcript}" (${Math.round(result.confidence * 100)}% confidence)`, 'success');

      // Test voice command recognition
      const transcript = result.transcript.toLowerCase();
      if (transcript.includes('hello')) {
        addResult('✅ Detected "hello" command!', 'success');
      } else if (transcript.includes('test')) {
        addResult('✅ Detected "test" command!', 'success');
      } else if (transcript.includes('stop')) {
        addResult('✅ Detected "stop" command - stopping transcription', 'success');
        transcribe.stopListening();
      }
    },
    onError: (error) => {
      addResult(`❌ Error: ${error.message}`, 'error');
    },
    confidenceThreshold: 0.3,
  });

  // Test microphone permission
  const testPermission = async () => {
    setIsTestRunning(true);
    addResult('Testing microphone permission...', 'info');

    try {
      const granted = await transcribe.requestPermission();
      if (granted) {
        addResult('✅ Microphone permission granted', 'success');
      } else {
        addResult('❌ Microphone permission denied', 'error');
      }
    } catch (error) {
      addResult(`❌ Permission test failed: ${error.message}`, 'error');
    }

    setIsTestRunning(false);
  };

  // Start listening test
  const startListeningTest = async () => {
    setIsTestRunning(true);
    addResult('Starting transcription test...', 'info');
    addResult('💡 Try saying: "Hello", "Test", or "Stop"', 'info');

    try {
      const success = await transcribe.startListening();
      if (success) {
        addResult('✅ Transcription started successfully', 'success');
        addResult('🎤 Listening... speak now!', 'info');
      } else {
        addResult('❌ Failed to start transcription', 'error');
      }
    } catch (error) {
      addResult(`❌ Start listening failed: ${error.message}`, 'error');
    }

    setIsTestRunning(false);
  };

  // Stop listening
  const stopListening = () => {
    addResult('Stopping transcription...', 'info');
    transcribe.stopListening();
    addResult('✅ Transcription stopped', 'success');
  };

  // Run comprehensive test
  const runComprehensiveTest = async () => {
    setIsTestRunning(true);
    clearResults();

    addResult('🧪 Starting comprehensive Amazon Transcribe test...', 'info');

    // Test 1: Browser support
    addResult(`Browser support: ${transcribe.isSupported ? '✅ Supported' : '❌ Not supported'}`,
              transcribe.isSupported ? 'success' : 'error');

    if (!transcribe.isSupported) {
      addResult('❌ Cannot continue - browser not supported', 'error');
      setIsTestRunning(false);
      return;
    }

    // Test 2: Permission
    addResult('Testing microphone permission...', 'info');
    try {
      const granted = await transcribe.requestPermission();
      addResult(`Permission: ${granted ? '✅ Granted' : '❌ Denied'}`,
                granted ? 'success' : 'error');

      if (!granted) {
        addResult('❌ Cannot continue - permission denied', 'error');
        setIsTestRunning(false);
        return;
      }
    } catch (error) {
      addResult(`❌ Permission error: ${error.message}`, 'error');
      setIsTestRunning(false);
      return;
    }

    // Test 3: Service initialization
    addResult(`Service ready: ${transcribe.isReady ? '✅ Ready' : '❌ Not ready'}`,
              transcribe.isReady ? 'success' : 'error');

    if (transcribe.isReady) {
      addResult('🎉 All tests passed! You can now test voice recognition.', 'success');
      addResult('💡 Click "Start Listening" and say something!', 'info');
    }

    setIsTestRunning(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Amazon Transcribe Test</h1>
        <p className="text-gray-600 mb-8">Test real-time speech-to-text functionality</p>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className={`text-2xl mb-2 ${transcribe.isSupported ? 'text-green-500' : 'text-red-500'}`}>
              {transcribe.isSupported ? '✅' : '❌'}
            </div>
            <div className="text-sm font-medium">Browser Support</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className={`text-2xl mb-2 ${transcribe.permissionGranted ? 'text-green-500' : 'text-gray-400'}`}>
              {transcribe.permissionGranted ? '🎤' : '🔇'}
            </div>
            <div className="text-sm font-medium">Microphone</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className={`text-2xl mb-2 ${transcribe.isReady ? 'text-green-500' : 'text-gray-400'}`}>
              {transcribe.isReady ? '🚀' : '⏳'}
            </div>
            <div className="text-sm font-medium">Service Ready</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className={`text-2xl mb-2 ${transcribe.isListening ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`}>
              {transcribe.isListening ? '👂' : '💤'}
            </div>
            <div className="text-sm font-medium">Listening</div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={runComprehensiveTest}
              disabled={isTestRunning}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {isTestRunning ? 'Running Tests...' : 'Run Full Test'}
            </button>

            <button
              onClick={testPermission}
              disabled={isTestRunning}
              className="bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Test Permission
            </button>

            <button
              onClick={startListeningTest}
              disabled={isTestRunning || !transcribe.isReady || transcribe.isListening}
              className="bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Start Listening
            </button>

            <button
              onClick={stopListening}
              disabled={!transcribe.isListening}
              className="bg-red-600 text-white px-4 py-3 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Stop Listening
            </button>

            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-4 py-3 rounded-md hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Current Status */}
        {transcribe.isListening && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-blue-800">Currently Listening</span>
            </div>
            {transcribe.transcript && (
              <div className="text-blue-700">
                <strong>Current transcript:</strong> &ldquo;{transcribe.transcript}&rdquo;
                {transcribe.confidence > 0 && (
                  <span className="ml-2 text-sm opacity-75">
                    ({Math.round(transcribe.confidence * 100)}% confidence)
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {transcribe.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800">
              <strong>Error:</strong> {transcribe.error}
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>

          {testResults.length === 0 ? (
            <p className="text-gray-500 italic">No test results yet. Run a test to see results here.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result) => (
                <div key={result.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                  <span className="text-xs text-gray-500 min-w-[60px] mt-1">
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

        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">How to Test</h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700">
            <li>Click &quot;Run Full Test&quot; to check browser support and permissions</li>
            <li>Grant microphone permission when prompted</li>
            <li>Click &quot;Start Listening&quot; to begin voice recognition</li>
            <li>Speak clearly into your microphone</li>
            <li>Try saying: &quot;Hello&quot;, &quot;Test&quot;, or &quot;Stop&quot; to see command recognition</li>
            <li>Watch the results appear in real-time below</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
