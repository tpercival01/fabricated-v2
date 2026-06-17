export interface Suspect {
    suspect_id: string
    name: string
    role: string
    relationship_to_victim: string
    alibi: string
  }
  
  export interface Clue {
    clue_id: string
    description: string
  }
  
  export interface Victim {
    name: string
    cause_of_death: string
    time_of_death: string
    location_of_death: string
  }
  
  export interface Player {
    display_name: string
    join_token: string
    suspect_id: string
    accused: boolean
  }
  
  export interface CharacterCard {
    suspect_id: string
    name: string
    role: string
    relationship_to_victim: string
    motive: string
    alibi: string
    secret: string
  }
  
  export interface Session {
    session_id: string
    room_code: string
    status: string
    theme: string
    difficulty: string
    player_count: number
    current_round: number
    player_count_joined: number
  }
  
  export interface GameState {
    session_id: string
    room_code: string
    status: string
    current_round: number
    suspects: Suspect[]
    clues: Clue[]
    victim: Victim
  }