import sys
import os
import time
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from app.models.mystery import MysteryCase

from app.services.generator import generate_new_case

THEMES = [
    "1920s Mansion",
    "Modern City",
    "Gothic Castle",
    "Space Station",
    "Fairy Tale Village",
]

DIFFICULTIES = ["easy", "standard", "brutal"]

RUNS = [
    ("1920s Mansion", "easy", 4),
    ("1920s Mansion", "standard", 6),
    ("Modern City", "easy", 5),
    ("Modern City", "brutal", 8),
    ("Gothic Castle", "standard", 5),
    ("Gothic Castle", "brutal", 7),
    ("Space Station", "easy", 4),
    ("Space Station", "standard", 6),
    ("Fairy Tale Village", "easy", 4),
    ("Fairy Tale Village", "brutal", 8),
    ("1920s Mansion", "brutal", 6),
    ("Modern City", "standard", 5),
    ("Gothic Castle", "easy", 4),
    ("Space Station", "brutal", 7),
    ("Fairy Tale Village", "standard", 6),
    ("1920s Mansion", "easy", 8),
    ("Modern City", "easy", 4),
    ("Gothic Castle", "standard", 7),
    ("Space Station", "standard", 5),
    ("Fairy Tale Village", "brutal", 6),
]


def validate_case(case, theme, difficulty, player_count) -> list[str]:
    """Returns a list of failure reasons. Empty list means pass."""
    failures = []

    # Correct suspect count
    if len(case.suspects) != player_count:
        failures.append(f"Expected {player_count} suspects, got {len(case.suspects)}")

    # Exactly one killer
    killers = [s for s in case.suspects if s.is_killer]
    if len(killers) != 1:
        failures.append(f"Expected exactly 1 killer, got {len(killers)}")

    # Killer matches core truth
    if killers:
        killer = killers[0]
        if killer.name != case.core_truth.killer_name:
            failures.append(f"Killer name mismatch: suspect '{killer.name}' vs truth '{case.core_truth.killer_name}'")
        if killer.alibi_flaw is None:
            failures.append("Killer has no alibi_flaw set")

    # Innocents have no alibi_flaw
    innocents = [s for s in case.suspects if not s.is_killer]
    for s in innocents:
        if s.alibi_flaw is not None:
            failures.append(f"Innocent suspect '{s.name}' has alibi_flaw set (should be null)")

    # At least one clue implicates the killer
    if killers:
        killer_id = killers[0].id
        killer_clues = [c for c in case.clues if c.implicates_suspect_id == killer_id and not c.is_red_herring]
        if not killer_clues:
            failures.append("No non-red-herring clues implicate the killer")

    # At least one red herring exists
    red_herrings = [c for c in case.clues if c.is_red_herring]
    if not red_herrings:
        failures.append("No red herring clues generated")

    # Reveal rounds are within range
    for clue in case.clues:
        if not (1 <= clue.reveal_round <= 4):
            failures.append(f"Clue '{clue.id}' has invalid reveal_round: {clue.reveal_round}")

    return failures


def run_tests():
    passed = 0
    failed = 0
    results = []

    for i, (theme, difficulty, player_count) in enumerate(RUNS, 1):
        print(f"\n{'='*60}")
        print(f"Run {i}/20 | theme={theme} | difficulty={difficulty} | players={player_count}")
        print(f"{'='*60}")

        if i > 1:
            print("Waiting 20s to avoid rate limits...")
            time.sleep(20)

        case = generate_new_case(theme, difficulty, player_count)

        if case is None:
            print(f"FAILED — generation returned None")
            failed += 1
            results.append((i, theme, difficulty, player_count, False, ["Generation failed"]))
            continue

        failures = validate_case(case, theme, difficulty, player_count)

        if failures:
            print(f"FAILED — {len(failures)} validation error(s):")
            for f in failures:
                print(f"  - {f}")
            failed += 1
            results.append((i, theme, difficulty, player_count, False, failures))
        else:
            print(f"PASSED")
            passed += 1
            results.append((i, theme, difficulty, player_count, True, []))

    print(f"\n{'='*60}")
    print(f"RESULTS: {passed}/20 passed, {failed}/20 failed")
    print(f"{'='*60}")

    if failed > 0:
        print("\nFailed runs:")
        for (i, theme, diff, pc, ok, reasons) in results:
            if not ok:
                print(f"  Run {i} ({theme}, {diff}, {pc}p): {reasons}")
    
    print("\n--- SAMPLE CASE (last passing run) ---")
    for (i, theme, diff, pc, ok, reasons) in results:
        if ok:
            last_pass = (theme, diff, pc)

    theme, diff, pc = last_pass
    sample = generate_new_case(theme, diff, pc)
    if sample:
        print_case(sample)

    return failed == 0

def print_case(case: MysteryCase):
    print(f"\nVICTIM: {case.core_truth.victim_name}")
    print(f"CAUSE: {case.core_truth.cause_of_death}")
    print(f"TIME: {case.core_truth.time_of_death}")
    print(f"\nKILLER (hidden from players): {case.core_truth.killer_name}")
    print(f"MOTIVE: {case.core_truth.killer_motive}")
    print(f"ALIBI FLAW: {case.core_truth.killer_alibi_flaw}")
    
    print(f"\nSUSPECTS:")
    for s in case.suspects:
        tag = "*** KILLER ***" if s.is_killer else ""
        print(f"  [{s.id}] {s.name} — {s.role} {tag}")
        print(f"    Motive: {s.motive}")
        print(f"    Alibi: {s.alibi}")
        if s.alibi_flaw:
            print(f"    Alibi flaw: {s.alibi_flaw}")

    print(f"\nCLUES:")
    for c in case.clues:
        tag = "(RED HERRING)" if c.is_red_herring else ""
        print(f"  [{c.id}] Round {c.reveal_round} — {c.description} {tag}")
        print(f"    Implicates: {c.implicates_suspect_id}")
        print(f"    Logic: {c.deduction_logic}")

    print(f"\nSOLUTION: {case.solution_explanation}")


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)

