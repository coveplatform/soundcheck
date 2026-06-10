# Reddit Post Draft — Discover Feature

## Subreddit suggestions
- r/WeAreTheMusicMakers
- r/IndieMusic
- r/musicproduction
- r/webdev (for the tech/design angle)
- r/InternetIsBeautiful

---

## Option A: Music community angle (r/WeAreTheMusicMakers, r/IndieMusic)

**Title:** I built a 3D space where you can fly around and discover independent music

**Body:**

Been working on this for a while and finally shipped it. It's basically a 3D space filled with floating album art from independent artists. You drag to orbit around, scroll to zoom in and out, and click any cover to listen.

It's built with Three.js/React Three Fiber and each track card has these subtle neon edge glows and a breathing animation. There's something oddly satisfying about just drifting through it.

Right now there's about 30+ tracks in there across electronic, indie, lo-fi, dream pop, hip-hop — all from real independent artists. The idea is it refreshes weekly with new music.

You can check it out here: https://mixreflect.com/discover

It's part of a larger project I've been building — a platform where artists can get genuine feedback on their tracks from real listeners and reviewers. But the discover page is open to everyone, no account needed. Just fly around and listen.

Would love to hear what you think. The mobile experience is a bit different (swipe to explore, pinch to zoom) but it works. Desktop is where it really shines though.

---

## Option B: Tech/design angle (r/webdev, r/InternetIsBeautiful)

**Title:** Made an interactive 3D music discovery page — fly through floating album art in space

**Body:**

I've been building a music platform and wanted the discovery experience to feel different from the usual grid/list layout. So I made this:

https://mixreflect.com/discover

It's a 3D starfield with album covers floating at different depths. You orbit around with your mouse, scroll to zoom, and click any cover to listen to the track inline. Each card has a neon edge glow and a subtle breathing animation.

Stack: Next.js, React Three Fiber, Three.js, Tailwind. The cards are billboard sprites with dynamically loaded artwork textures, positioned in a fibonacci sphere distribution so they spread evenly. OrbitControls handles camera movement with auto-rotate.

Some details I'm proud of:
- Cards have a soft glow halo behind them that pulses
- Stats bar updates to show per-track plays/reviews when you hover
- Featured tracks get a gold glow
- Vignette + corner decorations for that "command center" feel
- Works on mobile with touch gestures (swipe to rotate, pinch to zoom)

It's part of a music feedback platform I've been working on, but the discover page is fully public — no login needed.

What do you think? Any suggestions for improving the visual experience?

---

## Option C: Short and punchy (any subreddit)

**Title:** I made a page where you fly through a 3D space of indie music

**Body:**

https://mixreflect.com/discover

Drag to orbit, scroll to zoom, click to listen. About 30 tracks from independent artists, refreshed weekly. No login needed.

Built it as part of a music project I've been working on. Just wanted to make discovering new music feel less like scrolling a feed and more like exploring something.
