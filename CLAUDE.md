# CLAUDE.md - Interactive Story App

## Project Overview
An interactive children's story application built with Next.js that allows kids to experience personalized bedtime stories with character customization, story selection, and immersive reading experiences.

## Architecture

### Tech Stack
- **Framework**: Next.js 15.5.3 with React 19.1.0
- **Styling**: Tailwind CSS 4.0
- **Images**: Next.js Image optimization
- **Build**: Turbopack for fast development
- **Testing**: Playwright for E2E testing

### Key Directories
```
web/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── page.js            # Landing page
│   │   ├── play/              # Story creation flow
│   │   │   ├── character/     # Character name/gender selection
│   │   │   ├── appearance/    # Character appearance selection
│   │   │   └── idea/          # Story idea/selection
│   │   ├── story/             # Story reading experience
│   │   └── stories/           # Story library
│   ├── data/                  # Story data and configurations
│   │   ├── preset-stories.js  # Age-based story presets
│   │   └── stories.js         # Sample stories and content
│   └── utils/
│       └── markdownParser.js  # Markdown story parser
└── public/
    └── stories/               # Story assets and content
        ├── zoo/               # Zoo story with backgrounds
        └── Lily's Lost Smile/ # Classic story with images
```

## Story System

### Story Types
1. **Gradient Stories**: Traditional layout with CSS gradients and optional images
2. **Background Image Stories**: Full-screen immersive layout with background images

### Story Data Structure
```javascript
{
  id: "story-id",
  title: "Story Title",
  blurb: "Short description",
  isMarkdown: true/false,        // Whether to load from markdown file
  markdownPath: "/path/to/file", // Path to markdown content
  scenes: [                      // Story pages/scenes
    {
      id: "page1",
      title: "Scene Title",
      text: "Scene content...",
      bg: "gradient-class" || "/path/to/background.jpg",
      image: "/path/to/image.png" // Optional scene image
    }
  ]
}
```

### Markdown Parser
- Supports both `##` and `###` page headers
- Auto-detects zoo stories for background image assignment
- Handles character name/pronoun replacement
- Supports embedded images and instructions

## User Flow

1. **Landing Page** (`/`) - Welcome and entry point
2. **Character Setup** (`/play/character`) - Name and gender selection
3. **Appearance Selection** (`/play/appearance`) - Character appearance customization
4. **Story Selection** (`/play/idea`) - Choose from age-appropriate preset stories
5. **Story Experience** (`/story`) - Immersive reading with navigation and read-aloud

## Layout Types

### Full-Screen Background Layout
Used for stories where `scene.bg` starts with `/` (URL path):
- Full viewport height background image
- Text overlay on right 50% of screen
- White text with drop shadows for readability
- No header or distracting UI elements
- Semi-transparent navigation buttons

### Traditional Grid Layout  
Used for gradient-based stories:
- Header with navigation
- Split view: visual left, text right
- Gradient backgrounds with decorative elements
- User selfie integration
- Traditional story layout

## Key Features

### Character Customization
- Name selection with storage in localStorage
- Gender selection affecting pronouns in stories
- Appearance selection from age-appropriate options
- Character data persists across sessions

### Story Experience
- Read-aloud functionality using Web Speech API
- Previous/Next navigation between scenes
- Responsive design for different screen sizes
- Loading states for markdown content
- Error handling for missing content

### Age-Based Content
Stories are categorized by age groups (4, 5, 6, 7, 8) with appropriate:
- Complexity levels
- Themes and content
- Visual design
- Story length

## Development Commands

```bash
# Development
cd web && npm run dev

# Build
cd web && npm run build

# Testing
cd web && npx playwright test

# Linting
cd web && npm run lint
```

## Story Creation Workflow

### Adding New Stories
1. Create story assets in `public/stories/[story-name]/`
2. Add story configuration to `src/data/stories.js`
3. Add to age-appropriate presets in `src/data/preset-stories.js`
4. Test story loading and navigation

### Background Image Stories
- Place background images in `public/stories/[story-name]/bg/`
- Use consistent naming: `page1.jpg`, `Page2.jpg` (note capitalization)
- Story parser auto-detects and assigns background URLs
- Text automatically renders with white overlay styling

### Markdown Stories
- Place `.md` file in `public/stories/[story-name]/`
- Use `### Page X: Title` format for scene headers
- Parser handles character customization and image paths
- Support for instructions and interactive elements

## Testing Strategy

### E2E Testing (Playwright)
- Story loading and navigation
- Character customization flow
- Read-aloud functionality
- Responsive design validation
- Error state handling

### Manual Testing Checklist
- [ ] Story appears in appropriate age groups
- [ ] Background images load correctly
- [ ] Text overlay is readable
- [ ] Navigation buttons work
- [ ] Read-aloud functions properly
- [ ] Character customization persists
- [ ] Responsive design works on mobile/tablet

## Common Issues & Solutions

### Story Not Loading
- Check markdown path encoding (spaces = `%20`)
- Verify background image file naming consistency
- Ensure story is added to both `stories.js` and `preset-stories.js`

### Background Images Not Displaying
- Verify file paths in `public/stories/[name]/bg/`
- Check file naming: `page1.jpg` vs `Page2.jpg`
- Ensure `getZooBackground()` function handles naming correctly

### Character Customization Not Working
- Check localStorage keys: `character_v1`, `selfie_v1`
- Verify pronoun replacement logic in `markdownParser.js`
- Test character data persistence across page reloads

## Performance Considerations

- Images use Next.js Image component with `unoptimized` flag for local development
- Background images are loaded with `object-cover` for proper scaling
- Lazy loading for story content and assets
- LocalStorage for character data to minimize re-renders

## Security Notes

- All story content is static and safe
- No user-generated content stored permanently
- LocalStorage used only for character preferences
- Image paths are validated and sanitized

## Browser Compatibility

- Modern browsers with ES6+ support
- Web Speech API for read-aloud (graceful degradation)
- CSS Grid and Flexbox for layouts
- Next.js Image optimization support

## Future Enhancements

- Additional story formats and layouts
- Enhanced character customization options
- Story progress tracking
- Parent dashboard for story management
- Offline story caching
- Multi-language support