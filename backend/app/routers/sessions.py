from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.generator import generate_new_case
from app.services.session_store import create_session, get_session_by_id, get_session_by_code, add_player, start_session, advance_round, submit_accusation
from app.services.session_store import create_session, get_session_by_id, get_session_by_code, add_player, start_session, advance_round, submit_accusation, debug_print_session

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.get("/{session_id}/debug")
def debug_session(session_id: str):
    session = get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    return {
        "session_id": session["id"],
        "room_code": session["room_code"],
        "status": session["status"],
        "players": [
            {
                "display_name": p["display_name"],
                "join_token": p["join_token"],
                "suspect_id": p["suspect_id"],
                "accused": p["accusation"] is not None,
            }
            for p in session["players"]
        ]
    }

class CreateSessionRequest(BaseModel):
    theme: str
    difficulty: str
    player_count: int


class CreateSessionResponse(BaseModel):
    session_id: str
    room_code: str
    theme: str
    difficulty: str
    player_count: int
    status: str

VALID_THEMES = [
    "1920s Mansion",
    "Modern City",
    "Gothic Castle",
    "Space Station",
    "Fairy Tale Village",
]

@router.post("/", response_model=CreateSessionResponse)
def create_new_session(request: CreateSessionRequest):
    if request.theme not in VALID_THEMES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid theme. Must be one of: {VALID_THEMES}"
        )
    case = generate_new_case(request.theme, request.difficulty, request.player_count)
    if not case:
        raise HTTPException(status_code=500, detail="Failed to generate mystery. Please try again.")

    session = create_session(request.theme, request.difficulty, request.player_count, case)

    return CreateSessionResponse(
        session_id=session["id"],
        room_code=session["room_code"],
        theme=session["theme"],
        difficulty=session["difficulty"],
        player_count=session["player_count"],
        status=session["status"],
    )


@router.get("/{session_id}")
def get_session(session_id: str):
    session = get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    return {
        "session_id": session["id"],
        "room_code": session["room_code"],
        "status": session["status"],
        "theme": session["theme"],
        "difficulty": session["difficulty"],
        "player_count": session["player_count"],
        "current_round": session["current_round"],
        "player_count_joined": len(session["players"]),
    }


@router.get("/join/{room_code}")
def get_session_by_room_code(room_code: str):
    session = get_session_by_code(room_code)
    if not session:
        raise HTTPException(status_code=404, detail="Room not found. Check the code and try again.")

    return {
        "session_id": session["id"],
        "room_code": session["room_code"],
        "status": session["status"],
        "theme": session["theme"],
        "player_count": session["player_count"],
        "player_count_joined": len(session["players"]),
    }

class JoinSessionRequest(BaseModel):
    display_name: str


@router.post("/join/{room_code}")
def join_session(room_code: str, request: JoinSessionRequest):
    try:
        result = add_player(room_code, request.display_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result:
        raise HTTPException(status_code=404, detail="Room not found. Check the code and try again.")

    return {
        "player_id": result["player"]["id"],
        "join_token": result["player"]["join_token"],
        "display_name": result["player"]["display_name"],
        "character_card": result["character_card"],
    }

@router.post("/{session_id}/start")
def start_game(session_id: str):
    try:
        result = start_session(session_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result:
        raise HTTPException(status_code=404, detail="Session not found.")

    return result

@router.post("/{session_id}/advance")
def advance_game_round(session_id: str):
    try:
        result = advance_round(session_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result:
        raise HTTPException(status_code=404, detail="Session not found.")

    return result

class AccusationRequest(BaseModel):
    join_token: str
    killer_id: str
    motive: str
    evidence_ids: list[str]


@router.post("/{session_id}/accuse")
def make_accusation(session_id: str, request: AccusationRequest):
    try:
        result = submit_accusation(
            session_id,
            request.join_token,
            request.killer_id,
            request.motive,
            request.evidence_ids,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result:
        raise HTTPException(status_code=404, detail="Session not found.")

    return result