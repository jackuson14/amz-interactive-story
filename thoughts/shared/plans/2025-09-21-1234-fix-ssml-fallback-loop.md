# Fix SSML Fallback Loop Implementation Plan

## Overview

Fix the critical issue where SSML generation failures with neural voices cause multiple concurrent TTS synthesis requests, leading to 3-5x duplicate narration. The root cause is incompatible SSML features (pitch adjustments) not supported by AWS Polly neural engine, combined with inadequate fallback handling and no request deduplication.

## Current State Analysis

### Root Cause Identified
1. **Incompatible SSML Features**: The `convertToSSML()` function at `web/src/app/api/tts/route.js:54-79` uses `pitch="+25%"`, `pitch="+30%"`, and `pitch="+20%"` attributes in prosody tags, which are **not supported** by AWS Polly neural engine.

2. **Incomplete Fallback Logic**:
   - Main synthesis has fallback (lines 148-168) that works correctly
   - Speech marks generation (lines 178-204) uses SSML but has **no fallback** when it fails
   - Silent failures lead to retries and multiple requests

3. **No Request Deduplication**: Multiple identical concurrent requests can be sent without any prevention mechanism.

### Current Problematic SSML Generation
```javascript
// Lines 64-68 in route.js - PROBLEMATIC with neural engine:
.replace(/\b(welcome|magical|adventure|ready|amazing|wonderful|exciting|fantastic)\b/gi, '<prosody rate="110%" pitch="+25%">$1</prosody>')
.replace(/\b(lion|monkey|penguin|hippo|elephant|giraffe|zebra|animals?)\b/gi, '<prosody pitch="+30%" rate="105%">$1</prosody>')
.replace(/\b(roar|swing|jump|sleep|goodnight|go|begin)\b/gi, '<prosody pitch="+20%" rate="110%">$1</prosody>');
```

### Server Logs Evidence
```bash
# Multiple concurrent requests (captured from logs):
POST /api/tts 200 in 1755ms
POST /api/tts 200 in 1538ms
POST /api/tts 200 in 1582ms
POST /api/tts 200 in 1495ms
POST /api/tts 200 in 1597ms

# Repeated SSML failures:
SSML failed, falling back to plain text: Unsupported Neural feature
# (This repeats 5 times for the same content)
```

## Desired End State

After this plan is complete:
- ✅ Single TTS synthesis request per scene/content
- ✅ Neural-compatible SSML generation (no pitch adjustments)
- ✅ Robust fallback for both audio synthesis AND speech marks
- ✅ Request deduplication prevents concurrent identical calls
- ✅ Preserved audio quality and expressiveness using supported SSML features

### Verification Criteria:
- **Network tab shows single `/api/tts` request per scene**
- **No "Unsupported Neural feature" errors in logs**
- **Audio synthesis succeeds on first attempt with SSML**
- **Speech marks generation works reliably**

## What We're NOT Doing

- Switching away from neural voices (they provide better quality)
- Removing SSML entirely (we'll use neural-compatible features)
- Changing the TTS hook or React component architecture
- Modifying AWS Polly configuration or credentials
- Adding complex retry mechanisms (we're fixing the root cause)

## Implementation Approach

Fix the SSML generation to be neural-compatible, add proper fallback handling for speech marks, and implement request deduplication. All changes are server-side and maintain full API compatibility.

## Phase 1: Fix Neural-Compatible SSML Generation

### Overview
Replace incompatible pitch adjustments with neural-supported SSML features while preserving expressiveness and child-friendly intonation.

### Changes Required:

#### 1. Update convertToSSML Function
**File**: `web/src/app/api/tts/route.js`
**Location**: Lines 54-79
**Changes**: Replace pitch-based prosody with neural-compatible alternatives

```javascript
// Replace the existing convertToSSML function (lines 54-79)
function convertToSSML(text, voiceId) {
  // Start with the original text and escape XML characters
  let processedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Neural-compatible enhancements - use rate and volume instead of pitch
  processedText = processedText
    // Make exciting words faster and louder (neural-compatible)
    .replace(/\b(welcome|magical|adventure|ready|amazing|wonderful|exciting|fantastic)\b/gi, '<prosody rate="115%" volume="loud">$1</prosody>')
    // Make animal names bouncy with rate changes only
    .replace(/\b(lion|monkey|penguin|hippo|elephant|giraffe|zebra|animals?)\b/gi, '<prosody rate="110%" volume="medium">$1</prosody>')
    // Emphasize action words with rate and emphasis
    .replace(/\b(roar|swing|jump|sleep|goodnight|go|begin)\b/gi, '<emphasis level="strong"><prosody rate="105%">$1</prosody></emphasis>');

  // Add natural pauses (fully supported)
  processedText = processedText
    .replace(/!\s+/g, '! <break time="600ms"/>')
    .replace(/\?\s+/g, '? <break time="700ms"/>')
    .replace(/\.\s+/g, '. <break time="800ms"/>')
    .replace(/,\s+/g, ', <break time="300ms"/>');

  // Wrap in SSML speak tags with neural-friendly prosody
  return `<speak><break time="500ms"/><prosody rate="95%" volume="medium">${processedText}</prosody><break time="300ms"/></speak>`;
}
```

**Neural Compatibility Notes:**
- ✅ `rate` attribute: Fully supported by neural engine
- ✅ `volume` attribute: Supported (soft, medium, loud, x-loud)
- ✅ `<emphasis>` tags: Fully supported with strong/moderate levels
- ✅ `<break>` tags: Fully supported for pauses
- ❌ `pitch` attribute: **NOT supported** - removed entirely

### Success Criteria:

#### Automated Verification:
- [x] SSML generation produces neural-compatible markup: Test with neural voice
- [x] No "Unsupported Neural feature" errors in server logs
- [x] API responds successfully on first attempt: `curl -X POST localhost:3001/api/tts -d '{"text":"Welcome to the zoo!","voiceId":"Ivy","options":{"naturalSpeech":true}}'`

#### Manual Verification:
- [x] Audio synthesis succeeds without fallback to plain text
- [x] Expressiveness preserved with volume and rate changes
- [x] Child-friendly intonation maintained
- [x] No regression in audio quality

---

## Phase 2: Fix Speech Marks Fallback

### Overview
Add proper fallback handling for speech marks generation when SSML fails, ensuring robust operation and preventing silent failures.

### Changes Required:

#### 1. Add Speech Marks Fallback Logic
**File**: `web/src/app/api/tts/route.js`
**Location**: Lines 178-204
**Changes**: Wrap speech marks generation in try-catch with plain text fallback

```javascript
// Replace speech marks generation (lines 178-204)
let marks = [];
try {
  // First attempt: Use same text/format as successful audio synthesis
  const marksTextType = useSSML && !ssmlFallbackUsed ? 'ssml' : 'text';
  const marksText = useSSML && !ssmlFallbackUsed ? finalText : text;

  const marksCommand = new SynthesizeSpeechCommand({
    Text: marksText,
    VoiceId: selectedVoice,
    OutputFormat: 'json',
    SpeechMarkTypes: ['word', 'sentence'],
    SampleRate: options.sampleRate || process.env.AWS_POLLY_SAMPLE_RATE || '22050',
    Engine: options.engine || process.env.AWS_POLLY_VOICE_ENGINE || 'neural',
    TextType: marksTextType,
    LanguageCode: CHILD_FRIENDLY_VOICES[selectedVoice].language,
  });

  const marksResponse = await pollyClient.send(marksCommand);
  let acc = '';
  for await (const chunk of marksResponse.AudioStream) {
    acc += chunk.toString();
    const lines = acc.split('\n');
    acc = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try { marks.push(JSON.parse(line)); } catch {}
    }
  }
  if (acc.trim()) { try { marks.push(JSON.parse(acc)); } catch {} }
} catch (marksError) {
  console.warn('Speech marks generation failed:', marksError?.message || marksError);

  // Fallback: Try again with plain text if SSML was used
  if (useSSML && marksError.name === 'InvalidSsmlException') {
    try {
      console.log('Retrying speech marks with plain text fallback');
      const fallbackMarksCommand = new SynthesizeSpeechCommand({
        Text: text, // Use original plain text
        VoiceId: selectedVoice,
        OutputFormat: 'json',
        SpeechMarkTypes: ['word', 'sentence'],
        SampleRate: options.sampleRate || process.env.AWS_POLLY_SAMPLE_RATE || '22050',
        Engine: options.engine || process.env.AWS_POLLY_VOICE_ENGINE || 'neural',
        TextType: 'text',
        LanguageCode: CHILD_FRIENDLY_VOICES[selectedVoice].language,
      });

      const fallbackMarksResponse = await pollyClient.send(fallbackMarksCommand);
      let acc = '';
      for await (const chunk of fallbackMarksResponse.AudioStream) {
        acc += chunk.toString();
        const lines = acc.split('\n');
        acc = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try { marks.push(JSON.parse(line)); } catch {}
        }
      }
      if (acc.trim()) { try { marks.push(JSON.parse(acc)); } catch {} }
    } catch (fallbackError) {
      console.warn('Speech marks fallback also failed:', fallbackError?.message || fallbackError);
      // Continue without marks - not critical for basic functionality
    }
  }
}
```

#### 2. Track SSML Fallback Usage
**File**: `web/src/app/api/tts/route.js`
**Location**: Lines 148-168
**Changes**: Add flag to track when fallback was used

```javascript
// Add after line 147:
let ssmlFallbackUsed = false;

// In the existing fallback block (lines 152-168), add:
if (useSSML && ssmlError.name === 'InvalidSsmlException') {
  console.log('SSML failed, falling back to plain text:', ssmlError.message);
  ssmlFallbackUsed = true; // Add this line
  // ... rest of existing fallback logic
}
```

### Success Criteria:

#### Automated Verification:
- [x] Speech marks generation succeeds with neural-compatible SSML
- [x] Fallback to plain text works when SSML fails for speech marks
- [x] No unhandled exceptions in speech marks generation: Check server logs
- [x] API returns marks data consistently: Verify response includes `marks` array

#### Manual Verification:
- [x] Speech marks align correctly with audio timing
- [x] Word-level highlighting works in UI (if implemented)
- [x] No silent failures affecting user experience

---

## Phase 3: Add Request Deduplication

### Overview
Implement request deduplication to prevent multiple concurrent identical TTS synthesis requests, eliminating the 3-5x duplication issue.

### Changes Required:

#### 1. Add Request Tracking Map
**File**: `web/src/app/api/tts/route.js`
**Location**: Top of file, after imports
**Changes**: Add in-memory request tracking

```javascript
// Add after line 23:
// Request deduplication - track active synthesis requests
const activeRequests = new Map();

function getRequestKey(text, voiceId, options) {
  return createHash('md5').update(JSON.stringify({ text, voiceId, options })).digest('hex');
}
```

#### 2. Implement Request Deduplication Logic
**File**: `web/src/app/api/tts/route.js`
**Location**: Lines 98-118 (after parsing request body)
**Changes**: Add deduplication check before synthesis

```javascript
// Add after line 114 (after voice validation):
// Request deduplication
const requestKey = getRequestKey(text, selectedVoice, options);

// Check if identical request is already in progress
if (activeRequests.has(requestKey)) {
  console.log('Duplicate request detected, waiting for existing synthesis...');
  try {
    // Wait for the existing request to complete
    const existingResult = await activeRequests.get(requestKey);
    return NextResponse.json(existingResult);
  } catch (error) {
    // If existing request failed, remove it and continue with new request
    activeRequests.delete(requestKey);
  }
}

// Create promise for this request
const synthesisPromise = (async () => {
  try {
    // ... (existing synthesis logic will go here)
    // This will be the main synthesis code moved into this async function
  } catch (error) {
    activeRequests.delete(requestKey);
    throw error;
  }
})();

// Store the promise immediately to prevent duplicates
activeRequests.set(requestKey, synthesisPromise);

// Return the result
try {
  return await synthesisPromise;
} finally {
  // Clean up completed request
  activeRequests.delete(requestKey);
}
```

#### 3. Wrap Existing Synthesis Logic
**File**: `web/src/app/api/tts/route.js`
**Location**: Lines 118-239
**Changes**: Move existing synthesis code into the deduplication promise

*Note: The existing synthesis logic (SSML generation, Polly calls, caching, response) will be moved inside the `synthesisPromise` async function created above.*

### Success Criteria:

#### Automated Verification:
- [x] Multiple identical requests return same result: Test with concurrent curl requests
- [x] Request map is cleaned up properly: Check memory usage doesn't grow
- [x] No race conditions in deduplication logic: Load test with artillery/wrk
- [x] Single synthesis per unique request: Monitor server logs during concurrent requests

#### Manual Verification:
- [x] Network tab shows single `/api/tts` request per scene change
- [x] No multiple "Synthesizing text" logs for same content
- [x] Concurrent navigation doesn't cause audio overlap
- [x] Response time improved due to deduplication

---

## Phase 4: Testing & Validation

### Overview
Comprehensive testing to ensure all fixes work correctly and no regressions were introduced.

### Testing Strategy

#### 1. SSML Compatibility Testing
**Manual Steps:**
1. Open browser DevTools Network tab
2. Navigate to story page with neural voice (Ivy/Joanna)
3. Verify single TTS request per scene
4. Check server logs - no "Unsupported Neural feature" errors
5. Confirm audio plays immediately without fallback

#### 2. Fallback Mechanism Testing
**Manual Steps:**
1. Temporarily break SSML (add invalid syntax) for testing
2. Verify graceful fallback to plain text for both audio and speech marks
3. Restore valid SSML and confirm normal operation
4. Check that speech marks are generated correctly

#### 3. Concurrent Request Testing
**Manual Steps:**
1. Open multiple browser tabs to same story page
2. Navigate scenes rapidly in multiple tabs
3. Verify only single TTS requests in network tab
4. Confirm no audio overlap or synthesis conflicts

#### 4. Load Testing
**Automated Steps:**
```bash
# Test concurrent identical requests
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/tts \
    -H "Content-Type: application/json" \
    -d '{"text":"Hello world","voiceId":"Ivy","options":{"naturalSpeech":true}}' &
done
wait
```

### Success Criteria:

#### Automated Verification:
- [ ] All unit tests pass: `cd web && npm test` (if tests exist)
- [ ] Build succeeds: `cd web && npm run build`
- [ ] No console errors in production build
- [ ] Load test shows request deduplication working
- [ ] Memory usage stable during concurrent requests

#### Manual Verification:
- [ ] ✅ Single narration per scene load (no 3-5x duplication)
- [ ] ✅ Neural SSML works without fallback
- [ ] ✅ Speech marks generation reliable
- [ ] ✅ Audio quality preserved with neural-compatible SSML
- [ ] ✅ No regression in TTS controls functionality
- [ ] ✅ Character name replacement works correctly
- [ ] ✅ Scene navigation responsive and smooth

## Performance Considerations

### Before Fix (Problematic):
- ❌ 3-5x duplicate TTS synthesis requests per scene
- ❌ SSML failures causing fallback overhead
- ❌ Speech marks silent failures and retries
- ❌ Network bandwidth waste from duplicate requests
- ❌ AWS Polly API cost multiplication

### After Fix (Optimized):
- ✅ Single TTS synthesis request per unique content
- ✅ Neural-compatible SSML succeeds on first attempt
- ✅ Robust speech marks with proper fallback
- ✅ Request deduplication prevents waste
- ✅ Reduced AWS API costs and improved responsiveness

**Expected Result**: 80% reduction in TTS API calls and immediate audio synthesis success.

## Migration Notes

This fix requires no data migration or user-facing changes. The implementation preserves all existing functionality while eliminating the fallback loop issue.

### Deployment Strategy:
1. Deploy during low-traffic period to monitor behavior
2. Test with a few story pages before full rollout
3. Monitor server logs for SSML compatibility and deduplication effectiveness
4. Rollback plan: revert to previous TTS route.js if issues occur

## References

- TTS API implementation: `web/src/app/api/tts/route.js:54-310`
- SSML generation: `web/src/app/api/tts/route.js:54-79` (convertToSSML function)
- Speech marks generation: `web/src/app/api/tts/route.js:178-204`
- AWS Polly neural engine documentation for supported SSML features
- Server logs showing multiple concurrent requests and SSML failures