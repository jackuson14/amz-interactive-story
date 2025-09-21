# Fix Triple Narration Issue Implementation Plan

## Overview

Fix the critical issue where story narration is triggered 3 times concurrently when starting a story, caused by unstable function references in React useEffect dependency arrays. The root cause is the unmemoized `speakCurrent` function creating infinite re-render loops.

## Current State Analysis

### Root Cause Identified
The `speakCurrent` function at `web/src/app/story/page.js:598-623` is **not memoized with useCallback**, but is included in the auto-play useEffect dependency array at line 656. This creates an infinite re-render cycle:

1. Component renders → `speakCurrent` function recreated (new reference)
2. useEffect sees new `speakCurrent` dependency → triggers effect
3. Effect calls `speakCurrent()` → TTS synthesizeAndPlay executes
4. TTS state updates → component re-renders
5. Cycle repeats → multiple concurrent audio synthesis requests

### Key Discoveries:
- **Critical**: `speakCurrent` function recreation causes infinite loops in auto-play effect (`web/src/app/story/page.js:656`)
- **Secondary**: TTS hook `timeupdate` events trigger continuous re-renders without debouncing (`web/src/hooks/useTTS.js:112-116`)
- **Minor**: Several other functions lack memoization for consistency (`pauseReading`, `stopReading`, `prev`)
- **Good**: Many functions are already properly memoized (`next`, `stopListening`, `startListening`, all TTS controls)

### Current Auto-play Effect (PROBLEMATIC)
```javascript
// web/src/app/story/page.js:643-656
useEffect(() => {
  if (current && !tts.isPlaying && !tts.isPaused) {
    if (isListening) {
      stopListening();
    }
    const timer = setTimeout(() => {
      speakCurrent(); // ❌ UNSTABLE FUNCTION REFERENCE
    }, 500);

    return () => clearTimeout(timer);
  }
}, [current, isListening, tts.isPlaying, tts.isPaused, speakCurrent, stopListening, storyId]); // ❌ speakCurrent causes infinite loops
```

## Desired End State

After this plan is complete:
- ✅ Single narration per scene load/change
- ✅ No overlapping or concurrent audio synthesis
- ✅ Stable useEffect behavior without infinite loops
- ✅ Consistent manual TTS controls
- ✅ Optimized performance with debounced progress updates

### Verification Criteria:
- **Automated**: No console errors about multiple TTS synthesis
- **Manual**: Only one audio plays when scene changes
- **Manual**: Browser network tab shows single `/api/tts` request per scene

## What We're NOT Doing

- Restructuring the entire TTS system or hook architecture
- Changing the AWS Polly integration or API endpoints
- Modifying the auto-play timing or user experience
- Adding complex audio queue management systems
- Implementing audio preloading or caching strategies

## Implementation Approach

Incremental fixes targeting the specific root cause first, then performance optimizations. Each phase can be tested independently to ensure stability.

## Phase 1: Critical Fix - Memoize speakCurrent Function

### Overview
Memoize the `speakCurrent` function with useCallback to provide stable reference for useEffect dependencies, eliminating the infinite re-render loop.

### Changes Required:

#### 1. Story Page Component
**File**: `web/src/app/story/page.js`
**Location**: Lines 598-623
**Changes**: Replace function declaration with useCallback

```javascript
// Replace the existing speakCurrent function (lines 598-623)
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
      // This will be handled by the audio 'ended' event in useTTS hook
    }
  } catch (error) {
    console.error('Error speaking current scene:', error);
  }
}, [current, tts, characterName]); // ✅ Stable dependencies
```

**Dependency Analysis:**
- `current` - scene object, changes when navigating
- `tts` - TTS hook object, stable reference from useTTS
- `characterName` - character name from state, changes when character changes

### Success Criteria:

#### Automated Verification:
- [x] Component compiles without TypeScript/ESLint errors: `cd web && npm run lint`
- [ ] No infinite re-render warnings in console
- [ ] Single TTS API call per scene change (check browser network tab)

#### Manual Verification:
- [ ] Only one narration plays when scene loads
- [ ] Manual TTS controls still work correctly (play/pause/stop)
- [ ] Scene navigation triggers single new narration
- [ ] No audio overlap when rapidly changing scenes

---

## Phase 2: TTS Hook Performance Optimization

### Overview
Add debouncing to TTS hook progress updates to reduce unnecessary re-renders and improve performance.

### Changes Required:

#### 1. TTS Hook Progress Updates
**File**: `web/src/hooks/useTTS.js`
**Location**: Lines 112-116
**Changes**: Debounce timeupdate events using requestAnimationFrame

```javascript
// Replace the existing timeupdate listener (lines 112-116)
const progressUpdateRef = useRef(null);

audio.addEventListener('timeupdate', () => {
  if (progressUpdateRef.current) {
    cancelAnimationFrame(progressUpdateRef.current);
  }
  progressUpdateRef.current = requestAnimationFrame(() => {
    if (audio.duration) {
      setProgress((audio.currentTime / audio.duration) * 100);
    }
  });
});
```

#### 2. Cleanup Progress Animation Frame
**File**: `web/src/hooks/useTTS.js`
**Location**: Lines 25-36 (cleanup useEffect)
**Changes**: Add progressUpdateRef cleanup

```javascript
// Add to existing cleanup useEffect
useEffect(() => {
  return () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    // Add this cleanup
    if (progressUpdateRef.current) {
      cancelAnimationFrame(progressUpdateRef.current);
    }
  };
}, []);
```

### Success Criteria:

#### Automated Verification:
- [x] TTS hook compiles without errors: `cd web && npm run lint`
- [ ] No console warnings about memory leaks

#### Manual Verification:
- [ ] Progress bar updates smoothly during audio playback
- [ ] No performance degradation during long audio playback
- [ ] Component re-render frequency reduced (check React DevTools)

---

## Phase 3: Additional Function Memoization

### Overview
Memoize remaining unmemoized functions for consistency and potential performance improvements.

### Changes Required:

#### 1. Memoize pauseReading Function
**File**: `web/src/app/story/page.js`
**Location**: Lines 625-627
**Changes**: Convert to useCallback

```javascript
const pauseReading = useCallback(() => {
  tts.pause();
}, [tts]);
```

#### 2. Memoize stopReading Function
**File**: `web/src/app/story/page.js`
**Location**: Lines 629-635
**Changes**: Convert to useCallback

```javascript
const stopReading = useCallback(() => {
  tts.stop();
  // Stop listening when read-aloud is manually stopped
  if (isListening) {
    stopListening();
  }
}, [tts, isListening, stopListening]);
```

#### 3. Memoize prev Function
**File**: `web/src/app/story/page.js`
**Location**: Line 291
**Changes**: Convert to useCallback

```javascript
const prev = useCallback(() => {
  setIdx((v) => Math.max(v - 1, 0));
}, []);
```

### Success Criteria:

#### Automated Verification:
- [x] All functions compile without errors: `cd web && npm run lint`
- [ ] ESLint useCallback dependencies are correct

#### Manual Verification:
- [ ] All TTS controls work correctly
- [ ] Navigation controls work correctly
- [ ] No regressions in user experience

---

## Phase 4: Validation & Testing

### Overview
Comprehensive testing to ensure the fix is effective and no regressions were introduced.

### Testing Strategy

#### 1. Browser Console Monitoring
- Open browser dev tools console
- Navigate between story scenes
- Verify only one "Synthesizing text" log per scene change
- Confirm no error messages or warnings

#### 2. Network Tab Analysis
- Open browser dev tools Network tab
- Filter for `/api/tts` requests
- Navigate between scenes and verify single API call per scene
- Check that concurrent requests are eliminated

#### 3. React DevTools Performance
- Install React DevTools browser extension
- Monitor component re-render frequency
- Verify useEffect triggers are reduced
- Check that function references are stable

#### 4. Audio Playback Verification
- Test auto-play functionality on scene changes
- Verify manual controls (play/pause/stop/resume)
- Test rapid scene navigation doesn't cause audio overlap
- Confirm voice recognition starts after audio ends

### Success Criteria:

#### Automated Verification:
- [ ] All tests pass: `cd web && npm test` (if tests exist)
- [x] Build succeeds: `cd web && npm run build`
- [x] No console errors in production build
- [ ] Lighthouse performance score unchanged

#### Manual Verification:
- [ ] ✅ Single narration per scene load
- [ ] ✅ No overlapping audio synthesis
- [ ] ✅ Stable useEffect behavior (no infinite loops)
- [ ] ✅ Consistent manual controls
- [ ] ✅ Voice recognition integration works
- [ ] ✅ Character name replacement works
- [ ] ✅ Scene navigation responsive and smooth

## Performance Considerations

### Before Fix:
- Infinite re-render loops causing performance degradation
- Multiple concurrent audio synthesis requests
- Continuous TTS state updates triggering component re-renders
- Browser memory consumption from multiple audio elements

### After Fix:
- Stable function references prevent infinite loops
- Single audio synthesis per scene change
- Debounced progress updates reduce re-render frequency
- Improved memory management and performance

## Migration Notes

This fix requires no data migration or user-facing changes. The implementation preserves all existing functionality while eliminating the performance issues.

### Deployment Strategy:
1. Deploy during low-traffic period
2. Monitor console logs for any unexpected errors
3. Verify single TTS API calls in production logs
4. Rollback plan: revert specific function changes if issues occur

## References

- Original research: `thoughts/shared/research/2025-09-21-1159-triple-narration-fix.md`
- Story page component: `web/src/app/story/page.js:598-623` (speakCurrent function)
- Auto-play effect: `web/src/app/story/page.js:643-656` (useEffect with dependencies)
- TTS hook: `web/src/hooks/useTTS.js:112-116` (timeupdate event handler)
- React useCallback documentation for memoization patterns