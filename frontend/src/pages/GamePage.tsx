import { useState } from 'react'
import { GameState, Clue, Suspect } from '../types'
import { advanceRound, askGameMaster } from '../api'
import CharacterCardModal from '../components/CharacterCardModal'

const TITLES = ['lord', 'lady', 'dr', 'dr.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'sir', 'professor', 'prof', 'captain', 'col', 'general']

function getInitials(name: string): string {
  const words = name.split(' ').filter(w => !TITLES.includes(w.toLowerCase()))
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

interface GamePageProps {
  gameState: GameState
  sessionId: string
  players: any[]
  onGameComplete: (reveal: any) => void
}

function SuspectCard({ suspect, onClick, selected, clueCount, status, onStatusChange }: {
  suspect: Suspect
  onClick: () => void
  selected: boolean
  clueCount?: number
  status: string | undefined
  onStatusChange: (status: string) => void
}) {
  const statusConfig: Record<string, { label: string, color: string }> = {
    cleared: { label: 'Cleared', color: '#4a9e6b' },
    suspicious: { label: 'Suspicious', color: 'var(--accent)' },
    prime: { label: 'Prime Suspect', color: '#c0392b' },
  }

  return (
    <div
      className="rounded-xl p-4 cursor-pointer transition-all"
      style={{
        backgroundColor: selected ? 'var(--surface-raised)' : 'var(--surface)',
        border: `1px solid ${selected ? 'var(--accent-dim)' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-center gap-3" onClick={onClick}>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            backgroundColor: 'var(--surface-raised)',
            border: `1px solid ${status ? statusConfig[status]?.color : 'var(--border-light)'}`,
            color: status ? statusConfig[status]?.color : 'var(--accent)',
          }}
        >
          {getInitials(suspect.name)}
        </div>
        <div className="min-w-0 flex-1 flex items-center gap-2">
        <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
              {suspect.name}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {suspect.role}
            </p>
          </div>
          {clueCount ? (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-bold shrink-0"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
            >
              {clueCount}
            </span>
          ) : null}
        </div>
        {status && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
            style={{
              backgroundColor: `${statusConfig[status]?.color}20`,
              color: statusConfig[status]?.color,
              border: `1px solid ${statusConfig[status]?.color}40`,
            }}
          >
            {statusConfig[status]?.label}
          </span>
        )}
      </div>

      {selected && (
        <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Relationship</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{suspect.relationship_to_victim}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Alibi</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{suspect.alibi}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Mark as</p>
            <div className="flex gap-2">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={e => {
                    e.stopPropagation()
                    onStatusChange(status === key ? '' : key)
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: status === key ? `${cfg.color}20` : 'var(--bg)',
                    border: `1px solid ${status === key ? cfg.color : 'var(--border)'}`,
                    color: status === key ? cfg.color : 'var(--text-muted)',
                  }}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ClueCard({ clue, isNew, onLink, linkedSuspect, suspects, isLinking, onLinkToggle }: {
  clue: Clue & { round: number }
  isNew: boolean
  onLink: (suspectId: string) => void
  linkedSuspect?: Suspect
  suspects: Suspect[]
  isLinking: boolean
  onLinkToggle: () => void
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{
        backgroundColor: isNew ? 'var(--surface-raised)' : 'var(--surface)',
        border: `1px solid ${isLinking ? 'var(--accent)' : isNew ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Round {clue.round}
            </span>
            {isNew && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
              >
                New
              </span>
            )}
            {linkedSuspect && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--accent)',
                }}
              >
                → {linkedSuspect.name.split(' ')[0]}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: isNew ? 'var(--text)' : 'var(--text-muted)' }}>
            {clue.description}
          </p>
        </div>
        <button
          onClick={onLinkToggle}
          className="shrink-0 text-xs px-2 py-1 rounded-lg transition-all mt-1"
          style={{
            backgroundColor: isLinking ? 'var(--accent)' : 'var(--bg)',
            border: `1px solid ${isLinking ? 'var(--accent)' : 'var(--border)'}`,
            color: isLinking ? 'var(--bg)' : 'var(--text-muted)',
          }}
          title="Link to suspect"
        >
          {linkedSuspect ? '⇄' : '→'}
        </button>
      </div>

      {isLinking && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            Link this clue to...
          </p>
          <div className="flex flex-wrap gap-2">
            {suspects.map(s => (
              <button
                key={s.suspect_id}
                onClick={() => onLink(s.suspect_id)}
                className="px-3 py-1 rounded-lg text-xs transition-all"
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text)',
                }}
              >
                {s.name.split(' ').slice(-1)[0]}
              </button>
            ))}
            {linkedSuspect && (
              <button
                onClick={() => onLink('')}
                className="px-3 py-1 rounded-lg text-xs transition-all"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                Remove link
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function GamePage({ gameState, sessionId, players, onGameComplete }: GamePageProps) {
  const [currentRound, setCurrentRound] = useState(gameState.current_round)
  const [allClues, setAllClues] = useState<(Clue & { round: number })[]>(
    gameState.clues.map(c => ({ ...c, round: 1 }))
  )
  const [latestRound, setLatestRound] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null)
  const [viewingCard, setViewingCard] = useState<any | null>(null)
  const [askingPlayer, setAskingPlayer] = useState<string>(players[0]?.join_token || '')
  const [question, setQuestion] = useState('')
  const [gmHistory, setGmHistory] = useState<any[]>([])
  const [gmLoading, setGmLoading] = useState(false)
  const [gmError, setGmError] = useState<string | null>(null)
  const [suspectStatus, setSuspectStatus] = useState<Record<string, string>>({})
  const [clueLinks, setClueLinks] = useState<Record<string, string>>({})
  const [linkingClue, setLinkingClue] = useState<string | null>(null)

  const handleAdvance = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await advanceRound(sessionId)
      if (result.new_clues?.length > 0) {
        const newClues = result.new_clues.map((c: Clue) => ({
          ...c,
          round: result.current_round,
        }))
        setAllClues(prev => [...prev, ...newClues])
      }
      setCurrentRound(result.current_round)
      setLatestRound(result.current_round)
      if (result.status === 'complete') onGameComplete(null)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to advance round.')
    } finally {
      setLoading(false)
    }
  }

  const handleAsk = async () => {
    if (!question.trim() || question.trim().length < 10) {
      setGmError('Question must be at least 10 characters.')
      return
    }
    setGmLoading(true)
    setGmError(null)
    try {
      const result = await askGameMaster(sessionId, askingPlayer, question)
      setGmHistory(prev => [...prev, result])
      setQuestion('')
    } catch (e: any) {
      setGmError(e.response?.data?.detail || 'Failed to ask question.')
    } finally {
      setGmLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>

      {/* Header */}
      <div
        className="px-8 py-5"
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
              Victim
            </p>
            <h1 className="font-serif text-2xl font-bold" style={{ color: 'var(--text)' }}>
              {gameState.victim.name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {gameState.victim.cause_of_death}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
              {gameState.victim.time_of_death} · {gameState.victim.location_of_death}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
              Round
            </p>
            <p className="font-serif text-6xl font-black" style={{ color: 'var(--accent)' }}>
              {currentRound}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>of 6</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-8">

          {/* Evidence + GM — 2/3 */}
          <div className="col-span-2 space-y-8">

            {/* Evidence Board */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                Evidence Board
                <span className="ml-2" style={{ color: 'var(--text-faint)' }}>
                  — {allClues.length} clue{allClues.length !== 1 ? 's' : ''} revealed
                </span>
              </p>
              <div className="space-y-3">
                {allClues.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                    No evidence revealed yet.
                  </p>
                )}
                {allClues.map(clue => (
                  <ClueCard
                    key={clue.clue_id}
                    clue={clue}
                    isNew={clue.round === latestRound}
                    suspects={gameState.suspects}
                    linkedSuspect={gameState.suspects.find(s => s.suspect_id === clueLinks[clue.clue_id])}
                    isLinking={linkingClue === clue.clue_id}
                    onLinkToggle={() => setLinkingClue(linkingClue === clue.clue_id ? null : clue.clue_id)}
                    onLink={(suspectId) => {
                      setClueLinks(prev => ({ ...prev, [clue.clue_id]: suspectId }))
                      setLinkingClue(null)
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Game Master */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                Game Master
              </p>

              {gmHistory.length > 0 && (
                <div className="space-y-5 mb-6">
                  {gmHistory.map((entry, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                          {entry.player_name}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          · Round {entry.round}
                        </span>
                      </div>
                      <p
                        className="text-sm px-4 py-3 rounded-xl"
                        style={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                          fontStyle: 'italic',
                        }}
                      >
                        "{entry.question}"
                      </p>
                      <p
                        className="text-sm px-4 py-3 rounded-xl leading-relaxed"
                        style={{
                          backgroundColor: 'var(--surface-raised)',
                          border: '1px solid var(--border-light)',
                          color: 'var(--text)',
                        }}
                      >
                        {entry.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <select
                  value={askingPlayer}
                  onChange={e => setAskingPlayer(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text)',
                  }}
                >
                  {players.map(p => (
                    <option key={p.join_token} value={p.join_token}>
                      {p.display_name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAsk()}
                    placeholder="Ask about a suspect by name..."
                    maxLength={150}
                    className="flex-1 rounded-lg px-4 py-2 text-sm focus:outline-none"
                    style={{
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text)',
                    }}
                  />
                  <button
                    onClick={handleAsk}
                    disabled={gmLoading || !question.trim() || question.trim().length < 10}
                    className="px-5 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-30"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--bg)',
                    }}
                  >
                    {gmLoading ? '...' : 'Ask'}
                  </button>
                </div>
                {gmError && <p className="text-xs" style={{ color: 'var(--danger)' }}>{gmError}</p>}
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  1 question per player per round · {150 - question.length} chars remaining
                </p>
              </div>
            </div>
          </div>

          {/* Suspects — 1/3 */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
              Suspects
            </p>

            {/* Character card buttons */}
            <div className="mb-5">
              <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>
                View your character card
              </p>
              <div className="flex flex-wrap gap-2">
                {players.map(p => (
                  <button
                    key={p.join_token}
                    onClick={() => setViewingCard(p)}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {p.display_name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
            {gameState.suspects.map(suspect => (
              <SuspectCard
                key={suspect.suspect_id}
                suspect={suspect}
                selected={selectedSuspect?.suspect_id === suspect.suspect_id}
                status={suspectStatus[suspect.suspect_id]}
                clueCount={Object.values(clueLinks).filter(id => id === suspect.suspect_id).length || undefined}
                onStatusChange={(newStatus) => setSuspectStatus(prev => ({
                  ...prev,
                  [suspect.suspect_id]: newStatus,
                }))}
                onClick={() => setSelectedSuspect(
                  selectedSuspect?.suspect_id === suspect.suspect_id ? null : suspect
                )}
              />
            ))}
            </div>
          </div>

        </div>

        {/* Controls */}
        <div
          className="flex items-center gap-4 mt-10 pt-6"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
          <button
            onClick={() => onGameComplete(null)}
            className="px-6 py-3 rounded-lg font-medium text-sm transition-all ml-auto"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            Make Accusations
          </button>
          <button
            onClick={handleAdvance}
            disabled={loading}
            className="px-8 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-40"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--bg)',
            }}
          >
            {loading ? 'Advancing...' : `Advance to Round ${currentRound + 1}`}
          </button>
        </div>
      </div>

      {viewingCard && (
        <CharacterCardModal
          player={viewingCard}
          suspects={gameState.suspects}
          onClose={() => setViewingCard(null)}
        />
      )}
    </div>
  )
}