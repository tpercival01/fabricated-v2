import json
import time
from pydantic import ValidationError
from openai import OpenAI

from app.config import get_settings
from app.models.mystery import CoreTruth, SuspectList, EvidenceBoard, MysteryCase

settings = get_settings()

client = OpenAI(
    api_key=settings.groq_api_key,
    base_url=settings.groq_base_url,
)

DIFFICULTY_RULES = {
    "easy": {
        "core_truth": "The killer's alibi flaw must be a glaring, obvious physical contradiction (e.g., claiming to be in the rain but being dry).",
        "suspects": "Innocent suspects should have basic, transparent motives. Their alibis should be simple and easy to verify.",
        "evidence": "Generate 4 to 5 clues. Make them highly obvious — direct physical evidence like dropped nametags or clear witness sightings.",
    },
    "standard": {
        "core_truth": "The alibi flaw must rely on timeline overlaps or circumstantial events. It should require basic deduction to spot.",
        "suspects": "Innocent suspects must have believable motives and solid alibis. At least one should look genuinely guilty on the surface.",
        "evidence": "Generate 6 to 7 clues. Rely on timelines, witness testimonies, and circumstantial motives.",
    },
    "brutal": {
        "core_truth": "The alibi flaw MUST be a complex temporal or spatial contradiction requiring cross-referencing two separate facts. No single-point failures.",
        "suspects": "At least two innocent suspects must look strongly guilty. Highly compelling red herrings throughout.",
        "evidence": "Generate 8 to 10 clues. Never create a single clue that destroys the killer's alibi — force players to combine two.",
    },
}

def generate_new_case(theme: str, difficulty: str, player_count: int) -> MysteryCase | None:
    if difficulty not in DIFFICULTY_RULES:
        raise ValueError(f"Invalid difficulty '{difficulty}'. Must be one of: {list(DIFFICULTY_RULES.keys())}")

    if not (4 <= player_count <= 8):
        raise ValueError(f"player_count must be between 4 and 8, got {player_count}")

    rules = DIFFICULTY_RULES[difficulty]

    core_truth_schema = json.dumps(CoreTruth.model_json_schema(), indent=2)
    suspect_schema = json.dumps(SuspectList.model_json_schema(), indent=2)
    evidence_schema = json.dumps(EvidenceBoard.model_json_schema(), indent=2)

    print(f"[Phase 1] Generating core truth | theme={theme} difficulty={difficulty} players={player_count}")
    core_truth = _phase1_core_truth(theme, difficulty, rules["core_truth"], core_truth_schema)
    if not core_truth:
        return None
    print("[Phase 1] Done.")

    print(f"[Phase 2] Generating {player_count} suspects...")
    suspects = _phase2_suspects(theme, difficulty, rules["suspects"], suspect_schema, core_truth, player_count)
    if not suspects:
        return None
    print("[Phase 2] Done.")

    print("[Phase 3] Generating evidence board...")
    evidence = _phase3_evidence(theme, difficulty, rules["evidence"], evidence_schema, core_truth, suspects)
    if not evidence:
        return None
    print("[Phase 3] Done.")

    return MysteryCase(
        core_truth=core_truth,
        suspects=suspects.suspects,
        clues=evidence.clues,
        solution_explanation=evidence.solution_explanation,
    )

def _phase1_core_truth(theme, difficulty, rules, schema):
    prompt = f"""
        You are an expert mystery writer and game designer.
        Generate the FOUNDATION of a murder mystery in JSON format.

        Theme: {theme}
        Difficulty: {difficulty}
        Difficulty Rules: {rules}

        RULES:
        1. Output ONLY valid JSON matching the schema. No markdown, no backticks.
        2. cause_of_death must be realistic. No sci-fi weapons or magic.
        3. killer_alibi_flaw is the most important field — it must be a specific, provable physical 
        or temporal contradiction. Vague flaws like "he was lying" are not acceptable.
        4. killer_name must be a proper name only — e.g. "Emily Wellington". Never append 
        descriptors, roles, or relationships to the name field.

        SCHEMA:
        {schema}
    """
    return _api_call(prompt, CoreTruth)


def _phase2_suspects(theme, difficulty, rules, schema, core_truth: CoreTruth, player_count: int):
    prompt = f"""
        You are an expert mystery writer and game designer.
        Generate the CAST OF SUSPECTS for a murder mystery in JSON format.

        Theme: {theme}
        Difficulty: {difficulty}
        Difficulty Rules: {rules}

        THE ESTABLISHED TRUTH — DO NOT DEVIATE FROM THIS:
        {core_truth.model_dump_json()}

        RULES:
        1. Generate EXACTLY {player_count} suspects. Not more, not fewer.
        2. Exactly ONE suspect is the killer. Their name, motive, and alibi MUST match the truth above.
        3. The killer's alibi_flaw must restate the flaw from the truth. Set is_killer to true.
        4. ALL other suspects are innocent. Their alibi_flaw MUST be null — not a string, 
   not "None", not "N/A", not an empty string. Literally JSON null. Set is_killer 
   to false. If you set alibi_flaw on an innocent suspect the output is invalid.
        5. Innocent suspects must have airtight alibis — don't make them look guilty through sloppy timelines.
        6. Assign ids sequentially: "s1", "s2" ... "s{player_count}".
        7. Every suspect must feel grounded in the theme: {theme}.

        SCHEMA:
        {schema}
    """
    return _api_call(prompt, SuspectList)


def _phase3_evidence(theme, difficulty, rules, schema, core_truth: CoreTruth, suspects: SuspectList):
    prompt = f"""
        You are an expert mystery writer and game designer.
        Generate the EVIDENCE BOARD for a murder mystery in JSON format.

        Theme: {theme}
        Difficulty: {difficulty}
        Difficulty Rules: {rules}

        THE ESTABLISHED TRUTH:
        {core_truth.model_dump_json()}

        THE SUSPECTS:
        {suspects.model_dump_json()}

        VALID SUSPECT IDs: {[s.id for s in suspects.suspects]}

        CRITICAL: implicates_suspect_id MUST be one of the above suspect ids exactly as shown 
        (e.g. "s1", "s2"). It must ALWAYS be a string. It can NEVER be null, an object, or a 
        number. Every single clue must have a valid implicates_suspect_id.

        RULES:
        1. Generate the number of clues specified in the difficulty rules.
        2. At least one clue must directly prove the killer's alibi_flaw.
        3. At least one clue must relate to the cause of death or murder weapon.
        4. You MUST include at least 2 red herring clues pointing toward innocent suspects. 
   Set is_red_herring to true for these. A mystery with zero red herrings is invalid.
        5. NO INSTANT WINS — no confessions, no video footage, nothing that single-handedly 
        identifies the killer.
        6. deduction_logic must explain the clue's significance without assuming the player 
        knows who the killer is.
        7. Spread reveal_round values between 1 and 4. Don't dump everything in round 1.
        8. solution_explanation must walk through the clues step by step to prove guilt. 
        Write it as flowing prose — no bullet points, no asterisks, no numbered lists. 
        It must read as a single cohesive paragraph.
        SCHEMA:
        {schema}
    """
    return _api_call(prompt, EvidenceBoard)

def _api_call(prompt: str, model_class):
    for attempt in range(settings.generation_max_retries):
        print(f"  Attempt {attempt + 1}/{settings.generation_max_retries}...")
        try:
            response = client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": "Generate the mystery JSON now."},
                ],
                temperature=settings.generation_temperature,
                response_format={"type": "json_object"},
            )

            raw = response.choices[0].message.content
            raw = raw.strip("`").removeprefix("json").strip()

            validated = model_class.model_validate_json(raw)
            print(f"  Success.")
            return validated

        except ValidationError as e:
            print(f"  Validation failed on attempt {attempt + 1}:")
            for err in e.errors():
                print(f"    - {err.get('loc')}: {err.get('msg')}")
            if attempt < settings.generation_max_retries - 1:
                time.sleep(1)

        except Exception as e:
            print(f"  Error: {e}")
            if attempt < settings.generation_max_retries - 1:
                time.sleep(3)
                continue
            return None

    print("  Max retries reached.")
    return None