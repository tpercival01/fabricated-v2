import { useState } from 'react'
import { createSession } from '../api'

const THEMES = [
  '1920s Mansion',
  'Modern City',
  'Gothic Castle',
  'Space Station',
  'Fairy Tale Village',
]

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', desc: 'Obvious clues, simple alibi flaw' },
  { id: 'standard', label: 'Standard', desc: 'Circumstantial evidence, solid red herrings' },
  { id: 'brutal', label: 'Brutal', desc: 'Cross-reference two facts to catch the killer' },
]

interface HostPageProps {
  onSessionCreated: (session_id: string, room_code: string, count: number, players?: any[], gameState?: any) => void
}

export default function HostPage({ onSessionCreated }: HostPageProps) {
  const [theme, setTheme] = useState(THEMES[0])
  const [difficulty, setDifficulty] = useState('standard')
  const [playerCount, setPlayerCount] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      const session = await createSession(theme, difficulty, playerCount)
      onSessionCreated(session.session_id, session.room_code, playerCount)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="w-full max-w-lg space-y-10">

        {/* Header */}
        <div>
          <h1
            className="font-serif text-6xl font-black tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Fabricated
          </h1>
          <p style={{ color: 'var(--text-muted)' }} className="mt-2 text-sm tracking-wide">
            A murder has occurred. Someone in this room is responsible.
          </p>
          <div
            className="mt-4 h-px w-16"
            style={{ backgroundColor: 'var(--accent)' }}
          />
        </div>

        {/* Form */}
        <div className="space-y-8">

          {/* Theme */}
          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Setting
            </label>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              {THEMES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Difficulty
            </label>
            <div className="space-y-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className="w-full text-left px-4 py-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: difficulty === d.id ? 'var(--surface-raised)' : 'var(--surface)',
                    border: `1px solid ${difficulty === d.id ? 'var(--accent)' : 'var(--border)'}`,
                    color: difficulty === d.id ? 'var(--text)' : 'var(--text-muted)',
                  }}
                >
                  <span className="font-semibold text-sm">{d.label}</span>
                  <span className="text-xs ml-3" style={{ color: 'var(--text-muted)' }}>{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Player count */}
          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Suspects — <span style={{ color: 'var(--accent)' }}>{playerCount} players</span>
            </label>
            <input
              type="range"
              min={4}
              max={8}
              value={playerCount}
              onChange={e => setPlayerCount(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--accent)' }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
              {[4,5,6,7,8].map(n => <span key={n}>{n}</span>)}
            </div>
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-4 rounded-lg font-semibold text-sm tracking-wide transition-all disabled:opacity-40"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--bg)',
            }}
          >
            {loading ? 'Generating mystery...' : 'Begin Investigation'}
          </button>

          {/* Dev shortcut */}
          {import.meta.env.DEV && (
            <button
              onClick={async () => {
                setLoading(true)
                const res = await fetch('http://localhost:8000/sessions/dev/quickstart', { method: 'POST' })
                const data = await res.json()
                onSessionCreated(data.session_id, data.room_code, 4, data.players, data.game_state)
                setLoading(false)
              }}
              className="w-full py-3 rounded-lg text-xs transition-all"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              Dev: Quick Start (4 players, 1920s Mansion)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}