// Test script for the generate-story API endpoint
// This demonstrates how to use the API with a selfie, system prompt, and story

const testGenerateStory = async () => {
  // Example base64 encoded image (1x1 pixel PNG for testing)
  const testSelfie = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  
  // Example system prompt
  const systemPrompt = "You are a creative children's story illustrator. Create a gentle, age-appropriate story with beautiful illustrations that incorporate the person in the provided selfie as the main character. The story should be engaging, positive, and suitable for children aged 4-8.";
  
  // Example story content
  const story = "Once upon a time, there was a brave young explorer who discovered a magical forest filled with friendly talking animals. Together, they went on an adventure to find a hidden treasure that would help save their woodland home.";

  const requestBody = {
    selfie: testSelfie,
    systemPrompt: systemPrompt,
    story: story
  };

  try {
    console.log('Testing generate-story API...');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('http://localhost:3000/api/generate-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (result.status === 'success') {
      console.log('\n✅ Story generation successful!');
      console.log('Text content length:', result.result.textContent.length);
      console.log('Number of images generated:', result.result.images.length);
      
      if (result.result.images.length > 0) {
        result.result.images.forEach((img, index) => {
          console.log(`Image ${index + 1}: ${img.fileName} (${img.mimeType}, ${img.size} bytes)`);
        });
      }
    } else {
      console.log('\n❌ Story generation failed:', result.error);
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

// Test the GET endpoint as well
const testGetEndpoint = async () => {
  try {
    console.log('\nTesting GET endpoint...');
    const response = await fetch('http://localhost:3000/api/generate-story');
    const result = await response.json();
    console.log('GET response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error testing GET endpoint:', error);
  }
};

// Run the tests
const runTests = async () => {
  await testGetEndpoint();
  await testGenerateStory();
};

// Check if running in Node.js environment
if (typeof window === 'undefined') {
  // Node.js environment - need to import fetch
  const { fetch } = await import('node-fetch');
  global.fetch = fetch;
  runTests();
} else {
  // Browser environment
  runTests();
}

export { testGenerateStory, testGetEndpoint };
