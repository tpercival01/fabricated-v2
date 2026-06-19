import { useState } from 'react'
import { getSession, startGame, joinSession } from '../api'
import { GameState } from '../types'

interface LobbyPageProps {
  sessionId: string
  roomCode: string
  playerCount: number
  onGameStarted: (gameState: GameState, players: any[]) => void
}

export default function LobbyPage({ sessionId, roomCode, playerCount, onGameStarted }: LobbyPageProps) {
  const [joined, setJoined] = useState(0)
  const [addedPlayers, setAddedPlayers] = useState<any[]>([])
  const [nameInput, setNameInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddPlayer = async () => {
    if (!nameInput.trim()) return
    setAdding(true)
    setError(null)
    try {
      const result = await joinSession(roomCode, nameInput.trim())
      setAddedPlayers(prev => [...prev, {
        display_name: result.display_name,
        join_token: result.join_token,
        suspect_id: result.character_card.suspect_id,
        character_card: result.character_card,
      }])
      setJoined(prev => prev + 1)
      setNameInput('')
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to add player.')
    } finally {
      setAdding(false)
    }
  }

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    try {
      const gameState = await startGame(sessionId)
      onGameStarted(gameState, addedPlayers)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to start game.')
      setLoading(false)
    }
  }

  const allPlayersJoined = joined >= playerCount

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="w-full max-w-md space-y-12">

        {/* Title */}
        <div>
          <h1 className="font-serif text-4xl font-bold" style={{ color: 'var(--text)' }}>
            Fabricated
          </h1>
          <div className="mt-3 h-px w-16" style={{ backgroundColor: 'var(--accent)' }} />
        </div>

        {/* Room code */}
        <div>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Room Code
          </p>
          <p className="font-serif text-7xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            {roomCode}
          </p>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Share this code with your players
          </p>
        </div>

        {/* Players */}
        <div>
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            Players — {joined} of {playerCount} added
          </p>

          {/* Add player input */}
          {joined < playerCount && (
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
                placeholder="Enter player name..."
                className="flex-1 rounded-lg px-4 py-3 text-sm focus:outline-none"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
              <button
                onClick={handleAddPlayer}
                disabled={adding || !nameInput.trim()}
                className="px-6 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-30"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--bg)',
                }}
              >
                {adding ? '...' : 'Add'}
              </button>
            </div>
          )}

          {/* Player list */}
          <div className="space-y-2">
            {addedPlayers.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
                >
                  ✓
                </span>
                <span className="text-sm" style={{ color: 'var(--text)' }}>{p.display_name}</span>
              </div>
            ))}
            {addedPlayers.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                No players added yet.
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!allPlayersJoined || loading}
          className="w-full py-4 rounded-lg font-semibold text-sm tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            backgroundColor: allPlayersJoined ? 'var(--accent)' : 'var(--surface)',
            border: `1px solid ${allPlayersJoined ? 'var(--accent)' : 'var(--border)'}`,
            color: allPlayersJoined ? 'var(--bg)' : 'var(--text-muted)',
          }}
        >
          {loading ? 'Starting...' : allPlayersJoined ? 'Begin the Investigation' : 'Waiting for players...'}
        </button>

      </div>
    </div>
  )
}