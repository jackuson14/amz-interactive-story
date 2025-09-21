# AMZ Interactive Story

An interactive children's story application built with Next.js that lets kids experience personalized bedtime stories with character customization, story selection, and immersive reading.

![System Architecture](documents/system%20architecture.png)

## Overview

- Personalized stories with the child’s name, gender, and appearance
- Two immersive layouts: full-screen background stories and gradient-based stories
- Read‑aloud support and simple navigation between scenes
- Age‑appropriate story presets (ages 4–8)
- Static, safe content with local-only preferences (no persistent user data)

## Tech Stack

- Framework: Next.js 15.5.3 (App Router) with React 19.1.0
- Styling: Tailwind CSS 4
- Images: Next.js Image optimization
- Dev build: Turbopack for fast development
- Testing: Playwright for E2E

## Repository Structure

This repo hosts the web app in the web/ folder.

```
.
├── documents/                 # Diagrams, notes, and assets
├── web/                       # Next.js application
│   ├── public/                # Static files and story assets
│   │   └── stories/           # Story images and markdown
│   └── src/
│       ├── app/               # App Router pages
│       │   ├── page.js        # Landing page
│       │   ├── play/          # Story creation flow
│       │   │   ├── character/ # Name/gender selection
│       │   │   ├── appearance/# Appearance selection
│       │   │   └── idea/      # Story idea/selection
│       │   ├── story/         # Story reading experience
│       │   └── stories/       # Story library
│       ├── data/              # Story data & configs
│       │   ├── preset-stories.js
│       │   └── stories.js
│       └── utils/
│           └── markdownParser.js
└── README.md                  # You are here
```

## Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+

### Install

```bash
cd web
npm install
```

### Development

```bash
cd web
npm run dev
# App will be available at http://localhost:3000
```

### Build & Start

```bash
cd web
npm run build
npm start
```

### Lint

```bash
cd web
npm run lint
```

### Tests (Playwright)

```bash
cd web
# Optional: install browsers on first run
npx playwright install

# Run E2E tests
npx playwright test

# Open HTML report after a run
npx playwright show-report
```

Playwright is configured in `web/playwright.config.js` to auto‑start the dev server on port 3000 during tests.

## Story System

### Story Types

1. Gradient Stories — Traditional layout with soft gradients and optional inline images
2. Background Image Stories — Full-screen immersive layout with per‑scene background images

### Story Data Structure

```js
{
  id: "story-id",
  title: "Story Title",
  blurb: "Short description",
  isMarkdown: true/false,        // Load content from a markdown file if true
  markdownPath: "/path/to/file",// Path under public/ for markdown content
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

- Supports both `##` and `###` page headers as scene separators
- Auto‑detects zoo stories to assign per‑page background images
- Replaces character name and pronouns based on user selection
- Supports embedded images and simple instructions

## User Flow

1. Landing Page (`/`) — Welcome and entry point
2. Character Setup (`/play/character`) — Name and gender selection
3. Appearance Selection (`/play/appearance`) — Character appearance
4. Story Selection (`/play/idea`) — Choose age‑appropriate presets
5. Story Experience (`/story`) — Read with navigation and read‑aloud

## Layouts

- Full‑Screen Background: Used when `scene.bg` is a URL path. Text overlays right side; white text with shadows; semi‑transparent nav.
- Traditional Grid: Gradient backgrounds; header/nav; split layout; optional user selfie integration.

## Development Commands (from web/)

```bash
# Development
yarn dev # or: npm run dev

# Build
npm run build

# Testing
npx playwright test

# Linting
npm run lint
```

## Creating/Adding Stories

1. Create assets in `web/public/stories/[story-name]/`
2. Add story configuration in `web/src/data/stories.js`
3. Add to age‑group presets in `web/src/data/preset-stories.js`
4. Test loading, navigation, and visuals

### Background Image Stories

- Place backgrounds in `public/stories/[story-name]/bg/`
- Use consistent naming: `page1.jpg`, `Page2.jpg` (case sensitivity matters on some systems)
- Parser auto‑detects zoo stories and assigns backgrounds
- Text uses white overlay styling for contrast

### Markdown Stories

- Place `.md` in `public/stories/[story-name]/`
- Use headers like `### Page X: Title` for scene boundaries
- Parser handles character customization and image paths

## Testing Strategy

- E2E: Playwright covers story loading, navigation, character setup, read‑aloud, responsiveness, and error states
- Manual checklist:
  - Story appears in correct age groups
  - Background images load correctly
  - Text overlay is readable
  - Prev/Next navigation works
  - Read‑aloud functions properly
  - Character customization persists
  - Works on mobile/tablet

## Troubleshooting

- Story not loading
  - Check markdown path encoding (spaces -> `%20`)
  - Verify background image file naming and paths
  - Ensure story added to both `stories.js` and `preset-stories.js`

- Backgrounds not displaying
  - Verify file paths in `public/stories/[name]/bg/`
  - Check filename case (e.g., `page1.jpg` vs `Page1.jpg`)

- Character customization not working
  - Confirm localStorage keys: `character_v1`, `selfie_v1`
  - Verify pronoun replacement in `markdownParser.js`

## Security & Privacy

- All story content is static
- No persistent user accounts or backend storage
- LocalStorage used only for character preferences

## Notes

- Images are optimized by Next.js; in local dev they may use `unoptimized` for speed
- Backgrounds use `object-cover` to scale across viewports
- LocalStorage minimizes re-renders and preserves selections across sessions

---

Made with Next.js, React, and Playwright.

