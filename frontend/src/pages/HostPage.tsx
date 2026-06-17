import { useState } from 'react'
import { createSession } from '../api'

const THEMES = [
  '1920s Mansion',
  'Modern City',
  'Gothic Castle',
  'Space Station',
  'Fairy Tale Village',
]

const DIFFICULTIES = ['easy', 'standard', 'brutal']

interface HostPageProps {
  onSessionCreated: (session_id: string, room_code: string) => void
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
      onSessionCreated(session.session_id, session.room_code)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Fabricated</h1>
          <p className="text-gray-400 mt-2">Host a new mystery session</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-500"
            >
              {THEMES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-3 rounded-lg border capitalize font-medium transition-colors ${
                    difficulty === d
                      ? 'bg-white text-gray-950 border-white'
                      : 'bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Players — {playerCount}
            </label>
            <input
              type="range"
              min={4}
              max={8}
              value={playerCount}
              onChange={e => setPlayerCount(Number(e.target.value))}
              className="w-full accent-white"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>4</span><span>5</span><span>6</span><span>7</span><span>8</span>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-4 bg-white text-gray-950 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating mystery...' : 'Create Session'}
          </button>
        </div>
      </div>
    </div>
  )
}