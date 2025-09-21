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
  // Helpers to extract and clean voice keyword and script text
  const extractKeyword = (content) => {
    if (!content) return null;
    const keyLine = content.match(/^(?:\s*)(?:Keyword|Voice\s*Keyword)\s*:\s*"?([^"\n]+)"?/im);
    if (keyLine) return keyLine[1].trim().toLowerCase();
    const sayMatch = content.match(/Say\s+"([^"]+)"\s+to/i);
    if (sayMatch) return sayMatch[1].trim().toLowerCase();
    return null;
  };

  const cleanSceneText = (content) => {
    if (!content) return '';
    return content
      // remove explicit Keyword or Instruction lines
      .replace(/^(?:\s*)(?:Keyword|Voice\s*Keyword)\s*:[^\n]*$/gmi, '')
      .replace(/^(?:\s*)(?:Instruction|Voice\s*Instruction)\s*:[^\n]*$/gmi, '')
      // remove trailing Say "..." to ... guidance lines
      .replace(/Say\s+"[^"]+"\s+to[^\n]*$/gmi, '')
      .trim();
  };

  // Simple parsing - split by common scene indicators
  const sceneTexts = generatedText.split(/(?:Scene\s+\d+|Chapter\s+\d+|^\d+\.)/im).filter(text => text.trim());

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
      const rawContent = lines.slice(1).join(' ').trim() || text.trim();
      // Last scene: no voice keyword (will use jump interaction instead)
      const extracted = extractKeyword(text) || extractKeyword(rawContent);
      const keyword = index === 5 ? null : (extracted || 'next');
      const content = cleanSceneText(rawContent);

      scenes.push({
        id: `ai_scene_${index}`,
        title,
        text: content,
        keyword,
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
        // Last scene: no voice keyword (will use jump interaction instead)
        keyword: i === 5 ? null : 'next',
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

    // Choose illustration style guidance based on age
    const parseNumericAge = (val) => {
      const m = String(val ?? '').match(/\d+/);
      return m ? parseInt(m[0], 10) : null;
    };
    const ageNum = parseNumericAge(childAge);
    let styleGuidance = `Illustration Style: Use a clean, modern digital storybook style appropriate for children, avoiding photorealism.`;
    if (ageNum !== null && ageNum <= 4) {
      styleGuidance = `Illustration Style for Toddlers (Under 4 years)
A flat vector illustration style for toddlers, emphasizing visual simplicity and emotional safety. Use bold, simple shapes with soft, rounded edges and high contrast. Characters should have large, exaggerated facial features with joyful expressions. The palette is bright and cheerful, using primary and secondary colors with no complex shadows or textures. Backgrounds are minimal, often featuring playful geometric shapes and friendly anthropomorphic elements (e.g., a smiling sun).`;
    } else if (ageNum === 5 || ageNum === 6) {
      styleGuidance = `Illustration Style for Young Children (5-6 years)
A polished and clean vector art style for young children, showing more detail and sophistication. Characters have refined features, nuanced expressions that convey personality, and chibi-influenced proportions. The style incorporates subtle shading, soft gradients for depth, and a more muted, sophisticated color palette (earthy tones, pastels). Clothing and backgrounds are more detailed, featuring patterns and layers. Themes should include diversity and age-appropriate elements like school backpacks.`;
    }

    const systemPrompt = `You are a sophisticated AI Personalized Storyboard Director. Your function is to take a user-provided reference image (including a photograph or selfie), transform it into a consistent storybook character, and generate a sequence of illustrations featuring that character within the scenes of an accompanying story.

Primary Directive: Character Integrity and Consistency
Your absolute highest priority is to flawlessly maintain the likeness and style of the main character across all generated images.

Capture Likeness: Capture key recognizable features from the reference image (hair color/style, eye color, distinct facial characteristics).
Maintain the Stylized Form: Once you establish the illustrated version of the character, use that specific stylized form consistently in every scene.
Adapt to the Scene: Vary expression, pose, and actions to fit the narrative, but the core appearance must remain identical.

Personalization:
- The main character is named ${childName}, a ${childAge} year old ${childGender}.
- Ensure the story tone and visuals are suitable and delightful for a ${childAge} year old.

Illustration Style Guidance:
${styleGuidance}

Core Task: Photo-to-Character Transformation
If a photograph/selfie is provided, first analyze it and creatively transform the person into a charming, expressive illustrated character. Avoid photorealism; adopt a clean, modern digital storybook style unless the story specifies otherwise.

Story Structure Requirements (very important):
1) Read the user’s story idea below to understand plot, settings, and actions.
2) Create exactly 6 scenes (pages) that tell a complete bedtime story arc.
3) For Scenes 1–5, provide ALL of the following lines in order:
   - Scene N: <Short Title>
   - Keyword: <a simple kid-friendly word or 1–2 word phrase>
   - Script: <the complete story text for that page, including any dialogue and narrative>
   - Instruction: Say "<keyword>" to go to the next page.
   The keyword must be contextually related to the scene (e.g., "open", "door", "lion", "magic").
4) Scene 6 is the final celebratory ending page. For Scene 6, output ONLY:
   - Scene 6: <Short Title>
   - Script: <the complete story text for that page>
   Do NOT include a Keyword or an Instruction on Scene 6.
5) Generate a high-quality, family-friendly illustration for EACH scene that matches the script.

Strict Prohibitions:
- Do not alter the established stylized appearance of the character once created.
- All generated images must be 100% safe-for-work (SFW).

Story idea: ${prompt}

Output format guidance (text part):
For Scenes 1–5 output lines exactly like this order:
Scene N: Title
Keyword: word or short phrase
Script: Full narrative and dialogue for the page
Instruction: Say "<keyword>" to go to the next page.

For Scene 6 output lines exactly like this order:
Scene 6: Title
Script: Full narrative and dialogue for the page

The application will parse the keywords and scripts from these lines. Include images as inline data in the multimodal output.
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
