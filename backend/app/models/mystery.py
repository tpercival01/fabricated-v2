from pydantic import BaseModel, Field
from typing import Optional


class CoreTruth(BaseModel):
    victim_name: str
    victim_background: str
    cause_of_death: str
    time_of_death: str
    location_of_death: str
    killer_name: str
    killer_motive: str
    killer_means: str
    killer_opportunity: str
    killer_alibi: str
    killer_alibi_flaw: str


class Suspect(BaseModel):
    id: str
    name: str
    role: str
    relationship_to_victim: str
    motive: str
    alibi: str
    alibi_flaw: Optional[str] = None
    secret: str
    is_killer: bool


class SuspectList(BaseModel):
    suspects: list[Suspect]


class Clue(BaseModel):
    id: str
    description: str
    implicates_suspect_id: str
    is_red_herring: bool
    reveal_round: int
    deduction_logic: str


class EvidenceBoard(BaseModel):
    clues: list[Clue]
    solution_explanation: str


class MysteryCase(BaseModel):
    core_truth: CoreTruth
    suspects: list[Suspect]
    clues: list[Clue]
    solution_explanation: str