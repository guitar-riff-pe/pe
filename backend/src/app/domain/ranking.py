from collections.abc import Mapping
from uuid import UUID


def rank_scores(counts: Mapping[UUID, int]) -> dict[UUID, int]:
    """Competition ranking: equal scores share a place, subsequent places skip."""
    ordered = sorted(counts.values(), reverse=True)
    places = {}
    for index, score in enumerate(ordered, start=1):
        places.setdefault(score, index)
    return {riff_id: places[score] for riff_id, score in counts.items()}
