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
  // Defensive defaults
  const text = typeof generatedText === 'string' ? generatedText : (generatedText?.toString?.() ?? '');
  const imgs = Array.isArray(images) ? images : [];

  // Helpers to extract and clean voice keyword and script text
  const extractKeyword = (content) => {
    if (!content) return null;
    // Support variations and punctuation: colon/hyphen/en/em dash, straight/curly quotes, optional leading bullets
    const keyLine = content.match(/^(?:\s*)[-*]?\s*(?:Keyword|Voice\s*Keyword)\s*[:\-\u2013\u2014]\s*["'\u201c\u2018]?([^"'\n\u201d\u2019]+)["'\u201d\u2019]?/im);
    if (keyLine) return keyLine[1].trim().toLowerCase();
    // Match Say "..." to ... (supports curly/straight quotes too)
    const sayMatch = content.match(/Say\s+["'\u201c\u2018]([^"'\u201d\u2019]+)["'\u201d\u2019]\s+to/i);
    if (sayMatch) return sayMatch[1].trim().toLowerCase();
    return null;
  };

  const extractInstruction = (content) => {
    if (!content) return null;
    // Prefer explicit Instruction line
    const inst = content.match(/^(?:\s*)[-*]?\s*(?:Instruction|Voice\s*Instruction)\s*[:\-\u2013\u2014]\s*(.+)$/im);
    if (inst) return inst[1].trim();
    // Fallback: Say "keyword" to ... line
    const say = content.match(/^(?:\s*)[-*]?\s*Say\s+["'\u201c\u2018]([^"'\u201d\u2019]+)["'\u201d\u2019]\s+to\s+(.+)$/im);
    if (say) return `Say "${say[1].trim()}" to ${say[2].trim()}`;
    return null;
  };

  const cleanSceneText = (block) => {
    if (!block) return '';
    // Process line-by-line for robustness
    const lines = String(block).split('\n');
    const kept = [];
    for (const raw of lines) {
      let line = raw.trim();
      if (!line) continue;
      // Drop scene header lines entirely (allow :, -, en dash, em dash)
      if (/^Scene\s+\d+\s*[:\-\u2013\u2014]/i.test(line)) continue;
      // Drop keyword/instruction metadata (with optional leading bullets)
      if (/^(?:[-*]\s*)?(?:Keyword|Voice\s*Keyword)\s*[:\-\u2013\u2014]/i.test(line)) continue;
      if (/^(?:[-*]\s*)?(?:Instruction|Voice\s*Instruction)\s*[:\-\u2013\u2014]/i.test(line)) continue;
      // Strip 'Script:' label but keep its content
      line = line.replace(/^\s*Script\s*[:\-\u2013\u2014]\s*/i, '');
      // Drop pure guidance 'Say "..." to ...' lines (supports bullets and curly/straight quotes)
      if (/^(?:[-*]\s*)?Say\s+["'\u201c\u2018][^"'\u201d\u2019]+["'\u201d\u2019]\s+to/i.test(line)) continue;
      kept.push(line);
    }
    return kept.join(' ').trim();
  };

  // Parse scene blocks by explicit "Scene N:" headers to preserve per-scene mapping
  const sceneBlocks = text.match(/(^|\n)Scene\s+\d+:[\s\S]*?(?=(?:\nScene\s+\d+:)|$)/gi) || [];

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
  if (sceneBlocks.length >= 6) {
    sceneBlocks.slice(0, 6).forEach((block, index) => {
      // Title from header line
      const header = block.match(/Scene\s+\d+\s*[:\-\u2013\u2014]\s*(.*)/i);
      const titleHeader = header?.[1]?.trim() || '';

      // Normalize and split into lines for fallback handling
      const normalized = block.trim();
      const lines = normalized.split('\n').filter(line => line.trim());
      const titleRaw = (lines[0] || '').replace(/[*#]/g, '').trim();
      const title = (titleHeader || titleRaw)
        .replace(/^[:\-\s]*/, '')
        .replace(/^(?:Scene|Chapter)\s+\d+\s*[:\-\u2013\u2014]\s*/i, '')
        .trim() || `Scene ${index + 1}`;

      // Use original block for cleaning so line-based rules apply
      const rawBlock = block;
      // Last scene: no voice keyword (will use jump interaction instead)
      const extracted = extractKeyword(block) || extractKeyword(normalized);
      const keyword = index === 5 ? null : (extracted || 'next');
      const content = cleanSceneText(rawBlock) || (lines.slice(1).join(' ').trim() || normalized);

      const contentSansTitle = (() => {
        const c = content || '';
        const candidates = [title, `: ${title}`, `:${title}`, `${title}.`, `${title}!`, `${title}?`];
        for (const cand of candidates) {
          if (c.toLowerCase().startsWith(String(cand).toLowerCase())) {
            return c.slice(String(cand).length).trim();
          }
        }
        return c;
      })();

      const instruction = index === 5 ? null : (extractInstruction(block) || (keyword ? `Say "${keyword}" to go to the next page.` : null));

      scenes.push({
        id: `ai_scene_${index}`,
        title,
        text: contentSansTitle,
        keyword,
        instruction,
        bg: backgroundColors[index % backgroundColors.length],
        image: imgs[index] ? `data:${imgs[index].mimeType};base64,${imgs[index].data}` : null
      });
    });
  } else {
    // Fallback: create 6 scenes from the full text
    const fullText = text.trim();
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
        image: imgs[i] ? `data:${imgs[i].mimeType};base64,${imgs[i].data}` : null
      });
    }
  }

  return scenes;
};

const AIStoryGenerator = ({ onStoryGenerated }) => {
  const mutation = useMutation({
    mutationFn: generateStoryAPI,
    onSuccess: (result, variables) => {
      const images = result.images || [];
      let scenes;

      if (Array.isArray(result.scenes) && result.scenes.length > 0) {
        const backgroundColors = [
          'from-amber-100 via-rose-100 to-sky-100',
          'from-sky-100 via-indigo-100 to-fuchsia-100',
          'from-emerald-100 via-teal-100 to-cyan-100',
          'from-lime-100 via-emerald-100 to-teal-100',
          'from-pink-100 via-rose-100 to-amber-100',
          'from-slate-100 via-gray-100 to-sky-100'
        ];
        scenes = result.scenes.slice(0, 6).map((s, index) => {
          const baseKeyword = typeof s.keyword === 'string' ? s.keyword.trim().toLowerCase() : null;
          const keyword = index === 5 ? null : (baseKeyword || null);
          const instruction = index === 5 ? null : (s.instruction || (keyword ? `Say "${keyword}" to go to the next page.` : null));
          const img = s.image || (images[index] ? `data:${images[index].mimeType};base64,${images[index].data}` : null);
          return {
            id: `ai_scene_${index}`,
            title: s.title || `Scene ${index + 1}`,
            text: s.script || s.text || '',
            keyword,
            instruction,
            bg: backgroundColors[index % backgroundColors.length],
            image: img,
          };
        });
      } else {
        scenes = parseStoryIntoScenes(result.textContent, images);
      }

      if (onStoryGenerated) {
        onStoryGenerated(scenes, {
          originalText: result.textContent,
          images,
          prompt: variables.prompt,
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

VERY IMPORTANT — OUTPUT FORMAT (STRICT JSON ONLY):
- Produce exactly 6 scenes (pages) that tell a complete bedtime story arc.
- Return ONLY a single valid JSON object. No prose, no markdown, no comments, no code fences.
- Do NOT include images inside the JSON. Images will be streamed separately in the same order (scene 1 through scene 6).

The JSON MUST match this shape:
{
  "scenes": [
    {
      "title": "<short title>",
      "script": "<full narrative text for the page>",
      "keyword": "<simple word/phrase or null>",
      "instruction": "<instruction text or null>"
    },
    { ... total 6 objects ... }
  ]
}

Rules:
- Scenes 1–5: keyword MUST be present and simple (e.g., "open", "lion", "magic").
  Instruction MUST be of the form: Say "<keyword>" to go to the next page.
- Scene 6: keyword MUST be null; instruction MUST be null. This is the final ending page.

Strict Prohibitions:
- Do not alter the established stylized appearance of the character once created.
- All generated images must be 100% safe-for-work (SFW).

Story idea: ${prompt}
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
