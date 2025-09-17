"use client";

import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

const SELFIE_KEY = "selfie_v1";

const generateStoryAPI = async ({ prompt, systemPrompt, selfie }) => {
  const response = await fetch('/api/generate-story', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      selfie,
      systemPrompt,
      story: prompt
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
  const sceneTexts = generatedText.split(/(?:Scene \d+|Chapter \d+|^\d+\.)/i).filter(text => text.trim());

  // Create scenes in the format expected by the story page
  const scenes = [];
  const backgroundColors = [
    'from-amber-100 via-rose-100 to-sky-100',
    'from-sky-100 via-indigo-100 to-fuchsia-100',
    'from-emerald-100 via-teal-100 to-cyan-100',
    'from-lime-100 via-emerald-100 to-teal-100',
    'from-pink-100 via-rose-100 to-amber-100'
  ];

  // If we have structured text, use it; otherwise create default scenes
  if (sceneTexts.length >= 3) {
    sceneTexts.slice(0, 3).forEach((text, index) => {
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
    // Fallback: create 3 scenes from the full text
    const fullText = generatedText.trim();
    const sentences = fullText.split(/[.!?]+/).filter(s => s.trim());
    const sentencesPerScene = Math.max(1, Math.floor(sentences.length / 3));

    for (let i = 0; i < 3; i++) {
      const startIdx = i * sentencesPerScene;
      const endIdx = i === 2 ? sentences.length : (i + 1) * sentencesPerScene;
      const sceneText = sentences.slice(startIdx, endIdx).join('. ').trim() + '.';

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

    // Default system prompt for children's stories
    const systemPrompt = selfie
      ? `You are a creative children's story illustrator and writer. Create a gentle, age-appropriate story with beautiful illustrations that incorporate the person in the provided selfie as the main character.

Requirements:
- The story should be engaging, positive, and suitable for children aged 4-8
- Create exactly 3 scenes/chapters
- Each scene should have a title and descriptive text
- Include the main character (from the selfie) in each scene
- Make it an adventure that teaches positive values like friendship, courage, or kindness
- Keep the language simple and age-appropriate

Story prompt: ${prompt}

Please format your response as a story with clear scene breaks.`
      : `You are a creative children's story illustrator and writer. Create a gentle, age-appropriate story with beautiful illustrations.

Requirements:
- The story should be engaging, positive, and suitable for children aged 4-8
- Create exactly 3 scenes/chapters
- Each scene should have a title and descriptive text
- Make it an adventure that teaches positive values like friendship, courage, or kindness
- Keep the language simple and age-appropriate

Story prompt: ${prompt}

Please format your response as a story with clear scene breaks.`;

    return mutation.mutateAsync({
      prompt,
      systemPrompt,
      selfie
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
