import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { NextResponse } from 'next/server';

// Helper function to save binary file (adapted for web environment)
function saveBinaryFile(fileName, content) {
  // In a web environment, we'll return the file data instead of saving to filesystem
  return {
    fileName,
    content,
    size: content.length
  };
}

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { selfie, systemPrompt, story } = body;

    // Validate required fields
    if (!systemPrompt || !story) {
      return NextResponse.json(
        {
          status: "error",
          error: "Missing required fields: systemPrompt and story are required"
        },
        { status: 400 }
      );
    }

    // Check for GEMINI_API_KEY environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          status: "error", 
          error: "GEMINI_API_KEY environment variable is not set" 
        },
        { status: 500 }
      );
    }

    // Initialize Google GenAI
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const config = {
      responseModalities: [
        'IMAGE',
        'TEXT',
      ],
    };

    const model = 'gemini-2.5-flash-image-preview';

    // Prepare the input text combining system prompt and story
    const inputText = selfie
      ? `${systemPrompt}\n\nStory: ${story}\n\nPlease create an illustrated story based on the provided selfie and story content.`
      : `${systemPrompt}\n\nStory: ${story}\n\nPlease create an illustrated story based on the story content.`;

    // Prepare the content parts
    const parts = [
      {
        text: inputText,
      }
    ];

    // Add selfie if provided
    if (selfie) {
      parts.push({
        inlineData: {
          mimeType: 'image/png', // Assuming PNG format from canvas
          data: selfie.replace(/^data:image\/[a-z]+;base64,/, '') // Remove data URL prefix
        }
      });
    }

    // Prepare the content with optional selfie image and text
    const contents = [
      {
        role: 'user',
        parts: parts,
      },
    ];

    // Generate content stream
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    const results = {
      textContent: '',
      images: [],
      status: 'processing'
    };

    let fileIndex = 0;

    // Process the streaming response
    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }

      // Handle image data
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const fileName = `story_image_${fileIndex++}`;
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        const fileExtension = mime.getExtension(inlineData.mimeType || '');
        const buffer = Buffer.from(inlineData.data || '', 'base64');
        
        const savedFile = saveBinaryFile(`${fileName}.${fileExtension}`, buffer);
        results.images.push({
          fileName: savedFile.fileName,
          mimeType: inlineData.mimeType,
          data: inlineData.data, // Base64 encoded data
          size: savedFile.size
        });
      }
      // Handle text content
      else if (chunk.text) {
        results.textContent += chunk.text;
      }
    }

    results.status = 'complete';

    return NextResponse.json({
      status: "success",
      result: results
    });

  } catch (error) {
    console.error('Error generating story:', error);
    return NextResponse.json(
      { 
        status: "error", 
        error: error.message || "An error occurred while generating the story" 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: "info", 
    message: "POST to this endpoint with selfie, systemPrompt, and story to generate an illustrated story" 
  });
}
