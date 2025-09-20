import { useState, useEffect, useRef, useCallback } from 'react';

export const useTTS = (options = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(options.defaultVoice || 'Ivy');
  const [naturalSpeech, setNaturalSpeech] = useState(true); // Enable natural speech by default
  
  const audioRef = useRef(null);
  const progressInterval = useRef(null);
  const [volume, setVolumeState] = useState(0.9); // Default to 90% volume (louder)

  // Load available voices on mount
  useEffect(() => {
    loadVoices();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const loadVoices = async () => {
    try {
      const response = await fetch('/api/tts?language=en-US');
      const data = await response.json();
      
      if (data.success) {
        setAvailableVoices(data.voices);
        
        // Set recommended voice as default if current selection isn't available
        const recommendedVoice = data.voices.find(v => v.isRecommended);
        if (recommendedVoice && !data.voices.find(v => v.Id === selectedVoice)) {
          setSelectedVoice(recommendedVoice.Id);
        }
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
      setError('Failed to load voice options');
    }
  };

  const synthesizeAndPlay = async (text, voice = null) => {
    try {
      setIsLoading(true);
      setError(null);

      const voiceToUse = voice || selectedVoice;
      
      console.log('Synthesizing text:', { text: text.substring(0, 50) + '...', voice: voiceToUse });

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId: voiceToUse,
          options: {
            outputFormat: 'mp3',
            sampleRate: '22050',
            engine: 'neural',
            textType: naturalSpeech ? 'ssml' : 'text',
            naturalSpeech: naturalSpeech,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to synthesize speech');
      }

      // Convert base64 to blob
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set higher default volume
      audio.volume = volume;

      // Set up event listeners
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setError('Audio playback failed');
        setIsPlaying(false);
        setIsPaused(false);
      });

      // Play the audio
      await audio.play();
      setIsPlaying(true);
      setIsPaused(false);

      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(audioUrl);
      }, 60000); // Clean up after 1 minute

      return {
        success: true,
        metadata: data.metadata,
      };

    } catch (error) {
      console.error('TTS Error:', error);
      setError(error.message || 'Speech synthesis failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const play = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, [isPaused]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  }, [isPlaying]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
    }
  }, []);

  const setVolume = useCallback((newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    }
  }, []);

  const seek = useCallback((percentage) => {
    if (audioRef.current && duration) {
      const newTime = (percentage / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(percentage);
    }
  }, [duration]);

  return {
    // State
    isLoading,
    isPlaying,
    isPaused,
    error,
    progress,
    duration,
    availableVoices,
    selectedVoice,
    volume,
    naturalSpeech,
    
    // Actions
    synthesizeAndPlay,
    play,
    pause,
    stop,
    setVolume,
    setPlaybackRate,
    seek,
    setSelectedVoice,
    setNaturalSpeech,
    loadVoices,
    
    // Computed
    isReady: !isLoading && !error,
    canPlay: !isLoading && isPaused,
    canPause: !isLoading && isPlaying,
  };
};