# Ableton Render Worker Setup

This guide explains how to set up the local Ableton render worker for automatic stem rendering.

## Overview

When users upload Ableton projects (ZIP files), the worker:
1. Polls the API for pending renders
2. Downloads the project
3. Opens it in Ableton Live
4. Exports stems (all individual tracks)
5. Uploads stems back to the app

## Prerequisites

- Python 3.8+
- Ableton Live installed on your machine
- Ableton Live must be able to run in the background

## Quick Start

### 1. Install Python dependencies

```bash
cd scripts
pip install requests
```

### 2. Set environment variables (optional)

```bash
# API URL (defaults to http://localhost:3000)
export API_URL=http://localhost:3000

# Worker API key (defaults to "dev-worker-key")
export WORKER_API_KEY=dev-worker-key
```

### 3. Run the worker

```bash
python worker.py
```

The worker will start polling for pending renders every 10 seconds.

## ⚠️ Important: Ableton Automation Setup

The worker script **does not yet include Ableton automation**. You need to implement the `render_stems_with_ableton()` function based on your operating system and preferences.

### Option A: Manual Workflow (Simplest)

For now, you can manually export stems:

1. Run the worker - it will download and extract projects
2. When a render is pending, the worker logs the `.als` file path
3. Open that file in Ableton manually
4. File → Export Audio/Video → Export All Individual Tracks
5. Save to the output directory the worker specifies
6. The worker will detect the files and upload them

**Pros:** Works immediately, no automation setup needed
**Cons:** Requires manual intervention for each render

### Option B: AbletonOSC (Recommended for Mac)

[AbletonOSC](https://github.com/ideoforms/AbletonOSC) lets you control Ableton via OSC messages.

1. Install AbletonOSC Max for Live device
2. Install `pylive` Python library:
   ```bash
   pip install pylive
   ```
3. Update `render_stems_with_ableton()` to use AbletonOSC:
   ```python
   from pylive import Live

   live = Live()
   live.open_set(str(als_path))
   # Export logic here
   ```

**Pros:** Fully automated, reliable
**Cons:** Requires Max for Live (comes with Ableton Suite)

### Option C: Windows COM Automation

On Windows, you can use `pywinauto` to control Ableton's GUI:

```bash
pip install pywinauto
```

Example implementation:
```python
from pywinauto import Application

# Launch Ableton
app = Application().start(r"C:\ProgramData\Ableton\Live 11 Suite\Program\Ableton Live 11 Suite.exe")

# Wait for window
window = app.window(title_re=".*Ableton Live.*")

# Open file
window.menu_select("File->Open Set...")
# ... continue automation
```

**Pros:** No Max for Live required
**Cons:** Brittle, requires careful window detection

### Option D: macOS AppleScript

On macOS, use AppleScript to control Ableton:

```python
import subprocess

script = f'''
tell application "Ableton Live"
    open POSIX file "{als_path}"
    -- Export logic here
end tell
'''

subprocess.run(["osascript", "-e", script])
```

**Pros:** Native macOS automation
**Cons:** macOS only, limited Ableton scripting support

## Recommended Implementation Path

1. **Start with Option A (Manual)** - Get the full pipeline working with manual exports
2. **Upgrade to Option B (AbletonOSC)** - Automate if you have Max for Live
3. **OR use Option C/D** - If you don't have Max for Live

## File Upload

The current worker assumes rendered stems are saved to the app's `public/generated-stems/<trackId>/` directory.

In production, you'll want to:
1. Upload stem files to cloud storage (S3, Cloudinary, etc.)
2. Update stem URLs to point to those hosted files
3. Update the `upload_stems_to_api()` function accordingly

## Troubleshooting

### Worker can't connect to API
- Ensure your dev server is running on `http://localhost:3000`
- Check `API_URL` environment variable
- Verify `WORKER_API_KEY` matches `.env` file

### Can't download project files
- Check that projects are being saved to `public/ableton-projects/`
- Verify file permissions

### Ableton won't open projects
- Ensure Ableton Live is installed and licensed
- Check that the `.als` file is compatible with your Ableton version
- Try opening the file manually first

## Next Steps

1. Choose your automation approach (A, B, C, or D above)
2. Implement `render_stems_with_ableton()` function in `worker.py`
3. Test with a sample project upload
4. Monitor worker logs for errors

## Production Considerations

- Run worker as a system service (systemd, Docker, etc.)
- Set up error notifications (email, Slack, etc.)
- Add render queue prioritization
- Implement retry logic for failed renders
- Add render timeout limits
- Scale to multiple workers for parallel processing
