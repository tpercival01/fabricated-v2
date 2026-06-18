import { useState, useEffect } from 'react'
import { getSession, startGame } from '../api'
import { GameState } from '../types'

interface LobbyPageProps {
  sessionId: string
  roomCode: string
  playerCount: number
  onGameStarted: (gameState: GameState) => void
}

export default function LobbyPage({ sessionId, roomCode, playerCount, onGameStarted }: LobbyPageProps) {
  const [joined, setJoined] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const session = await getSession(sessionId)
        setJoined(session.player_count_joined)
      } catch (e) {}
    }, 3000)
    return () => clearInterval(interval)
  }, [sessionId])

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    try {
      const gameState = await startGame(sessionId)
      onGameStarted(gameState)
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
            Players — {joined} of {playerCount} joined
          </p>
          <div className="flex gap-3">
            {Array.from({ length: playerCount }).map((_, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
                style={{
                  backgroundColor: i < joined ? 'var(--accent)' : 'var(--surface)',
                  border: `1px solid ${i < joined ? 'var(--accent)' : 'var(--border)'}`,
                  color: i < joined ? 'var(--bg)' : 'var(--text-faint)',
                }}
              >
                {i < joined ? '✓' : i + 1}
              </div>
            ))}
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