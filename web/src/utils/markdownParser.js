// Function to replace pronouns based on gender
function replacePronounsAndGender(text, characterName, characterGender) {
  // Replace character name first
  let result = text.replace(/Lily/g, characterName);
  
  if (characterGender === "boy") {
    // Replace female pronouns with male pronouns
    // Handle capitalized versions first, then lowercase
    result = result.replace(/\bShe\b/g, "He");
    result = result.replace(/\bshe\b/g, "he");
    result = result.replace(/\bHer\b/g, "His");
    result = result.replace(/\bher\b/g, "his");
    result = result.replace(/\bHers\b/g, "His");
    result = result.replace(/\bhers\b/g, "his");
  }
  // For girls, keep original female pronouns (no changes needed)
  
  return result;
}

export function parseMarkdownStory(markdownContent, characterName = "Lily", characterGender = "girl") {
  const lines = markdownContent.split('\n');
  const scenes = [];
  let currentScene = null;
  let blurb = '';
  let title = '';
  
  // Extract title from first line
  const titleMatch = lines[0].match(/^# (.+)$/);
  if (titleMatch) {
    title = replacePronounsAndGender(titleMatch[1], characterName, characterGender);
  }
  
  // Extract blurb
  const blurbMatch = markdownContent.match(/\*\*Blurb:\*\* (.+)/);
  if (blurbMatch) {
    blurb = blurbMatch[1];
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for page headers
    const pageMatch = line.match(/^## Page (\d+): (.+)$/);
    if (pageMatch) {
      // Save previous scene if exists
      if (currentScene) {
        scenes.push(currentScene);
      }
      
      // Start new scene
      currentScene = {
        id: `page${pageMatch[1]}`,
        title: pageMatch[2],
        text: '',
        image: '',
        bg: getBackgroundForPage(parseInt(pageMatch[1]))
      };
      continue;
    }
    
    // Check for image
    const imageMatch = line.match(/!\[.*?\]\((.+?)\)/);
    if (imageMatch && currentScene) {
      // Convert image path to use local stories folder
      let imagePath = imageMatch[1];
      
      // Check if it's a Lily's Lost Smile story image (from old or new path)
      if (imagePath.includes("Lily's") || imagePath.includes("Lily%27s") || imagePath.includes("Lost%20Smile")) {
        // Extract just the filename
        const filename = imagePath.split('/').pop();
        
        // Create new path with proper encoding
        const folderName = encodeURIComponent("Lily's Lost Smile");
        imagePath = `/stories/${folderName}/${filename}`;
      }
      
      currentScene.image = imagePath;
      continue;
    }
    
    // Skip empty lines, headers, and separators
    if (!line || line.startsWith('#') || line.startsWith('---')) {
      continue;
    }
    
    // Add to current scene text
    if (currentScene && line) {
      if (currentScene.text) {
        currentScene.text += ' ';
      }
      // Replace names and pronouns based on character
      currentScene.text += replacePronounsAndGender(line, characterName, characterGender);
    }
  }
  
  // Add final scene
  if (currentScene) {
    scenes.push(currentScene);
  }
  
  return {
    title,
    blurb,
    scenes
  };
}

function getBackgroundForPage(pageNumber) {
  const backgrounds = [
    "from-yellow-100 via-amber-100 to-orange-100",
    "from-green-100 via-emerald-100 to-teal-100", 
    "from-blue-100 via-sky-100 to-cyan-100",
    "from-purple-100 via-pink-100 to-rose-100",
    "from-rose-100 via-pink-100 to-yellow-100"
  ];
  return backgrounds[(pageNumber - 1) % backgrounds.length];
}