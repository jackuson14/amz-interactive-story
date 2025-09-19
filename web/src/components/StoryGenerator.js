"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';

const StoryGenerator = () => {
  const [selfie, setSelfie] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a creative children's story illustrator. Create a gentle, age-appropriate story with beautiful illustrations that incorporate the person in the provided selfie as the main character. The story should be engaging, positive, and suitable for children aged 4-8."
  );
  const [story, setStory] = useState(
    "Once upon a time, there was a brave young explorer who discovered a magical forest filled with friendly talking animals. Together, they went on an adventure to find a hidden treasure that would help save their woodland home."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraOn(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please grant permission.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/png');
    setSelfie(dataUrl);
    stopCamera();
  };

  const generateStory = async () => {
    if (!selfie || !systemPrompt.trim() || !story.trim()) {
      setError('Please provide a selfie, system prompt, and story.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selfie,
          systemPrompt,
          story
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setResult(data.result);
      } else {
        setError(data.error || 'Failed to generate story');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('An error occurred while generating the story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">AI Story Generator</h1>
      
      {/* Selfie Capture Section */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">1. Capture Your Selfie</h2>
        
        {!selfie && (
          <div className="space-y-4">
            <video
              ref={videoRef}
              className={`w-full max-w-md mx-auto rounded border ${cameraOn ? 'block' : 'hidden'}`}
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="flex gap-2 justify-center">
              {!cameraOn ? (
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Start Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={capturePhoto}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Capture Photo
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Stop Camera
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        
        {selfie && (
          <div className="text-center space-y-4">
            <Image
              src={selfie}
              alt="Captured selfie"
              width={300}
              height={300}
              className="mx-auto rounded border"
            />
            <button
              onClick={() => setSelfie(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Retake Photo
            </button>
          </div>
        )}
      </div>

      {/* System Prompt Section */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">2. System Prompt</h2>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="w-full h-24 p-3 border rounded resize-none"
          placeholder="Enter the system prompt for the AI..."
        />
      </div>

      {/* Story Section */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">3. Story Content</h2>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          className="w-full h-32 p-3 border rounded resize-none"
          placeholder="Enter your story content..."
        />
      </div>

      {/* Generate Button */}
      <div className="text-center">
        <button
          onClick={generateStory}
          disabled={loading || !selfie || !systemPrompt.trim() || !story.trim()}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating Story...' : 'Generate Illustrated Story'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-xl font-semibold">Generated Story</h2>
          
          {result.textContent && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium mb-2">Story Text:</h3>
              <p className="whitespace-pre-wrap">{result.textContent}</p>
            </div>
          )}
          
          {result.images && result.images.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Generated Images:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.images.map((img, index) => (
                  <div key={index} className="border rounded p-2">
                    <Image
                      src={`data:${img.mimeType};base64,${img.data}`}
                      alt={`Generated image ${index + 1}`}
                      width={400}
                      height={300}
                      className="w-full h-auto rounded"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      {img.fileName} ({Math.round(img.size / 1024)}KB)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoryGenerator;
