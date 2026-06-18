import { useState } from 'react'
import { submitAccusation } from '../api'
import { Suspect } from '../types'

interface AccusePageProps {
  sessionId: string
  players: any[]
  suspects: Suspect[]
  onReveal: (reveal: any) => void
}

export default function AccusePage({ sessionId, players, suspects, onReveal }: AccusePageProps) {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null)
  const [motive, setMotive] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<string[]>([])

  const currentPlayer = players[currentPlayerIndex]

  const handleSubmit = async () => {
    if (!selectedSuspectId || !motive.trim()) {
      setError('Pick a suspect and enter your reasoning.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await submitAccusation(
        sessionId,
        currentPlayer.join_token,
        selectedSuspectId,
        motive,
        [],
      )
      setSubmitted(prev => [...prev, currentPlayer.display_name])
      if (result.game_complete && result.reveal) {
        onReveal(result.reveal)
        return
      }
      setCurrentPlayerIndex(prev => prev + 1)
      setSelectedSuspectId(null)
      setMotive('')
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to submit accusation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="font-serif text-4xl font-bold" style={{ color: 'var(--text)' }}>
            The Accusation
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Each player names their killer. Choose carefully.
          </p>
          <div className="mt-4 h-px w-16" style={{ backgroundColor: 'var(--accent)' }} />
        </div>

        {/* Progress bar */}
        <div className="flex gap-2">
          {players.map((p, i) => (
            <div
              key={p.player_id}
              className="flex-1 h-0.5 rounded-full transition-all duration-500"
              style={{
                backgroundColor: submitted.includes(p.display_name)
                  ? 'var(--accent)'
                  : i === currentPlayerIndex
                  ? 'var(--text-muted)'
                  : 'var(--border)',
              }}
            />
          ))}
        </div>

        {/* Current player card */}
        <div
          className="rounded-2xl p-8 space-y-8"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-light)',
          }}
        >
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
              Now accusing
            </p>
            <p className="font-serif text-3xl font-bold" style={{ color: 'var(--text)' }}>
              {currentPlayer?.display_name}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--accent)' }}>
              Playing as {suspects.find(s => s.suspect_id === currentPlayer?.suspect_id)?.name}
            </p>
          </div>

          {/* Suspect grid */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              I accuse...
            </p>
            <div className="grid grid-cols-2 gap-2">
              {suspects.map(suspect => (
                <button
                  key={suspect.suspect_id}
                  onClick={() => setSelectedSuspectId(suspect.suspect_id)}
                  className="p-4 rounded-xl text-left transition-all"
                  style={{
                    backgroundColor: selectedSuspectId === suspect.suspect_id
                      ? 'var(--surface-raised)'
                      : 'var(--bg)',
                    border: `1px solid ${selectedSuspectId === suspect.suspect_id
                      ? 'var(--accent)'
                      : 'var(--border)'}`,
                    color: 'var(--text)',
                  }}
                >
                  <p className="font-semibold text-sm">{suspect.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {suspect.role}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Your reasoning
            </p>
            <textarea
              value={motive}
              onChange={e => setMotive(e.target.value)}
              placeholder="Why do you think they did it? What evidence points to them?"
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !selectedSuspectId || !motive.trim()}
            className="w-full py-4 rounded-lg font-semibold text-sm tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--bg)',
            }}
          >
            {loading ? 'Submitting...' : 'Submit Accusation'}
          </button>
        </div>

        {/* Submitted */}
        {submitted.length > 0 && (
          <div className="space-y-1">
            {submitted.map(name => (
              <p key={name} className="text-sm" style={{ color: 'var(--text-faint)' }}>
                ✓ {name} has submitted
              </p>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}