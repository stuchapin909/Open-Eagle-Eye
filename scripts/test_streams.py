#!/usr/bin/env python3
"""Test candidate MJPEG streams with GET and short read."""
import urllib.request
import socket

urls = [
    ("Purdue Engineering Mall", "http://webcam01.ecn.purdue.edu/mjpg/video.mjpg"),
    ("UH Centennial E-Cullen", "https://webcams.uh.edu/stream/centennial-e"),
]

socket.setdefaulttimeout(8)

for name, url in urls:
    try:
        req = urllib.request.Request(url)
        req.add_header("User-Agent", "Mozilla/5.0")
        resp = urllib.request.urlopen(req, timeout=8)
        ct = resp.headers.get("Content-Type", "unknown")
        # Read first 100 bytes to verify data flows
        data = resp.read(100)
        resp.close()
        print(f"OK    {name}: {ct} (read {len(data)} bytes)")
    except urllib.error.HTTPError as e:
        ct = e.headers.get("Content-Type", "unknown")
        print(f"HTTP   {name}: {e.code} - {ct}")
    except Exception as e:
        print(f"ERROR  {name}: {e}")
