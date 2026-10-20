from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.dependencies import Services, get_current_player, get_services
from app.domain.models import Player
from app.schemas.room import JoinIn, RoomOut, StartRoundIn, room_out
from app.schemas.round import RoundOut, round_out

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("", response_model=RoomOut, status_code=201)
def create_room(
    player: Annotated[Player, Depends(get_current_player)],
    services: Annotated[Services, Depends(get_services)],
) -> RoomOut:
    return room_out(services.room.create(player))


@router.post("/join", response_model=RoomOut)
def join_room(
    payload: JoinIn,
    player: Annotated[Player, Depends(get_current_player)],
    services: Annotated[Services, Depends(get_services)],
) -> RoomOut:
    return room_out(services.room.join(player, payload.code))


@router.get("/{room_id}", response_model=RoomOut)
def get_room(
    room_id: UUID,
    player: Annotated[Player, Depends(get_current_player)],
    services: Annotated[Services, Depends(get_services)],
) -> RoomOut:
    return room_out(services.room.get(player, room_id))


@router.delete("/{room_id}/membership", status_code=204)
def leave_room(
    room_id: UUID,
    player: Annotated[Player, Depends(get_current_player)],
    services: Annotated[Services, Depends(get_services)],
) -> None:
    services.room.leave(player, room_id)


@router.post("/{room_id}/rounds", response_model=RoundOut, status_code=201)
def start_round(
    room_id: UUID,
    player: Annotated[Player, Depends(get_current_player)],
    services: Annotated[Services, Depends(get_services)],
    payload: StartRoundIn | None = None,
) -> RoundOut:
    loop_id = None if payload is None else payload.loop_id
    return round_out(services.round.start(player, room_id, loop_id))
