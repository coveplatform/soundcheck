#!/usr/bin/env python3
"""
Ableton Render Worker

This script watches for pending Ableton project renders,
downloads them, renders stems using Ableton Live,
and uploads the results back to the app.
"""

import os
import sys
import time
import zipfile
import shutil
import requests
import json
from pathlib import Path
from typing import List, Dict, Optional

# Configuration
API_URL = os.getenv("API_URL", "http://localhost:3000")
WORKER_API_KEY = os.getenv("WORKER_API_KEY", "dev-worker-key")
WORK_DIR = Path(__file__).parent / "worker_temp"
POLL_INTERVAL = 10  # seconds

# Ensure work directory exists
WORK_DIR.mkdir(exist_ok=True)


def log(message: str):
    """Print timestamped log message"""
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}")


def get_pending_renders() -> List[Dict]:
    """Fetch pending renders from API"""
    try:
        response = requests.get(
            f"{API_URL}/api/worker/pending-renders",
            headers={"Authorization": f"Bearer {WORKER_API_KEY}"},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("tracks", [])
    except Exception as e:
        log(f"Error fetching pending renders: {e}")
        return []


def download_project(track_id: str, project_url: str) -> Optional[Path]:
    """Download Ableton project ZIP"""
    try:
        # Handle both absolute URLs and relative paths
        if project_url.startswith("http"):
            url = project_url
        else:
            url = f"{API_URL}{project_url}"

        log(f"Downloading project from {url}")

        response = requests.get(url, timeout=60)
        response.raise_for_status()

        # Save ZIP
        zip_path = WORK_DIR / f"{track_id}.zip"
        zip_path.write_bytes(response.content)

        log(f"Downloaded {len(response.content)} bytes to {zip_path}")
        return zip_path
    except Exception as e:
        log(f"Error downloading project: {e}")
        return None


def extract_project(zip_path: Path) -> Optional[Path]:
    """Extract Ableton project ZIP"""
    try:
        extract_dir = zip_path.parent / zip_path.stem
        extract_dir.mkdir(exist_ok=True)

        log(f"Extracting {zip_path} to {extract_dir}")

        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(extract_dir)

        # Find .als file
        als_files = list(extract_dir.rglob("*.als"))
        if not als_files:
            log(f"No .als file found in {extract_dir}")
            return None

        als_path = als_files[0]
        log(f"Found project file: {als_path}")
        return als_path
    except Exception as e:
        log(f"Error extracting project: {e}")
        return None


def find_ableton_executable() -> Optional[Path]:
    """Find Ableton Live executable on Windows"""
    # Common installation paths
    common_paths = [
        r"C:\ProgramData\Ableton",
        r"C:\Program Files\Ableton",
    ]

    for base_path in common_paths:
        base = Path(base_path)
        if base.exists():
            # Look for Ableton Live executables
            for exe in base.rglob("Ableton Live *.exe"):
                if "Program" in str(exe.parent):
                    log(f"Found Ableton at: {exe}")
                    return exe

    log("Could not find Ableton Live executable")
    return None


def render_stems_with_ableton(
    als_path: Path, output_dir: Path
) -> Optional[List[Path]]:
    """
    Render stems using Ableton Live (Windows automation)
    """
    try:
        import subprocess
        from pywinauto import Desktop
        from pywinauto.keyboard import send_keys

        output_dir.mkdir(exist_ok=True)

        log(f"Rendering stems from {als_path}")
        log(f"Output directory: {output_dir}")

        # Find Ableton executable
        ableton_exe = find_ableton_executable()
        if not ableton_exe:
            log("ERROR: Ableton Live not found. Please check installation.")
            return None

        # Launch Ableton with the project file
        log(f"Launching Ableton Live...")
        process = subprocess.Popen([str(ableton_exe), str(als_path)])

        # Wait for Ableton window to appear
        log("Waiting for Ableton to start (30s max)...")
        time.sleep(5)  # Initial wait

        # Find Ableton window
        desktop = Desktop(backend="uia")
        ableton_window = None

        for attempt in range(25):  # Try for 25 seconds
            try:
                windows = desktop.windows()
                for win in windows:
                    title = win.window_text()
                    if "Ableton Live" in title and "Untitled" in title or als_path.stem in title:
                        ableton_window = win
                        log(f"Found Ableton window: {title}")
                        break

                if ableton_window:
                    break

                time.sleep(1)
            except:
                time.sleep(1)

        if not ableton_window:
            log("ERROR: Could not find Ableton window")
            process.kill()
            return None

        # Make sure window is active
        try:
            ableton_window.set_focus()
        except:
            pass

        time.sleep(2)  # Wait for project to load

        log("Opening Export Audio/Video dialog...")

        # Use keyboard shortcut: Ctrl+Shift+R (Export Audio/Video)
        send_keys("^+r")
        time.sleep(2)

        # Export dialog should now be open
        # Tab through to "All Individual Tracks" option
        log("Selecting 'All Individual Tracks'...")

        # Press Tab to navigate, then arrow keys to select
        for _ in range(3):
            send_keys("{TAB}")
            time.sleep(0.2)

        send_keys("{DOWN}")  # Select "All Individual Tracks"
        time.sleep(0.5)

        # Navigate to output path
        log("Setting output path...")
        for _ in range(5):
            send_keys("{TAB}")
            time.sleep(0.2)

        # Clear existing path and type new one
        send_keys("^a")  # Select all
        time.sleep(0.2)
        send_keys(str(output_dir))  # Type output path
        time.sleep(0.5)

        # Navigate to Export button and click
        log("Starting export...")
        for _ in range(8):
            send_keys("{TAB}")
            time.sleep(0.2)

        send_keys("{ENTER}")  # Click Export

        # Wait for export to complete
        log("Export started. Waiting for completion (checking for WAV files)...")

        max_wait = 300  # 5 minutes max
        start_time = time.time()

        while (time.time() - start_time) < max_wait:
            # Check if WAV files exist
            wav_files = list(output_dir.glob("*.wav"))

            if wav_files:
                # Wait a bit more to ensure all files are written
                time.sleep(5)

                # Check if file size is stable (export complete)
                initial_sizes = {f: f.stat().st_size for f in wav_files}
                time.sleep(3)
                final_sizes = {f: f.stat().st_size for f in wav_files if f.exists()}

                if initial_sizes == final_sizes:
                    log(f"Export complete! Found {len(wav_files)} stem files")

                    # Close Ableton
                    log("Closing Ableton...")
                    try:
                        process.terminate()
                        process.wait(timeout=10)
                    except:
                        process.kill()

                    return wav_files

            time.sleep(2)

        log("ERROR: Export timeout (5 minutes)")
        try:
            process.terminate()
        except:
            process.kill()

        return None

    except ImportError as e:
        log(f"ERROR: Missing required library: {e}")
        log("Run: pip install pywinauto pywin32")
        return None
    except Exception as e:
        log(f"Error rendering stems: {e}")
        import traceback
        traceback.print_exc()
        return None


def upload_stems_to_api(
    track_id: str, stem_files: List[Path], master_file: Optional[Path]
) -> bool:
    """Upload rendered stems to API"""
    try:
        # In a real implementation, you'd upload files to storage first
        # For now, we'll assume stems are accessible via the app's public folder

        stems_data = []
        for i, stem_file in enumerate(stem_files):
            # Detect stem type from filename
            filename_lower = stem_file.name.lower()
            if "drum" in filename_lower:
                stem_type = "DRUMS"
            elif "bass" in filename_lower:
                stem_type = "BASS"
            elif "vocal" in filename_lower:
                stem_type = "VOCALS"
            elif "melody" in filename_lower or "lead" in filename_lower:
                stem_type = "MELODY"
            elif "pad" in filename_lower or "chord" in filename_lower:
                stem_type = "HARMONY"
            elif "fx" in filename_lower or "effect" in filename_lower:
                stem_type = "EFFECTS"
            elif "master" in filename_lower:
                stem_type = "MASTER"
            else:
                stem_type = "OTHER"

            stems_data.append(
                {
                    "stemUrl": f"/generated-stems/{track_id}/{stem_file.name}",
                    "stemType": stem_type,
                    "label": stem_file.stem,
                    "order": i,
                }
            )

        payload = {"stems": stems_data}

        if master_file:
            payload["masterUrl"] = f"/generated-stems/{track_id}/{master_file.name}"

        log(f"Uploading {len(stems_data)} stems to API")

        response = requests.post(
            f"{API_URL}/api/worker/tracks/{track_id}/complete",
            headers={
                "Authorization": f"Bearer {WORKER_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=30,
        )
        response.raise_for_status()

        log(f"✓ Successfully uploaded stems for track {track_id}")
        return True
    except Exception as e:
        log(f"Error uploading stems: {e}")
        return False


def process_track(track: Dict) -> bool:
    """Process a single track render"""
    track_id = track["id"]
    project_url = track["abletonProjectUrl"]

    log(f"Processing track {track_id}: {track['title']}")

    # Download project
    zip_path = download_project(track_id, project_url)
    if not zip_path:
        return False

    # Extract project
    als_path = extract_project(zip_path)
    if not als_path:
        return False

    # Render stems
    output_dir = WORK_DIR / f"{track_id}_output"
    stem_files = render_stems_with_ableton(als_path, output_dir)

    if stem_files is None:
        log(f"⚠️  Skipping track {track_id} - Ableton rendering not configured")
        return False

    if not stem_files:
        log(f"No stems rendered for track {track_id}")
        return False

    # Find master file
    master_file = next(
        (f for f in stem_files if "master" in f.name.lower()), None
    )

    # Upload results
    success = upload_stems_to_api(track_id, stem_files, master_file)

    # Cleanup
    try:
        if zip_path.exists():
            zip_path.unlink()
        if als_path.parent != WORK_DIR:
            shutil.rmtree(als_path.parent, ignore_errors=True)
        if output_dir.exists():
            shutil.rmtree(output_dir, ignore_errors=True)
    except Exception as e:
        log(f"Error during cleanup: {e}")

    return success


def main():
    """Main worker loop"""
    log("🎵 Ableton Render Worker started")
    log(f"API URL: {API_URL}")
    log(f"Work directory: {WORK_DIR}")
    log(f"Poll interval: {POLL_INTERVAL}s")
    log("")
    log("⚠️  NOTE: Ableton automation is not yet configured!")
    log("This worker will poll for renders but won't process them until configured.")
    log("See scripts/WORKER-SETUP.md for setup instructions.")
    log("")

    while True:
        try:
            # Get pending renders
            pending = get_pending_renders()

            if pending:
                log(f"Found {len(pending)} pending render(s)")

                for track in pending:
                    process_track(track)
            else:
                log("No pending renders")

            # Wait before next poll
            time.sleep(POLL_INTERVAL)

        except KeyboardInterrupt:
            log("Worker stopped by user")
            break
        except Exception as e:
            log(f"Unexpected error in main loop: {e}")
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
