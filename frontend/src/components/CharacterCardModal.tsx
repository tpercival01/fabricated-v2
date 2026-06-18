interface CharacterCardModalProps {
  player: any
  suspects: any[]
  onClose: () => void
}

export default function CharacterCardModal({ player, suspects, onClose }: CharacterCardModalProps) {
  const suspect = suspects.find(s => s.suspect_id === player.suspect_id)
  const name = player.character_card?.name || suspect?.name
  const role = player.character_card?.role || suspect?.role

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 space-y-6"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border-light)',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
              Your Character
            </p>
            <h2 className="font-serif text-2xl font-bold" style={{ color: 'var(--text)' }}>
              {name}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--accent)' }}>{role}</p>
          </div>
          <button
            onClick={onClose}
            className="text-lg font-bold transition-colors"
            style={{ color: 'var(--text-faint)' }}
          >
            ✕
          </button>
        </div>

        <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

        {/* Fields */}
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Your Motive
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              {player.character_card?.motive}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Your Alibi
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              {player.character_card?.alibi}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
              Your Secret
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              {player.character_card?.secret}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          Close
        </button>

      </div>
    </div>
  )
}