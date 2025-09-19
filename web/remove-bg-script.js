const { removeBackground } = require('@imgly/background-removal');
const fs = require('fs');
const path = require('path');

async function removeBgFromImage() {
  try {
    console.log('🔄 Loading image...');
    
    // Input and output paths
    const inputPath = path.join(__dirname, 'public/stories/zoo/char/boy2.png');
    const outputPath = path.join(__dirname, 'public/stories/zoo/char/boy2_transparent.png');
    
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.error('❌ Input file not found:', inputPath);
      return;
    }
    
    console.log('🤖 Removing background with AI...');
    console.log('📍 Input:', inputPath);
    console.log('📍 Output:', outputPath);
    
    // Read the image file
    const imageBuffer = fs.readFileSync(inputPath);
    
    // Remove background
    const resultBlob = await removeBackground(imageBuffer);
    
    // Convert blob to buffer
    const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());
    
    // Save the result
    fs.writeFileSync(outputPath, resultBuffer);
    
    console.log('✅ Success! Background removed');
    console.log('📁 Original size:', fs.statSync(inputPath).size, 'bytes');
    console.log('📁 New size:', fs.statSync(outputPath).size, 'bytes');
    console.log('');
    console.log('🔄 To replace the original file, run:');
    console.log(`   mv "${outputPath}" "${inputPath}"`);
    
  } catch (error) {
    console.error('❌ Error removing background:', error);
  }
}

// Run the script
removeBgFromImage();