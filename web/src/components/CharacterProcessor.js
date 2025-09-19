"use client";

import { useState } from 'react';
import Image from 'next/image';
import { processCharacterImage, downloadProcessedImage } from '@/utils/backgroundRemoval';

export default function CharacterProcessor() {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setOriginalImage(file);
      setProcessedImage(null);
      setError(null);
    }
  };

  const handleImageUrlInput = (url) => {
    if (url) {
      setOriginalImage(url);
      setProcessedImage(null);
      setError(null);
    }
  };

  const processImage = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      const processedUrl = await processCharacterImage(originalImage);
      setProcessedImage(processedUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = async () => {
    if (!originalImage) return;

    try {
      await downloadProcessedImage(originalImage, 'character_transparent.png');
    } catch (err) {
      setError(err.message);
    }
  };

  const processZooCharacter = async () => {
    try {
      setIsProcessing(true);
      const processedUrl = await processCharacterImage('/stories/zoo/char/boy2.png');
      setProcessedImage(processedUrl);
      setOriginalImage('/stories/zoo/char/boy2.png');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">🎨 Character Background Removal</h2>
      
      {/* Input Options */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Upload Character Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        
        <div className="text-center">
          <button
            onClick={processZooCharacter}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            🦁 Process Zoo Boy2 Character
          </button>
        </div>
      </div>

      {/* Process Button */}
      {originalImage && (
        <div className="text-center mb-6">
          <button
            onClick={processImage}
            disabled={isProcessing}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? '🤖 Processing...' : '✨ Remove Background'}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          ❌ {error}
        </div>
      )}

      {/* Images Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Image */}
        {originalImage && (
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-3">Original Image</h3>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              {typeof originalImage === 'string' ? (
                <Image
                  src={originalImage}
                  alt="Original character"
                  width={250}
                  height={250}
                  className="mx-auto object-contain"
                  unoptimized
                />
              ) : (
                <img
                  src={URL.createObjectURL(originalImage)}
                  alt="Original character"
                  className="mx-auto max-w-full max-h-64 object-contain"
                />
              )}
            </div>
          </div>
        )}

        {/* Processed Image */}
        {processedImage && (
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-3">Transparent Background</h3>
            <div className="border-2 border-green-300 rounded-lg p-4 bg-gradient-to-br from-gray-100 to-gray-200 relative">
              {/* Checkerboard pattern to show transparency */}
              <div className="absolute inset-4 opacity-30 bg-gradient-to-br from-white to-gray-300" 
                   style={{
                     backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                     backgroundSize: '20px 20px',
                     backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                   }}>
              </div>
              <img
                src={processedImage}
                alt="Character with transparent background"
                className="mx-auto max-w-full max-h-64 object-contain relative z-10"
              />
            </div>
            <button
              onClick={downloadResult}
              className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              💾 Download
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      {processedImage && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">📋 Next Steps:</h4>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
            <li>Download the processed image</li>
            <li>Save it as <code className="bg-blue-100 px-1 rounded">boy2.png</code> in <code className="bg-blue-100 px-1 rounded">web/public/stories/zoo/char/</code></li>
            <li>The story will automatically use the transparent background version</li>
          </ol>
        </div>
      )}
    </div>
  );
}