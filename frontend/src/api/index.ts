import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

export const createSession = async (theme: string, difficulty: string, player_count: number) => {
  const res = await api.post('/sessions/', { theme, difficulty, player_count })
  return res.data
}

export const getSession = async (session_id: string) => {
  const res = await api.get(`/sessions/${session_id}`)
  return res.data
}

export const joinSession = async (room_code: string, display_name: string) => {
  const res = await api.post(`/sessions/join/${room_code}`, { display_name })
  return res.data
}

export const startGame = async (session_id: string) => {
  const res = await api.post(`/sessions/${session_id}/start`)
  return res.data
}

export const advanceRound = async (session_id: string) => {
  const res = await api.post(`/sessions/${session_id}/advance`)
  return res.data
}

export const submitAccusation = async (
  session_id: string,
  join_token: string,
  killer_id: string,
  motive: string,
  evidence_ids: string[]
) => {
  const res = await api.post(`/sessions/${session_id}/accuse`, {
    join_token,
    killer_id,
    motive,
    evidence_ids,
  })
  return res.data
}

export const debugSession = async (session_id: string) => {
  const res = await api.get(`/sessions/${session_id}/debug`)
  return res.data
}

export const askGameMaster = async (session_id: string, join_token: string, question: string) => {
  const res = await api.post(`/sessions/${session_id}/ask`, { join_token, question })
  return res.data
}