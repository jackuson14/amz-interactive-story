"use client";

import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

const SELFIE_KEY = "selfie_v1";
const CHARACTER_KEY = "character_v1";

const generateStoryAPI = async ({ prompt, systemPrompt, selfie, character }) => {
  const response = await fetch('/api/generate-story', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      selfie,
      systemPrompt,
      story: prompt,
      character,
    })
  });

  const data = await response.json();

  if (data.status !== 'success') {
    throw new Error(data.error || 'Failed to generate story');
  }

  return data.result;
};

const parseStoryIntoScenes = (generatedText, images) => {
  // Simple parsing - split by common scene indicators
  const sceneTexts = generatedText.split(/(?:Scene \d+|Chapter \d+|^\d+\.)/im).filter(text => text.trim());

  // Create scenes in the format expected by the story page
  const scenes = [];
  const backgroundColors = [
    'from-amber-100 via-rose-100 to-sky-100',
    'from-sky-100 via-indigo-100 to-fuchsia-100',
    'from-emerald-100 via-teal-100 to-cyan-100',
    'from-lime-100 via-emerald-100 to-teal-100',
    'from-pink-100 via-rose-100 to-amber-100',
    'from-slate-100 via-gray-100 to-sky-100'
  ];

  // If we have structured text, use it; otherwise create default scenes
  if (sceneTexts.length >= 6) {
    sceneTexts.slice(0, 6).forEach((text, index) => {
      const lines = text.trim().split('\n').filter(line => line.trim());
      const title = lines[0]?.replace(/[*#]/g, '').trim() || `Scene ${index + 1}`;
      const content = lines.slice(1).join(' ').trim() || text.trim();

      scenes.push({
        id: `ai_scene_${index}`,
        title,
        text: content,
        bg: backgroundColors[index % backgroundColors.length],
        image: images[index] ? `data:${images[index].mimeType};base64,${images[index].data}` : null
      });
    });
  } else {
    // Fallback: create 6 scenes from the full text
    const fullText = generatedText.trim();
    const sentences = fullText.split(/[.!?]+/).filter(s => s.trim());
    const sentencesPerScene = Math.max(1, Math.floor(sentences.length / 6));

    for (let i = 0; i < 6; i++) {
      const startIdx = i * sentencesPerScene;
      const endIdx = i === 5 ? sentences.length : (i + 1) * sentencesPerScene;
      const sceneText = sentences.slice(startIdx, endIdx).join('. ').trim() + (endIdx > startIdx ? '.' : '');

      scenes.push({
        id: `ai_scene_${i}`,
        title: `Chapter ${i + 1}`,
        text: sceneText,
        bg: backgroundColors[i % backgroundColors.length],
        image: images[i] ? `data:${images[i].mimeType};base64,${images[i].data}` : null
      });
    }
  }

  return scenes;
};

const AIStoryGenerator = ({ onStoryGenerated }) => {
  const mutation = useMutation({
    mutationFn: generateStoryAPI,
    onSuccess: (result, variables) => {
      const scenes = parseStoryIntoScenes(result.textContent, result.images || []);

      if (onStoryGenerated) {
        onStoryGenerated(scenes, {
          originalText: result.textContent,
          images: result.images || [],
          prompt: variables.prompt
        });
      }
    },
  });

  const generateAIStory = useCallback(async (prompt) => {
    if (!prompt?.trim()) {
      throw new Error('Please provide a story prompt');
    }

    // Get selfie from localStorage (optional)
    let selfie = null;
    try {
      const raw = localStorage.getItem(SELFIE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.url) {
          selfie = parsed.url;
        }
      }
    } catch (e) {
      console.warn('Could not load selfie from localStorage:', e);
    }

    // Load personalization (name, age, gender) from localStorage
    let character = { name: null, age: null, gender: null };
    try {
      const rawChar = localStorage.getItem(CHARACTER_KEY);
      if (rawChar) {
        const parsedChar = JSON.parse(rawChar);
        character = {
          name: parsedChar?.name || null,
          age: parsedChar?.age || null,
          gender: parsedChar?.gender || null,
        };
      }
    } catch (e) {
      console.warn('Could not load character from localStorage:', e);
    }

    // Compose system prompt for Google LLM (Gemini) with personalization
    const childName = character.name || 'the child';
    const childAge = character.age || '4-8';
    const childGender = character.gender || 'child';

    const systemPrompt = `You are a sophisticated AI Personalized Storyboard Director. Your function is to take a user-provided reference image (including a photograph or selfie), transform it into a consistent storybook character, and generate a sequence of illustrations featuring that character within the scenes of an accompanying story.

Primary Directive: Character Integrity and Consistency
Your absolute highest priority is to flawlessly maintain the likeness and style of the main character across all generated images.

Capture Likeness: Capture key recognizable features from the reference image (hair color/style, eye color, distinct facial characteristics).
Maintain the Stylized Form: Once you establish the illustrated version of the character, use that specific stylized form consistently in every scene.
Adapt to the Scene: Vary expression, pose, and actions to fit the narrative, but the core appearance must remain identical.

Personalization:
- The main character is named ${childName}, a ${childAge} year old ${childGender}.
- Ensure the story tone and visuals are suitable and delightful for a ${childAge} year old.

Core Task: Photo-to-Character Transformation
If a photograph/selfie is provided, first analyze it and creatively transform the person into a charming, expressive illustrated character. Avoid photorealism; adopt a clean, modern digital storybook style unless the story specifies otherwise.

Instructions:
1) Analyze and Stylize Reference Image (if provided) to establish the official artistic look.
2) Read the user’s story idea below to understand plot, settings, and actions.
3) Identify exactly 6 scenes (pages) that tell a complete bedtime story arc.
   - Scene 3 MUST be an interactive page that explicitly prompts the child to speak a word or short phrase.
   - Include a clear voice instruction using this exact pattern somewhere on Scene 3: Say "<keyword>" to <action>.
   - Choose a friendly keyword kids can easily say, e.g., "let's go", "goodnight", or "magic".
4) For each of the 6 scenes, generate a high-quality, family-friendly illustration featuring the established character placed within the scene.
5) Also write clear, age-appropriate narrative text for each scene (a short paragraph) that matches the illustration.

Strict Prohibitions:
- Do not alter the established stylized appearance of the character once created.
- All generated images must be 100% safe-for-work (SFW).

Story idea: ${prompt}

Output format guidance:
- Start each scene with a label like "Scene 1:" (or "Chapter 1:") followed by the scene title on the next line; then write the paragraph for that scene.
- Provide narrative text naturally as part of the response and include images as inline data in the multimodal output. The application will parse both text and images.
`;

    return mutation.mutateAsync({
      prompt,
      systemPrompt,
      selfie,
      character,
    });
  }, [mutation]);

  return {
    generateAIStory,
    loading: mutation.isPending,
    error: mutation.error?.message || null,
    setError: () => mutation.reset(),
    isSuccess: mutation.isSuccess,
    isError: mutation.isError
  };
};

export default AIStoryGenerator;
