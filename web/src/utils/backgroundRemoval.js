import { removeBackground } from '@imgly/background-removal';

/**
 * Remove background from an image file or URL
 * @param {File|string} imageInput - Image file or URL
 * @returns {Promise<string>} - Object URL of processed image with transparent background
 */
export async function processCharacterImage(imageInput) {
  try {
    let imageBlob;
    
    if (typeof imageInput === 'string') {
      // If it's a URL, fetch the image
      const response = await fetch(imageInput);
      imageBlob = await response.blob();
    } else {
      // If it's a File object
      imageBlob = imageInput;
    }
    
    // Remove background using AI
    const resultBlob = await removeBackground(imageBlob);
    
    // Return object URL for immediate use
    return URL.createObjectURL(resultBlob);
    
  } catch (error) {
    console.error('Error removing background:', error);
    throw new Error(`Background removal failed: ${error.message}`);
  }
}

/**
 * Process and download character image with transparent background
 * @param {File|string} imageInput - Image file or URL
 * @param {string} filename - Download filename
 */
export async function downloadProcessedImage(imageInput, filename = 'character_transparent.png') {
  try {
    const processedUrl = await processCharacterImage(imageInput);
    
    // Create download link
    const a = document.createElement('a');
    a.href = processedUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up object URL
    URL.revokeObjectURL(processedUrl);
    
  } catch (error) {
    console.error('Error downloading processed image:', error);
    throw error;
  }
}

/**
 * Process multiple character images
 * @param {Array<File|string>} images - Array of image files or URLs
 * @returns {Promise<Array<string>>} - Array of processed image URLs
 */
export async function processMultipleImages(images) {
  const processed = [];
  
  for (const image of images) {
    try {
      const processedUrl = await processCharacterImage(image);
      processed.push(processedUrl);
    } catch (error) {
      console.error(`Failed to process image:`, error);
      processed.push(null); // Keep array length consistent
    }
  }
  
  return processed;
}