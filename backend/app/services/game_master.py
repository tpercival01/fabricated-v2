import json
from openai import OpenAI
from app.config import get_settings

settings = get_settings()

client = OpenAI(
    api_key=settings.groq_api_key,
    base_url=settings.groq_base_url,
)


def build_system_prompt(session: dict) -> str:
    case = session["case"]
    core = case.core_truth
    suspects = case.suspects
    clues = case.clues

    mystery_json = {
        "victim": {
            "name": core.victim_name,
            "cause_of_death": core.cause_of_death,
            "time_of_death": core.time_of_death,
            "location_of_death": core.location_of_death,
            "background": core.victim_background,
        },
        "killer": {
            "name": core.killer_name,
            "motive": core.killer_motive,
            "means": core.killer_means,
            "opportunity": core.killer_opportunity,
            "alibi": core.killer_alibi,
            "alibi_flaw": core.killer_alibi_flaw,
        },
        "suspects": [
            {
                "id": s.id,
                "name": s.name,
                "role": s.role,
                "motive": s.motive,
                "alibi": s.alibi,
                "alibi_flaw": s.alibi_flaw,
                "secret": s.secret,
                "is_killer": s.is_killer,
            }
            for s in suspects
        ],
        "clues": [
            {
                "id": c.id,
                "description": c.description,
                "implicates": c.implicates_suspect_id,
                "is_red_herring": c.is_red_herring,
            }
            for c in clues
        ],
    }

    return f"""
        You are the Game Master — an omniscient narrator overseeing a murder mystery set in {session['theme']}.
        You have witnessed everything that happened. You are not a suspect. You are a neutral, authoritative figure.

        THE COMPLETE MYSTERY (your source of truth — never deviate from this):
        {json.dumps(mystery_json, indent=2)}

        YOUR RULES:
        1. You may only state facts that are in the mystery JSON above. Never invent new facts.
        2. Never directly confirm or deny who the killer is.
        3. Never reveal alibi_flaw directly — players must deduce it from clues.
        4. Never reveal is_killer or alibi_flaw unprompted.
        5. Stay in character for the setting: {session['theme']}.
        6. Players will ask about suspects by name — answer about that suspect specifically.
        7. If asked something outside the mystery, deflect: "I'm afraid I cannot speak to matters outside what I witnessed directly."
        8. Keep responses concise — 2-4 sentences maximum.
        9. You must stay consistent with all previous answers in this session.
        10. If you have already answered a question about the same suspect or fact, your answer must not contradict it.

        IMPORTANT: You are an observer and narrator. Never answer as if you are one of the suspects.
        Refer to suspects in the third person: "James Parker was seen..." not "I was in the kitchen..."
    """


def ask_game_master(session: dict, question: str, asking_player: dict) -> str:
    # Build interaction history for context
    history = session.get("gm_history", [])

    for entry in history:
        if entry["question"].strip().lower() == question.strip().lower():
            return entry["answer"]

    messages = [
        {"role": "system", "content": build_system_prompt(session)},
    ]

    # Add previous interactions as context
    for interaction in history:
        messages.append({"role": "user", "content": interaction["question"]})
        messages.append({"role": "assistant", "content": interaction["answer"]})

    # Add current question
    messages.append({
        "role": "user",
        "content": f"{asking_player['display_name']} asks: {question}"
    })

    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=messages,
        temperature=0.7,
    )

    answer = response.choices[0].message.content.strip()

    # Store in history
    if "gm_history" not in session:
        session["gm_history"] = []

    session["gm_history"].append({
        "round": session["current_round"],
        "player_id": asking_player["id"],
        "player_name": asking_player["display_name"],
        "question": question,
        "answer": answer,
    })

    return answer