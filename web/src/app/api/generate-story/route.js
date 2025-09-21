export const runtime = 'nodejs';

import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { NextResponse } from 'next/server';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { selfie, systemPrompt, story, character } = body;

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

    // Check for APP_GEMINI_API_KEY environment variable
    const apiKey = process.env.APP_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          status: "error",
          error: "APP_GEMINI_API_KEY environment variable is not set"
        },
        { status: 500 }
      );
    }

    // Initialize Google GenAI
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    // Phase 1: text-only to get structured JSON scenes
    const config = {
      responseModalities: [
        'TEXT',
      ],
    };

    const model = 'gemini-2.5-flash-image-preview';

    // Prepare personalization from character if provided
    const personalizationText = character && (character.name || character.age || character.gender)
      ? `\n\nPersonalization:\n- Child name: ${character.name || ''}\n- Age: ${character.age || ''}\n- Gender: ${character.gender || ''}`
      : '';

    // Prepare the input text combining system prompt, personalization and story
    const inputText = selfie
      ? `${systemPrompt}${personalizationText}\n\nStory: ${story}\n\nPlease create an illustrated story based on the provided selfie and story content.`
      : `${systemPrompt}${personalizationText}\n\nStory: ${story}\n\nPlease create an illustrated story based on the story content.`;

    // Prepare the content parts
    const parts = [
      {
        text: inputText,
      }
    ];

    // Always attach a default character reference image from /public/images
    let refBase64 = null;
    let refMime = null;
    try {
      const refPath = path.join(process.cwd(), 'public', 'images', 'character_reference.jpg');
      const refBuffer = await readFile(refPath);
      refBase64 = refBuffer.toString('base64');
      refMime = mime.getType(refPath) || 'image/jpeg';
      parts.push({
        inlineData: {
          mimeType: refMime,
          data: refBase64,
        },
      });
    } catch (e) {
      console.warn('Reference character image missing or unreadable:', e?.message || e);
    }

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

    // Process the streaming response (collect all parts, not just index 0)
    for await (const chunk of response) {
      const candidates = chunk?.candidates || [];
      let appendedTextFromParts = false;

      for (const cand of candidates) {
        const partsArr = cand?.content?.parts || [];
        for (const p of partsArr) {
          // Image parts
          if (p.inlineData) {
            const fileName = `story_image_${fileIndex++}`;
            const fileExtension = mime.getExtension(p.inlineData.mimeType || '');
            const base64Len = (p.inlineData.data || '').length;
            const estimatedSize = Math.floor(base64Len * 0.75);
            results.images.push({
              fileName: `${fileName}.${fileExtension}`,
              mimeType: p.inlineData.mimeType,
              data: p.inlineData.data,
              size: estimatedSize,
            });
          }
          // Text parts
          if (typeof p.text === 'string' && p.text.length > 0) {
            results.textContent += p.text;
            appendedTextFromParts = true;
          }
        }
      }

      // Some SDKs also provide chunk.text; append if no explicit parts text was found
      if (!appendedTextFromParts && typeof chunk.text === 'string' && chunk.text.length > 0) {
        results.textContent += chunk.text;
      }
    }

    results.status = 'complete';

    // Try to parse structured JSON scenes from the text content, if the model followed the JSON instruction
    const tryParseScenes = (text) => {
      if (!text) return null;
      let raw = String(text).trim();
      // Strip code fences if present
      const fenceMatch = raw.match(/```json[\s\S]*?```/i) || raw.match(/```[\s\S]*?```/i);
      if (fenceMatch) raw = fenceMatch[0].replace(/```json|```/gi, '').trim();
      // Fallback: take substring from first '{' to last '}'
      if (!/^\s*\{/.test(raw)) {
        const first = raw.indexOf('{');
        const last = raw.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
          raw = raw.slice(first, last + 1);
        }
      }
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.scenes)) return parsed.scenes;
      } catch (_) {
        // ignore
      }
      return null;
    };

    const structuredScenes = tryParseScenes(results.textContent);
    if (structuredScenes) {
      results.scenes = structuredScenes;
      // Phase 2: Generate exactly one image per scene sequentially to ensure correct alignment
      if (Array.isArray(results.scenes) && results.scenes.length > 0) {
        const imgConfig = { responseModalities: ['IMAGE'] };
        for (let i = 0; i < results.scenes.length; i++) {
          const scene = results.scenes[i];
          const sceneTitle = scene?.title || `Scene ${i + 1}`;
          const sceneScript = scene?.script || '';
          const imgPrompt = [
            `Generate exactly ONE single-frame illustration (no collage, no grid, no multi-panel) for the following story scene.`,
            `Maintain consistent main character appearance across scenes based on the provided reference/selfie.`,
            `Square composition is preferred. Return image only (no text).`,
            `Scene ${i + 1} Title: ${sceneTitle}`,
            `Scene ${i + 1} Script: ${sceneScript}`
          ].join('\n');

          const imgParts = [ { text: imgPrompt } ];
          if (refBase64 && refMime) {
            imgParts.push({ inlineData: { mimeType: refMime, data: refBase64 } });
          }
          if (selfie) {
            imgParts.push({ inlineData: { mimeType: 'image/png', data: selfie.replace(/^data:image\/[a-z]+;base64,/, '') } });
          }

          try {
            const imgResp = await ai.models.generateContent({
              model,
              config: imgConfig,
              contents: [{ role: 'user', parts: imgParts }]
            });
            let dataUrl = null;
            const cand = imgResp?.candidates?.[0];
            const parts = cand?.content?.parts || [];
            for (const p of parts) {
              if (p.inlineData?.data && p.inlineData?.mimeType) {
                dataUrl = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
                break;
              }
            }
            results.scenes[i] = { ...scene, image: dataUrl };
          } catch (e) {
            console.warn(`Image generation failed for scene ${i + 1}:`, e?.message || e);
            results.scenes[i] = { ...scene, image: scene.image || null };
          }
        }
      }
    }

    // Attach streamed images to scenes by index to produce scene.image data URLs
    if (Array.isArray(results.scenes) && results.scenes.length > 0) {
      try {
        const imgs = Array.isArray(results.images) ? results.images : [];
        results.scenes = results.scenes.map((scene, i) => {
          const img = imgs[i];
          const imageUrl = img ? `data:${img.mimeType};base64,${img.data}` : (scene.image || null);
          return { ...scene, image: imageUrl };
        });
      } catch (e) {
        console.warn('Failed to attach images to scenes:', e);
      }
    }

    // Build minimal response without top-level images/textContent per request
    const minimalResult = {
      status: results.status,
      scenes: results.scenes || []
    };

    return NextResponse.json({
      status: "success",
      result: minimalResult
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
