from dataclasses import dataclass
from typing import Literal

# Метаданные каталога. Самих WAV в репозитории нет: файлы можно добавить
# только после проверки лицензии. Редактор каталога в MVP не входит.
LoopBars = Literal[4, 8]


@dataclass(frozen=True, slots=True)
class DrumLoop:
    id: str
    title: str
    bpm: int
    bars: LoopBars
    url: str


LOOPS: tuple[DrumLoop, ...] = (
    DrumLoop("groove-140-4", "Бой 140, 4 такта", 140, 4, "/sounds/drums/groove-140-4.wav"),
    DrumLoop("groove-120-8", "Бой 120, 8 тактов", 120, 8, "/sounds/drums/groove-120-8.wav"),
    DrumLoop("groove-100-4", "Бой 100, 4 такта", 100, 4, "/sounds/drums/groove-100-4.wav"),
    DrumLoop("groove-160-8", "Бой 160, 8 тактов", 160, 8, "/sounds/drums/groove-160-8.wav"),
)


def get_loop(loop_id: str) -> DrumLoop | None:
    return next((item for item in LOOPS if item.id == loop_id), None)


def default_loop() -> DrumLoop:
    return LOOPS[0]
