import { useState, useEffect, useRef, useCallback } from 'react';
import { TranscribeService } from '../utils/transcribeService';

export const useTranscribe = (options = {}) => {
  // State management
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Refs
  const transcribeServiceRef = useRef(null);
  const initializationPromiseRef = useRef(null);

  // Options
  const {
    languageCode = 'en-US',
    onTranscript,
    onFinalTranscript,
    onError: onErrorCallback,
    onEnd,
    autoRestart = false,
    confidenceThreshold = 0.3,
  } = options;

  // Check browser support and initialize
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Check if required APIs are available
        const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext);
        
        if (hasMediaDevices && hasAudioContext) {
          setIsSupported(true);
          
          // Test microphone permission
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Clean up test stream
            setPermissionGranted(true);
          } catch (permError) {
            console.log('Microphone permission not granted yet:', permError.message);
            setPermissionGranted(false);
          }
        } else {
          setIsSupported(false);
          setError('Browser does not support required audio APIs');
        }
      } catch (error) {
        console.error('Error checking transcription support:', error);
        setIsSupported(false);
        setError('Failed to check browser support');
      }
    };

    checkSupport();
  }, []);

  // Initialize transcribe service
  const initializeService = useCallback(async () => {
    if (transcribeServiceRef.current || !isSupported) {
      return transcribeServiceRef.current;
    }

    // Return existing promise if initialization is in progress
    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current;
    }

    setIsInitializing(true);
    setError(null);

    initializationPromiseRef.current = (async () => {
      try {
        const service = new TranscribeService();
        
        // Set up event handlers
        service.setOnTranscript((result) => {
          setTranscript(result.transcript);
          setConfidence(result.confidence);
          
          if (onTranscript) {
            onTranscript(result);
          }
          
          if (result.isFinal && onFinalTranscript) {
            onFinalTranscript(result);
          }
        });

        service.setOnError((error) => {
          console.error('Transcription error:', error);
          setError(error.message || 'Transcription failed');
          setIsListening(false);
          
          if (onErrorCallback) {
            onErrorCallback(error);
          }
        });

        service.setOnEnd(() => {
          setIsListening(false);
          
          if (onEnd) {
            onEnd();
          }
          
          // Auto-restart if enabled and no error
          if (autoRestart && !error) {
            setTimeout(() => {
              startListening();
            }, 1000);
          }
        });

        const success = await service.initialize();
        if (!success) {
          throw new Error('Failed to initialize transcription service');
        }

        transcribeServiceRef.current = service;
        setPermissionGranted(true);
        return service;
      } catch (error) {
        console.error('Failed to initialize transcribe service:', error);
        setError(error.message || 'Failed to initialize transcription');
        throw error;
      } finally {
        setIsInitializing(false);
        initializationPromiseRef.current = null;
      }
    })();

    return initializationPromiseRef.current;
  }, [isSupported, onTranscript, onFinalTranscript, onErrorCallback, onEnd, autoRestart, error]);

  // Start listening
  const startListening = useCallback(async () => {
    if (isListening || !isSupported) {
      return false;
    }

    try {
      setError(null);
      
      const service = await initializeService();
      if (!service) {
        throw new Error('Failed to initialize transcription service');
      }

      const success = await service.startTranscription({
        languageCode,
      });

      if (success) {
        setIsListening(true);
        setTranscript('');
        setConfidence(0);
        return true;
      } else {
        throw new Error('Failed to start transcription');
      }
    } catch (error) {
      console.error('Failed to start listening:', error);
      setError(error.message || 'Failed to start listening');
      setIsListening(false);
      return false;
    }
  }, [isListening, isSupported, initializeService, languageCode]);

  // Stop listening
  const stopListening = useCallback(async () => {
    if (!isListening || !transcribeServiceRef.current) {
      return;
    }

    try {
      await transcribeServiceRef.current.stopTranscription();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping transcription:', error);
      setError(error.message || 'Error stopping transcription');
      setIsListening(false);
    }
  }, [isListening]);

  // Toggle listening
  const toggleListening = useCallback(async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      setError(null);
      return true;
    } catch (error) {
      console.error('Permission denied:', error);
      setError('Microphone permission denied');
      setPermissionGranted(false);
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transcribeServiceRef.current) {
        transcribeServiceRef.current.cleanup();
        transcribeServiceRef.current = null;
      }
    };
  }, []);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
  }, []);

  return {
    // State
    isSupported,
    isListening,
    isInitializing,
    transcript,
    confidence,
    error,
    permissionGranted,
    
    // Actions
    startListening,
    stopListening,
    toggleListening,
    requestPermission,
    clearTranscript,
    
    // Computed
    isReady: isSupported && permissionGranted && !isInitializing,
    hasHighConfidence: confidence >= confidenceThreshold,
  };
};
