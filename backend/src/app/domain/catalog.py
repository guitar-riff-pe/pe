import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

# WAV лежат в frontend/public/sounds/drums/.
# Новая запись: файл в эту папку и объект в grooves.json.
# Первый элемент списка — луп по умолчанию, если хост не передал loop_id.
LoopBars = Literal[4, 6, 8, 16]
_ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_FILE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]*\.wav$")
_CATALOG_PATH = Path(__file__).with_name("grooves.json")


@dataclass(frozen=True, slots=True)
class DrumLoop:
    id: str
    title: str
    bpm: int
    bars: LoopBars
    url: str


def parse_loops(payload: object) -> tuple[DrumLoop, ...]:
    if not isinstance(payload, dict) or not isinstance(payload.get("loops"), list):
        raise ValueError("В grooves.json нужен объект с массивом loops")
    loops: list[DrumLoop] = []
    seen_ids: set[str] = set()
    seen_files: set[str] = set()
    for index, item in enumerate(payload["loops"], start=1):
        loops.append(_parse_loop(item, index, seen_ids, seen_files))
    if not loops:
        raise ValueError("В grooves.json нет ни одного лупа")
    return tuple(loops)


def load_loops(path: Path | None = None) -> tuple[DrumLoop, ...]:
    catalog_path = _CATALOG_PATH if path is None else path
    return parse_loops(json.loads(catalog_path.read_text(encoding="utf-8")))


def _parse_loop(
    item: object,
    index: int,
    seen_ids: set[str],
    seen_files: set[str],
) -> DrumLoop:
    if not isinstance(item, dict):
        raise ValueError(f"Луп {index} в grooves.json должен быть объектом")
    loop_id = _text(item.get("id"), index, "id")
    title = _text(item.get("title"), index, "title")
    file_name = _text(item.get("file"), index, "file")
    bpm = item.get("bpm")
    bars = item.get("bars")
    if _ID.fullmatch(loop_id) is None:
        raise ValueError(f"Луп {index}: id должен быть вроде groove-140-4")
    if loop_id in seen_ids:
        raise ValueError(f"Луп {index}: id {loop_id} уже есть")
    if not 1 <= len(title) <= 80:
        raise ValueError(f"Луп {index}: название должно быть от 1 до 80 символов")
    if not isinstance(bpm, int) or isinstance(bpm, bool) or not 40 <= bpm <= 400:
        raise ValueError(f"Луп {index}: bpm должен быть целым числом от 40 до 400")
    if bars not in (4, 6, 8, 16):
        raise ValueError(f"Луп {index}: bars может быть только 4, 6, 8 или 16")
    if _FILE.fullmatch(file_name) is None or file_name != Path(file_name).name:
        raise ValueError(f"Луп {index}: file должен быть именем WAV без папок")
    if file_name in seen_files:
        raise ValueError(f"Луп {index}: файл {file_name} уже указан")
    seen_ids.add(loop_id)
    seen_files.add(file_name)
    return DrumLoop(loop_id, title, bpm, bars, f"/sounds/drums/{file_name}")


def _text(value: object, index: int, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Луп {index}: поле {field} должно быть строкой")
    return value.strip()


LOOPS = load_loops()


def get_loop(loop_id: str) -> DrumLoop | None:
    return next((item for item in LOOPS if item.id == loop_id), None)


def default_loop() -> DrumLoop:
    return LOOPS[0]
