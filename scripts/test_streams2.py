#!/usr/bin/env python3
"""Test remaining UH streams."""
import urllib.request
import socket

urls = [
    ("UH Centennial E-Cullen 2", "https://webcams.uh.edu/stream/centennial-e-2"),
    ("UH Centennial MSM", "https://webcams.uh.edu/stream/centennial-msm"),
    ("UH Centennial PGH", "https://webcams.uh.edu/stream/centennial-pgh"),
    ("UH Freshman Housing", "https://webcams.uh.edu/stream/fresh-hou-cph"),
]

socket.setdefaulttimeout(8)

for name, url in urls:
    try:
        req = urllib.request.Request(url)
        req.add_header("User-Agent", "Mozilla/5.0")
        resp = urllib.request.urlopen(req, timeout=8)
        ct = resp.headers.get("Content-Type", "unknown")
        data = resp.read(100)
        resp.close()
        print(f"OK    {name}: {ct} (read {len(data)} bytes)")
    except urllib.error.HTTPError as e:
        ct = e.headers.get("Content-Type", "unknown")
        print(f"HTTP   {name}: {e.code} - {ct}")
    except Exception as e:
        print(f"ERROR  {name}: {e}")
