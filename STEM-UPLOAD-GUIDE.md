# Stem Upload Guide for Artists

## What Are Stems?

**Stems** are the individual components of your track exported as separate audio files. Instead of just uploading your final mix, you can upload:

- **Master** - Your full mix (required)
- **Drums** - All percussion elements
- **Bass** - Bass instruments
- **Synths** - Synthesizers, keys, pads
- **Vocals** - Lead and backing vocals
- **Melody** - Melodic instruments (guitar, piano, etc.)
- **FX** - Sound effects, atmospheres, risers
- **Other** - Any custom elements

---

## Why Upload Stems?

### Get More Detailed Feedback
Instead of vague comments like "the mix needs work," reviewers can:
- Solo your vocals to check if they're loud enough
- Mute the drums to hear if the bass is masking other elements
- Provide specific feedback like "Your kick at 1:42 is too loud compared to the bass"

### Professional Workflow
Uploading stems is how you'd send your track to a mix engineer. Reviewers can experience your music the way you built it, layer by layer.

### Better Review Quality
Reviewers can give actionable, technical feedback because they can isolate problematic elements. This leads to faster improvements.

---

## How to Export Stems from Your DAW

### Ableton Live
1. Select all tracks you want to export
2. File → Export Audio/Video
3. In the export dialog:
   - **Rendered Track:** Select "All Individual Tracks"
   - **File Type:** WAV or MP3
   - **Sample Rate:** 44.1 kHz or 48 kHz
   - **Bit Depth:** 16-bit or 24-bit
4. Ensure all stems are the same length (trim silence at the end if needed)
5. Name your stems clearly (e.g., "Drums.wav", "Vocals.wav")

### FL Studio
1. File → Export → Wave file
2. Select "Split mixer tracks" option
3. Choose which mixer tracks to export
4. FL Studio will create individual files for each track

### Logic Pro
1. File → Bounce → All Tracks as Audio Files
2. Select destination folder
3. Choose format (WAV or MP3)
4. Logic exports each track as a separate file

### Pro Tools
1. File → Bounce To → Disk
2. Select "Offline" for faster rendering
3. Use "Bounce Sources" dropdown to select tracks
4. Repeat for each stem you want to export

---

## Uploading to MixReflect

### Step 1: Go to Upload Page
1. Log in to MixReflect
2. Click "Submit Track" or go to `/artist/submit`
3. Select **"Upload stems"** mode (has a ✨ sparkle icon)

### Step 2: Add Your Stems
1. The **Master** track is required (your full mix)
2. Click **"Choose File"** for the master track
3. Upload your full mix MP3 or WAV
4. Click **"+ Add Stem"** to add more stems
5. For each stem:
   - Select the stem type from the dropdown (🥁 Drums, 🎸 Bass, etc.)
   - Add a label (e.g., "Kick & Snare", "Lead Vocals")
   - Upload the audio file

### Step 3: Validation
- All stems must be **within 2 seconds** of the same duration
- Maximum **10 stems** per track
- Each stem can be up to **25MB**
- Supported formats: MP3, WAV

### Step 4: Add Track Details
1. Enter track title
2. Select genres (up to 3)
3. Optionally add feedback focus notes
4. Click **"Submit"**

---

## Best Practices

### Naming Your Stems
Use clear, descriptive names:
- ✅ "Kick & Snare.wav"
- ✅ "Lead Vocals.wav"
- ✅ "Synth Pad.wav"
- ❌ "Track 1.wav"
- ❌ "Audio_123.wav"

### Stem Organization
Group similar elements together:
- **Drums:** Kick, snare, hi-hats, percussion all in one stem
- **Bass:** All bass layers combined
- **Vocals:** Lead + backing vocals together (or separate if needed)
- **Synths:** All synth layers

Don't over-split! 5-8 stems is usually perfect. Too many stems can be overwhelming.

### Audio Quality
- Export at the same quality as your master (44.1kHz, 16-bit minimum)
- Ensure all stems start at the same point (bar 1)
- Trim excess silence at the end
- No clipping! Keep headroom on individual stems

### Duration Matching
**Critical:** All stems must be the same length.
- If your track is 3:42, all stems should be 3:42
- MixReflect validates duration within ±2 seconds
- Trim or extend stems in your DAW before exporting

---

## How Reviewers Use Stems

### The Stem Mixer
When reviewers open your track, they'll see a mixer with controls for each stem:

```
Master    [M] [S] ──────●───  100%
Drums     [M] [S] ──────●───   80%
Bass      [M] [S] ──────●───   90%
Synths    [M] [S] ──────●───   70%
Vocals    [M] [S] ──────●───  100%
```

- **M** = Mute button (silence this stem)
- **S** = Solo button (only hear this stem)
- **Slider** = Volume control (0-100%)

### Example Feedback You'll Get
With stems, reviewers can say things like:
- "At 1:30, mute the drums and listen to the bass—it's fighting with the synth"
- "Solo the vocals around 2:15. They're getting buried when the drums come in"
- "Your kick drum is masking the bass. Try reducing the kick's sub frequencies"

---

## Troubleshooting

### "Stem durations must match within 2 seconds"
- Check that all stems start at the same position in your DAW
- Ensure you didn't accidentally trim one stem shorter
- Re-export all stems together to guarantee matching length

### "File too large (max 25MB)"
- Compress your audio or reduce bitrate
- Use MP3 instead of WAV to reduce file size
- 320kbps MP3 is high quality and usually under 25MB for most tracks

### "Maximum 10 stems per track"
- Combine similar elements (all drums into one stem, all synths into one, etc.)
- Focus on the most important elements reviewers should hear separately

### Upload is slow
- Ensure you have a stable internet connection
- Try uploading during off-peak hours
- Consider using MP3 instead of WAV to reduce upload time

---

## FAQ

### Do I have to upload stems?
No! Stem upload is optional. You can still upload your track as a single MP3 like before. Stems just give you more detailed feedback.

### Can I edit stems after uploading?
Currently, no. If you need to update stems, you'll need to upload a new version of the track.

### Will reviewers download my stems?
No. Stems are only playable in the built-in mixer on MixReflect. Reviewers cannot download individual stem files.

### What if I only have the master mix?
That's totally fine! Just use the regular "Upload MP3" mode instead of "Upload stems."

### Can I upload stems from an old project?
Yes! As long as you can re-export the stems from your DAW with matching lengths, you can upload them.

### Are my stems safe?
Yes. Stems are only accessible to reviewers assigned to your track. They cannot be downloaded, shared, or redistributed. Once your track is public, the stem mixer is available to listeners, but individual stems cannot be extracted.

---

## Tips for Getting the Most Out of Stems

1. **Upload stems for your most important tracks** - Tracks you're planning to release or that you're struggling to get right
2. **Ask for specific feedback** - In the "Feedback Focus" field, say things like "Please check if the vocals sit right in the mix"
3. **Group stems logically** - Don't upload 20 stems. Group elements (all drums, all synths, etc.) for clarity
4. **Export at consistent quality** - All stems should be the same sample rate and bit depth
5. **Test before uploading** - Import your exported stems back into your DAW to verify they play back correctly

---

## Getting Help

If you run into issues uploading stems:
- Check the troubleshooting section above
- Contact support with the specific error message you're seeing
- Include track title and stem file names in your support request

Happy producing! 🎵
