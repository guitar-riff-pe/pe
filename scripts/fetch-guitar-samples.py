"""Vendor wavebase Parker Fly WAVs, verifying their Git LFS object hashes."""

import concurrent.futures
import hashlib
import io
import json
import re
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "frontend/public/sounds/wavebase-guitar"
REPOSITORY = "https://github.com/cluesurf/wavebase"
COMMIT = "0c7183fd66fb68e5343d37f2eeebdf40cc7c570e"
PITCH_CLASSES = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def fetch(url):
    request = urllib.request.Request(
        url, headers={"User-Agent": "pe-wavebase-guitar/1.0"}
    )
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read()


def main():
    DESTINATION.mkdir(parents=True, exist_ok=True)
    manifest_file = DESTINATION / "manifest.json"
    previous = (
        json.loads(manifest_file.read_text("utf-8")) if manifest_file.exists() else None
    )
    commit = previous["commit"] if previous else COMMIT
    base = f"https://raw.githubusercontent.com/cluesurf/wavebase/{commit}"
    tree = json.loads(
        fetch(
            f"https://api.github.com/repos/cluesurf/wavebase/git/trees/{commit}?recursive=1"
        )
    )
    candidates = {}
    pattern = re.compile(
        r"base/guitar/parker-fly/string-(\d)/string-\d-note-([A-G])(x?)(\d)-fret-(\d+)-1\.wav$"
    )
    for entry in tree["tree"]:
        match = pattern.fullmatch(entry["path"])
        if not match:
            continue
        string, letter, sharp, octave, fret = match.groups()
        midi = (int(octave) + 1) * 12 + PITCH_CLASSES[letter] + bool(sharp)
        if midi < 40 or midi > 88:
            continue
        item = {
            "path": entry["path"],
            "fret": int(fret),
            "string": int(string),
            "note": f"{letter}{'#' if sharp else ''}{octave}",
        }
        if midi not in candidates or item["fret"] < candidates[midi]["fret"]:
            candidates[midi] = item
    if set(candidates) != set(range(40, 89)):
        raise ValueError("Wavebase does not cover every E2–E6 pitch")

    def sample(item):
        midi, info = item
        pointer = fetch(f"{base}/{info['path']}").decode("ascii")
        expected = re.search(r"oid sha256:([a-f0-9]{64})", pointer).group(1)
        size = int(re.search(r"^size (\d+)$", pointer, re.MULTILINE).group(1))
        filename = f"{midi}.wav"
        target = DESTINATION / filename
        data = target.read_bytes() if target.exists() else b""
        if hashlib.sha256(data).hexdigest() != expected:
            data = fetch(
                f"https://media.githubusercontent.com/media/cluesurf/wavebase/{commit}/{info['path']}"
            )
        digest = hashlib.sha256(data).hexdigest()
        if (
            digest != expected
            or len(data) != size
            or data[:4] != b"RIFF"
            or data[8:12] != b"WAVE"
        ):
            raise ValueError(f"{filename}: invalid WAV or Git LFS hash mismatch")
        with wave.open(io.BytesIO(data), "rb") as audio:
            metadata = {
                "channels": audio.getnchannels(),
                "sampleRate": audio.getframerate(),
                "sampleWidth": audio.getsampwidth(),
                "frames": audio.getnframes(),
                "duration": audio.getnframes() / audio.getframerate(),
            }
        target.write_bytes(data)
        print(f"{info['note']}: {len(data)} bytes", flush=True)
        return info["note"], {
            "midi": midi,
            "file": filename,
            "source": info["path"],
            "take": 1,
            "bytes": len(data),
            "sha256": digest,
            "lfsOid": expected,
            **metadata,
        }

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        samples = dict(pool.map(sample, sorted(candidates.items())))
    (DESTINATION / "UPSTREAM-README.md").write_bytes(fetch(f"{base}/readme.md"))
    (DESTINATION / "ATTRIBUTION.txt").write_text(
        f"Parker Fly electric guitar recordings — ClueSurf / wavebase\n\n"
        f"Source: {REPOSITORY}\nPinned revision: {commit}\n"
        "Upstream declares sound files Public Domain (see UPSTREAM-README.md, License section).\n"
        "This is the upstream public-domain declaration, not a claim of a separate CC0 license.\n"
        "49 unmodified WAVs cover MIDI 40–88 (E2–E6). First take per note; the lowest\n"
        "available fret is chosen where several strings record the same pitch.\n"
        "Only local filenames are changed. Git LFS content hashes are preserved in manifest.json.\n"
        "Playback applies volume and short attack/release envelopes.\n",
        encoding="utf-8",
    )
    manifest_file.write_text(
        json.dumps(
            {
                "instrument": "guitar/parker-fly",
                "repository": REPOSITORY,
                "commit": commit,
                "license": "Public Domain",
                "licenseSource": f"{REPOSITORY}/blob/{commit}/readme.md#license",
                "modified": False,
                "samples": samples,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(
        f"Verified {len(samples)} original WAVs, {sum(s['bytes'] for s in samples.values())} bytes, commit {commit}"
    )


if __name__ == "__main__":
    main()
