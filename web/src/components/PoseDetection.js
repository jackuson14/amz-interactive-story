"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

const PoseDetection = ({ onJumpDetected, onHandsUpDetected, isActive = false, detectionMode = 'jump' }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const streamRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const isDetectingRef = useRef(false); // More reliable detection state
  const [jumpStatus, setJumpStatus] = useState('');
  const [initStatus, setInitStatus] = useState('Starting...');
  const [cameraStatus, setCameraStatus] = useState('');
  const [poseStatus, setPoseStatus] = useState('');
  
  // Jump detection state
  const lastPositions = useRef([]);
  const jumpThreshold = 0.015; // Much more sensitive threshold
  const smoothingFrames = 3; // Fewer frames for faster detection
  const [debugInfo, setDebugInfo] = useState('');
  const [detectedLandmarks, setDetectedLandmarks] = useState('');
  const detectionCounter = useRef(0);

  // Initialize MediaPipe with extensive logging
  const initializePoseLandmarker = useCallback(async () => {
    if (!isActive) {
      console.log('🚫 PoseDetection: Not active, skipping initialization');
      return;
    }
    
    console.log('🚀 PoseDetection: Starting initialization...');
    setIsLoading(true);
    setError(null);
    setInitStatus('Loading MediaPipe...');
    
    try {
      console.log('📦 Importing MediaPipe tasks-vision...');
      setInitStatus('Importing MediaPipe library...');
      
      // Dynamic import to avoid SSR issues
      const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      console.log('✅ MediaPipe import successful');
      
      console.log('🔧 Creating FilesetResolver...');
      setInitStatus('Setting up WebAssembly...');
      
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      console.log('✅ FilesetResolver created');
      
      console.log('🤖 Creating PoseLandmarker...');
      setInitStatus('Loading pose detection model...');
      
      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.1, // Very low confidence for maximum sensitivity
        minPosePresenceConfidence: 0.1,
        minTrackingConfidence: 0.1
      });
      
      console.log('✅ PoseLandmarker created successfully');
      poseLandmarkerRef.current = poseLandmarker;
      setIsLoading(false);
      setInitStatus('MediaPipe ready!');
      
    } catch (err) {
      console.error('❌ Error initializing pose landmarker:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      setError(`Failed to load pose detection: ${err.message}`);
      setInitStatus(`Error: ${err.message}`);
      setIsLoading(false);
    }
  }, [isActive]);

  // Start camera with extensive logging
  const startCamera = useCallback(async () => {
    if (!isActive || !videoRef.current) {
      console.log('🚫 Camera: Not active or no video ref');
      return;
    }
    
    console.log('📷 Starting camera...');
    setCameraStatus('Requesting camera access...');
    
    try {
      console.log('🔍 Checking camera permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      console.log('✅ Camera access granted');
      console.log('📺 Camera stream:', {
        active: stream.active,
        tracks: stream.getTracks().length,
        videoTracks: stream.getVideoTracks().length
      });
      
      setCameraStatus('Camera connected');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = () => {
          if (!videoRef.current) return; // Component may have unmounted
          
          console.log('🎬 Video metadata loaded:', {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
            duration: videoRef.current.duration
          });
          setCameraStatus('Video ready');
          console.log('🎯 Starting pose detection loop...');
          setIsDetecting(true);
          isDetectingRef.current = true; // Set ref immediately
          
          // Start detection loop with a small delay to ensure everything is ready
          setTimeout(() => {
            console.log('🚀 Calling detectPose() for the first time');
            console.log('🔍 Detection state check:', {
              poseLandmarker: !!poseLandmarkerRef.current,
              video: !!videoRef.current,
              isDetecting: true, // We just set it
              actualIsDetecting: isDetecting, // What React thinks it is
              refIsDetecting: isDetectingRef.current // What the ref thinks
            });
            
            if (poseLandmarkerRef.current && videoRef.current) {
              console.log('✅ Prerequisites met, starting detection');
              detectPose();
            } else {
              console.error('❌ Cannot start detection:', {
                missingPoseLandmarker: !poseLandmarkerRef.current,
                missingVideo: !videoRef.current,
                videoElement: videoRef.current,
                poseLandmarker: poseLandmarkerRef.current
              });
            }
          }, 100);
        };
        
        videoRef.current.onerror = (e) => {
          console.error('❌ Video error:', e);
          setCameraStatus('Video error');
        };
      }
      
    } catch (err) {
      console.error('❌ Error accessing camera:', err);
      console.error('Camera error details:', {
        name: err.name,
        message: err.message,
        constraint: err.constraint
      });
      setError(`Camera access failed: ${err.message}`);
      setCameraStatus(`Camera error: ${err.message}`);
    }
  }, [isActive]);

  // Hands-up detection for celebration
  const detectHandsUp = useCallback((landmarks) => {
    if (!landmarks || landmarks.length === 0) return false;
    
    // Get relevant landmarks for hands-up detection
    const leftWrist = landmarks[15];  // Left wrist
    const rightWrist = landmarks[16]; // Right wrist
    const leftElbow = landmarks[13];  // Left elbow
    const rightElbow = landmarks[14]; // Right elbow
    const leftShoulder = landmarks[11]; // Left shoulder
    const rightShoulder = landmarks[12]; // Right shoulder
    const nose = landmarks[0]; // Nose (head position)
    
    if (!leftWrist || !rightWrist || !leftElbow || !rightElbow || !leftShoulder || !rightShoulder) {
      setJumpStatus('Show your arms to the camera');
      setDetectedLandmarks('Arms not fully visible');
      return false;
    }
    
    setDetectedLandmarks('Arms detected ✓');
    
    // Check if both hands are raised above shoulders
    const leftHandRaised = leftWrist.y < leftShoulder.y - 0.1; // Left hand above shoulder
    const rightHandRaised = rightWrist.y < rightShoulder.y - 0.1; // Right hand above shoulder
    
    // Check if elbows are also raised (more confident gesture)
    const leftElbowRaised = leftElbow.y < leftShoulder.y;
    const rightElbowRaised = rightElbow.y < rightShoulder.y;
    
    // Debug info
    const leftHeight = (leftShoulder.y - leftWrist.y).toFixed(3);
    const rightHeight = (rightShoulder.y - rightWrist.y).toFixed(3);
    setDebugInfo(`L: ${leftHeight}, R: ${rightHeight}`);
    
    // Both hands must be raised above shoulders
    if (leftHandRaised && rightHandRaised && leftElbowRaised && rightElbowRaised) {
      setJumpStatus('🙌 Hands up detected! Great job! 🎉');
      setTimeout(() => setJumpStatus(''), 2000);
      return true;
    } else if (leftHandRaised || rightHandRaised) {
      setJumpStatus('Almost there! Raise both hands high! 🙌');
    } else {
      setJumpStatus('Lift both hands up high to celebrate! 🙌');
    }
    
    return false;
  }, []);

  // Shoulder-based jump detection for deliberate jumping movements
  const detectJump = useCallback((landmarks) => {
    if (!landmarks || landmarks.length === 0) return false;
    
    // Focus specifically on shoulders (landmarks 11 and 12)
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    
    if (!leftShoulder || !rightShoulder) {
      setJumpStatus('Show your shoulders to camera for jump detection');
      setDetectedLandmarks('Shoulders not visible');
      return false;
    }
    
    // Calculate average shoulder height
    const shoulderHeight = (leftShoulder.y + rightShoulder.y) / 2;
    
    setDetectedLandmarks('Shoulders detected ✓');
    
    // Store shoulder position history
    lastPositions.current.push(shoulderHeight);
    
    // Keep only recent positions (increase history for better jump detection)
    const historyFrames = 15; // ~0.5 seconds at 30fps
    if (lastPositions.current.length > historyFrames) {
      lastPositions.current.shift();
    }
    
    const positions = lastPositions.current;
    
    // Debug info
    setDebugInfo(`Shoulders: ${shoulderHeight.toFixed(3)}, History: ${positions.length}`);
    
    // Need sufficient history to detect jumping pattern
    if (positions.length < 10) {
      setJumpStatus('Establishing baseline...');
      return false;
    }
    
    // Analyze movement pattern for deliberate jumping
    const recentPositions = positions.slice(-10); // Last 10 frames
    const minHeight = Math.min(...recentPositions);
    const maxHeight = Math.max(...recentPositions);
    const verticalRange = maxHeight - minHeight;
    
    // Very strict threshold for deliberate jumping only
    const jumpThresholdStrict = 0.08; // Much higher - requires very deliberate movement
    
    // Check for jumping pattern: significant up-down movement
    if (verticalRange > jumpThresholdStrict) {
      // Additional validation: check for actual jumping pattern 
      // Split into 3 parts to detect proper jump sequence
      const third1 = recentPositions.slice(0, 3);
      const third2 = recentPositions.slice(3, 6);
      const third3 = recentPositions.slice(6, 9);
      
      const avg1 = third1.reduce((a, b) => a + b, 0) / third1.length;
      const avg2 = third2.reduce((a, b) => a + b, 0) / third2.length;
      const avg3 = third3.reduce((a, b) => a + b, 0) / third3.length;
      
      // Look for clear jump pattern: start → peak/valley → return
      const diff1to2 = Math.abs(avg1 - avg2);
      const diff2to3 = Math.abs(avg2 - avg3);
      
      // Must have significant movement in both directions (actual jump)
      const minJumpMovement = 0.03; // Each phase must have substantial movement
      
      if (diff1to2 > minJumpMovement && diff2to3 > minJumpMovement) {
        // Final validation: ensure it's a proper jump pattern, not just swaying
        const totalMovement = diff1to2 + diff2to3;
        
        if (totalMovement > 0.1) { // Total movement must be very substantial
          setJumpStatus('Jump detected! 🐒🎉');
          // Clear history to prevent multiple triggers
          lastPositions.current = [];
          setTimeout(() => setJumpStatus(''), 2000);
          return true;
        }
      }
    }
    
    // Provide feedback based on movement
    if (verticalRange > 0.02) {
      setJumpStatus('Good movement! Jump higher! 🐒');
    } else if (verticalRange > 0.01) {
      setJumpStatus('Keep moving up and down...');
    } else {
      setJumpStatus('Jump up and down like a monkey! 🐒');
    }
    
    return false;
  }, []);

  // Pose detection loop with extensive logging
  const detectPose = useCallback(async () => {
    console.log('🎯 detectPose called, checking prerequisites...');
    
    if (!poseLandmarkerRef.current || !videoRef.current || !isDetectingRef.current) {
      console.log('🚫 Pose detection prerequisites not met:', {
        poseLandmarker: !!poseLandmarkerRef.current,
        video: !!videoRef.current,
        isDetecting,
        isDetectingRef: isDetectingRef.current,
        willExit: true
      });
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Always log occasionally to ensure loop is running
    if (Math.random() < 0.05) { // 5% of frames for debugging
      console.log('🔄 Pose detection loop running...', {
        videoReady: video.readyState >= 2,
        videoSize: `${video.videoWidth}x${video.videoHeight}`,
        canvasPresent: !!canvas,
        timestamp: performance.now()
      });
    }
    
    if (video.readyState >= 2 && canvas) {
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      try {
        // Increment detection counter
        detectionCounter.current++;
        
        // Detect poses
        const results = await poseLandmarkerRef.current.detectForVideo(video, performance.now());
        
        // Always log results for debugging
        if (detectionCounter.current % 30 === 0) { // Every 30 frames (~1 second)
          console.log('🔍 MediaPipe results (frame #' + detectionCounter.current + '):', {
            hasResults: !!results,
            hasLandmarks: !!(results && results.landmarks),
            landmarksLength: results?.landmarks?.length || 0,
            videoSize: `${video.videoWidth}x${video.videoHeight}`,
            timestamp: performance.now()
          });
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        if (results && results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          // Log successful detection occasionally
          if (Math.random() < 0.05) { // 5% of frames when detecting
            console.log('✅ Pose detected! Landmarks:', landmarks.length);
            setPoseStatus(`Detecting ${landmarks.length} landmarks`);
          }
          
          // Draw pose landmarks
          drawLandmarks(ctx, landmarks, canvas.width, canvas.height);
          
          // Check for appropriate gesture based on detection mode
          if (detectionMode === 'handsUp') {
            if (detectHandsUp(landmarks)) {
              console.log('🙌 Hands up detected, triggering action!');
              onHandsUpDetected?.();
            }
          } else {
            // Default to jump detection
            if (detectJump(landmarks)) {
              console.log('🦘 Jump detected, triggering progression!');
              onJumpDetected?.();
            }
          }
        } else {
          // No pose detected - more detailed debugging
          setPoseStatus('No pose detected - move into camera view');
          if (Math.random() < 0.02) { // Occasional logging
            console.log('👻 No pose detected in frame:', {
              results: !!results,
              landmarks: results?.landmarks?.length || 0,
              videoReady: video.readyState,
              videoPlaying: !video.paused && !video.ended,
              brightness: 'unknown'
            });
          }
        }
        
      } catch (err) {
        console.error('❌ Error during pose detection:', err);
        setPoseStatus(`Detection error: ${err.message}`);
      }
    } else {
      setPoseStatus('Waiting for video...');
    }
    
    // Continue detection loop
    if (isDetectingRef.current) {
      console.log('🔄 Scheduling next frame...');
      requestAnimationFrame(detectPose);
    } else {
      console.log('🛑 Detection stopped, not scheduling next frame');
    }
  }, [isDetecting, detectJump, onJumpDetected]);

  // Draw pose landmarks focusing on shoulders for jump detection
  const drawLandmarks = (ctx, landmarks, width, height) => {
    ctx.lineWidth = 4;
    
    // Highlight shoulders prominently since they're the focus
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    
    if (leftShoulder && rightShoulder) {
      // Draw shoulder landmarks with large, bright circles
      ctx.fillStyle = '#00ff00'; // Bright green for shoulders
      ctx.strokeStyle = '#00ff00';
      
      // Left shoulder
      const leftX = leftShoulder.x * width;
      const leftY = leftShoulder.y * height;
      ctx.beginPath();
      ctx.arc(leftX, leftY, 12, 0, 2 * Math.PI); // Larger circles
      ctx.fill();
      
      // Right shoulder  
      const rightX = rightShoulder.x * width;
      const rightY = rightShoulder.y * height;
      ctx.beginPath();
      ctx.arc(rightX, rightY, 12, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw connection between shoulders
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.stroke();
      
      // Add label
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.fillText('SHOULDERS', leftX - 20, leftY - 20);
    }
    
    // Draw other landmarks more subtly
    const otherLandmarks = [
      { landmarks: [23, 24], color: '#888888', name: 'hips' },
      { landmarks: [15, 16], color: '#666666', name: 'wrists' },
      { landmarks: [0], color: '#444444', name: 'nose' }
    ];
    
    ctx.lineWidth = 2;
    otherLandmarks.forEach(group => {
      ctx.fillStyle = group.color;
      ctx.strokeStyle = group.color;
      
      group.landmarks.forEach(index => {
        const landmark = landmarks[index];
        if (landmark) {
          const x = landmark.x * width;
          const y = landmark.y * height;
          
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    });
  };

  // Cleanup
  const cleanup = useCallback(() => {
    console.log('🧹 Cleanup called, stopping detection');
    setIsDetecting(false);
    isDetectingRef.current = false; // Stop detection loop
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    lastPositions.current = [];
    setJumpStatus('');
    setDetectedLandmarks('');
    setDebugInfo('');
  }, []);

  // Browser compatibility check
  useEffect(() => {
    console.log('🔄 PoseDetection useEffect triggered:', { 
      isActive, 
      componentMounted: true,
      timestamp: new Date().toISOString() 
    });
    
    if (isActive) {
      console.log('🌐 Browser compatibility check:', {
        userAgent: navigator.userAgent,
        webRTC: !!navigator.mediaDevices,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia,
        webAssembly: typeof WebAssembly !== 'undefined',
        canvas: !!document.createElement('canvas').getContext,
        requestAnimationFrame: !!window.requestAnimationFrame
      });
      
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error('❌ Camera not supported');
        setError('Camera not supported in this browser');
        return;
      }
      
      if (typeof WebAssembly === 'undefined') {
        console.error('❌ WebAssembly not supported');
        setError('WebAssembly not supported in this browser');
        return;
      }
      
      console.log('✅ Calling initializePoseLandmarker...');
      initializePoseLandmarker();
    } else {
      console.log('🚫 Component not active, running cleanup');
      cleanup();
    }
    
    return cleanup;
  }, [isActive, initializePoseLandmarker, cleanup]);

  // Start camera after pose landmarker is ready
  useEffect(() => {
    console.log('📸 Camera start useEffect triggered:', {
      poseLandmarkerReady: !!poseLandmarkerRef.current,
      isActive,
      isLoading,
      shouldStartCamera: poseLandmarkerRef.current && isActive && !isLoading
    });
    
    if (poseLandmarkerRef.current && isActive && !isLoading) {
      console.log('🎬 Starting camera now that MediaPipe is ready');
      startCamera();
    } else {
      console.log('🚫 Not starting camera:', {
        reason: !poseLandmarkerRef.current ? 'No landmarker' : 
                !isActive ? 'Not active' : 
                isLoading ? 'Still loading' : 'Unknown'
      });
    }
  }, [isActive, isLoading, startCamera]);

  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-xs">
        {error && (
          <div className="text-red-600 text-sm mb-2 p-2 bg-red-100 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {isLoading && (
          <div className="text-blue-600 text-sm mb-2">
            Loading pose detection...
          </div>
        )}
        
        {/* Debug Status Panel */}
        <div className="bg-gray-100 p-2 rounded text-xs mb-2">
          <div className="font-bold mb-1">🔧 Debug Status:</div>
          <div className="text-blue-600">Init: {initStatus}</div>
          <div className="text-green-600">Camera: {cameraStatus || 'Not started'}</div>
          <div className="text-purple-600">Pose: {poseStatus || 'Not started'}</div>
          <div className="text-gray-600">Active: {isActive ? 'YES' : 'NO'}</div>
          <div className="text-gray-600">Loading: {isLoading ? 'YES' : 'NO'}</div>
          <div className="text-gray-600">Detecting: {isDetecting ? 'YES' : 'NO'}</div>
          <div className="text-gray-600">Frames: {detectionCounter.current}</div>
        </div>
        
        {jumpStatus && (
          <div className="text-green-600 text-sm mb-2 font-medium p-2 bg-green-100 rounded">
            {jumpStatus}
          </div>
        )}
        
        {detectedLandmarks && (
          <div className="text-purple-600 text-xs mb-1 p-1 bg-purple-100 rounded">
            {detectedLandmarks}
          </div>
        )}
        
        {debugInfo && (
          <div className="text-blue-600 text-xs mb-2 p-1 bg-blue-100 rounded">
            {debugInfo}
          </div>
        )}
        
        <div className="text-xs text-gray-600 mb-2">
          🐒 <strong>Jump up and down to continue!</strong><br/>
          <span className="text-green-600">Show your SHOULDERS to the camera</span><br/>
          <span className="text-gray-500">Jump or bounce - deliberate movement required!</span>
        </div>
        
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => onJumpDetected?.()}
            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
          >
            Manual Jump
          </button>
          <button
            onClick={() => {
              console.log('🔄 Force reinitializing MediaPipe...');
              poseLandmarkerRef.current = null;
              setIsLoading(true);
              setInitStatus('Force reinitializing...');
              initializePoseLandmarker();
            }}
            className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors"
          >
            Reinit
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
          >
            Reload
          </button>
        </div>
        
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-32 h-24 rounded bg-black"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-32 h-24 rounded pointer-events-none"
            style={{ transform: 'scaleX(-1)' }}
          />
        </div>
      </div>
    </div>
  );
};

export default PoseDetection;