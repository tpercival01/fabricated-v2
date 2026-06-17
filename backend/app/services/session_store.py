from app.models.mystery import MysteryCase
from datetime import datetime
import random
import string


_sessions: dict = {}


def generate_room_code() -> str:
    words = ["WOLF", "ROOK", "MIST", "VALE", "IRON", "DUSK", "CROW", "ASH"]
    word = random.choice(words)
    number = random.randint(1000, 9999)
    return f"{word}-{number}"


def create_session(theme: str, difficulty: str, player_count: int, case: MysteryCase) -> dict:
    session_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
    room_code = generate_room_code()

    session = {
        "id": session_id,
        "room_code": room_code,
        "status": "lobby",
        "theme": theme,
        "difficulty": difficulty,
        "player_count": player_count,
        "current_round": 1,
        "case": case,
        "players": [],
        "created_at": datetime.utcnow().isoformat(),
    }

    _sessions[session_id] = session
    _sessions[room_code] = session
    return session


def get_session_by_id(session_id: str) -> dict | None:
    return _sessions.get(session_id)


def get_session_by_code(room_code: str) -> dict | None:
    return _sessions.get(room_code.upper())

def add_player(room_code: str, display_name: str) -> dict | None:
    session = get_session_by_code(room_code)
    if not session:
        return None

    if session["status"] != "lobby":
        raise ValueError("Game has already started.")

    if len(session["players"]) >= session["player_count"]:
        raise ValueError("Room is full.")

    # Assign next available suspect
    suspect_index = len(session["players"])
    suspect = session["case"].suspects[suspect_index]

    import secrets
    join_token = secrets.token_urlsafe(16)

    player = {
        "id": ''.join(random.choices(string.ascii_lowercase + string.digits, k=8)),
        "display_name": display_name,
        "join_token": join_token,
        "suspect_id": suspect.id,
        "accusation": None,
        "joined_at": datetime.utcnow().isoformat(),
    }

    session["players"].append(player)

    return {
        "player": player,
        "character_card": {
            "suspect_id": suspect.id,
            "name": suspect.name,
            "role": suspect.role,
            "relationship_to_victim": suspect.relationship_to_victim,
            "motive": suspect.motive,
            "alibi": suspect.alibi,
            "secret": suspect.secret,
        }
    }

def start_session(session_id: str) -> dict | None:
    session = get_session_by_id(session_id)
    if not session:
        return None

    if session["status"] != "lobby":
        raise ValueError("Game has already started.")

    if len(session["players"]) < session["player_count"]:
        raise ValueError(f"Not enough players. Have {len(session['players'])}, need {session['player_count']}.")

    session["status"] = "active"

    public_suspects = [
        {
            "suspect_id": s.id,
            "name": s.name,
            "role": s.role,
            "relationship_to_victim": s.relationship_to_victim,
            "alibi": s.alibi,
        }
        for s in session["case"].suspects
    ]

    round_1_clues = [
        {
            "clue_id": c.id,
            "description": c.description,
        }
        for c in session["case"].clues
        if c.reveal_round == 1
    ]

    return {
        "session_id": session["id"],
        "room_code": session["room_code"],
        "status": session["status"],
        "current_round": session["current_round"],
        "suspects": public_suspects,
        "clues": round_1_clues,
        "victim": {
            "name": session["case"].core_truth.victim_name,
            "cause_of_death": session["case"].core_truth.cause_of_death,
            "time_of_death": session["case"].core_truth.time_of_death,
            "location_of_death": session["case"].core_truth.location_of_death,
        }
    }

def advance_round(session_id: str) -> dict | None:
    session = get_session_by_id(session_id)
    if not session:
        return None

    if session["status"] != "active":
        raise ValueError("Game is not active.")

    session["current_round"] += 1

    # Check if we've exceeded max rounds
    if session["current_round"] > 6:
        session["status"] = "complete"

    # Return clues that unlock this round
    new_clues = [
        {
            "clue_id": c.id,
            "description": c.description,
        }
        for c in session["case"].clues
        if c.reveal_round == session["current_round"]
    ]

    return {
        "session_id": session["id"],
        "room_code": session["room_code"],
        "status": session["status"],
        "current_round": session["current_round"],
        "new_clues": new_clues,
    }

def submit_accusation(session_id: str, join_token: str, killer_id: str, motive: str, evidence_ids: list[str]) -> dict | None:
    session = get_session_by_id(session_id)
    if not session:
        return None

    if session["status"] != "active":
        raise ValueError("Game is not active.")

    # Find player by join token
    player = next((p for p in session["players"] if p["join_token"] == join_token), None)
    if not player:
        raise ValueError("Invalid join token.")

    if player["accusation"] is not None:
        raise ValueError("You have already submitted an accusation.")

    # Check accusation is correct
    is_correct = killer_id == session["case"].core_truth.killer_name or \
                 any(s.id == killer_id and s.is_killer for s in session["case"].suspects)

    player["accusation"] = {
        "killer_id": killer_id,
        "motive": motive,
        "evidence_ids": evidence_ids,
        "is_correct": is_correct,
    }

    # Check if all players have accused
    all_accused = all(p["accusation"] is not None for p in session["players"])
    if all_accused:
        session["status"] = "complete"

    return {
        "player_id": player["id"],
        "accusation_recorded": True,
        "game_complete": session["status"] == "complete",
        "reveal": _build_reveal(session) if session["status"] == "complete" else None,
    }


def _build_reveal(session) -> dict:
    core = session["case"].core_truth
    killer_suspect = next(s for s in session["case"].suspects if s.is_killer)

    return {
        "killer": {
            "suspect_id": killer_suspect.id,
            "name": killer_suspect.name,
            "role": killer_suspect.role,
        },
        "motive": core.killer_motive,
        "means": core.killer_means,
        "opportunity": core.killer_opportunity,
        "alibi_flaw": core.killer_alibi_flaw,
        "solution_explanation": session["case"].solution_explanation,
        "scoreboard": [
            {
                "player_id": p["id"],
                "display_name": p["display_name"],
                "suspect_played": p["suspect_id"],
                "accused": p["accusation"]["killer_id"] if p["accusation"] else None,
                "correct": p["accusation"]["is_correct"] if p["accusation"] else False,
            }
            for p in session["players"]
        ]
    }

def debug_print_session(session_id: str):
    session = get_session_by_id(session_id)
    if not session:
        print("Session not found.")
        return

    print(f"\n{'='*50}")
    print(f"SESSION: {session['id']} | {session['room_code']} | {session['status']}")
    print(f"{'='*50}")
    print(f"PLAYERS:")
    for p in session["players"]:
        print(f"  {p['display_name']} | token: {p['join_token']} | suspect: {p['suspect_id']} | accused: {p['accusation']}")