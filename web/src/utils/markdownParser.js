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
  
  // Detect if this is a zoo story
  const isZooStory = markdownContent.includes('Goodnight Zoo') || markdownContent.includes('zoo');
  
  // Extract title from first line (either # or ##)
  const titleMatch = lines[0].match(/^#{1,2} (.+)$/);
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
    
    // Check for page headers (both ## and ### formats)
    // Handle both "Page X: Title" and "Page X:" formats
    const pageMatch = line.match(/^#{2,3} Page (\d+):?\s*(.*)$/);
    if (pageMatch) {
      // Save previous scene if exists
      if (currentScene) {
        scenes.push(currentScene);
      }
      
      // Start new scene
      const pageNum = parseInt(pageMatch[1]);
      const pageTitle = pageMatch[2] || `Page ${pageNum}`;
      currentScene = {
        id: `page${pageNum}`,
        title: pageTitle,
        text: '',
        image: '', // Remove image for zoo stories to use background instead
        bg: isZooStory ? getZooBackground(pageNum) : getBackgroundForPage(pageNum)
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
      // Check if it's a zoo story image
      else if (imagePath.includes("zoo") || imagePath.includes("page")) {
        // For zoo story, ensure proper path
        const filename = imagePath.split('/').pop();
        imagePath = `/stories/zoo/${filename}`;
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
      // Strip leading and trailing quotes if present
      let cleanLine = line;
      if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
        cleanLine = cleanLine.slice(1, -1);
      }
      
      if (currentScene.text) {
        currentScene.text += ' ';
      }
      // Replace names and pronouns based on character
      currentScene.text += replacePronounsAndGender(cleanLine, characterName, characterGender);
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

function getZooBackground(pageNumber) {
  // Return the URL for the zoo background image
  // Handle inconsistent naming: page1.jpg vs Page2.jpg, etc.
  const filename = pageNumber === 1 ? 'page1.jpg' : `Page${pageNumber}.jpg`;
  return `/stories/zoo/bg/${filename}`;
}