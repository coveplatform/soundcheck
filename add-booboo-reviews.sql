-- First, get the track ID and reviewer IDs
-- Run this to verify before inserting:
-- SELECT id, title FROM "Track" WHERE title LIKE '%Think Of Me%';

-- Insert reviews for BooBooBeaar track
-- Replace TRACK_ID_HERE with the actual track ID from above query
-- Replace REVIEWER_IDs with the reviewer profile IDs

INSERT INTO "Review" (
  id, "trackId", "reviewerId", status, 
  "firstImpression", "wouldListenAgain",
  "productionScore", "vocalScore", "originalityScore",
  "qualityLevel", "nextFocus", "playlistAction",
  "lowEndClarity", "vocalClarity", "highEndQuality", "stereoWidth", "dynamics", "trackLength",
  "quickWin", "biggestWeaknessSpecific", "bestPart", "weakestPart",
  "listenDuration", "countsTowardCompletion", "countsTowardAnalytics",
  "createdAt", "updatedAt"
) VALUES
-- Review 1: Marcus Chen - RELEASE_READY
(gen_random_uuid(), 'TRACK_ID_HERE', 'MARCUS_REVIEWER_ID', 'COMPLETED',
 'STRONG_HOOK', true,
 4, 4, 4,
 'RELEASE_READY', 'MIXING', 'LET_PLAY',
 'BOTH_MUDDY', 'CRYSTAL_CLEAR', 'PERFECT', 'TOO_NARROW', 'GREAT_DYNAMICS', 'PERFECT',
 'Widen the stereo field by panning your doubled vocals left and right instead of keeping everything centered. The atmosphere you''ve built deserves more space.',
 'The low end gets a bit cluttered around 100-200Hz where the bass and acoustic guitar are sitting on top of each other. A gentle EQ cut on the guitar in that range would let the bass anchor the track better and clear up the mix.',
 'The vocal delivery in the quieter sections has this haunting, almost whispered quality that totally nails the mood you''re going for. It draws you in and creates real tension. That restraint is way more powerful than if you were belting—it fits the vibe perfectly.',
 'The low end gets a bit cluttered around 100-200Hz where the bass and acoustic guitar are sitting on top of each other. A gentle EQ cut on the guitar in that range would let the bass anchor the track better and clear up the mix.',
 120, true, true,
 NOW(), NOW()),

-- Review 2: Sarah Thompson - ALMOST_THERE
(gen_random_uuid(), 'TRACK_ID_HERE', 'SARAH_REVIEWER_ID', 'COMPLETED',
 'STRONG_HOOK', true,
 3, 4, 4,
 'ALMOST_THERE', 'ARRANGEMENT', 'LET_PLAY',
 'PERFECT', 'CRYSTAL_CLEAR', 'PERFECT', 'TOO_NARROW', 'GREAT_DYNAMICS', 'PERFECT',
 'Pan that gentle percussion slightly off-center to create more width in the stereo field. Even just 20-30% left or right would open things up nicely.',
 'The track stays in one dynamic lane for too long. The atmosphere is great, but adding more contrast—maybe pulling back the instrumentation in a verse or letting the percussion drop out for 8 bars—would make the fuller sections hit harder emotionally. Right now it''s all moody plateau when it could ebb and flow.',
 'The way the percussion sits so far back in the mix, almost like a heartbeat you can barely hear—that''s a really smart production choice. It adds movement without breaking the spell of the atmosphere. Shows you understand that less is more for this kind of vibe.',
 'The track stays in one dynamic lane for too long. The atmosphere is great, but adding more contrast—maybe pulling back the instrumentation in a verse or letting the percussion drop out for 8 bars—would make the fuller sections hit harder emotionally. Right now it''s all moody plateau when it could ebb and flow.',
 120, true, true,
 NOW(), NOW()),

-- Review 3: Alex Kim - RELEASE_READY
(gen_random_uuid(), 'TRACK_ID_HERE', 'ALEX_REVIEWER_ID', 'COMPLETED',
 'STRONG_HOOK', true,
 4, 4, 5,
 'RELEASE_READY', 'ARRANGEMENT', 'ADD_TO_LIBRARY',
 'PERFECT', 'CRYSTAL_CLEAR', 'PERFECT', 'GOOD_BALANCE', 'GREAT_DYNAMICS', 'PERFECT',
 'Add a subtle high-pass filter to the reverb return around 200Hz. It''ll keep that lush atmosphere without letting the low-mid frequencies get cloudy and boomy.',
 'The outro lingers a bit too long without enough development. Either bring in a new element in the last 15-20 seconds or fade it earlier—right now it loses some of the tension and mystery you built up. End while they still want more.',
 'When the vocals come in over that sparse arrangement with just the fingerpicking and distant percussion, it''s genuinely chilling. The space between the notes creates this foreboding atmosphere that feels intentional and mature. You''re not overproducing it, and that''s exactly right for what you''re doing. This moment alone could make someone stop scrolling.',
 'The outro lingers a bit too long without enough development. Either bring in a new element in the last 15-20 seconds or fade it earlier—right now it loses some of the tension and mystery you built up. End while they still want more.',
 120, true, true,
 NOW(), NOW());

-- Update track completion count
-- UPDATE "Track" SET "reviewsCompleted" = "reviewsCompleted" + 3 WHERE id = 'TRACK_ID_HERE';
