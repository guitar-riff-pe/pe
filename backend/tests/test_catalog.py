import pytest

from app.domain.catalog import LOOPS, default_loop, parse_loops


def test_catalog_exposes_public_drum_urls() -> None:
    assert default_loop().id == "blast-155-8"
    assert default_loop().url == "/sounds/drums/blast-155-8.wav"
    assert {item.bars for item in LOOPS} == {4, 6, 8, 16}
    assert len({item.id for item in LOOPS}) == len(LOOPS)


def test_catalog_rejects_a_duplicate_or_unsafe_file() -> None:
    with pytest.raises(ValueError, match="уже есть"):
        parse_loops(
            {
                "loops": [
                    _loop("same"),
                    _loop("same"),
                ]
            }
        )
    with pytest.raises(ValueError, match="без папок"):
        parse_loops({"loops": [_loop("safe", file="../secret.wav")]})


def _loop(loop_id: str, file: str = "groove-140-4.wav") -> dict[str, object]:
    return {
        "id": loop_id,
        "title": "Бой",
        "bpm": 140,
        "bars": 4,
        "file": file,
    }
