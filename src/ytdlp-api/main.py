"""
yt-dlp API Wrapper
Simple HTTP API to control yt-dlp downloads with real-time progress via SSE.
"""

import asyncio
import json
import os
import re
import subprocess
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

app = FastAPI(title="yt-dlp API", version="1.0.0")

# In-memory storage for downloads
downloads: dict[str, dict] = {}

YOUTUBE_PATH = os.getenv("YOUTUBE_PATH", "/youtube")


class DownloadStatus(str, Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class DownloadRequest(BaseModel):
    url: str
    quality: str = "1080"
    format: str = "mp4"
    concurrent_fragments: int = 4
    sponsorblock: bool = True
    sponsorblock_action: str = "mark"  # "mark" or "remove"
    download_thumbnail: bool = True


class InfoRequest(BaseModel):
    url: str


def build_ytdlp_command(request: DownloadRequest, download_id: str) -> list[str]:
    """Build the yt-dlp command with all options."""
    cmd = [
        "yt-dlp",
        "--newline",
        "--progress-template", "PROGRESS:%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress.fragment_index)s/%(progress.fragment_count)s",
        f"--concurrent-fragments", str(request.concurrent_fragments),
        "--format-sort", f"res:{request.quality},+codec:avc:m4a",
        "--format", "bestvideo*+bestaudio/best",
        f"--remux-video", request.format,
        "--embed-metadata",
        "-o", f"{YOUTUBE_PATH}/%(uploader)s - %(title)s [%(id)s].%(ext)s",
    ]

    if request.download_thumbnail:
        cmd.extend([
            "--write-thumbnail",
            "--convert-thumbnail", "jpg",
            "-o", f"thumbnail:{YOUTUBE_PATH}/%(uploader)s - %(title)s [%(id)s]-thumb.%(ext)s",
            "--embed-thumbnail",
        ])

    if request.sponsorblock:
        if request.sponsorblock_action == "remove":
            cmd.extend([
                "--sponsorblock-remove", "sponsor,intro,outro,selfpromo,preview,filler,interaction"
            ])
        else:
            cmd.extend([
                "--sponsorblock-mark", "sponsor,intro,outro,selfpromo,preview,filler,interaction"
            ])

    cmd.append(request.url)
    return cmd


def parse_progress_line(line: str) -> Optional[dict]:
    """Parse yt-dlp progress output."""
    if line.startswith("PROGRESS:"):
        try:
            parts = line[9:].strip().split("|")
            if len(parts) >= 4:
                percent_str = parts[0].strip().replace("%", "")
                speed_str = parts[1].strip()
                eta_str = parts[2].strip()
                fragments_str = parts[3].strip()

                # Parse percent
                try:
                    percent = float(percent_str) if percent_str and percent_str != "N/A" else 0
                except ValueError:
                    percent = 0

                # Parse fragments
                fragment_index = 0
                fragment_count = 0
                if "/" in fragments_str:
                    try:
                        fi, fc = fragments_str.split("/")
                        fragment_index = int(fi) if fi and fi != "N/A" else 0
                        fragment_count = int(fc) if fc and fc != "N/A" else 0
                    except ValueError:
                        pass

                return {
                    "percent": percent,
                    "speed": speed_str if speed_str != "N/A" else None,
                    "eta": eta_str if eta_str != "N/A" else None,
                    "fragment_index": fragment_index,
                    "fragment_count": fragment_count,
                }
        except Exception:
            pass
    return None


def parse_info_from_output(output: str) -> dict:
    """Extract video info from yt-dlp output (title, uploader, etc)."""
    info = {}

    # Try to find the destination line
    dest_match = re.search(r'\[Merger\] Merging formats into "(.+)"', output)
    if not dest_match:
        dest_match = re.search(r'\[download\] Destination: (.+)', output)
    if not dest_match:
        dest_match = re.search(r'\[download\] (.+) has already been downloaded', output)

    if dest_match:
        filepath = dest_match.group(1)
        info["filepath"] = filepath

        # Parse filename: "Uploader - Title [ID].ext"
        filename = os.path.basename(filepath)
        match = re.match(r'^(.+?) - (.+?) \[([a-zA-Z0-9_-]+)\]\.(\w+)$', filename)
        if match:
            info["uploader"] = match.group(1)
            info["title"] = match.group(2)
            info["video_id"] = match.group(3)
            info["ext"] = match.group(4)

    return info


async def run_download(download_id: str, request: DownloadRequest):
    """Run yt-dlp download in background."""
    downloads[download_id]["status"] = DownloadStatus.DOWNLOADING
    downloads[download_id]["started_at"] = datetime.utcnow().isoformat()

    cmd = build_ytdlp_command(request, download_id)
    full_output = ""

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        downloads[download_id]["pid"] = process.pid

        async for line in process.stdout:
            line_str = line.decode("utf-8", errors="replace").strip()
            full_output += line_str + "\n"

            # Parse progress
            progress = parse_progress_line(line_str)
            if progress:
                downloads[download_id].update({
                    "percent": progress["percent"],
                    "speed": progress["speed"],
                    "eta": progress["eta"],
                    "fragment_index": progress["fragment_index"],
                    "fragment_count": progress["fragment_count"],
                })

        await process.wait()

        if process.returncode == 0:
            downloads[download_id]["status"] = DownloadStatus.COMPLETED
            downloads[download_id]["percent"] = 100

            # Extract video info from output
            info = parse_info_from_output(full_output)
            downloads[download_id]["result"] = info
        else:
            downloads[download_id]["status"] = DownloadStatus.FAILED
            downloads[download_id]["error"] = f"yt-dlp exited with code {process.returncode}"

    except asyncio.CancelledError:
        downloads[download_id]["status"] = DownloadStatus.CANCELLED
        downloads[download_id]["error"] = "Download cancelled"
    except Exception as e:
        downloads[download_id]["status"] = DownloadStatus.FAILED
        downloads[download_id]["error"] = str(e)
    finally:
        downloads[download_id]["completed_at"] = datetime.utcnow().isoformat()
        downloads[download_id]["pid"] = None


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/download")
async def start_download(request: DownloadRequest, background_tasks: BackgroundTasks):
    """Start a new download."""
    download_id = str(uuid.uuid4())[:12]

    downloads[download_id] = {
        "id": download_id,
        "url": request.url,
        "status": DownloadStatus.PENDING,
        "percent": 0,
        "speed": None,
        "eta": None,
        "fragment_index": 0,
        "fragment_count": 0,
        "error": None,
        "result": None,
        "pid": None,
        "created_at": datetime.utcnow().isoformat(),
        "started_at": None,
        "completed_at": None,
    }

    background_tasks.add_task(run_download, download_id, request)

    return {"id": download_id, "status": "pending"}


@app.get("/download/{download_id}")
async def get_download(download_id: str):
    """Get download status."""
    if download_id not in downloads:
        raise HTTPException(status_code=404, detail="Download not found")
    return downloads[download_id]


@app.delete("/download/{download_id}")
async def cancel_download(download_id: str):
    """Cancel a download."""
    if download_id not in downloads:
        raise HTTPException(status_code=404, detail="Download not found")

    download = downloads[download_id]

    if download["status"] in [DownloadStatus.COMPLETED, DownloadStatus.FAILED, DownloadStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Download already finished")

    # Kill the process if running
    if download["pid"]:
        try:
            os.kill(download["pid"], 9)
        except ProcessLookupError:
            pass

    download["status"] = DownloadStatus.CANCELLED
    download["error"] = "Cancelled by user"
    download["completed_at"] = datetime.utcnow().isoformat()

    return {"status": "cancelled"}


@app.get("/download/{download_id}/stream")
async def stream_progress(download_id: str):
    """SSE endpoint for real-time progress."""
    if download_id not in downloads:
        raise HTTPException(status_code=404, detail="Download not found")

    async def event_generator():
        last_data = None
        while True:
            download = downloads.get(download_id)
            if not download:
                break

            # Send update if changed
            current_data = json.dumps({
                "id": download["id"],
                "status": download["status"],
                "percent": download["percent"],
                "speed": download["speed"],
                "eta": download["eta"],
                "fragment_index": download["fragment_index"],
                "fragment_count": download["fragment_count"],
            })

            if current_data != last_data:
                yield {"event": "progress", "data": current_data}
                last_data = current_data

            # Stop if download finished
            if download["status"] in [DownloadStatus.COMPLETED, DownloadStatus.FAILED, DownloadStatus.CANCELLED]:
                yield {"event": "complete", "data": json.dumps(download)}
                break

            await asyncio.sleep(0.5)

    return EventSourceResponse(event_generator())


@app.post("/info")
async def get_info(request: InfoRequest):
    """Get video info without downloading."""
    cmd = [
        "yt-dlp",
        "--dump-json",
        "--no-download",
        request.url,
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            raise HTTPException(status_code=400, detail=f"Failed to get info: {result.stderr}")

        info = json.loads(result.stdout)
        return {
            "id": info.get("id"),
            "title": info.get("title"),
            "uploader": info.get("uploader"),
            "duration": info.get("duration"),
            "thumbnail": info.get("thumbnail"),
            "description": info.get("description"),
            "upload_date": info.get("upload_date"),
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Request timed out")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse video info")


@app.post("/update")
async def update_ytdlp():
    """Update yt-dlp to the latest version."""
    try:
        result = subprocess.run(["pip", "install", "--upgrade", "yt-dlp"], capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Update failed: {result.stderr}")

        # Get new version
        version_result = subprocess.run(["yt-dlp", "--version"], capture_output=True, text=True)
        return {"status": "updated", "version": version_result.stdout.strip()}
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Update timed out")
