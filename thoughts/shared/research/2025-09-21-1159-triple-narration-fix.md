---
date: 2025-09-21T11:59:00-08:00
researcher: Claude Code
git_commit: 672588ff3ef903407c9ae3ed9b4ca6b133d82b42
branch: main
repository: amz-interactive-story
topic: "Fix Plan for Triple Narration Issue"
tags: [research, codebase, tts, react-hooks, useeffect, memoization]
status: complete
last_updated: 2025-09-21
last_updated_by: Claude Code
---

# Research: Fix Plan for Triple Narration Issue

**Date**: 2025-09-21T11:59:00-08:00
**Researcher**: Claude Code
**Git Commit**: 672588ff3ef903407c9ae3ed9b4ca6b133d82b42
**Branch**: main
**Repository**: amz-interactive-story

## Research Question
Why is the story narration being triggered 3 times concurrently (with less than 1 second delay between each narration) when starting a story, and how can this be fixed?

## Summary
The triple narration issue is caused by **unstable function references in React useEffect dependency arrays**, specifically the `speakCurrent` function in the auto-play useEffect hook. The function is recreated on every render, causing the useEffect to trigger multiple times. Additionally, the TTS hook lacks debouncing mechanisms, making it susceptible to race conditions.

## Detailed Findings

### Root Cause: Unstable Function Dependencies

The primary issue is in the auto-play useEffect at `web/src/app/story/page.js:643-656`:

```javascript
useEffect(() => {
  if (current && !tts.isPlaying && !tts.isPaused) {
    // Auto-play logic
    const timer = setTimeout(() => {
      speakCurrent(); // ❌ UNSTABLE REFERENCE
    }, 500);

    return () => clearTimeout(timer);
  }
}, [current, isListening, tts.isPlaying, tts.isPaused, speakCurrent, stopListening, storyId]);
```

**Problem**: The `speakCurrent` function (lines 598-623) is **not memoized with useCallback**, so it gets recreated on every render. This makes it an unstable dependency that triggers the useEffect repeatedly.

### Secondary Contributing Factors

#### 1. TTS Hook Race Conditions (`web/src/hooks/useTTS.js`)
- **No debouncing**: `synthesizeAndPlay()` function has no protection against rapid successive calls
- **Continuous re-renders**: `timeupdate` event triggers `setProgress()` multiple times per second
- **Async cleanup issues**: `stop()` function doesn't wait for operations to complete
- **State update cascades**: Multiple state updates in event handlers cause render cascades

#### 2. Additional Unmemoized Functions
Several other functions lack memoization but have less critical impact:
- `pauseReading` (lines 625-627)
- `stopReading` (lines 629-635)
- `prev` (line 291)

#### 3. React StrictMode Status
- React StrictMode is **not explicitly enabled** in the application
- However, Next.js 15.5.3 may enable it by default in development mode
- This is **not the primary cause** but could be a contributing factor

## Code References

### Critical Files
- `web/src/app/story/page.js:643-656` - Auto-play useEffect with unstable dependencies
- `web/src/app/story/page.js:598-623` - Unmemoized speakCurrent function
- `web/src/hooks/useTTS.js:58-168` - synthesizeAndPlay function lacking debouncing
- `web/src/hooks/useTTS.js:112-116` - Continuous timeupdate event handlers

### Function Memoization Status
**✅ Properly Memoized:**
- `getPageSpeechKeyword` (line 70)
- `next` (line 261)
- `stopListening` (line 294)
- `startListening` (line 488)
- `handleGenerate` (line 536)

**❌ Not Memoized (Critical):**
- `speakCurrent` (line 598) - **Primary cause of triple narration**
- `pauseReading` (line 625)
- `stopReading` (line 629)
- `prev` (line 291)

## Architecture Insights

### Event Chain Causing Triple Narration
1. **Component mounts/re-renders** → `speakCurrent` function recreated
2. **useEffect dependency change** → Auto-play effect triggers
3. **TTS state updates** → Component re-renders
4. **Function recreation** → Cycle repeats
5. **Multiple audio synthesis** → Overlapping narrations

### TTS State Management Issues
The useTTS hook manages 9 separate state variables, with the 'timeupdate' event firing continuously during playback. This creates a feedback loop:
- Audio plays → timeupdate events → setProgress() calls → re-renders → speakCurrent recreated → useEffect triggers

## Fix Implementation Plan

### Phase 1: Critical Fix (Immediate)
**Memoize the `speakCurrent` function:**
```javascript
const speakCurrent = useCallback(async () => {
  try {
    if (!current) return;

    // If paused, resume
    if (tts.isPaused) {
      tts.play();
      return;
    }

    // Create story text with character name replacement
    const storyText = `${current.title}. ${current.text}`;
    const personalizedText = storyText.replace(/Lily/g, characterName);

    // Stop current audio and synthesize new speech
    const result = await tts.synthesizeAndPlay(personalizedText);

    if (result.success) {
      // Auto-start listening after read-aloud finishes
    }
  } catch (error) {
    console.error('Error speaking current scene:', error);
  }
}, [current, tts, characterName]); // ✅ Stable dependencies
```

### Phase 2: TTS Hook Improvements (Follow-up)
**Add debouncing to prevent rapid calls:**
```javascript
const synthesizeAndPlay = useCallback(debounce(async (text, voice) => {
  // existing implementation
}, 100), []);
```

**Throttle progress updates:**
```javascript
const throttledSetProgress = useCallback(throttle(setProgress, 100), []);
```

### Phase 3: Additional Memoization (Cleanup)
Memoize remaining functions for consistency:
- `pauseReading`
- `stopReading`
- `prev`

### Phase 4: Validation
1. **Test single narration**: Verify only one TTS call per scene change
2. **Check performance**: Ensure no excessive re-renders
3. **Validate navigation**: Confirm manual controls still work
4. **Production testing**: Test in production mode to rule out StrictMode

## Testing Strategy

### Validation Steps
1. **Browser console monitoring**: Check for multiple TTS synthesis logs
2. **React DevTools**: Monitor useEffect trigger frequency
3. **Network tab**: Verify single API calls to `/api/tts`
4. **Audio element inspection**: Confirm no overlapping audio elements

### Success Criteria
- ✅ Single narration per scene load
- ✅ No overlapping audio synthesis
- ✅ Stable useEffect behavior
- ✅ Consistent manual controls

## Open Questions
1. Should debouncing delay be configurable based on reading speed?
2. Is there a need for audio queue management for rapid scene changes?
3. Should the component implement audio preloading for smoother transitions?

## Related Research
This is the initial research document for the triple narration issue. Future research may include:
- TTS performance optimization
- Audio caching strategies
- Voice recognition integration improvements